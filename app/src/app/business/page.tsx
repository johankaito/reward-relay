'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Download } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProGate } from '@/components/ui/ProGate'
import { CardBreakdown, type ProfitCard } from '@/components/profit/CardBreakdown'
import { supabase } from '@/lib/supabase/client'
import { getPointValue, getFinancialYear } from '@/lib/pointValuations'
import { calculateFbtExposure } from '@/lib/fbt'

export default function BusinessPage() {
  const router = useRouter()
  const [businessCards, setBusinessCards] = useState<ProfitCard[]>([])
  const [isBusiness, setIsBusiness] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent('/business')}`)
        return
      }

      const meta = session.user.user_metadata as Record<string, unknown>
      const businessFlag = meta?.subscription_tier === 'business'
      setIsBusiness(businessFlag)

      const { data: earnedCards } = await supabase
        .from('user_cards')
        .select(`id, bank, name, annual_fee, bonus_earned_at, is_business, cards!card_id (welcome_bonus_points, points_currency, annual_fee)`)
        .eq('bonus_earned', true)
        .eq('is_business', true)
        .order('bonus_earned_at', { ascending: false })

      const cards: ProfitCard[] = (earnedCards ?? []).map((row) => {
        const cardData = Array.isArray(row.cards) ? row.cards[0] : row.cards
        const points = cardData?.welcome_bonus_points ?? 0
        const program = cardData?.points_currency ?? 'default'
        const bonusAud = points * getPointValue(program)
        const fee = row.annual_fee ?? cardData?.annual_fee ?? 0
        return {
          id: row.id,
          bank: row.bank ?? '',
          name: row.name ?? '',
          bonusAud,
          fee,
          netValue: bonusAud - fee,
          bonusEarnedAt: row.bonus_earned_at ?? '',
          pointsProgram: program,
          welcomeBonusPoints: points,
          fy: row.bonus_earned_at ? getFinancialYear(row.bonus_earned_at) : 'Unknown',
          is_business: true,
        }
      })
      setBusinessCards(cards)
      setLoading(false)
    }
    void load()
  }, [router])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--surface-subtle)]" />
          ))}
        </div>
      </AppShell>
    )
  }

  const fbtResults = calculateFbtExposure(
    businessCards.map((c) => ({
      bonus_earned_at: c.bonusEarnedAt || null,
      welcomeBonusPoints: c.welcomeBonusPoints,
      pointsProgram: c.pointsProgram,
    })),
  )
  const totalBonus = businessCards.reduce((s, c) => s + c.bonusAud, 0)
  const totalFees  = businessCards.reduce((s, c) => s + c.fee, 0)
  const fmt = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">Business</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Business Tier</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Business card P&amp;L and FBT tools</p>
          </div>
          <ProGate feature="annual report" isPro={isBusiness} requiredTier="business">
            <Button variant="outline" size="sm" asChild>
              <a href="/api/business/report" download>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Annual Report (PDF)
              </a>
            </Button>
          </ProGate>
        </div>

        {businessCards.length === 0 ? (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-[var(--text-secondary)]/40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">No business cards tracked</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Flag a card as business on the Cards page to see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
              <CardContent className="pt-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Business bonuses</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{fmt(totalBonus)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Fees paid</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{fmt(totalFees)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Net</p>
                    <p className="mt-1 text-2xl font-bold" style={{ color: (totalBonus - totalFees) >= 0 ? 'var(--accent)' : 'var(--destructive)' }}>
                      {fmt(totalBonus - totalFees)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ProGate feature="FBT calculator" isPro={isBusiness} requiredTier="business">
              <div className="space-y-2">
                {fbtResults.map((r) => (
                  <div
                    key={r.fbtYear}
                    className={`rounded-xl border p-4 ${r.thresholdExceeded ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-green-500/40 bg-green-500/10'}`}
                  >
                    <p className={`text-sm font-semibold ${r.thresholdExceeded ? 'text-yellow-300' : 'text-green-300'}`}>
                      FBT {r.fbtYear} — {r.thresholdExceeded ? `Potential exposure ~${fmt(r.estimatedFbtLiability)}` : 'Under threshold'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{r.disclaimer}</p>
                  </div>
                ))}
              </div>
            </ProGate>

            <CardBreakdown cards={businessCards} />
          </>
        )}
      </div>
    </AppShell>
  )
}
