"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatCard } from "@/components/ui/stat-card"
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

function MobileSpendArc({ spent, target }: { spent: number; target: number }) {
  const pct = target > 0 ? Math.min(spent / target, 1) : 0
  const TOTAL_LEN = Math.PI * 80 // semicircle path length ≈ 251.3
  const filled = TOTAL_LEN * pct
  return (
    <div className="arc-hero-bg -mx-4 px-4 pb-8 pt-4">
      <svg width="100%" viewBox="0 0 200 100" style={{ overflow: "visible" }}>
        {/* Track */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="#4edea3"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${TOTAL_LEN - filled}`}
          style={{
            transition: "stroke-dasharray 600ms ease-out",
            filter: "drop-shadow(0 0 8px rgba(78,222,163,0.4))",
          }}
        />
        {/* Amount */}
        <text
          x="100"
          y="62"
          textAnchor="middle"
          fill="white"
          fontSize="20"
          fontWeight="bold"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {formatCurrencyCompact(spent)}
        </text>
        {/* Label */}
        <text
          x="100"
          y="78"
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          of {formatCurrencyCompact(target)}
        </text>
      </svg>
    </div>
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
  if (!card.spend_deadline || !card.spend_target) return { label: "On Track", color: "text-primary" }

  const remaining = card.spend_target - card.current_spend
  if (remaining <= 0) return { label: "Bonus Earned", color: "text-primary" }

  const daysLeft = Math.ceil(
    (new Date(card.spend_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (daysLeft <= 0) return { label: "Will Miss Bonus", color: "text-destructive" }

  const dailyNeeded = remaining / daysLeft
  if (dailyNeeded > 100) return { label: "Will Miss Bonus", color: "text-destructive" }
  if (dailyNeeded > 50) return { label: "Behind Pace", color: "text-amber-400" }
  return { label: "On Track", color: "text-primary" }
}

export default function SpendingTrackerPage() {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [transactions, setTransactions] = useState<Record<string, SpendingTransaction[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
        .in("status", ["active", "pending_spend"])
        .order("activated_date", { ascending: false })

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrichedCards = (cards || []).map((card: any) => {
        const spendTarget = card.card?.bonus_spend_requirement || 0
        const windowMonths = card.card?.bonus_spend_window_months || 3
        let deadline = null
        if (card.activated_date && spendTarget > 0) {
          const d = new Date(card.activated_date)
          deadline = new Date(d.setMonth(d.getMonth() + windowMonths))
        }
        return {
          ...card,
          current_spend: card.current_spend || 0,
          spend_target: spendTarget,
          spend_deadline: deadline?.toISOString() || null,
        }
      })

      setUserCards(enrichedCards)
      if (enrichedCards.length > 0) {
        setSelectedCardId(enrichedCards[0].id)
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
      <div className="space-y-6 pb-10">
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

        {/* ── Profile summary row (when profile exists and not editing) ── */}
        {userId && hasSpendingProfile && !editingProfile && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--surface)] px-4 py-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Spending profile</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Active</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-[var(--text-secondary)]"
              onClick={() => setEditingProfile(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
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
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Est. Rewards</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-tertiary tabular-nums tracking-tighter">
                      {bonusPts ? `${(bonusPts / 1000).toFixed(0)}k` : "—"}
                    </span>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                      {bonusPts ? "pts" : "if target hit"}
                    </span>
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Time Remaining</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-white tabular-nums tracking-tighter">
                      {daysLeft !== null ? daysLeft : "—"}
                    </span>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Days</span>
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Daily Pace</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-bold text-white tabular-nums tracking-tighter">
                      {dailyPace !== null ? `$${Math.ceil(dailyPace)}` : "—"}
                    </span>
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">/day</span>
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-3 group transition-all hover:bg-white/[0.05]">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Bonus Progress</span>
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
              className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              {userCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.card.bank} — {c.card.name}
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
              style={{ background: "var(--gradient-cta)" }}
              onClick={() => (window.location.href = "/cards")}
            >
              Add cards
            </Button>
          </div>
        ) : activeCard && pace ? (
          <>
            {/* ── Mobile arc (semicircle hero) — hidden on desktop ── */}
            <div className="md:hidden">
              <MobileSpendArc spent={activeCard.current_spend} target={activeCard.spend_target} />
            </div>

            {/* ── Desktop: Stitch grid-cols-12 arc + activity layout ── */}
            <div className="hidden md:block max-w-[1440px] mx-auto">
              <div className="grid grid-cols-12 gap-10">
                {/* Arc panel: col-span-5 */}
                <div className="col-span-12 lg:col-span-5">
                  <div className="bg-surface-container-low rounded-2xl p-10 relative overflow-hidden flex flex-col items-center text-center border border-white/5 h-full">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
                    <div className="relative w-full">
                      <h2 className="text-slate-500 text-[11px] uppercase tracking-[0.2em] font-bold mb-10">
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
                          <span className="text-slate-500 text-[10px] uppercase tracking-[0.15em] font-bold mt-2">
                            of {formatCurrencyCompact(activeCard.spend_target)} Goal
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-6">
                      <div className={`flex items-center gap-2.5 bg-primary/10 px-5 py-2 rounded-full border border-primary/30 premium-glow`}>
                        <span className={`text-xs font-bold uppercase tracking-widest ${pace.color}`}>{pace.label}</span>
                      </div>
                      {activeCard.spend_deadline && activeCard.spend_target > activeCard.current_spend && (() => {
                        const daysLeft = Math.ceil(
                          (new Date(activeCard.spend_deadline).getTime() - Date.now()) / 86400000,
                        )
                        if (daysLeft <= 0) return null
                        const dailyAmt = (activeCard.spend_target - activeCard.current_spend) / daysLeft
                        return (
                          <p className="text-slate-400 text-sm max-w-[300px] leading-relaxed">
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
                      <p className="text-slate-500 text-sm mt-1.5 font-medium">
                        Spend transactions for {activeCard.card.bank} {activeCard.card.name}
                      </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="rounded-xl font-bold text-on-primary px-5 py-2.5"
                          style={{ background: "var(--gradient-cta)" }}
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
                            style={{ background: "var(--gradient-cta)" }}
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
                              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
                                <span className="text-lg font-bold text-primary">
                                  {txn.description?.charAt(0)?.toUpperCase() ?? "·"}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-on-surface text-base">{txn.description}</h4>
                                <p className="text-slate-500 text-xs mt-0.5 font-medium">{txn.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block font-headline font-bold tabular-nums text-xl">
                                {formatCurrency(txn.amount)}
                              </span>
                              <div className="flex items-center justify-end gap-2 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Qualified</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 text-sm">
                          No transactions yet. Add one to start tracking.
                        </div>
                      )}
                    </div>
                    <div className="p-5 bg-surface-container-high/30 border-t border-white/5 flex justify-center">
                      <button className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors py-2 px-8">
                        Load More Activity
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile: stats + CTA ── */}
            <div className="md:hidden space-y-6">
              {(() => {
                const daysLeft = activeCard.spend_deadline
                  ? Math.max(0, Math.ceil((new Date(activeCard.spend_deadline).getTime() - Date.now()) / 86400000))
                  : null
                const remaining = Math.max(0, activeCard.spend_target - activeCard.current_spend)
                const dailyPaceMobile = daysLeft && daysLeft > 0 ? remaining / daysLeft : null
                const pct = activeCard.spend_target > 0
                  ? Math.min(100, Math.round((activeCard.current_spend / activeCard.spend_target) * 100))
                  : 0
                const bonusPts = activeCard.card.welcome_bonus_points

                const stats = [
                  {
                    label: "Est. Rewards",
                    value: bonusPts ? `${(bonusPts / 1000).toFixed(0)}k pts` : "—",
                    sub: "if target hit",
                    icon: "✦",
                    accent: true,
                  },
                  {
                    label: "Time Remaining",
                    value: daysLeft !== null ? `${daysLeft}d` : "—",
                    sub: "until deadline",
                    icon: "◷",
                    accent: daysLeft !== null && daysLeft < 14,
                  },
                  {
                    label: "Daily Pace",
                    value: dailyPaceMobile !== null ? `$${Math.ceil(dailyPaceMobile)}/d` : "—",
                    sub: "needed to hit bonus",
                    icon: "⚡",
                    accent: false,
                  },
                  {
                    label: "Bonus Progress",
                    value: `${pct}%`,
                    sub: `$${Math.round(activeCard.current_spend).toLocaleString()} of $${Math.round(activeCard.spend_target).toLocaleString()}`,
                    icon: "◎",
                    accent: pct >= 100,
                  },
                ]

                return (
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((s) => (
                      <StatCard
                        key={s.label}
                        label={s.label}
                        value={s.value}
                        sub={s.sub}
                        icon={s.icon}
                        accent={s.accent}
                      />
                    ))}
                  </div>
                )
              })()}

              {/* Mobile CTA */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full rounded-full py-6 text-base font-bold text-on-primary"
                    style={{ background: "var(--gradient-cta)" }}
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
                      <Label htmlFor="amount-mobile" className="text-on-surface-variant">
                        Amount (AUD)
                      </Label>
                      <Input
                        id="amount-mobile"
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
                      <Label htmlFor="description-mobile" className="text-on-surface-variant">
                        Description
                      </Label>
                      <Input
                        id="description-mobile"
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
                      <Label htmlFor="txn-date-mobile" className="text-on-surface-variant">
                        Date
                      </Label>
                      <Input
                        id="txn-date-mobile"
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
                      style={{ background: "var(--gradient-cta)" }}
                    >
                      Save Transaction
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}
