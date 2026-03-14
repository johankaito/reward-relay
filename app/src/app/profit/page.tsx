"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Download, AlertTriangle, CheckCircle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProGate } from "@/components/ui/ProGate"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { getPointValue, getFinancialYear } from "@/lib/pointValuations"
import { CardBreakdown, type ProfitCard } from "@/components/profit/CardBreakdown"
import { Leaderboard } from "@/components/gamification/Leaderboard"
import { exportProfitCsv } from "@/lib/exportProfitCsv"
import { calculateFbtExposure, type FbtResult } from "@/lib/fbt"

interface FYRow {
  fy: string
  bonusAud: number
  fee: number
  netValue: number
}

type Tab = 'all' | 'personal' | 'business'

function fmtAud(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
}

function computeSummary(cards: ProfitCard[]) {
  const totalBonusAud = cards.reduce((s, c) => s + c.bonusAud, 0)
  const totalFees = cards.reduce((s, c) => s + c.fee, 0)
  const byFy: Record<string, FYRow> = {}
  for (const c of cards) {
    if (!byFy[c.fy]) byFy[c.fy] = { fy: c.fy, bonusAud: 0, fee: 0, netValue: 0 }
    byFy[c.fy].bonusAud += c.bonusAud
    byFy[c.fy].fee += c.fee
    byFy[c.fy].netValue += c.netValue
  }
  return {
    totalBonusAud,
    totalFees,
    netProfit: totalBonusAud - totalFees,
    fyRows: Object.values(byFy).sort((a, b) => b.fy.localeCompare(a.fy)),
  }
}

