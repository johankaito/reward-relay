import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseOzBargainFeed, type OzBargainFeedItem } from '@/lib/ozbargain-parser'

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  try {
    // Fetch OzBargain RSS feed
    const feedItems = await fetchOzBargainFeed()
    console.log(`Fetched ${feedItems.length} OzBargain items`)

    // Parse with Claude Haiku
    const parsedOffers = await parseOzBargainFeed(feedItems)
    console.log(`Parsed ${parsedOffers.length} bonus offers`)

    let matched = 0
    let unmatched = 0

    // Fuzzy match against cards table
    for (const { offer } of parsedOffers) {
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
        // Only update if the offer is newer or has more points
        const shouldUpdate =
          !cardMatch.welcome_bonus_points ||
          offer.bonusPoints > cardMatch.welcome_bonus_points

        if (shouldUpdate) {
          await supabase
            .from('cards')
            .update({
              welcome_bonus_points: offer.bonusPoints,
              bonus_spend_requirement: offer.spendRequirement,
              ...(offer.expiryDate && { offer_expiry_date: offer.expiryDate }),
              last_verified_at: new Date().toISOString(),
            })
            .eq('id', cardMatch.id)
        }
        matched++
      } else {
        console.log(`Unmatched offer: ${offer.issuer} - ${offer.cardName ?? 'unknown card'} (${offer.bonusPoints} ${offer.programName})`)
        unmatched++
      }
    }

    return NextResponse.json({
      success: true,
      feedItems: feedItems.length,
      parsedOffers: parsedOffers.length,
      matched,
      unmatched,
    })
  } catch (error) {
    console.error('OzBargain parse cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
