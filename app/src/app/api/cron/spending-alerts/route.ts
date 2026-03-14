import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/email/client'
import { calculatePace } from '@/lib/spendPace'
import {
  getPaceAlertEmail,
  get14DayWarningEmail,
  get3DayWarningEmail,
  getCompletionEmail,
} from '@/lib/email/spendingAlertTemplates'

export const dynamic = 'force-dynamic'

type AlertType = 'spending_pace' | 'spending_14day' | 'spending_3day' | 'spending_completion'

type CardRow = {
  id: string
  user_id: string
  bank: string | null
  name: string | null
  current_spend: number | null
  bonus_spend_deadline: string | null
  application_date: string | null
  alert_enabled: boolean
  bonus_earned: boolean
  card: {
    bonus_spend_requirement: number | null
    welcome_bonus_points: number | null
    points_currency: string | null
  } | null
}

export async function GET(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const { data: activeCards, error } = await supabaseAdmin
      .from('user_cards')
      .select(`
        id, user_id, bank, name, current_spend, bonus_spend_deadline,
        application_date, alert_enabled, bonus_earned,
        card:cards!card_id(bonus_spend_requirement, welcome_bonus_points, points_currency)
      `)
      .eq('status', 'active')
      .eq('alert_enabled', true)
      .eq('bonus_earned', false)
      .not('bonus_spend_deadline', 'is', null)
      .gte('bonus_spend_deadline', todayStr)

    if (error) throw error

    const stats = { pace: 0, warning14: 0, warning3: 0, completion: 0, skipped: 0 }

    const promises = ((activeCards ?? []) as unknown as CardRow[]).map((card) =>
      (async () => {
        const requirement = card.card?.bonus_spend_requirement ?? 0
        if (requirement === 0) {
          stats.skipped++
          return
        }

        const currentSpend = card.current_spend ?? 0
        const deadline = card.bonus_spend_deadline!
        const applicationDate = card.application_date ?? todayStr

        const pace = calculatePace(currentSpend, requirement, applicationDate, deadline)
        const { daysRemaining, requiredDailySpend, paceStatus } = pace

        let alertType: AlertType | null = null
        if (currentSpend >= requirement) {
          alertType = 'spending_completion'
        } else if (daysRemaining <= 3 && paceStatus === 'will_miss') {
          alertType = 'spending_3day'
        } else if (daysRemaining <= 14 && paceStatus !== 'on_track') {
          alertType = 'spending_14day'
        } else if (paceStatus === 'will_miss' && daysRemaining > 14) {
          alertType = 'spending_pace'
        }

        if (!alertType) {
          stats.skipped++
          return
        }

        // Deduplicate: skip if same alert type already sent today
        const { data: existing } = await supabaseAdmin
          .from('email_reminders')
          .select('id')
          .eq('user_card_id', card.id)
          .eq('reminder_type', alertType)
          .gte('sent_at', todayStr)
          .maybeSingle()

        if (existing) {
          stats.skipped++
          return
        }

        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(card.user_id)
        if (!userData?.user?.email) {
          stats.skipped++
          return
        }

        const emailData = {
          cardName: card.name ?? '',
          bank: card.bank ?? '',
          currentSpend,
          requirement,
          daysRemaining,
          dailyNeeded: requiredDailySpend,
          deadline: new Date(deadline).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          appUrl: APP_URL,
        }

        const emailFns = {
          spending_completion: getCompletionEmail,
          spending_3day: get3DayWarningEmail,
          spending_14day: get14DayWarningEmail,
          spending_pace: getPaceAlertEmail,
        }
        const email = emailFns[alertType](emailData)

        await resend.emails.send({
          from: FROM_EMAIL,
          to: userData.user.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })

        await supabaseAdmin.from('email_reminders').insert({
          user_card_id: card.id,
          reminder_type: alertType,
          email_to: userData.user.email,
        })

        if (alertType === 'spending_completion') {
          await supabaseAdmin
            .from('user_cards')
            .update({ bonus_earned_suggested: true })
            .eq('id', card.id)
          stats.completion++
        } else if (alertType === 'spending_3day') {
          stats.warning3++
        } else if (alertType === 'spending_14day') {
          stats.warning14++
        } else {
          stats.pace++
        }
      })()
    )

    await Promise.all(promises)

    return NextResponse.json({
      success: true,
      stats,
      totalCards: activeCards?.length ?? 0,
    })
  } catch (err: unknown) {
    console.error('spending-alerts cron error:', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal server error' },
      { status: 500 },
    )
  }
}
