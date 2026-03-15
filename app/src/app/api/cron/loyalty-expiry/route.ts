import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

/**
 * Loyalty point expiry checker
 *
 * Checks if users have cancelled cards where their earned bonus points
 * may be at risk of expiry. Alerts when cards have been cancelled for
 * 12+ months (typical program inactivity threshold).
 *
 * Velocity: expire after 18 months inactivity
 * Qantas: expire 18 months after last earn activity
 * Membership Rewards (Amex): no expiry while card active, expire on cancel
 */

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  try {
    // Find cards cancelled 12–18 months ago where bonus was earned
    // These users have loyalty points that may soon expire (inactivity window)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const eighteenMonthsAgo = new Date()
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18)

    const { data: atRiskCards, error } = await supabase
      .from('user_cards')
      .select(`
        id,
        user_id,
        bank,
        name,
        cancellation_date,
        bonus_earned,
        card:cards(points_currency, welcome_bonus_points)
      `)
      .eq('status', 'cancelled')
      .eq('bonus_earned', true)
      .gte('cancellation_date', eighteenMonthsAgo.toISOString().split('T')[0])
      .lte('cancellation_date', twelveMonthsAgo.toISOString().split('T')[0])

    if (error) throw error

    // Filter to programs with inactivity expiry
    const EXPIRY_PROGRAMS = ['Velocity Points', 'Qantas Points', 'KrisFlyer', 'Asia Miles']
    const flagged = (atRiskCards ?? []).filter(c => {
      const prog = c.card?.points_currency ?? ''
      return EXPIRY_PROGRAMS.some(p => prog.includes(p))
    })

    return NextResponse.json({
      success: true,
      checked: atRiskCards?.length ?? 0,
      flagged: flagged.length,
      note: 'Email notifications for loyalty expiry are pending email template creation',
    })
  } catch (err: unknown) {
    console.error('loyalty-expiry cron error:', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}
