"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
        .progress-arc-container { transition: transform 300ms ease-out; }
        .progress-arc-container:hover { transform: scale(1.02); }
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
              className="progress-center-amount tabular-nums font-bold text-white"
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

function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${Math.round(amount)}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
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

  useEffect(() => {
    void loadUserCards()
  }, [])

  const loadUserCards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

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

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-[#1b1f2c]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#1b1f2c]" />
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1b1f2c]" />
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
        {/* Page header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">Spending</p>
          <h1
            className="mt-1 bg-gradient-to-br from-[#4edea3] to-[#10b981] bg-clip-text text-2xl font-black text-transparent"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Spend Tracker
          </h1>
        </div>

        {userCards.length === 0 ? (
          <div className="glass-panel premium-glow flex flex-col items-center gap-4 rounded-2xl px-8 py-16 text-center">
            <p
              className="font-semibold text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              No active cards
            </p>
            <p className="text-sm text-[#bbcabf]">
              Add cards with spending requirements to track your progress.
            </p>
            <Button
              className="rounded-full font-bold text-[#003824]"
              style={{ background: "var(--gradient-cta)" }}
              onClick={() => (window.location.href = "/cards")}
            >
              Add cards
            </Button>
          </div>
        ) : (
          <>
            {/* Card selector */}
            {userCards.length > 1 && (
              <div>
                <Label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#bbcabf]">
                  Tracking card
                </Label>
                <select
                  value={selectedCardId ?? ""}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1b1f2c] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4edea3]/40"
                >
                  {userCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.card.bank} — {c.card.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeCard && pace && (
              <>
                {/* Arc + stats */}
                <div className="flex flex-col gap-5 rounded-b-[4rem] md:flex-row md:items-center">
                  {/* Arc — 60% width */}
                  <div className="flex flex-[3] items-center justify-center py-4">
                    <SpendArc spent={activeCard.current_spend} target={activeCard.spend_target} />
                  </div>

                  {/* Stats panel — 40% width */}
                  <div className="glass-panel premium-glow flex flex-[2] flex-col gap-5 rounded-2xl p-6">
                    {activeCard.spend_deadline && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#bbcabf]">
                          Days Remaining
                        </p>
                        <p
                          className="mt-0.5 text-5xl font-black tabular-nums text-white"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {Math.max(
                            0,
                            Math.ceil(
                              (new Date(activeCard.spend_deadline).getTime() - Date.now()) /
                                86400000,
                            ),
                          )}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#bbcabf]">
                        Pace
                      </p>
                      <p
                        className={`mt-0.5 text-lg font-bold ${pace.color}`}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {pace.label}
                      </p>
                    </div>

                    {activeCard.spend_deadline &&
                      activeCard.spend_target > activeCard.current_spend && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#bbcabf]">
                            Daily Target
                          </p>
                          <p className="mt-0.5 text-lg font-bold tabular-nums text-white">
                            {(() => {
                              const daysLeft = Math.ceil(
                                (new Date(activeCard.spend_deadline).getTime() - Date.now()) /
                                  86400000,
                              )
                              if (daysLeft <= 0) return "—"
                              return (
                                formatCurrency(
                                  (activeCard.spend_target - activeCard.current_spend) / daysLeft,
                                ) + "/day"
                              )
                            })()}
                          </p>
                        </div>
                      )}

                    {!!activeCard.card.welcome_bonus_points && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#bbcabf]">
                          Earn on Completion
                        </p>
                        <p
                          className="mt-0.5 text-lg font-bold tabular-nums text-[#c3c0ff]"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {activeCard.card.welcome_bonus_points.toLocaleString()} pts
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent transactions */}
                {(transactions[activeCard.id]?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#bbcabf]">
                      Recent Transactions
                    </p>
                    <div className="space-y-2">
                      {transactions[activeCard.id].slice(0, 5).map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-[#dfe2f3]">{txn.description}</span>
                          <span className="tabular-nums font-medium text-white">
                            {formatCurrency(txn.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full rounded-full py-6 text-base font-bold text-[#003824]"
                      style={{ background: "var(--gradient-cta)" }}
                    >
                      + Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border border-white/10 bg-[#1b1f2c]">
                    <DialogHeader>
                      <DialogTitle className="text-white">Record Transaction</DialogTitle>
                      <DialogDescription className="text-[#bbcabf]">
                        Record a purchase made with {activeCard.card.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount" className="text-[#bbcabf]">
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
                          className="border-white/10 bg-[#262a37] text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-[#bbcabf]">
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
                          className="border-white/10 bg-[#262a37] text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="txn-date" className="text-[#bbcabf]">
                          Date
                        </Label>
                        <Input
                          id="txn-date"
                          type="date"
                          value={newTransaction.date}
                          onChange={(e) =>
                            setNewTransaction({ ...newTransaction, date: e.target.value })
                          }
                          className="border-white/10 bg-[#262a37] text-white"
                        />
                      </div>
                      <Button
                        onClick={handleAddTransaction}
                        className="w-full rounded-full font-bold text-[#003824]"
                        style={{ background: "var(--gradient-cta)" }}
                      >
                        Save Transaction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