export default function ProfitPage() {
  const router = useRouter()
  const [allCards, setAllCards] = useState<ProfitCard[]>([])
  const [isPro, setIsPro] = useState(false)
  const [isBusiness, setIsBusiness] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('all')

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/")
        return
      }

      const meta = session.user.user_metadata as Record<string, unknown>
      const businessFlag = meta?.subscription_tier === "business"
      const proFlag = meta?.is_pro === true || meta?.subscription_tier === "pro" || businessFlag
      setIsPro(proFlag)
      setIsBusiness(businessFlag)

      const { data: earnedCards } = await supabase
        .from("user_cards")
        .select(`
          id, bank, name, annual_fee, bonus_earned_at, is_business,
          cards!card_id (
            welcome_bonus_points,
            points_currency,
            annual_fee
          )
        `)
        .eq("bonus_earned", true)
        .order("bonus_earned_at", { ascending: false })

      if (!earnedCards) {
        setLoading(false)
        return
      }

      const profitCards: ProfitCard[] = earnedCards.map((row) => {
        const cardData = Array.isArray(row.cards) ? row.cards[0] : row.cards
        const points = cardData?.welcome_bonus_points ?? 0
        const program = cardData?.points_currency ?? "default"
        const bonusAud = points * getPointValue(program)
        const fee = row.annual_fee ?? cardData?.annual_fee ?? 0
        const netValue = bonusAud - fee
        const fy = row.bonus_earned_at ? getFinancialYear(row.bonus_earned_at) : "Unknown"
        return {
          id: row.id,
          bank: row.bank ?? "",
          name: row.name ?? "",
          bonusAud,
          fee,
          netValue,
          bonusEarnedAt: row.bonus_earned_at ?? "",
          pointsProgram: program,
          welcomeBonusPoints: points,
          fy,
          is_business: row.is_business ?? false,
        }
      })

      setAllCards(profitCards)
      setLoading(false)
    }
    void load()
  }, [router])

  const hasBusinessCards = useMemo(() => allCards.some((c) => c.is_business), [allCards])

  const visibleCards = useMemo(() => {
    if (activeTab === 'personal') return allCards.filter((c) => !c.is_business)
    if (activeTab === 'business') return allCards.filter((c) => c.is_business)
    return allCards
  }, [allCards, activeTab])

  const { totalBonusAud, totalFees, netProfit, fyRows } = useMemo(
    () => computeSummary(visibleCards),
    [visibleCards],
  )

  const fbtResults = useMemo((): FbtResult[] => {
    if (!isBusiness) return []
    const businessCards = allCards.filter((c) => c.is_business)
    return calculateFbtExposure(
      businessCards.map((c) => ({
        bonus_earned_at: c.bonusEarnedAt || null,
        welcomeBonusPoints: c.welcomeBonusPoints,
        pointsProgram: c.pointsProgram,
      })),
    )
  }, [allCards, isBusiness])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-[var(--surface-subtle)]"
            />
          ))}
        </div>
      </AppShell>
    )
  }

  const isEmpty = allCards.length === 0

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Net Profit</h1>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">Your churning P&amp;L</p>
          </div>
          {isPro && allCards.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportProfitCsv(visibleCards)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
        </div>

        {/* All / Personal / Business tabs — only when business cards exist */}
        {hasBusinessCards && (
          <div className="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-1">
            {(['all', 'personal', 'business'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {isEmpty ? (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="mb-3 h-10 w-10 text-[var(--text-secondary)]/40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">No bonuses confirmed yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Mark a card bonus as received on the dashboard to start your P&amp;L
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Headline P&L card — always visible */}
            <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  {activeTab === 'all' ? 'All-time summary' : activeTab === 'personal' ? 'Personal cards summary' : 'Business cards summary'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Total bonuses</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {fmtAud(totalBonusAud)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Total fees paid</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {fmtAud(totalFees)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Net profit</p>
                    <p
                      className="mt-1 text-2xl font-bold"
                      style={{ color: netProfit >= 0 ? "var(--accent)" : "#ef4444" }}
                    >
                      {fmtAud(netProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FBT exposure section — Business tier only */}
            {isBusiness && fbtResults.length > 0 && (
              <div className="space-y-2">
                {fbtResults.map((result) => (
                  <div
                    key={result.fbtYear}
                    className={`rounded-xl border p-4 ${
                      result.thresholdExceeded
                        ? 'border-yellow-500/40 bg-yellow-500/10'
                        : 'border-green-500/40 bg-green-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.thresholdExceeded ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                      ) : (
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      )}
                      <div className="space-y-1 text-sm">
                        {result.thresholdExceeded ? (
                          <>
                            <p className="font-semibold text-yellow-300">
                              FBT Exposure Indicator — {result.fbtYear}
                            </p>
                            <p className="text-[var(--text-secondary)]">
                              You earned {result.totalBusinessPoints.toLocaleString()} business card points (~{fmtAud(result.totalBusinessAud)}) this FBT year.
                              This exceeds the 250,000-point indicative threshold.
                            </p>
                            <p className="text-[var(--text-secondary)]">
                              Indicative FBT exposure: ~{fmtAud(result.estimatedFbtLiability)} (47% of ~{fmtAud(result.estimatedTaxableValue)})
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-green-300">
                              Under FBT threshold — {result.fbtYear}
                            </p>
                            <p className="text-[var(--text-secondary)]">
                              {result.totalBusinessPoints.toLocaleString()} business card points earned — under the 250,000-point indicative threshold.
                            </p>
                          </>
                        )}
                        <p className="text-xs text-[var(--text-secondary)]/70">{result.disclaimer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Financial year breakdown — Pro only */}
            <ProGate feature="profit breakdown" isPro={isPro} previewRows={3}>
              <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
                <CardHeader className="pb-2 pt-5">
                  <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                    By financial year
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
                          <th className="px-4 py-2.5 text-left font-medium">FY</th>
                          <th className="px-4 py-2.5 text-right font-medium">Bonuses</th>
                          <th className="px-4 py-2.5 text-right font-medium">Fees</th>
                          <th className="px-4 py-2.5 text-right font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fyRows.map((row) => (
                          <tr
                            key={row.fy}
                            className="border-b border-[var(--border-default)] last:border-0"
                          >
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                              {row.fy}
                            </td>
                            <td className="px-4 py-3 text-right text-[var(--text-primary)]">
                              {fmtAud(row.bonusAud)}
                            </td>
                            <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                              {fmtAud(row.fee)}
                            </td>
                            <td
                              className="px-4 py-3 text-right font-semibold"
                              style={{ color: row.netValue >= 0 ? "var(--accent)" : "#ef4444" }}
                            >
                              {fmtAud(row.netValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </ProGate>

            {/* Card breakdown — Pro only */}
            <ProGate feature="card breakdown" isPro={isPro} previewRows={3}>
              <CardBreakdown cards={visibleCards} />
            </ProGate>

            {/* Leaderboard */}
            <Leaderboard isPro={isPro} />
          </>
        )}
      </div>
    </AppShell>
  )
}
