import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchCardPageByUrl } from '@/lib/card-fetcher'
import { extractCardData, getVerificationAction } from '@/lib/card-extractor'
import { reconcileCardData, type CdrProduct } from '@/lib/cdr/reconcile'
import type { Database } from '@/types/database.types'

type Card = Database['public']['Tables']['cards']['Row']

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

    const updateData: Database['public']['Tables']['cards']['Update'] = {
      needs_verification: verificationAction.needsVerification || reconciled.requiresReview,
      verification_priority: verificationAction.verificationPriority,
      last_verified_at: new Date().toISOString(),
    }

    if (reconciled.resolvedAnnualFee !== null) {
      updateData.annual_fee = reconciled.resolvedAnnualFee
    }

    if (reconciled.isDiscontinued) {
      updateData.is_active = false
    }

    await supabase.from('cards').update(updateData).eq('id', cardId)

    console.log(
      `Extracted ${card.name}: confidence=${extracted.confidenceScore.toFixed(2)}, conflicts=${reconciled.conflicts.length}`
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
