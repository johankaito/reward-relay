#!/usr/bin/env tsx
/**
 * Standalone TC (terms & conditions) cooling-period verification script.
 * Replicates the logic of app/api/cron/tc-verify/route.ts.
 */

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { fetchCardPageByUrl } from '@/lib/card-fetcher'
import type { Database } from '@/types/database.types'

type BankExclusionPeriod = Database['public']['Tables']['bank_exclusion_periods']['Row']

interface ExtractedPeriod {
  cooling_period_months: number | null
  scope: string
  exact_quote: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function extractCoolingPeriod(pageMarkdown: string, bankName: string): Promise<ExtractedPeriod | null> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Extract the welcome bonus cooling/exclusion period from these credit card terms for ${bankName}. This is the period a customer must wait after closing a card before being eligible for a new welcome bonus from the same bank.\n\nReturn ONLY valid JSON: {"cooling_period_months": number|null, "scope": "string", "exact_quote": "string"}. If unclear, return null for cooling_period_months.\n\nTerms:\n${pageMarkdown.slice(0, 8000)}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    return JSON.parse(jsonMatch[0]) as ExtractedPeriod
  } catch {
    return null
  }
}

async function main() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: periodsToVerify } = await supabase
    .from('bank_exclusion_periods')
    .select('*')
    .not('official_tc_url', 'is', null)
    .or(`last_verified_at.is.null,last_verified_at.lt.${sevenDaysAgo}`)

  if (!periodsToVerify?.length) {
    console.log('No periods due for verification')
    process.exit(0)
  }

  console.log(`Verifying ${periodsToVerify.length} bank exclusion periods...`)

  let processed = 0
  let matched = 0
  const mismatches: Array<{ bank_slug: string; stored_months: number | null; extracted_months: number | null }> = []

  for (const period of periodsToVerify as BankExclusionPeriod[]) {
    if (!period.official_tc_url) continue

    try {
      const page = await fetchCardPageByUrl(period.official_tc_url, 1)
      const extracted = await extractCoolingPeriod(page.markdown, period.bank_name)

      if (!extracted) {
        console.log(`  ${period.bank_slug}: could not extract — skipping`)
        processed++
        continue
      }

      const hasMismatch = extracted.cooling_period_months !== period.exclusion_months

      await supabase
        .from('bank_exclusion_periods')
        .update({
          tc_exact_quote: extracted.exact_quote,
          verified_by: 'automated',
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', period.id)

      if (hasMismatch) {
        mismatches.push({
          bank_slug: period.bank_slug,
          stored_months: period.exclusion_months,
          extracted_months: extracted.cooling_period_months,
        })
        console.warn(`  MISMATCH ${period.bank_slug}: stored=${period.exclusion_months}mo, extracted=${extracted.cooling_period_months}mo`)
      } else {
        matched++
        console.log(`  OK ${period.bank_slug}: ${period.exclusion_months}mo confirmed`)
      }

      processed++
    } catch (err) {
      console.error(`  ERROR ${period.bank_slug}:`, err)
      processed++
    }
  }

  console.log(`\nDone — ${processed} processed, ${matched} matched, ${mismatches.length} mismatches`)
  if (mismatches.length > 0) {
    console.warn('Mismatches detected — review bank_exclusion_periods table')
    mismatches.forEach((m) =>
      console.warn(`  ${m.bank_slug}: stored=${m.stored_months}mo vs extracted=${m.extracted_months}mo`)
    )
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
