import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseOzBargainFeed, type OzBargainFeedItem } from '@/lib/ozbargain-parser'
import type { Database } from '@/types/database.types'

const OZBARGAIN_RSS_URL = 'https://www.ozbargain.com.au/deals/feed'

async function fetchOzBargainFeed(): Promise<OzBargainFeedItem[]> {
  const response = await fetch(OZBARGAIN_RSS_URL, {
    headers: { 'User-Agent': 'RewardRelay/1.0' },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`OzBargain feed returned ${response.status}`)
  }

  const xml = await response.text()
  const items: OzBargainFeedItem[] = []

  // Simple XML parsing for RSS feed
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const itemXml = match[1]
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? itemXml.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const description = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ?? itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''

    if (title) {
      items.push({ title, description, link, pubDate })
    }
  }

  return items
}

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

  // CDP-5: Catch feed fetch failures separately → 502
  let feedItems: OzBargainFeedItem[]
  try {
    feedItems = await fetchOzBargainFeed()
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 })
  }

  // CDP-5: Catch parse failures → 500
  let parsedOffers: Awaited<ReturnType<typeof parseOzBargainFeed>>
  try {
    parsedOffers = await parseOzBargainFeed(feedItems)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Feed parse failed: ${String(err)}` },
      { status: 500 }
    )
  }

  let matched = 0
  let signalled = 0
  let confirmed = 0
  let unmatched = 0
  const errors: Array<{ offer: string; error: string }> = []

  // Fuzzy match against cards table
  for (const { offer } of parsedOffers) {
    try {
      // Try to match issuer + card name to existing cards
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

        // CDP-8: Store deal for two-source validation — dedup by card_id+bonus_points within 30 days
        // (ozbargain items have no stable source_url, so upsert-on-conflict is not viable)
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
          if (insertError) {
            errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: insertError.message })
          }
        }

        if (offer.bonusPoints > storedBonus) {
          // Feed shows a higher bonus — flag for authoritative re-extraction
          const { error: updateErr } = await supabase
            .from('cards')
            .update({ needs_verification: true, verification_priority: 'high' })
            .eq('id', cardMatch.id)
          if (updateErr) errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: updateErr.message })
          else signalled++
        } else if (offer.bonusPoints === storedBonus) {
          // Feed confirms our data — refresh last_verified_at
          const { error: updateErr } = await supabase
            .from('cards')
            .update({ last_verified_at: new Date().toISOString() })
            .eq('id', cardMatch.id)
          if (updateErr) errors.push({ offer: offer.cardName ?? offer.issuer ?? '', error: updateErr.message })
          else confirmed++
        }
        // If feedBonus < storedBonus: stale feed item, signal ignored but deal stored
      } else {
        // Store unmatched offer for admin review
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

  return NextResponse.json({
    ok: errors.length === 0,
    feedItems: feedItems.length,
    parsedOffers: parsedOffers.length,
    matched,
    signalled,
    confirmed,
    unmatched,
    errors,
  })
}
