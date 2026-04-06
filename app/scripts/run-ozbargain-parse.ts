#!/usr/bin/env tsx
/**
 * Standalone OzBargain feed parser script.
 * Replicates the logic of app/api/cron/ozbargain-parse/route.ts.
 */

import { createClient } from '@supabase/supabase-js'
import { parseOzBargainFeed, type OzBargainFeedItem } from '@/lib/ozbargain-parser'
import type { Database } from '@/types/database.types'

const OZBARGAIN_RSS_URL = 'https://www.ozbargain.com.au/deals/feed'

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

async function fetchOzBargainFeed(): Promise<OzBargainFeedItem[]> {
  const response = await fetch(OZBARGAIN_RSS_URL, {
    headers: { 'User-Agent': 'RewardRelay/1.0' },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) throw new Error(`OzBargain feed returned ${response.status}`)

  const xml = await response.text()
  const items: OzBargainFeedItem[] = []

  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const itemXml = match[1]
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ?? itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''

    if (title) items.push({ title, description, link, pubDate })
  }

  return items
}

async function main() {
  const feedItems = await fetchOzBargainFeed()
  console.log(`Fetched ${feedItems.length} feed items`)

  const parsedOffers = await parseOzBargainFeed(feedItems)
  console.log(`Parsed ${parsedOffers.length} credit card offers`)

  let matched = 0
  let signalled = 0
  let confirmed = 0
  let unmatched = 0
  const errors: Array<{ offer: string; error: string }> = []

  for (const { offer } of parsedOffers) {
    try {
      const { data: matchedCards } = await supabase
        .from('cards')
        .select('id, name, bank, welcome_bonus_points, offer_expiry_date')
        .ilike('bank', `%${offer.issuer}%`)
        .limit(10)

      let cardMatch = null
      if (matchedCards && matchedCards.length > 0) {
        if (offer.cardName) {
          cardMatch = matchedCards.find(
            (c) =>
              c.name.toLowerCase().includes(offer.cardName!.toLowerCase()) ||
              offer.cardName!.toLowerCase().includes(c.name.toLowerCase())
          )
        }
        if (!cardMatch) cardMatch = matchedCards[0]
      }

      if (cardMatch) {
        matched++
        const storedBonus = cardMatch.welcome_bonus_points ?? 0

        const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
        const { data: existingDeal } = await supabase
          .from('deals')
          .select('id')
          .eq('card_id', cardMatch.id)
          .eq('bonus_points', offer.bonusPoints)
          .gte('created_at', thirtyDaysAgo)
          .limit(1)

        if (!existingDeal || existingDeal.length === 0) {
          const { error: insertError } = await supabase.from('deals').insert({
            title: `${offer.issuer ?? ''} ${offer.cardName ?? ''} — ${offer.bonusPoints.toLocaleString()} pts bonus`.trim().slice(0, 255),
            merchant: offer.issuer ?? 'Various',
            deal_url: '',
            source: 'ozbargain',
            specific_issuer: offer.issuer ?? null,
            card_id: cardMatch.id,
            bonus_points: offer.bonusPoints,
            valid_from: new Date().toISOString(),
            is_active: true,
          })
          if (insertError) errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: insertError.message })
        }

        if (offer.bonusPoints > storedBonus) {
          const { error: updateErr } = await supabase
            .from('cards')
            .update({ needs_verification: true, verification_priority: 'high' })
            .eq('id', cardMatch.id)
          if (updateErr) errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: updateErr.message })
          else signalled++
        } else if (offer.bonusPoints === storedBonus) {
          const { error: updateErr } = await supabase
            .from('cards')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('id', cardMatch.id)
          if (updateErr) errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: updateErr.message })
          else confirmed++
        }
      } else {
        const { error: insertErr } = await supabase.from('unmatched_deals').insert({
          source: 'ozbargain',
          raw_title: offer.cardName ?? null,
          extracted_issuer: offer.issuer ?? null,
          extracted_card_name: offer.cardName ?? null,
          bonus_points: typeof offer.bonusPoints === 'number' ? offer.bonusPoints : null,
          source_url: null,
          status: 'pending',
        })
        if (insertErr) errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: insertErr.message })
        else unmatched++
      }
    } catch (err) {
      errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: String(err) })
    }
  }

  console.log(`\nDone — matched=${matched}, signalled=${signalled}, confirmed=${confirmed}, unmatched=${unmatched}, errors=${errors.length}`)
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`  ERROR ${e.offer}: ${e.error}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
