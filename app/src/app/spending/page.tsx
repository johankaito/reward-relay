"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, TrendingUp, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SpendingEmptyState } from "@/components/forms/SpendingEmptyState"

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

export default function SpendingTrackerPage() {
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [transactions, setTransactions] = useState<Record<string, SpendingTransaction[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null)
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    category: "general",
  })

  useEffect(() => {
    loadUserCards()
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
          const activatedDate = new Date(card.activated_date)
          deadline = new Date(activatedDate.setMonth(activatedDate.getMonth() + windowMonths))
        }

        return {
          ...card,
          current_spend: card.current_spend || 0,
          spend_target: spendTarget,
          spend_deadline: deadline?.toISOString() || null,
        }
      })

      setUserCards(enrichedCards)

      const cardIds = enrichedCards.map((c) => c.id)
      await loadTransactions(cardIds)
    } catch (error) {
      console.error("Error loading cards:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (cardIds: string[]) => {
    const transactionMap: Record<string, SpendingTransaction[]> = {}
    cardIds.forEach((id) => {
      transactionMap[id] = []
    })
    setTransactions(transactionMap)
  }

  const handleAddTransaction = async () => {
    if (!selectedCard || !newTransaction.amount) return

    try {
      const newSpend = (selectedCard.current_spend || 0) + parseFloat(newTransaction.amount)

      const { error } = await supabase
        .from("user_cards")
        .update({ current_spend: newSpend })
        .eq("id", selectedCard.id)

      if (error) throw error

      setUserCards((cards) =>
        cards.map((c: UserCard) =>
          c.id === selectedCard.id ? { ...c, current_spend: newSpend } : c,
        ),
      )

      setNewTransaction({
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        category: "general",
      })
      setIsAddingTransaction(false)
      setSelectedCard(null)
    } catch (error) {
      console.error("Error adding transaction:", error)
    }
  }

  const getSpendingStatus = (card: UserCard) => {
    if (!card.spend_target) return { status: "no_target", color: "gray" }

    const progress = (card.current_spend / card.spend_target) * 100
    const daysLeft = card.spend_deadline
      ? Math.ceil(
          (new Date(card.spend_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
      : null

    if (progress >= 100) return { status: "completed", icon: CheckCircle }
    if (daysLeft !== null && daysLeft < 14) return { status: "urgent", icon: AlertCircle }
    if (daysLeft !== null && daysLeft < 30) return { status: "warning", icon: Clock }
    return { status: "on_track", icon: TrendingUp }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
            ))}
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </AppShell>
    )
  }

  const cardsNeedingSpend = userCards.filter(
    (c) => c.spend_target > 0 && c.current_spend < c.spend_target,
  ).length
  const totalTarget = userCards.reduce((sum, c) => sum + (c.spend_target || 0), 0)

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Spending
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            Spend tracker
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track progress toward minimum spend requirements
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="px-4 py-3">
              <p className="text-xs text-[var(--text-secondary)]">Active cards</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                {userCards.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="px-4 py-3">
              <p className="text-xs text-[var(--text-secondary)]">Needs spend</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                {cardsNeedingSpend}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="px-4 py-3">
              <p className="text-xs text-[var(--text-secondary)]">Total target</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(totalTarget)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Card spending progress */}
        {userCards.length === 0 ? (
          <SpendingEmptyState />
        ) : (
          <div className="space-y-4">
            {userCards.map((card) => {
              const status = getSpendingStatus(card)
              const progress = card.spend_target ? (card.current_spend / card.spend_target) * 100 : 0
              const StatusIcon = status.icon || TrendingUp

              const badgeStyle =
                status.status === "completed"
                  ? { backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }
                  : status.status === "urgent"
                    ? { backgroundColor: "var(--danger)", color: "white" }
                    : status.status === "warning"
                      ? { backgroundColor: "var(--warning-bg)", color: "var(--warning-fg)" }
                      : { backgroundColor: "var(--info-bg)", color: "var(--info-fg)" }

              return (
                <Card
                  key={card.id}
                  className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm"
                  data-spending-card={card.id}
                >
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">
                            {card.card.bank} — {card.card.name}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            <Badge style={badgeStyle}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.status === "completed"
                                ? "Target met"
                                : status.status === "urgent"
                                  ? "Urgent"
                                  : status.status === "warning"
                                    ? "Deadline soon"
                                    : "On track"}
                            </Badge>
                            {card.spend_deadline && (
                              <Badge
                                variant="outline"
                                className="border-[var(--border-default)] text-[var(--text-secondary)]"
                              >
                                Due {formatDate(card.spend_deadline)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Dialog
                          open={isAddingTransaction && selectedCard?.id === card.id}
                          onOpenChange={(open) => {
                            setIsAddingTransaction(open)
                            if (open) setSelectedCard(card)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 rounded-full"
                            >
                              <Plus className="mr-1.5 h-3.5 w-3.5" />
                              Add spend
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Record transaction</DialogTitle>
                              <DialogDescription>
                                Record a purchase made with {card.card.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="amount">Amount (AUD)</Label>
                                <Input
                                  id="amount"
                                  type="number"
                                  step="0.01"
                                  placeholder="100.00"
                                  value={newTransaction.amount}
                                  onChange={(e) =>
                                    setNewTransaction({ ...newTransaction, amount: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="description">Description</Label>
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
                                />
                              </div>
                              <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                  id="date"
                                  type="date"
                                  value={newTransaction.date}
                                  onChange={(e) =>
                                    setNewTransaction({ ...newTransaction, date: e.target.value })
                                  }
                                />
                              </div>
                              <Button onClick={handleAddTransaction} className="w-full">
                                Save transaction
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Progress */}
                      {card.spend_target > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[var(--text-primary)]">
                              {formatCurrency(card.current_spend)}
                            </span>
                            <span className="text-[var(--text-secondary)]">
                              of {formatCurrency(card.spend_target)}
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                          <p className="text-xs text-[var(--text-secondary)]">
                            {progress >= 100
                              ? "Spending requirement met — bonus points incoming"
                              : `${formatCurrency(card.spend_target - card.current_spend)} remaining to earn ${card.card.welcome_bonus_points?.toLocaleString() || "bonus"} points`}
                          </p>
                        </div>
                      )}

                      {/* Recent transactions */}
                      {transactions[card.id]?.length > 0 && (
                        <div className="border-t border-[var(--border-default)] pt-3">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            Recent transactions
                          </h4>
                          <div className="space-y-1">
                            {transactions[card.id].slice(0, 3).map((txn) => (
                              <div
                                key={txn.id}
                                className="flex justify-between text-sm text-[var(--text-secondary)]"
                              >
                                <span>{txn.description}</span>
                                <span>{formatCurrency(txn.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
