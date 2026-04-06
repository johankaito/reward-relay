#!/usr/bin/env tsx
/**
 * Standalone card extraction script — runs outside Vercel's 10s timeout.
 * Replicates the logic of app/api/cron/card-extract/route.ts.
 */

import { createClient } from '@supabase/supabase-js'
import { fetchCardPageByUrl } from '@/lib/card-fetcher'
import { extractCardData, getVerificationAction } from '@/lib/card-extractor'
import { reconcileCardData, type CdrProduct } from '@/lib/cdr/reconcile'
import { computeChangeHash, compareHashes } from '@/lib/change-hash'
import type { Database } from '@/types/database.types'

type Card = Database['public']['Tables']['cards']['Row']

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
const HIGH_CONFIDENCE = 0.75

async function processCard(card: Card): Promise<{ cardId: string; success: boolean; error?: string }> {
  const cardId = card.id
  try {
    const cardUrl = card.application_link
    if (!cardUrl) return { cardId, success: false, error: 'No application_link' }

    const { markdown } = await fetchCardPageByUrl(cardUrl)

    let cdrData: CdrProduct | undefined
    const bankSlug = card.bank?.toLowerCase().replace(/\s+/g, '-') ?? ''
    if (bankSlug) {
      const { data: cdrProducts } = await supabase
        .from('cdr_products')
        .select('id, product_id, bank_slug, bank_name, product_name, annual_fee_amount, loyalty_program_name, is_active')
        .eq('bank_slug', bankSlug)
        .eq('is_active', true)
        .ilike('product_name', `%${card.name.split(' ').slice(0, 2).join(' ')}%`)
        .limit(1)

      if (cdrProducts && cdrProducts.length > 0) {
        cdrData = cdrProducts[0] as CdrProduct
      }
    }

    const extracted = await extractCardData(markdown, cdrData)

    const reconciled = cdrData
      ? reconcileCardData(cdrData, extracted)
      : { conflicts: [], resolvedAnnualFee: null, requiresReview: false, isDiscontinued: false }

    const verificationAction = getVerificationAction(extracted.confidenceScore)
    const now = new Date().toISOString()

    const newHash = computeChangeHash({
      annualFee: extracted.annualFee?.amount ?? card.annual_fee ?? 0,
      earnRates: extracted.earnRates ?? [],
      bonusPoints: extracted.bonusOffer?.bonusPoints ?? card.welcome_bonus_points ?? 0,
      spendReq: extracted.bonusOffer?.spendRequirement ?? card.bonus_spend_requirement ?? 0,
    })

    const { hasChanged } = compareHashes(newHash, card.change_hash, card.last_extracted_at)

    const updateData: Database['public']['Tables']['cards']['Update'] = {
      needs_verification: verificationAction.needsVerification || reconciled.requiresReview,
      verification_priority: verificationAction.verificationPriority,
      last_verified_at: now,
      last_extracted_at: now,
      extraction_confidence: extracted.confidenceScore,
      change_hash: newHash,
    }

    if (hasChanged) updateData.change_detected_at = now
    if (reconciled.resolvedAnnualFee !== null) updateData.annual_fee = reconciled.resolvedAnnualFee
    if (reconciled.isDiscontinued) updateData.is_active = false

    if (extracted.confidenceScore >= HIGH_CONFIDENCE) {
      const extractedBonus = extracted.bonusOffer?.bonusPoints ?? null
      const existingBonus = card.welcome_bonus_points
      const bonusChanged = extractedBonus !== null && extractedBonus !== existingBonus

      if (extracted.bonusOffer) {
        const TWO_SOURCE_CONFIDENCE = 0.80
        if (bonusChanged && extracted.confidenceScore >= TWO_SOURCE_CONFIDENCE) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
          const { data: dealConfirmation } = await supabase
            .from('deals')
            .select('id')
            .eq('card_id', cardId)
            .gte('bonus_points', Math.floor((extractedBonus ?? 0) * 0.95))
            .gte('created_at', thirtyDaysAgo)
            .limit(1)

          if (dealConfirmation && dealConfirmation.length > 0) {
            updateData.welcome_bonus_points = extractedBonus
            updateData.bonus_spend_requirement = extracted.bonusOffer.spendRequirement
            updateData.bonus_spend_window_months = extracted.bonusOffer.timeframeMonths
            if (extracted.bonusOffer.expiryDate) updateData.offer_expiry_date = extracted.bonusOffer.expiryDate
          } else {
            updateData.needs_verification = true
            updateData.verification_priority = 'high'
            console.log(`Two-source gate: ${card.name} extracted=${extractedBonus}, stored=${card.welcome_bonus_points} — no deal confirmation, holding for review`)
          }
        } else {
          updateData.welcome_bonus_points = extracted.bonusOffer.bonusPoints
          updateData.bonus_spend_requirement = extracted.bonusOffer.spendRequirement
          updateData.bonus_spend_window_months = extracted.bonusOffer.timeframeMonths
          if (extracted.bonusOffer.expiryDate) updateData.offer_expiry_date = extracted.bonusOffer.expiryDate
        }
      } else {
        updateData.welcome_bonus_points = null
        updateData.bonus_spend_requirement = null
        updateData.bonus_spend_window_months = null
        updateData.offer_expiry_date = null
      }

      if (extracted.earnRates.length > 0) {
        updateData.earn_rate_primary = extracted.earnRates[0].pointsPerDollar
        updateData.points_currency = extracted.earnRates[0].programName
      }
      if (extracted.earnRates.length > 1) {
        updateData.earn_rate_secondary = extracted.earnRates[1].pointsPerDollar
      }
      if (extracted.minIncome !== null) updateData.min_income = extracted.minIncome
    }

    await supabase.from('cards').update(updateData).eq('id', cardId)

    await supabase.from('extraction_log').insert({
      card_id: cardId,
      run_at: now,
      model_used: extracted.modelUsed,
      confidence_score: extracted.confidenceScore,
      change_hash: newHash,
      hash_changed: hasChanged,
      conflicts_detected: reconciled.conflicts as unknown as Database['public']['Tables']['extraction_log']['Insert']['conflicts_detected'],
      raw_output: extracted as unknown as Database['public']['Tables']['extraction_log']['Insert']['raw_output'],
    })

    const bonusWritten = extracted.confidenceScore >= HIGH_CONFIDENCE
    console.log(
      `Extracted ${card.name}: confidence=${extracted.confidenceScore.toFixed(2)}, changed=${hasChanged}, conflicts=${reconciled.conflicts.length}, bonus=${bonusWritten ? `${extracted.bonusOffer?.bonusPoints ?? 0}pts` : 'skipped(low-conf)'}`
    )

    return { cardId, success: true }
  } catch (error) {
    console.error(`Failed to process card ${cardId}:`, error)
    return { cardId, success: false, error: String(error) }
  }
}

async function main() {
  const startTime = Date.now()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .eq('is_active', true)
    .or(`needs_verification.eq.true,last_verified_at.is.null,last_verified_at.lt.${sevenDaysAgo}`)
    .not('application_link', 'is', null)
    .limit(50)

  if (error) {
    console.error('DB error fetching cards:', error.message)
    process.exit(1)
  }

  if (!cards || cards.length === 0) {
    console.log('No cards need extraction')
    process.exit(0)
  }

  console.log(`Processing ${cards.length} cards...`)

  const batchSize = 5 // smaller batches for script context (no HTTP timeout pressure)
  const results: Array<{ cardId: string; success: boolean; error?: string }> = []

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((card) => processCard(card)))
    results.push(...batchResults)
    console.log(`Batch ${Math.floor(i / batchSize) + 1} done`)
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success)

  console.log(`\nDone in ${Date.now() - startTime}ms — ${succeeded} succeeded, ${failed.length} failed`)
  if (failed.length > 0) {
    failed.forEach((f) => console.error(`  FAILED ${f.cardId}: ${f.error}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
