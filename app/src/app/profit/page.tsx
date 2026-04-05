"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, AlertTriangle, CheckCircle, TrendingUp, Sparkles, Activity } from "lucide-react"
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

/** Build per-card chart data from cards earned this FY, sorted by bonus desc */
function buildChartData(cards: ProfitCard[], fy: string) {
  const fyCards = cards.filter((c) => c.fy === fy)
  if (fyCards.length === 0) return []

  // One bar per card, sorted by bonus value descending so highest earners appear first
  return [...fyCards]
    .sort((a, b) => b.bonusAud - a.bonusAud)
    .map((c) => {
      // Truncate card name to fit under bar label
      const label = c.name.split(" ").slice(0, 2).join(" ")
      return {
        month: label,
        bonuses: Math.round(c.bonusAud),
        fees: Math.round(c.fee),
      }
    })
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
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
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
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
          ))}
        </div>
      </AppShell>
    )
  }

  const isEmpty = allCards.length === 0

  return (
    <AppShell>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 w-full z-40 bg-background/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-[1440px] mx-auto">
          <h2 className="font-headline font-bold text-lg text-on-surface">Profit Dashboard</h2>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto p-6 md:p-12 space-y-12">
        {/* Export buttons row */}
        <div className="flex items-center gap-2">
            {isPro && allCards.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportProfitCsv(visibleCards)}
                className="border-white/10 text-on-surface-variant hover:text-on-surface"
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
                  className="border-white/10 text-on-surface-variant hover:text-on-surface"
                >
                  <a href="/api/business/report" download>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PDF Report
                  </a>
                </Button>
              </ProGate>
            )}
        </div>

        {/* Tab selector — business only */}
        {hasBusinessCards && (
          <ProGate feature="personal/business P&L split">
            <div className="flex gap-1 rounded-xl border border-white/10 bg-surface-container p-1">
              {(["all", "personal", "business"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "bg-[#4edea3] text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
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
            <TrendingUp className="mb-3 h-10 w-10 text-on-surface-variant/40" />
            <p className="font-medium text-on-surface">No bonuses confirmed yet</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Mark a card bonus as received on the dashboard to start your P&amp;L
            </p>
          </div>
        ) : (
          <>
            {/* ── Mobile view (md:hidden) ── */}
            <div className="md:hidden space-y-8">
              {/* Mobile Hero */}
              <section className="flex flex-col gap-1">
                <span className="text-primary text-[11px] uppercase tracking-[0.2em] font-bold">Total Net Profit</span>
                <div className="flex items-end gap-3 mt-1">
                  <h2 className="text-5xl font-headline font-extrabold tracking-tight tabular-nums">{fmtAud(fyNet)}</h2>
                  {fyNet > 0 && (
                    <div className="flex items-center mb-1 text-[#4edea3]">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-bold ml-0.5">{fy}</span>
                    </div>
                  )}
                </div>
                <p className="text-on-surface-variant text-sm mt-1">
                  Across {fyCards.length} active card{fyCards.length !== 1 ? "s" : ""} this FY
                </p>
              </section>

              {/* Horizontal scroll CSS bar chart */}
              {chartData.length > 0 && (
                <section className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-headline font-bold">Bonuses vs Fees per Card</h3>
                    <span className="px-3 py-1 bg-surface-container-highest/50 rounded-full text-[10px] font-extrabold text-on-surface-variant tracking-wider">
                      {chartData.length} CARDS
                    </span>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex items-end gap-5 min-w-[500px] h-44 pb-2">
                      {(() => {
                        const maxBonus = Math.max(...chartData.map((d) => d.bonuses), 1)
                        const lastIdx = chartData.length - 1
                        return chartData.map((d, i) => {
                          const bonusPct = d.bonuses / maxBonus
                          const isActive = i === lastIdx
                          return (
                            <div key={d.month} className="flex-1 flex flex-col items-center gap-3">
                              <div
                                className={`w-full rounded-t-xl relative ${isActive ? "bg-[#4edea3]/5 ring-1 ring-[#4edea3]/30" : "bg-surface-container-high/40"}`}
                                style={{ height: `${Math.max(bonusPct * 144, 20)}px` }}
                              >
                                <div
                                  className={`absolute bottom-0 w-full rounded-t-xl ${isActive ? "bg-[#4edea3] shadow-[0_0_25px_rgba(78,222,163,0.3)]" : "bg-[#4edea3]/80"}`}
                                  style={{ height: `${bonusPct * 66}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold ${isActive ? "text-[#4edea3]" : "text-on-surface-variant"}`}>
                                {d.month.toUpperCase()}
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                </section>
              )}

              {/* Bento grid: Points Val / Fees / ROI */}
              <section className="grid grid-cols-2 gap-4">
                <div className="col-span-1 p-6 rounded-2xl bg-surface-container/60 border border-white/5 flex flex-col gap-2">
                  <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Points Val</span>
                  <span className="text-2xl font-headline font-bold tabular-nums">{fmtAud(fyBonus)}</span>
                  <div className="mt-2 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="bg-[#50e3c2] h-full" style={{ width: fyNet > 0 ? "66%" : "0%" }} />
                  </div>
                </div>
                <div className="col-span-1 p-6 rounded-2xl bg-surface-container/60 border border-white/5 flex flex-col gap-2">
                  <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Fees Paid</span>
                  <span className="text-2xl font-headline font-bold tabular-nums">{fmtAud(fyFees)}</span>
                  <div className="mt-2 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="bg-[#d0bcff] h-full" style={{ width: fyBonus > 0 ? `${Math.min((fyFees / fyBonus) * 100, 100)}%` : "0%" }} />
                  </div>
                </div>
                <div className="col-span-2 p-6 rounded-2xl bg-surface-container border border-white/5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">Average ROI</span>
                    <span className="text-3xl font-headline font-bold tabular-nums" style={{ color: "#50e3c2" }}>
                      {fyCards.length > 0
                        ? `${(fyCards.reduce((s, c) => s + c.bonusAud / Math.max(c.fee, 1), 0) / fyCards.length).toFixed(1)}x`
                        : "—"}
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#4edea3]" />
                  </div>
                </div>
              </section>

              {/* Earned This FY */}
              {fyCards.length > 0 && (
                <section className="flex flex-col gap-5">
                  <h3 className="text-xl font-headline font-bold px-1">Earned This FY</h3>
                  <div className="space-y-4">
                    {[...fyCards]
                      .sort((a, b) => b.bonusAud - a.bonusAud)
                      .map((c) => {
                        const roi = c.bonusAud / Math.max(c.fee, 1)
                        const onTrack = roi >= 2
                        return (
                          <div key={c.id} className="p-6 rounded-2xl bg-surface-container-low border border-white/5 flex flex-col gap-5">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4 items-center">
                                <div className="w-10 h-6 bg-gradient-to-r from-[#d4af37] to-[#8b6b00] rounded-sm" />
                                <div>
                                  <p className="text-[15px] font-bold font-headline">{c.name}</p>
                                  <p className="text-[10px] text-on-surface-variant tracking-wide uppercase">{c.bank}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold" style={{ color: onTrack ? "#50e3c2" : "#ffab00" }}>
                                  +{fmtAud(c.bonusAud)}
                                </span>
                                <span
                                  className="text-[10px] font-bold mt-0.5"
                                  style={{ color: onTrack ? "rgba(80,227,194,0.6)" : "rgba(255,171,0,0.6)" }}
                                >
                                  {onTrack ? "ON TRACK" : "NEEDS ATTENTION"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px] font-bold text-on-surface-variant">
                                <span className="tracking-wide">ROI</span>
                                <span className="tabular-nums">{roi.toFixed(1)}x return</span>
                              </div>
                              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(roi / 5, 1) * 100}%`,
                                    background: onTrack ? "#50e3c2" : "#ffab00",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </section>
              )}
            </div>

            {/* ── Desktop Hero + Chart ─────────────────────────────── */}
            <div className="hidden md:block">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Hero Metrics Card: col-span-5 */}
              <div className="lg:col-span-5 flex flex-col justify-between p-10 bg-surface-container rounded-lg relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                <div className="relative z-10 space-y-8">
                  <div>
                    <span className="text-xs font-bold tracking-[0.3em] uppercase text-outline opacity-70">
                      {fy} Net Profit
                    </span>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-6xl md:text-7xl font-headline font-extrabold text-on-surface tabular tracking-tighter">
                        {fmtAud(fyNet)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-outline">Total Bonuses</span>
                      <p className="text-2xl font-headline font-bold text-on-surface tabular mt-1">+{fmtAud(fyBonus)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-outline">Gross Fees</span>
                      <p className="text-2xl font-headline font-bold text-[#d0bcff] tabular mt-1">-{fmtAud(fyFees)}</p>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 mt-12 bg-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-[#4edea3]" />
                    {(() => {
                      const prevFY = fyRows.find((r) => r.fy !== fy)
                      if (!prevFY || prevFY.netValue === 0) return (
                        <span className="text-sm font-semibold text-on-surface-variant">This financial year</span>
                      )
                      const change = ((fyNet - prevFY.netValue) / Math.abs(prevFY.netValue)) * 100
                      const positive = change >= 0
                      return (
                        <span className="text-sm font-semibold text-on-surface">
                          {positive ? "+" : ""}{Math.round(change)}% from last FY
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Chart Canvas: col-span-7 */}
              <div className="lg:col-span-7 bg-surface-container rounded-lg p-8 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="font-headline font-bold text-xl">Bonuses vs Fees per Card</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#4edea3]/10 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-[#4edea3]"></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">Bonus</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#d0bcff]/10 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-[#d0bcff]"></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#d0bcff]">Fee</span>
                    </div>
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <div className="flex-1 overflow-x-auto">
                    <div className="h-48" style={{ minWidth: 480 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <XAxis
                            dataKey="month"
                            tick={{ fill: 'var(--on-surface-variant)', fontSize: 10, fontFamily: "Inter" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                          <Bar dataKey="bonuses" fill="#4edea3" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          <Bar dataKey="fees" fill="#d0bcff" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
                    No chart data for this FY yet
                  </div>
                )}
              </div>
            </div>
            </div>{/* end hidden md:block */}

            {/* ── Insight bento ──────────────────────────────────────── */}
            {fyCards.length > 0 && (() => {
              const topCard = [...fyCards].sort((a, b) => (b.bonusAud / Math.max(b.fee, 1)) - (a.bonusAud / Math.max(a.fee, 1)))[0]
              const potentialSavings = fyCards.filter(c => c.fee > 0 && c.bonusAud / c.fee < 1).reduce((s, c) => s + c.fee - c.bonusAud, 0)
              const avgRoi = fyCards.length > 0
                ? fyCards.reduce((s, c) => s + c.bonusAud / Math.max(c.fee, 1), 0) / fyCards.length
                : 0

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-surface-container-highest/30 border border-white/5 rounded-lg p-8 flex flex-col gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Potential Savings</span>
                    <h4 className="font-headline font-bold text-lg tabular-nums text-on-surface">
                      {potentialSavings > 0 ? fmtAud(potentialSavings) : '—'}
                    </h4>
                    <p className="text-xs text-on-surface-variant">fees exceeding bonus value this FY</p>
                  </div>
                  <div className="bg-surface-container-highest/30 border border-white/5 rounded-lg p-8 flex flex-col gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Next ROI Peak</span>
                    <h4 className="font-headline font-bold text-lg tabular-nums text-[#4edea3]">
                      {topCard ? `${(topCard.bonusAud / Math.max(topCard.fee, 1)).toFixed(1)}x` : '—'}
                    </h4>
                    <p className="text-xs text-on-surface-variant">{topCard ? `${topCard.bank} ${topCard.name}` : 'no data'}</p>
                  </div>
                  <div className="bg-surface-container-highest/30 border border-white/5 rounded-lg p-8 flex flex-col gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Wallet Health</span>
                    <h4 className="font-headline font-bold text-lg tabular-nums text-[#4edea3]">
                      {avgRoi > 0 ? `${avgRoi.toFixed(1)}x` : '—'}
                    </h4>
                    <p className="text-xs text-on-surface-variant">{`avg ROI across ${fyCards.length} card${fyCards.length !== 1 ? 's' : ''} this FY`}</p>
                  </div>
                </div>
              )
            })()}

            {/* ── High Velocity Assets ────────────────────────────────── */}
            {fyCards.filter(c => c.fee > 0 && c.bonusAud / c.fee >= 5).length > 0 && (
              <div className="rounded-2xl bg-surface-container p-6" style={{ border: '1px solid rgba(78,222,163,0.1)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-7 w-7 text-[#4edea3]" />
                  <h3 className="font-headline font-bold text-2xl">High Velocity Assets</h3>
                </div>
                <div className="space-y-3">
                  {[...fyCards]
                    .filter(c => c.fee > 0 && c.bonusAud / c.fee >= 5)
                    .sort((a, b) => b.bonusAud / b.fee - a.bonusAud / a.fee)
                    .map(c => {
                      const roi = c.bonusAud / c.fee
                      return (
                        <div
                          key={c.id}
                          className="bg-surface-container-low p-6 rounded-lg flex items-center justify-between group hover:bg-surface-container transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-10 rounded bg-gradient-to-br from-[#d4af37] to-[#8b6b00] shadow-lg flex items-center justify-center text-[8px] font-bold text-white uppercase">
                              {c.name.split(' ')[0] ?? 'Card'}
                            </div>
                            <div>
                              <h4 className="font-bold text-on-surface">{c.bank} {c.name}</h4>
                              <p className="text-xs text-outline font-medium">{c.pointsProgram}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-headline font-extrabold text-lg tabular-nums tracking-tighter">{roi.toFixed(1)}x</p>
                            <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Efficiency</p>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )}

            {/* ── Holding Strategy ────────────────────────────────────── */}
            {fyCards.filter(c => c.fee > 0 && c.bonusAud / c.fee < 2).length > 0 && (
              <div className="rounded-2xl bg-surface-container p-6" style={{ border: '1px solid rgba(255,180,171,0.08)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="h-7 w-7 text-[#d0bcff]" />
                  <h3 className="font-headline font-bold text-2xl">Holding Strategy</h3>
                </div>
                <div className="space-y-3">
                  {[...fyCards]
                    .filter(c => c.fee > 0 && c.bonusAud / c.fee < 2)
                    .sort((a, b) => a.bonusAud / a.fee - b.bonusAud / b.fee)
                    .map(c => {
                      const roi = c.bonusAud / c.fee
                      return (
                        <div
                          key={c.id}
                          className="bg-surface-container-low p-6 rounded-lg flex items-center justify-between group hover:bg-surface-container transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-10 rounded bg-surface-container-highest border border-white/10 shadow-lg flex items-center justify-center text-[8px] font-bold text-on-surface uppercase">
                              {c.name.split(' ')[0] ?? 'Card'}
                            </div>
                            <div>
                              <h4 className="font-bold text-on-surface">{c.bank} {c.name}</h4>
                              <p className="text-xs text-outline font-medium">{c.pointsProgram}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[#d0bcff] font-headline font-bold text-lg tabular">{roi.toFixed(1)}x</p>
                            <p className="text-[10px] text-outline uppercase font-bold tracking-widest mt-1">Maintenance</p>
                          </div>
                        </div>
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
                              <p className="text-on-surface-variant">
                                You earned {result.totalBusinessPoints.toLocaleString()} business card
                                points (~{fmtAud(result.totalBusinessAud)}) this FBT year. This exceeds
                                the 250,000-point indicative threshold.
                              </p>
                              <p className="text-on-surface-variant">
                                Indicative FBT exposure: ~{fmtAud(result.estimatedFbtLiability)} (47% of
                                ~{fmtAud(result.estimatedTaxableValue)})
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-[#4edea3]">
                                Under FBT threshold — {result.fbtYear}
                              </p>
                              <p className="text-on-surface-variant">
                                {result.totalBusinessPoints.toLocaleString()} business card points
                                earned — under the 250,000-point indicative threshold.
                              </p>
                            </>
                          )}
                          <p className="text-xs text-on-surface-variant/60">{result.disclaimer}</p>
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
                className="rounded-2xl bg-surface-container overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="px-6 pt-6 pb-3">
                  <p className="text-sm font-bold text-on-surface">
                    Per-Card ROI
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-6 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Card
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Bonus Earned
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Annual Fee
                        </th>
                        <th className="px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Net Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roiRows.map((card) => (
                        <tr key={card.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3.5 font-medium text-on-surface">
                            {card.bank} {card.name}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-on-surface">
                            {fmtAud(card.bonusAud)}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-on-surface-variant">
                            {fmtAud(card.fee)}
                          </td>
                          <td
                            className={`px-6 py-3.5 text-right tabular-nums font-bold ${
                              card.netValue >= 0 ? "text-[#4edea3]" : "text-destructive"
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
                className="rounded-2xl bg-surface-container overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="px-6 pt-6 pb-3">
                  <p className="text-sm font-bold text-on-surface">
                    By Financial Year
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-6 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          FY
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Bonuses
                        </th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Fees
                        </th>
                        <th className="px-6 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Net
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fyRows.map((row) => (
                        <tr key={row.fy} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3.5 font-medium text-on-surface">{row.fy}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-on-surface">
                            {fmtAud(row.bonusAud)}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-on-surface-variant">
                            {fmtAud(row.fee)}
                          </td>
                          <td
                            className={`px-6 py-3.5 text-right tabular-nums font-bold ${
                              row.netValue >= 0 ? "text-[#4edea3]" : "text-destructive"
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
              <div className="rounded-2xl bg-surface-container p-6" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  All-time Summary
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-on-surface-variant">Total bonuses</p>
                    <p className="mt-1 tabular-nums text-lg font-bold text-on-surface">
                      {fmtAud(totalBonusAud)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Total fees paid</p>
                    <p className="mt-1 tabular-nums text-lg font-bold text-on-surface">
                      {fmtAud(totalFees)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Net profit</p>
                    <p
                      className={`mt-1 tabular-nums text-2xl font-bold ${netProfit >= 0 ? "text-[#4edea3]" : "text-destructive"}`}
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
