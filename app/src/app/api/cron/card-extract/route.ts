import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchCardPageByUrl } from '@/lib/card-fetcher'
import { extractCardData, getVerificationAction } from '@/lib/card-extractor'
import { reconcileCardData, type CdrProduct } from '@/lib/cdr/reconcile'
import { computeChangeHash, compareHashes } from '@/lib/change-hash'
import type { Database } from '@/types/database.types'

type Card = Database['public']['Tables']['cards']['Row']

const HIGH_CONFIDENCE = 0.75

async function processCard(
  card: Card,
  supabase: ReturnType<typeof createClient<Database>>
): Promise<{ cardId: string; success: boolean; error?: string }> {
  const cardId = card.id

  try {
    const cardUrl = card.application_link
    if (!cardUrl) {
      return { cardId, success: false, error: 'No application_link' }
    }

    // Fetch page content
    const { markdown } = await fetchCardPageByUrl(cardUrl)

    // Get CDR data for this bank if available
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

    // Extract card data with Claude
    const extracted = await extractCardData(markdown, cdrData)

    // Reconcile with CDR data
    const reconciled = cdrData
      ? reconcileCardData(cdrData, extracted)
      : { conflicts: [], resolvedAnnualFee: null, requiresReview: false, isDiscontinued: false }

    // Determine verification action
    const verificationAction = getVerificationAction(extracted.confidenceScore)
    const now = new Date().toISOString()

    // Compute change hash from extracted data
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

    if (hasChanged) {
      updateData.change_detected_at = now
    }

    if (reconciled.resolvedAnnualFee !== null) {
      updateData.annual_fee = reconciled.resolvedAnnualFee
    }

    if (reconciled.isDiscontinued) {
      updateData.is_active = false
    }

    // Write bonus + earn data only when confidence is high enough to trust
    if (extracted.confidenceScore >= HIGH_CONFIDENCE) {
      const extractedBonus = extracted.bonusOffer?.bonusPoints ?? null
      const existingBonus = card.welcome_bonus_points
      const bonusChanged = extractedBonus !== null && extractedBonus !== existingBonus

      if (extracted.bonusOffer) {
        const TWO_SOURCE_CONFIDENCE = 0.80

        if (bonusChanged && extracted.confidenceScore >= TWO_SOURCE_CONFIDENCE) {
          // CDP-8: Bonus changed at high confidence — require deal feed confirmation before auto-publishing
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
          const { data: dealConfirmation } = await supabase
            .from('deals')
            .select('id')
            .eq('card_id', cardId)
            .gte('bonus_points', Math.floor((extractedBonus ?? 0) * 0.95))
            .gte('created_at', thirtyDaysAgo)
            .limit(1)

          if (dealConfirmation && dealConfirmation.length > 0) {
            // Two sources agree — auto-publish bonus + spend fields
            updateData.welcome_bonus_points = extractedBonus
            updateData.bonus_spend_requirement = extracted.bonusOffer.spendRequirement
            updateData.bonus_spend_window_months = extracted.bonusOffer.timeframeMonths
            if (extracted.bonusOffer.expiryDate) {
              updateData.offer_expiry_date = extracted.bonusOffer.expiryDate
            }
          } else {
            // Only Claude detected the change — hold for review, don't auto-publish
            updateData.needs_verification = true
            updateData.verification_priority = 'high'
            console.log(
              `Two-source gate: ${card.name} extracted=${extractedBonus}, stored=${card.welcome_bonus_points} — no deal confirmation, holding for review`
            )
          }
        } else {
          // No change or below two-source threshold — write bonus + spend fields directly
          updateData.welcome_bonus_points = extracted.bonusOffer.bonusPoints
          updateData.bonus_spend_requirement = extracted.bonusOffer.spendRequirement
          updateData.bonus_spend_window_months = extracted.bonusOffer.timeframeMonths
          if (extracted.bonusOffer.expiryDate) {
            updateData.offer_expiry_date = extracted.bonusOffer.expiryDate
          }
        }
      } else {
        // Bonus offer no longer present — clear stale values
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

      if (extracted.minIncome !== null) {
        updateData.min_income = extracted.minIncome
      }
    }

    await supabase.from('cards').update(updateData).eq('id', cardId)

    // Write to extraction_log so admin dashboard has visibility
    await supabase.from('extraction_log').insert({
      card_id: cardId,
      run_at: now,
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

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
    return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 })
  }

  if (!cards || cards.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: 'No cards need extraction' })
  }

  const batchSize = 10
  const results: Array<{ cardId: string; success: boolean; error?: string }> = []

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map((card) => processCard(card, supabase))
    )
    results.push(...batchResults)
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    success: true,
    processed: results.length,
    succeeded,
    failed,
    durationMs: Date.now() - startTime,
  })
}
