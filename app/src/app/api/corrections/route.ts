import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

interface CorrectionBody {
  cardId: string
  field: string
  reportedValue: string
}

function isValidBody(body: unknown): body is CorrectionBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as CorrectionBody).cardId === 'string' &&
    typeof (body as CorrectionBody).field === 'string' &&
    typeof (body as CorrectionBody).reportedValue === 'string'
  )
}

const VALID_FIELDS = ['bonusPoints', 'annualFee', 'earnRate', 'spendRequirement', 'other']

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: 'Missing required fields: cardId, field, reportedValue' }, { status: 400 })
  }

  const { cardId, field, reportedValue } = body

  if (!VALID_FIELDS.includes(field)) {
    return NextResponse.json({ error: `Invalid field. Must be one of: ${VALID_FIELDS.join(', ')}` }, { status: 400 })
  }

  if (reportedValue.trim().length === 0) {
    return NextResponse.json({ error: 'reportedValue cannot be empty' }, { status: 400 })
  }

  const { data: correction, error: insertError } = await supabase
    .from('card_corrections')
    .insert({
      card_id: cardId,
      field,
      reported_value: reportedValue.trim(),
      reported_by: session.user.id,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Failed to insert correction:', insertError)
    return NextResponse.json({ error: 'Failed to save correction' }, { status: 500 })
  }

  // Flag card for verification with high priority
  await supabase
    .from('cards')
    .update({
      needs_verification: true,
      verification_priority: 'high',
    })
    .eq('id', cardId)

  return NextResponse.json({ success: true, correctionId: correction.id })
}
