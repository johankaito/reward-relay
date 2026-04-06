#!/usr/bin/env tsx
/**
 * Standalone PointHacks deals sync script.
 * Replicates the logic of app/api/cron/deals-sync/route.ts.
 */

import { createClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'
import { extractIssuer, extractNetwork, extractExpiry } from '@/lib/dealEnrichment'
import type { Database } from '@/types/database.types'

const POINT_HACKS_RSS = 'https://www.pointhacks.com.au/feed/'
const CREDIT_CARD_KEYWORDS = [
  'credit card',
  'bonus points',
  'welcome bonus',
  'sign-up bonus',
  'annual fee waived',
  'qantas points',
  'velocity points',
]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const response = await fetch(POINT_HACKS_RSS, {
    headers: { 'User-Agent': 'RewardRelay/1.0' },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    console.error(`Feed returned ${response.status}`)
    process.exit(1)
  }

  const xml = await response.text()

  let items: Record<string, unknown>[]
  try {
    const parser = new XMLParser({ ignoreAttributes: false })
    const feed = parser.parse(xml)
    items = feed?.rss?.channel?.item ?? []
  } catch (err) {
    console.error('XML parse failed:', err)
    process.exit(1)
  }

  console.log(`Fetched ${items.length} RSS items`)

  let inserted = 0
  let skipped = 0
  let signalled = 0
  let unmatchedStored = 0
  const errors: { title: string; error: string }[] = []

  for (const item of items) {
    const title = (item.title as string) ?? ''
    const description = (item.description as string) ?? ''
    const combined = `${title} ${description}`.toLowerCase()

    const isRelevant = CREDIT_CARD_KEYWORDS.some((kw) => combined.includes(kw))
    if (!isRelevant) {
      skipped++
      continue
    }

    const specific_issuer = extractIssuer(title)
    const card_network = extractNetwork(title)
    const valid_until = extractExpiry(description)

    let matchedCardId: string | null = null
    if (specific_issuer) {
      const { data: matchedCards } = await supabase
        .from('cards')
        .select('id, name, bank')
        .ilike('bank', `%${specific_issuer}%`)
        .eq('is_active', true)
        .limit(5)

      if (matchedCards && matchedCards.length > 0) {
        matchedCardId = matchedCards[0].id
        const cardIds = matchedCards.map((c) => c.id)
        await supabase
          .from('cards')
          .update({ needs_verification: true, verification_priority: 'high' })
          .in('id', cardIds)
        signalled += cardIds.length
      } else {
        await supabase.from('unmatched_deals').insert({
          source: 'pointhacks',
          raw_title: title.slice(0, 255),
          extracted_issuer: specific_issuer,
          extracted_card_name: null,
          bonus_points: null,
          source_url: (item.link as string) ?? null,
          status: 'pending',
        })
        unmatchedStored++
      }
    }

    const { error } = await supabase.from('deals').upsert(
      {
        title: title.slice(0, 255),
        description: description.slice(0, 1000),
        merchant: specific_issuer ?? 'Various',
        deal_url: (item.link as string) ?? '',
        source: 'pointhacks',
        source_url: (item.link as string) ?? '',
        specific_issuer,
        card_network,
        card_id: matchedCardId,
        valid_from: new Date((item.pubDate as string) ?? Date.now()).toISOString(),
        valid_until:
          valid_until ??
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      },
      { onConflict: 'source_url' }
    )

    if (error) {
      errors.push({ title: title.slice(0, 100), error: error.message })
    } else {
      inserted++
    }
  }

  console.log(`\nDone — inserted=${inserted}, skipped=${skipped}, signalled=${signalled}, unmatchedStored=${unmatchedStored}, errors=${errors.length}`)
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`  ERROR "${e.title}": ${e.error}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
