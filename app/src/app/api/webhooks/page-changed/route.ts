import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

interface ChangeDetectionPayload {
  url: string
  changeType?: string
  uuid?: string
  [key: string]: unknown
}

function isValidPayload(body: unknown): body is ChangeDetectionPayload {
  return (
    typeof body === 'object' &&
    body !== null &&
    'url' in body &&
    typeof (body as ChangeDetectionPayload).url === 'string'
  )
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: 'Missing required field: url' },
      { status: 400 }
    )
  }

  const { url } = body

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Fetch all cards with application links and match in JS
  const { data: allCards, error } = await supabase
    .from('cards')
    .select('id, name, bank, application_link, scrape_url')
    .not('application_link', 'is', null)

  if (error) {
    console.error('DB error fetching cards:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!allCards || allCards.length === 0) {
    return NextResponse.json({ matched: false, cardId: null })
  }

  type CardRow = (typeof allCards)[number]
  let matchedCard: CardRow | undefined

  // Try exact URL match first
  matchedCard = allCards.find((c) => c.application_link === url)

  // Try hostname match
  if (!matchedCard) {
    try {
      const incomingHostname = new URL(url).hostname
      matchedCard = allCards.find((c) => {
        if (!c.application_link) return false
        try {
          return new URL(c.application_link).hostname === incomingHostname
        } catch {
          return false
        }
      })
    } catch {
      // URL parsing failed, skip hostname match
    }
  }

  if (!matchedCard) {
    console.log(`Page changed: no card matched for URL ${url}`)
    return NextResponse.json({ matched: false, cardId: null })
  }

  const { error: updateError } = await supabase
    .from('cards')
    .update({
      needs_verification: true,
      change_detected_at: new Date().toISOString(),
    })
    .eq('id', matchedCard.id)

  if (updateError) {
    console.error('Failed to update card:', updateError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  console.log(`Page changed: matched card ${matchedCard.name} (${matchedCard.id}) for URL ${url}`)
  return NextResponse.json({ matched: true, cardId: matchedCard.id })
}
