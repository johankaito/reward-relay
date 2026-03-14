import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getPointValue, getFinancialYear } from '@/lib/pointValuations'
import { calculateFbtExposure } from '@/lib/fbt'
import { AnnualReport } from '@/components/business/AnnualReport'
import type { ProfitCard } from '@/components/profit/CardBreakdown'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meta = session.user.user_metadata as Record<string, unknown>
  const isBusiness = meta?.subscription_tier === 'business'

  if (!isBusiness) {
    return NextResponse.json({ error: 'Business tier required' }, { status: 403 })
  }

  const { data: earnedCards } = await supabase
    .from('user_cards')
    .select(`
      id, bank, name, annual_fee, bonus_earned_at, is_business,
      cards!card_id (
        welcome_bonus_points,
        points_currency,
        annual_fee
      )
    `)
    .eq('bonus_earned', true)
    .eq('user_id', session.user.id)
    .order('bonus_earned_at', { ascending: false })

  const profitCards: ProfitCard[] = (earnedCards ?? []).map((row) => {
    const cardData = Array.isArray(row.cards) ? row.cards[0] : row.cards
    const points = cardData?.welcome_bonus_points ?? 0
    const program = cardData?.points_currency ?? 'default'
    const bonusAud = points * getPointValue(program)
    const fee = row.annual_fee ?? cardData?.annual_fee ?? 0
    const netValue = bonusAud - fee
    const fy = row.bonus_earned_at ? getFinancialYear(row.bonus_earned_at) : 'Unknown'
    return {
      id: row.id,
      bank: row.bank ?? '',
      name: row.name ?? '',
      bonusAud,
      fee,
      netValue,
      bonusEarnedAt: row.bonus_earned_at ?? '',
      pointsProgram: program,
      welcomeBonusPoints: points,
      fy,
      is_business: row.is_business ?? false,
    }
  })

  const businessCards = profitCards.filter((c) => c.is_business)
  const fbtResults = calculateFbtExposure(
    businessCards.map((c) => ({
      bonus_earned_at: c.bonusEarnedAt || null,
      welcomeBonusPoints: c.welcomeBonusPoints,
      pointsProgram: c.pointsProgram,
    })),
  )

  const now = new Date()
  const fy = profitCards.length > 0
    ? profitCards[0].fy
    : getFinancialYear(now.toISOString())

  const reportData = {
    userEmail: session.user.email ?? '',
    financialYear: fy,
    generatedAt: now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    allCards: profitCards,
    fbtResults,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await renderToStream(React.createElement(AnnualReport, { data: reportData }) as any)

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reward-relay-report-${fy.replace('/', '-')}.pdf"`,
    },
  })
}
