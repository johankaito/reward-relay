"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { AppShell } from "@/components/layout/AppShell"
import { ProGate } from "@/components/ui/ProGate"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { ActivityItem } from "@/components/ui/activity-item"
import { StatusBadge } from "@/components/ui/status-badge"
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

type Tab = "all" | "personal" | "business"

function fmtAud(n: number) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  })
}

function currentFY(): string {
  return getFinancialYear(new Date().toISOString())
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

/** Build monthly area chart data from cards earned this FY */
function buildChartData(cards: ProfitCard[], fy: string) {
  const fyCards = cards.filter((c) => c.fy === fy && c.bonusEarnedAt)
  if (fyCards.length === 0) return []

  // Group by month label
  const byMonth: Record<string, { bonuses: number; fees: number }> = {}
  for (const c of fyCards) {
    const d = new Date(c.bonusEarnedAt)
    const key = d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" })
    if (!byMonth[key]) byMonth[key] = { bonuses: 0, fees: 0 }
    byMonth[key].bonuses += c.bonusAud
    byMonth[key].fees += c.fee
  }

  // Sort by date
  const sorted = Object.entries(byMonth).sort(([a], [b]) => {
    const parseKey = (k: string) => {
      const [mon, yr] = k.split(" ")
      return new Date(`${mon} 20${yr}`)
    }
    return parseKey(a).getTime() - parseKey(b).getTime()
  })

  return sorted.map(([month, { bonuses, fees }]) => ({
    month,
    bonuses: Math.round(bonuses),
    fees: Math.round(fees),
  }))
}

// Custom Recharts tooltip with glass-panel styling
function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; fill: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="glass-panel rounded-xl px-4 py-3 text-sm"
      style={{ minWidth: 140 }}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#bbcabf]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-bold tabular-nums" style={{ color: entry.fill }}>
          {entry.name === "bonuses" ? "Bonus" : "Fees"}: {fmtAud(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function ProfitPage() {
  const router = useRouter()
  const [allCards, setAllCards] = useState<ProfitCard[]>([])
  const [isPro, setIsPro] = useState(false)
  const [isBusiness, setIsBusiness] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("all")

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
    if (activeTab === "personal") return allCards.filter((c) => !c.is_business)
    if (activeTab === "business") return allCards.filter((c) => c.is_business)
    return allCards
  }, [allCards, activeTab])

  const { totalBonusAud, totalFees, netProfit, fyRows } = useMemo(
    () => computeSummary(visibleCards),
    [visibleCards],
  )

  const fy = currentFY()
  const fyCards = useMemo(() => visibleCards.filter((c) => c.fy === fy), [visibleCards, fy])
  const fyBonus = fyCards.reduce((s, c) => s + c.bonusAud, 0)
  const fyFees = fyCards.reduce((s, c) => s + c.fee, 0)
  const fyNet = fyBonus - fyFees

  const chartData = useMemo(() => buildChartData(visibleCards, fy), [visibleCards, fy])

  // Per-card ROI table sorted by netValue desc
  const roiRows = useMemo(
    () => [...visibleCards].sort((a, b) => b.netValue - a.netValue),
    [visibleCards],
  )

  const fbtResults = useMemo((): FbtResult[] => {
    const businessCards = allCards.filter((c) => c.is_business)
    if (businessCards.length === 0) return []
    return calculateFbtExposure(
      businessCards.map((c) => ({
        bonus_earned_at: c.bonusEarnedAt || null,
        welcomeBonusPoints: c.welcomeBonusPoints,
        pointsProgram: c.pointsProgram,
      })),
    )
  }, [allCards])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1b1f2c]" />
          ))}
        </div>
      </AppShell>
    )
  }

  const isEmpty = allCards.length === 0

  return (
    <AppShell>
      <div className="space-y-6 pb-10">
        {/* Export buttons row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">Track</p>
            <h1
              className="mt-1 bg-gradient-to-br from-[#4edea3] to-[#10b981] bg-clip-text text-2xl font-black text-transparent"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Profit Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isPro && allCards.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportProfitCsv(visibleCards)}
                className="border-white/10 text-[#bbcabf] hover:text-white"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
            )}
            {allCards.length > 0 && (
              <ProGate feature="annual report">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-white/10 text-[#bbcabf] hover:text-white"
                >
                  <a href="/api/business/report" download>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PDF Report
                  </a>
                </Button>
              </ProGate>
            )}
          </div>
        </div>

        {/* Tab selector — business only */}
        {hasBusinessCards && (
          <ProGate feature="personal/business P&L split">
            <div className="flex gap-1 rounded-xl border border-white/10 bg-[#1b1f2c] p-1">
              {(["all", "personal", "business"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-[#4edea3] text-[#003824]"
                      : "text-[#bbcabf] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </ProGate>
        )}

        {isEmpty ? (
          <div className="glass-panel premium-glow flex flex-col items-center justify-center rounded-2xl py-16 text-center">
            <TrendingUp className="mb-3 h-10 w-10 text-[#bbcabf]/40" />
            <p className="font-medium text-white">No bonuses confirmed yet</p>
            <p className="mt-1 text-sm text-[#bbcabf]">
              Mark a card bonus as received on the dashboard to start your P&amp;L
            </p>
          </div>
        ) : (
          <>
            {/* ── Hero ──────────────────────────────────────────────── */}
            <div
              className="relative overflow-hidden rounded-2xl bg-[#1b1f2c] p-8"
              style={{ boxShadow: "0 0 40px rgba(78,222,163,0.06)" }}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full blur-3xl"
                style={{ background: "rgba(78,222,163,0.05)", transform: "translate(30%,-30%)" }}
              />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#86948a]">
                {fy} Net Profit
              </p>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span
                  className="tabular-nums text-5xl font-extrabold text-[#4edea3]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {fmtAud(fyNet)}
                </span>
                {(() => {
                  const prevFY = fyRows.find((r) => r.fy !== fy)
                  if (!prevFY || prevFY.netValue === 0) return null
                  const change = ((fyNet - prevFY.netValue) / Math.abs(prevFY.netValue)) * 100
                  const positive = change >= 0
                  return (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        background: positive ? 'rgba(78,222,163,0.12)' : 'rgba(255,180,171,0.12)',
                        color: positive ? '#4edea3' : '#ffb4ab',
                      }}
                    >
                      {positive ? '+' : ''}{Math.round(change)}% vs last FY
                    </span>
                  )
                })()}
              </div>
              <p className="mt-1 text-sm text-[#bbcabf]">This financial year</p>

              {/* Stat cards */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#1b1f2c] p-5" style={{ border: "1px solid rgba(78,222,163,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                    Bonuses Earned
                  </p>
                  <p
                    className="mt-2 tabular-nums text-2xl font-bold text-[#4edea3]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    +{fmtAud(fyBonus)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#1b1f2c] p-5" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                    Fees Paid
                  </p>
                  <p
                    className="mt-2 tabular-nums text-2xl font-bold text-[#bbcabf]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    -{fmtAud(fyFees)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Bar chart ──────────────────────────────────────────── */}
            {chartData.length > 0 && (
              <div className="rounded-2xl bg-[#1b1f2c] p-6" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                <p
                  className="mb-4 text-sm font-bold text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Monthly Bonuses vs Fees — {fy}
                </p>
                <div className="overflow-x-auto">
                  <div className="h-48" style={{ minWidth: 480 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#86948a", fontSize: 10, fontFamily: "Inter" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip content={<GlassTooltip />} />
                        <Bar dataKey="bonuses" fill="#4edea3" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        <Bar dataKey="fees" fill="#ffb4ab" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── Insight bento ──────────────────────────────────────── */}
            {fyCards.length > 0 && (() => {
              const topCard = [...fyCards].sort((a, b) => (b.bonusAud / Math.max(b.fee, 1)) - (a.bonusAud / Math.max(a.fee, 1)))[0]
              const potentialSavings = fyCards.filter(c => c.fee > 0 && c.bonusAud / c.fee < 1).reduce((s, c) => s + c.fee - c.bonusAud, 0)
              const avgRoi = fyCards.length > 0
                ? fyCards.reduce((s, c) => s + c.bonusAud / Math.max(c.fee, 1), 0) / fyCards.length
                : 0

              return (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatCard
                    label="Potential Savings"
                    value={potentialSavings > 0 ? fmtAud(potentialSavings) : '—'}
                    sub="fees exceeding bonus value this FY"
                    className="p-5"
                  />
                  <StatCard
                    label="Next ROI Peak"
                    value={topCard ? `${(topCard.bonusAud / Math.max(topCard.fee, 1)).toFixed(1)}x` : '—'}
                    sub={topCard ? `${topCard.bank} ${topCard.name}` : 'no data'}
                    accent
                    className="p-5"
                  />
                  <StatCard
                    label="Wallet Health"
                    value={avgRoi > 0 ? `${avgRoi.toFixed(1)}x` : '—'}
                    sub={`avg ROI across ${fyCards.length} card${fyCards.length !== 1 ? 's' : ''} this FY`}
                    accent
                    className="p-5"
                  />
                </div>
              )
            })()}

            {/* ── High Velocity Assets ────────────────────────────────── */}
            {fyCards.filter(c => c.fee > 0 && c.bonusAud / c.fee >= 5).length > 0 && (
              <div className="rounded-2xl bg-[#1b1f2c] p-6" style={{ border: '1px solid rgba(78,222,163,0.1)' }}>
                <p className="mb-4 text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ⚡ High Velocity Assets
                </p>
                <div className="space-y-3">
                  {[...fyCards]
                    .filter(c => c.fee > 0 && c.bonusAud / c.fee >= 5)
                    .sort((a, b) => b.bonusAud / b.fee - a.bonusAud / a.fee)
                    .map(c => {
                      const roi = c.bonusAud / c.fee
                      return (
                        <ActivityItem
                          key={c.id}
                          primary={`${c.bank} ${c.name}`}
                          secondary={`${fmtAud(c.bonusAud)} bonus · ${fmtAud(c.fee)} fee`}
                          value={<StatusBadge variant="primary">{roi.toFixed(1)}x</StatusBadge>}
                          className="px-0 py-0"
                        />
                      )
                    })
                  }
                </div>
              </div>
            )}

            {/* ── Holding Strategy ────────────────────────────────────── */}
            {fyCards.filter(c => c.fee > 0 && c.bonusAud / c.fee < 2).length > 0 && (
              <div className="rounded-2xl bg-[#1b1f2c] p-6" style={{ border: '1px solid rgba(255,180,171,0.08)' }}>
                <p className="mb-4 text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ◎ Holding Strategy
                </p>
                <div className="space-y-3">
                  {[...fyCards]
                    .filter(c => c.fee > 0 && c.bonusAud / c.fee < 2)
                    .sort((a, b) => a.bonusAud / a.fee - b.bonusAud / b.fee)
                    .map(c => {
                      const roi = c.bonusAud / c.fee
                      return (
                        <ActivityItem
                          key={c.id}
                          primary={`${c.bank} ${c.name}`}
                          secondary={`${fmtAud(c.bonusAud)} bonus · ${fmtAud(c.fee)} fee`}
                          value={<StatusBadge variant="danger">{roi.toFixed(1)}x</StatusBadge>}
                          className="px-0 py-0"
                        />
                      )
                    })
                  }
                </div>
              </div>
            )}

            {/* ── FBT exposure ───────────────────────────────────────── */}
            {fbtResults.length > 0 && (
              <ProGate feature="FBT calculator">
                <div className="space-y-2">
                  {fbtResults.map((result) => (
                    <div
                      key={result.fbtYear}
                      className={`rounded-xl border p-4 ${
                        result.thresholdExceeded
                          ? "border-yellow-500/40 bg-yellow-500/10"
                          : "border-[#4edea3]/20 bg-[#4edea3]/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.thresholdExceeded ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                        ) : (
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />
                        )}
                        <div className="space-y-1 text-sm">
                          {result.thresholdExceeded ? (
                            <>
                              <p className="font-semibold text-yellow-300">
                                FBT Exposure Indicator — {result.fbtYear}
                              </p>
                              <p className="text-[#bbcabf]">
                                You earned {result.totalBusinessPoints.toLocaleString()} business card
                                points (~{fmtAud(result.totalBusinessAud)}) this FBT year. This exceeds
                                the 250,000-point indicative threshold.
                              </p>
                              <p className="text-[#bbcabf]">
                                Indicative FBT exposure: ~{fmtAud(result.estimatedFbtLiability)} (47% of
                                ~{fmtAud(result.estimatedTaxableValue)})
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-[#4edea3]">
                                Under FBT threshold — {result.fbtYear}
                              </p>
                              <p className="text-[#bbcabf]">
                                {result.totalBusinessPoints.toLocaleString()} business card points
                                earned — under the 250,000-point indicative threshold.
                              </p>
                            </>
                          )}
                          <p className="text-xs text-[#bbcabf]/60">{result.disclaimer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ProGate>
            )}

            {/* ── Per-card ROI table ─────────────────────────────────── */}
            <ProGate feature="card breakdown">
              <div
                className="rounded-2xl bg-[#1b1f2c] overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="px-6 pt-6 pb-3">
                  <p
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Per-Card ROI
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-6 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Card
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Bonus Earned
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Annual Fee
                        </th>
                        <th className="px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Net Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roiRows.map((card) => (
                        <tr key={card.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3.5 font-medium text-[#dfe2f3]">
                            {card.bank} {card.name}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-[#dfe2f3]">
                            {fmtAud(card.bonusAud)}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-[#bbcabf]">
                            {fmtAud(card.fee)}
                          </td>
                          <td
                            className={`px-6 py-3.5 text-right tabular-nums font-bold ${
                              card.netValue >= 0 ? "text-[#4edea3]" : "text-[#ffb4ab]"
                            }`}
                          >
                            {fmtAud(card.netValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ProGate>

            {/* ── FY breakdown table — Pro only ──────────────────────── */}
            <ProGate feature="profit breakdown">
              <div
                className="rounded-2xl bg-[#1b1f2c] overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="px-6 pt-6 pb-3">
                  <p
                    className="text-sm font-bold text-white"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    By Financial Year
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-6 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          FY
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Bonuses
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Fees
                        </th>
                        <th className="px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                          Net
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fyRows.map((row) => (
                        <tr key={row.fy} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3.5 font-medium text-[#dfe2f3]">{row.fy}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-[#dfe2f3]">
                            {fmtAud(row.bonusAud)}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-[#bbcabf]">
                            {fmtAud(row.fee)}
                          </td>
                          <td
                            className={`px-6 py-3.5 text-right tabular-nums font-bold ${
                              row.netValue >= 0 ? "text-[#4edea3]" : "text-[#ffb4ab]"
                            }`}
                          >
                            {fmtAud(row.netValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ProGate>

            {/* Leaderboard */}
            <Leaderboard isPro={isPro} />

            {/* All-time summary (collapsed detail) */}
            {activeTab !== "all" && (
              <div className="rounded-2xl bg-[#1b1f2c] p-6" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#86948a]">
                  All-time Summary
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#bbcabf]">Total bonuses</p>
                    <p className="mt-1 tabular-nums text-lg font-bold text-[#dfe2f3]">
                      {fmtAud(totalBonusAud)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#bbcabf]">Total fees paid</p>
                    <p className="mt-1 tabular-nums text-lg font-bold text-[#dfe2f3]">
                      {fmtAud(totalFees)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#bbcabf]">Net profit</p>
                    <p
                      className={`mt-1 tabular-nums text-2xl font-bold ${netProfit >= 0 ? "text-[#4edea3]" : "text-[#ffb4ab]"}`}
                    >
                      {fmtAud(netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
