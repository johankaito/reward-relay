"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SpendingSliderWizard } from "@/components/forms/SpendingSliderWizard"

interface UserCard {
  id: string
  card_id: string
  status: string
  applied_date: string | null
  approved_date: string | null
  activated_date: string | null
  annual_fee_paid: number | null
  welcome_bonus_received: boolean
  notes: string | null
  current_spend: number
  spend_target: number
  spend_deadline: string | null
  card: {
    id: string
    bank: string
    name: string
    welcome_bonus_points?: number
    bonus_spend_requirement?: number
    bonus_spend_window_months?: number
  }
}

interface SpendingTransaction {
  id: string
  user_card_id: string
  amount: number
  description: string
  date: string
  category: string
}

// ─── SVG Arc constants ───────────────────────────────────────────────────────
const RADIUS = 80
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_LENGTH = CIRCUMFERENCE * 0.667 // 240 degrees

function SpendArc({ spent, target }: { spent: number; target: number }) {
  const pct = target > 0 ? Math.min(spent / target, 1) : 0
  const filledLength = ARC_LENGTH * pct
  const viewBoxSize = (RADIUS + 14) * 2
  const center = RADIUS + 14
  // Start arc from bottom-left (-210deg) spanning 240 degrees
  const rotation = -210

  return (
    <div
      className="progress-arc-container flex items-center justify-center"
      style={{ position: "relative" }}
    >
      <style>{`
        .progress-arc-container:hover .progress-arc-path {
          stroke-width: 12 !important;
          filter: drop-shadow(0 0 12px rgba(78,222,163,0.6));
        }
        .progress-arc-container:hover .progress-center-amount {
          text-shadow: 0 0 15px rgba(255,255,255,0.2);
        }
      `}</style>
      <svg
        width={viewBoxSize}
        height={viewBoxSize}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={10}
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
        />
        {/* Fill */}
        <circle
          className="progress-arc-path arc-glow"
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke="#4edea3"
          strokeWidth={10}
          strokeDasharray={`${filledLength} ${CIRCUMFERENCE - filledLength}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${center} ${center})`}
          style={{
            transition: "stroke-dasharray 600ms ease-out, stroke-width 300ms ease-out, filter 300ms ease-out",
          }}
        />
        {/* Center text */}
        <foreignObject x={center - 72} y={center - 38} width={144} height={76}>
          <div
            className="flex flex-col items-center justify-center"
            style={{ height: "100%", textAlign: "center" }}
          >
            <span
              className="progress-center-amount tabular-nums font-bold text-on-surface"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "1.875rem",
                lineHeight: 1.1,
                transition: "text-shadow 300ms ease-out",
              }}
            >
              {formatCurrencyCompact(spent)}
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "Inter, sans-serif",
                marginTop: 3,
              }}
            >
              of {formatCurrencyCompact(target)}
            </span>
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}

