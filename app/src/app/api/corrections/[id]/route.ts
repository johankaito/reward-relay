import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

const ADMIN_EMAIL = 'john.g.keto+rewardrelay@gmail.com'

// Map correction field names (user-facing) → cards table column names.
// Allowlist prevents arbitrary column injection.
const FIELD_TO_COLUMN: Record<string, keyof Database['public']['Tables']['cards']['Update']> = {
  bonusPoints: 'welcome_bonus_points',
  annualFee: 'annual_fee',
  earnRate: 'earn_rate_primary',
  spendRequirement: 'bonus_spend_requirement',
  bonus_spend_window_months: 'bonus_spend_window_months',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth: admin only
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: correctionId } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const status = (body as { status?: string })?.status
  if (status !== 'verified' && status !== 'dismissed') {
    return NextResponse.json(
      { error: 'status must be "verified" or "dismissed"' },
      { status: 400 }
    )
  }

  // Use service role for writes
  const serviceSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Fetch the correction record
  const { data: correction, error: fetchError } = await serviceSupabase
    .from('card_corrections')
    .select('id, card_id, field, reported_value, status')
    .eq('id', correctionId)
    .single()

  if (fetchError || !correction) {
    return NextResponse.json({ error: 'Correction not found' }, { status: 404 })
  }

  if (correction.status !== 'pending') {
    return NextResponse.json(
      { error: `Correction is already ${correction.status}` },
      { status: 409 }
    )
  }

  // If approving, write the value back to the cards table
  if (status === 'verified') {
    const column = FIELD_TO_COLUMN[correction.field]
    if (!column) {
      return NextResponse.json(
        { error: `Field "${correction.field}" cannot be applied — not in allowlist` },
        { status: 400 }
      )
    }

    if (!correction.card_id) {
      return NextResponse.json({ error: 'Correction has no card_id' }, { status: 422 })
    }

    const numericValue = Number(correction.reported_value)
    if (!Number.isFinite(numericValue)) {
      return NextResponse.json(
        { error: `reported_value "${correction.reported_value}" is not a valid number` },
        { status: 400 }
      )
    }

    const { error: updateError } = await serviceSupabase
      .from('cards')
      .update({ [column]: numericValue } as Database['public']['Tables']['cards']['Update'])
      .eq('id', correction.card_id)

    if (updateError) {
      console.error('Failed to apply correction to cards table:', updateError)
      return NextResponse.json({ error: 'Failed to apply correction to card' }, { status: 500 })
    }
  }

  // Mark correction as verified or dismissed
  const { error: statusError } = await serviceSupabase
    .from('card_corrections')
    .update({ status })
    .eq('id', correctionId)

  if (statusError) {
    console.error('Failed to update correction status:', statusError)
    return NextResponse.json({ error: 'Failed to update correction status' }, { status: 500 })
  }

  return NextResponse.json({ success: true, correctionId, status })
}
