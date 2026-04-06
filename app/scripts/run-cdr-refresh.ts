#!/usr/bin/env tsx
/**
 * Standalone CDR product refresh script.
 * Replicates the logic of app/api/cron/cdr-refresh/route.ts.
 */

import { createClient } from '@supabase/supabase-js'
import { fetchAllBanksCDRProducts } from '@/lib/cdr/fetcher'
import type { Database } from '@/types/database.types'

type CdrProductInsert = Database['public']['Tables']['cdr_products']['Insert']

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const startTime = Date.now()
  let totalUpserted = 0
  let totalFailed = 0
  const bankSummary: Array<{ bank: string; upserted: number; error?: string }> = []

  const bankResults = await fetchAllBanksCDRProducts()

  for (const { bankSlug, products, error } of bankResults) {
    if (error || products.length === 0) {
      console.error(`  ${bankSlug}: ${error ?? 'No products found'}`)
      bankSummary.push({ bank: bankSlug, upserted: 0, error: error ?? 'No products found' })
      totalFailed++
      continue
    }

    const batchSize = 50
    let bankUpserted = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      const { error: upsertError } = await supabase
        .from('cdr_products')
        .upsert(batch as CdrProductInsert[], { onConflict: 'bank_slug,product_id' })

      if (upsertError) {
        console.error(`  Upsert error for ${bankSlug}:`, upsertError.message)
      } else {
        bankUpserted += batch.length
      }
    }

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
    console.log(`  ${bankSlug}: ${bankUpserted} products upserted`)
  }

  console.log(`\nDone in ${Date.now() - startTime}ms — ${totalUpserted} upserted, ${totalFailed} banks failed`)
  bankSummary.forEach((b) => {
    if (b.error) console.error(`  FAILED ${b.bank}: ${b.error}`)
  })

  if (totalFailed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