function MobileSpendArc({
  spent,
  target,
  paceLabel,
  bonusPts,
}: {
  spent: number
  target: number
  paceLabel: string
  bonusPts?: number
}) {
  const pct = target > 0 ? Math.min(spent / target, 1) : 0
  const TOTAL_LEN = Math.PI * 80 // semicircle path ≈ 251.3
  const filled = TOTAL_LEN * pct
  return (
    <section className="arc-hero-bg -mx-4 pt-10 pb-20 px-6 text-center relative overflow-hidden rounded-b-[4rem] bg-surface-container">
      {/* Header */}
      <header className="mb-10 relative z-10">
        <p className="text-[#4edea3] text-[11px] uppercase tracking-[0.2em] font-bold mb-3 opacity-90">
          Current Statement Balance
        </p>
        <h1 className="text-6xl font-extrabold font-headline tracking-tighter tabular-nums text-on-surface">
          {formatCurrencyCompact(spent)}
          <span className="text-surface-bright/80 font-medium text-3xl align-baseline">
            {target > 0 ? ` / ${formatCurrencyCompact(target)}` : ""}
          </span>
        </h1>
      </header>

      {/* Centered Arc */}
      <div className="relative w-64 h-32 mx-auto mb-12">
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="arcGradMobile" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#4edea3" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeLinecap="round"
            strokeWidth="12"
          />
          {/* Fill */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#arcGradMobile)"
            strokeLinecap="round"
            strokeWidth="12"
            strokeDasharray={`${filled} ${TOTAL_LEN - filled}`}
            style={{
              transition: "stroke-dasharray 600ms ease-out",
              filter: "drop-shadow(0 0 8px rgba(78,222,163,0.4))",
            }}
          />
        </svg>
        {/* Pace badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-full">
            <span className="w-2 h-2 bg-[#4edea3] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-[#4edea3] uppercase tracking-wider">{paceLabel}</span>
          </div>
        </div>
      </div>

      {/* 2-col glass stat cards */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto relative z-10">
        <div className="glass-card p-5 rounded-2xl text-left">
          <p className="text-on-surface-variant text-xs font-semibold mb-2">Projected Points</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-on-surface font-bold text-2xl tabular-nums">
              {bonusPts ? `${(bonusPts / 1000).toFixed(0)}k` : "—"}
            </span>
            {bonusPts ? <span className="text-[#4edea3] text-xs font-bold">pts</span> : null}
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl text-left">
          <p className="text-on-surface-variant text-xs font-semibold mb-2">Progress</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-on-surface font-bold text-2xl tabular-nums">
              {target > 0 ? `${Math.round(pct * 100)}%` : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${Math.round(amount)}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount)
}

function getPaceStatus(card: UserCard): { label: string; color: string } {
  if (!card.spend_deadline || !card.spend_target) return { label: "On Track", color: "text-[#4edea3]" }

  const remaining = card.spend_target - card.current_spend
  if (remaining <= 0) return { label: "Bonus Earned", color: "text-[#4edea3]" }

  const daysLeft = Math.ceil(
    (new Date(card.spend_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (daysLeft <= 0) return { label: "Will Miss Bonus", color: "text-[#ffb4ab]" }

  const dailyNeeded = remaining / daysLeft
  if (dailyNeeded > 100) return { label: "Will Miss Bonus", color: "text-[#ffb4ab]" }
  if (dailyNeeded > 50) return { label: "Behind Pace", color: "text-amber-400" }
  return { label: "On Track", color: "text-[#4edea3]" }
}

type SpendPeriod = "monthly" | "quarterly" | "annual"

export default function SpendingTrackerPage() {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [transactions, setTransactions] = useState<Record<string, SpendingTransaction[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [period, setPeriod] = useState<SpendPeriod>("monthly")
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "general",
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [hasSpendingProfile, setHasSpendingProfile] = useState<boolean | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    void loadUserCards()
  }, [])

  const loadUserCards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Check spending profile existence
      const { data: profile } = await supabase
        .from("spending_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      setHasSpendingProfile(!!profile)

      const { data: cards, error } = await supabase
        .from("user_cards")
        .select(`*, card:cards(*)`)
        .eq("user_id", user.id)
        .order("application_date", { ascending: false })

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrichedCards = (cards || []).map((card: any) => {
        // Supabase may return the join as array or object depending on relationship type
        const cardData = Array.isArray(card.card) ? card.card[0] : card.card
        const spendTarget = cardData?.bonus_spend_requirement || 0
        const windowMonths = cardData?.bonus_spend_window_months || 3
        let deadline = null
        if (card.activated_date && spendTarget > 0) {
          const d = new Date(card.activated_date)
          deadline = new Date(d.setMonth(d.getMonth() + windowMonths))
        }
        return {
          ...card,
          card: cardData ?? null,  // normalise join to object (not array)
          current_spend: card.current_spend || 0,
          spend_target: spendTarget,
          spend_deadline: deadline?.toISOString() || null,
        }
      })

      const validCards = enrichedCards.filter((c) => c.card !== null)
      setUserCards(validCards)
      if (validCards.length > 0) {
        setSelectedCardId(validCards[0].id)
      }

      const transactionMap: Record<string, SpendingTransaction[]> = {}
      for (const c of enrichedCards) transactionMap[c.id] = []
      setTransactions(transactionMap)
    } catch (err) {
      console.error("Error loading cards:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    const activeCard = userCards.find((c) => c.id === selectedCardId)
    if (!activeCard || !newTransaction.amount) return

    try {
      const newSpend = activeCard.current_spend + parseFloat(newTransaction.amount)
      const { error } = await supabase
        .from("user_cards")
        .update({ current_spend: newSpend })
        .eq("id", activeCard.id)
      if (error) throw error

      setUserCards((prev) =>
        prev.map((c) => (c.id === activeCard.id ? { ...c, current_spend: newSpend } : c)),
      )
      setNewTransaction({
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "general",
      })
      setIsDialogOpen(false)
    } catch (err) {
      console.error("Error adding transaction:", err)
    }
  }

  const cardsNeedingSpend = userCards.filter(
    (c) => (c.current_spend || 0) < (c.spend_target || 0)
  ).length
  const totalTarget = userCards.reduce((sum, c) => sum + (c.spend_target || 0), 0)

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      </AppShell>
    )
  }

  const activeCard = userCards.find((c) => c.id === selectedCardId) ?? userCards[0] ?? null
  const pace = activeCard ? getPaceStatus(activeCard) : null

  return (
    <AppShell>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 w-full z-40 bg-background/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-10 h-16 w-full max-w-[1440px] mx-auto">
          <h1 className="text-lg font-black text-on-surface font-headline">Spend Tracker</h1>
          {/* Period selector chips */}
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
            {(["monthly", "quarterly", "annual"] as SpendPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                  period === p
                    ? "bg-[#4edea3] text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                }`}
              >
                {p === "monthly" ? "Mo" : p === "quarterly" ? "Qtr" : "Ann"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-6 pb-10 px-10 pt-10">
        {/* ── Spending profile wizard — shown when no profile exists or editing ── */}
        {userId && (hasSpendingProfile === false || editingProfile) && (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="p-5">
              <SpendingSliderWizard
                userId={userId}
                stepLabel="Your Spending Profile"
                onSaved={() => {
                  setHasSpendingProfile(true)
                  setEditingProfile(false)
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Profile edit trigger — only visible when profile exists and not editing */}
        {userId && hasSpendingProfile && !editingProfile && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-on-surface-variant hover:text-on-surface text-xs"
              onClick={() => setEditingProfile(true)}
            >
              <Pencil className="mr-1.5 h-3 w-3" />
              Edit spending profile
            </Button>
          </div>
        )}

        {/* ── Top stats row (Stitch 4-col glass panels) ── */}
        {activeCard && pace && (() => {
          const daysLeft = activeCard.spend_deadline
            ? Math.max(0, Math.ceil((new Date(activeCard.spend_deadline).getTime() - Date.now()) / 86400000))
            : null
          const remaining = Math.max(0, activeCard.spend_target - activeCard.current_spend)
          const dailyPace = daysLeft && daysLeft > 0 ? remaining / daysLeft : null
          const pct = activeCard.spend_target > 0
            ? Math.min(100, Math.round((activeCard.current_spend / activeCard.spend_target) * 100))
            : 0
          const bonusPts = activeCard.card.welcome_bonus_points

          return (
            <section className="max-w-[1440px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">Est. Rewards</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-tertiary tabular-nums tracking-tighter">
                      {bonusPts ? `${(bonusPts / 1000).toFixed(0)}k` : "—"}
                    </span>
                    <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
                      {bonusPts ? "pts" : "if target hit"}
                    </span>
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">Time Remaining</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-white tabular-nums tracking-tighter">
                      {daysLeft !== null ? daysLeft : "—"}
                    </span>
                    <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">Days</span>
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">Daily Pace</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-white tabular-nums tracking-tighter">
                      {dailyPace !== null ? `$${Math.ceil(dailyPace)}` : "—"}
                    </span>
                    <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">/day</span>
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">Bonus Progress</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-white tabular-nums tracking-tighter">{pct}%</span>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* ── Card selector (multi-card) ── */}
        {userCards.length > 1 && (
          <div>
            <Label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Tracking card
            </Label>
            <select
              value={selectedCardId ?? ""}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#4edea3]/40"
            >
              {userCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.card?.bank ?? ""} — {c.card?.name ?? ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Empty state ── */}
        {userCards.length === 0 ? (
          <div className="glass-panel premium-glow flex flex-col items-center gap-4 rounded-2xl px-8 py-16 text-center">
            <p
              className="font-semibold text-on-surface"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              No active cards
            </p>
            <p className="text-sm text-on-surface-variant">
              Add cards with spending requirements to track your progress.
            </p>
            <Button
              className="rounded-full font-bold text-on-primary"
              style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)" }}
              onClick={() => (window.location.href = "/cards")}
            >
              Add cards
            </Button>
          </div>
        ) : activeCard && pace ? (
          <>
            {/* ── Mobile arc hero — hidden on desktop ── */}
            <div className="md:hidden">
              <MobileSpendArc
                spent={activeCard.current_spend}
                target={activeCard.spend_target}
                paceLabel={pace.label}
                bonusPts={activeCard.card.welcome_bonus_points}
              />
            </div>

            {/* ── Desktop: Stitch grid-cols-12 arc + activity layout ── */}
            <div className="hidden md:block max-w-[1440px] mx-auto">
              <div className="grid grid-cols-12 gap-10">
                {/* Arc panel: col-span-5 */}
                <div className="col-span-12 lg:col-span-5">
                  <div className="bg-surface-container-low rounded-2xl p-10 relative overflow-hidden flex flex-col items-center text-center border border-white/5 h-full">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#4edea3]/10 blur-[100px] rounded-full" />
                    <div className="relative w-full">
                      <h2 className="text-on-surface-variant text-[11px] uppercase tracking-[0.2em] font-bold mb-10">
                        {activeCard.card.bank} {activeCard.card.name} Bonus Progress
                      </h2>

                      {/* Stitch-style arc: w-80 h-48 semicircle with gradient */}
                      <div className="relative w-80 h-48 mx-auto progress-arc-container">
                        <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 55">
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            opacity="0.6"
                            stroke="#262a37"
                            strokeLinecap="round"
                            strokeWidth="10"
                          />
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#313442"
                            strokeDasharray="0.5 7.5"
                            strokeLinecap="round"
                            strokeWidth="10"
                          />
                          {(() => {
                            // Total arc path length for "M 10 50 A 40 40 0 0 1 90 50" ≈ 125.66
                            const totalLen = Math.PI * 40
                            const pct = activeCard.spend_target > 0
                              ? Math.min(activeCard.current_spend / activeCard.spend_target, 1)
                              : 0
                            const filled = totalLen * pct
                            return (
                              <path
                                className="arc-glow progress-arc-path"
                                d="M 10 50 A 40 40 0 0 1 90 50"
                                fill="none"
                                stroke="url(#arc-gradient-spend)"
                                strokeDasharray={`${filled} ${totalLen - filled}`}
                                strokeLinecap="round"
                                strokeWidth="10"
                                style={{ transition: "stroke-dasharray 600ms ease-out" }}
                              />
                            )
                          })()}
                          <defs>
                            <linearGradient id="arc-gradient-spend" x1="0%" x2="100%" y1="0%" y2="0%">
                              <stop offset="0%" stopColor="#4edea3" />
                              <stop offset="100%" stopColor="#a7f3d0" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center pb-2">
                          <span className="text-5xl font-headline font-extrabold tabular-nums tracking-tight text-white">
                            {formatCurrencyCompact(activeCard.current_spend)}
                          </span>
                          <span className="text-on-surface-variant text-[10px] uppercase tracking-[0.15em] font-bold mt-2">
                            of {formatCurrencyCompact(activeCard.spend_target)} Goal
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-6">
                      <div className={`flex items-center gap-2.5 bg-[#4edea3]/10 px-5 py-2 rounded-full border border-[#4edea3]/30 premium-glow`}>
                        <span className={`text-xs font-bold uppercase tracking-widest ${pace.color}`}>{pace.label}</span>
                      </div>
                      {activeCard.spend_deadline && activeCard.spend_target > activeCard.current_spend && (() => {
                        const daysLeft = Math.ceil(
                          (new Date(activeCard.spend_deadline).getTime() - Date.now()) / 86400000,
                        )
                        if (daysLeft <= 0) return null
                        const dailyAmt = (activeCard.spend_target - activeCard.current_spend) / daysLeft
                        return (
                          <p className="text-on-surface-variant text-sm max-w-[300px] leading-relaxed">
                            Spend{" "}
                            <span className="text-on-surface font-semibold tabular-nums">
                              {formatCurrency(dailyAmt)}
                            </span>{" "}
                            per day for the next{" "}
                            <span className="text-on-surface font-semibold">{daysLeft} days</span>{" "}
                            to hit your bonus.
                          </p>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Activity panel: col-span-7 */}
                <div className="col-span-12 lg:col-span-7">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-headline font-bold tracking-tight">Recent Activity</h3>
                      <p className="text-on-surface-variant text-sm mt-1.5 font-medium">
                        Spend transactions for {activeCard.card.bank} {activeCard.card.name}
                      </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="rounded-xl font-bold text-on-primary px-5 py-2.5"
                          style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)" }}
                        >
                          + Add Transaction
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border border-white/10 bg-surface-container">
                        <DialogHeader>
                          <DialogTitle className="text-on-surface">Record Transaction</DialogTitle>
                          <DialogDescription className="text-on-surface-variant">
                            Record a purchase made with {activeCard.card.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount" className="text-on-surface-variant">
                              Amount (AUD)
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              placeholder="100.00"
                              value={newTransaction.amount}
                              onChange={(e) =>
                                setNewTransaction({ ...newTransaction, amount: e.target.value })
                              }
                              className="border-white/10 bg-surface-container-high text-on-surface"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description" className="text-on-surface-variant">
                              Description
                            </Label>
                            <Input
                              id="description"
                              placeholder="e.g., Groceries at Woolworths"
                              value={newTransaction.description}
                              onChange={(e) =>
                                setNewTransaction({
                                  ...newTransaction,
                                  description: e.target.value,
                                })
                              }
                              className="border-white/10 bg-surface-container-high text-on-surface"
                            />
                          </div>
                          <div>
                            <Label htmlFor="txn-date" className="text-on-surface-variant">
                              Date
                            </Label>
                            <Input
                              id="txn-date"
                              type="date"
                              value={newTransaction.date}
                              onChange={(e) =>
                                setNewTransaction({ ...newTransaction, date: e.target.value })
                              }
                              className="border-white/10 bg-surface-container-high text-on-surface"
                            />
                          </div>
                          <Button
                            onClick={handleAddTransaction}
                            className="w-full rounded-full font-bold text-on-primary"
                            style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)" }}
                          >
                            Save Transaction
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Transaction list */}
                  <div className="bg-surface-container/30 rounded-2xl overflow-hidden border border-white/5">
                    <div className="divide-y divide-white/5">
                      {(transactions[activeCard.id]?.length ?? 0) > 0 ? (
                        transactions[activeCard.id].slice(0, 5).map((txn) => (
                          <div
                            key={txn.id}
                            className="p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-[#4edea3]">
                                <span className="text-lg font-bold text-[#4edea3]">
                                  {txn.description?.charAt(0)?.toUpperCase() ?? "·"}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-on-surface text-base">{txn.description}</h4>
                                <p className="text-on-surface-variant text-xs mt-0.5 font-medium">{txn.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block font-headline font-bold tabular-nums text-xl">
                                {formatCurrency(txn.amount)}
                              </span>
                              <div className="flex items-center justify-end gap-2 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#4edea3]">Qualified</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-on-surface-variant text-sm">
                          No transactions yet. Add one to start tracking.
                        </div>
                      )}
                    </div>
                    <div className="p-5 bg-surface-container-high/30 border-t border-white/5 flex justify-center">
                      <button className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-[#4edea3] transition-colors py-2 px-8">
                        Load More Activity
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile: Category Bento + Transaction List (Stitch) — hidden on desktop ── */}
            <div className="md:hidden">
              {/* Category Bento — overlaps arc with negative margin */}
              {(() => {
                const daysLeft = activeCard.spend_deadline
                  ? Math.max(0, Math.ceil((new Date(activeCard.spend_deadline).getTime() - Date.now()) / 86400000))
                  : null
                const remaining = Math.max(0, activeCard.spend_target - activeCard.current_spend)
                const dailyPaceMobile = daysLeft && daysLeft > 0 ? remaining / daysLeft : null
                return (
                  <section className="-mx-4 px-4 -mt-10 grid grid-cols-2 gap-5">
                    <div className="bg-surface-container/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl transition-transform active:scale-95">
                      <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">Spend Progress</p>
                      <p className="text-2xl font-bold font-headline tabular-nums">{formatCurrencyCompact(activeCard.current_spend)}</p>
                      <p className="text-on-surface-variant text-xs mt-1">of {formatCurrencyCompact(activeCard.spend_target)} goal</p>
                    </div>
                    <div className="bg-surface-container/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl transition-transform active:scale-95">
                      <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">
                        {daysLeft !== null ? "Days Left" : "Daily Pace"}
                      </p>
                      <p className="text-2xl font-bold font-headline tabular-nums">
                        {daysLeft !== null ? daysLeft : dailyPaceMobile !== null ? `$${Math.ceil(dailyPaceMobile)}` : "—"}
                      </p>
                      <p className="text-on-surface-variant text-xs mt-1">
                        {daysLeft !== null ? "until deadline" : "per day needed"}
                      </p>
                    </div>
                  </section>
                )
              })()}

              {/* Transaction List */}
              <section className="mt-14 -mx-4 px-4">
                <div className="flex items-center justify-between mb-8 px-1">
                  <div>
                    <h3 className="text-2xl font-bold font-headline tracking-tight">Recent Activity</h3>
                    <p className="text-on-surface-variant text-xs mt-1">Spend tracking for {activeCard.card.name}</p>
                  </div>
                  <button
                    onClick={() => setIsDialogOpen(true)}
                    className="text-[#4edea3] text-sm font-bold bg-[#4edea3]/10 px-4 py-2 rounded-full hover:bg-[#4edea3]/20 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {(transactions[activeCard.id]?.length ?? 0) > 0 ? (
                    transactions[activeCard.id].slice(0, 5).map((txn) => (
                      <div
                        key={txn.id}
                        className="group active:bg-white/5 transition-all p-4 rounded-2xl flex items-center justify-between hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center border border-white/5">
                            <span className="text-on-surface-variant font-bold text-lg">
                              {txn.description?.charAt(0)?.toUpperCase() ?? "·"}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-base leading-tight">{txn.description}</p>
                            <p className="text-on-surface-variant text-xs mt-0.5">{txn.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-headline text-base tabular-nums">-{formatCurrency(txn.amount)}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="w-1 h-1 bg-[#4edea3] rounded-full" />
                            <span className="text-[#4edea3] text-[9px] font-extrabold uppercase tracking-widest">Qualified</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-surface-container/30 border border-white/5">
                      <p className="text-on-surface-variant text-sm">No transactions recorded yet.</p>
                      <button
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-3 text-[#4edea3] text-sm font-bold bg-[#4edea3]/10 px-4 py-2 rounded-full hover:bg-[#4edea3]/20 transition-colors"
                      >
                        + Add Transaction
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Floating FAB (mobile only) ── */}
      {activeCard && (
        <button
          onClick={() => setIsDialogOpen(true)}
          className="fixed bottom-28 right-6 w-16 h-16 rounded-2xl z-50 flex items-center justify-center active:scale-90 transition-all md:hidden overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)",
            boxShadow: "0 12px 40px rgba(78,222,163,0.4)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "var(--on-primary)",
          }}
        >
          <span className="text-3xl font-bold leading-none">+</span>
          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
        </button>
      )}
    </AppShell>
  )
}

