import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAllBanksCDRProducts } from '@/lib/cdr/fetcher'
import type { Database } from '@/types/database.types'

type CdrProductInsert = Database['public']['Tables']['cdr_products']['Insert']

export async function POST(request: NextRequest) {
  // Verify cron secret
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
  let totalUpserted = 0
  let totalFailed = 0
  const bankSummary: Array<{ bank: string; upserted: number; error?: string }> = []

  try {
    const bankResults = await fetchAllBanksCDRProducts()

    for (const { bankSlug, products, error } of bankResults) {
      if (error || products.length === 0) {
        bankSummary.push({ bank: bankSlug, upserted: 0, error: error ?? 'No products found' })
        totalFailed++
        continue
      }

      // Upsert in batches of 50
      const batchSize = 50
      let bankUpserted = 0

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)

        const { error: upsertError } = await supabase
          .from('cdr_products')
          .upsert(batch as CdrProductInsert[], {
            onConflict: 'bank_slug,product_id',
          })

        if (upsertError) {
          console.error(`Upsert error for ${bankSlug}:`, upsertError)
        } else {
          bankUpserted += batch.length
        }
      }

      // Mark products not in this refresh as inactive for this bank
      if (products.length > 0) {
        const activeProductIds = products.map((p) => p.product_id)
        await supabase
          .from('cdr_products')
          .update({ is_active: false })
          .eq('bank_slug', bankSlug)
          .not('product_id', 'in', `(${activeProductIds.map((id) => `"${id}"`).join(',')})`)
      }

      totalUpserted += bankUpserted
      bankSummary.push({ bank: bankSlug, upserted: bankUpserted })
    }

    return NextResponse.json({
      success: true,
      totalUpserted,
      totalFailed,
      durationMs: Date.now() - startTime,
      banks: bankSummary,
    })
  } catch (error) {
    console.error('CDR refresh cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
