"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

export default function ChurnHistoryPage() {
  const router = useRouter()
  const [cards, setCards] = useState<UserCard[]>([])
  const [filteredCards, setFilteredCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "cancelled">("all")
  const [bankFilter, setBankFilter] = useState<string>("all")

  const loadCards = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace("/login")
      return
    }

    const { data, error } = await supabase
      .from("user_cards")
      .select("*")
      .order("cancellation_date", { ascending: false, nullsFirst: false })
      .order("application_date", { ascending: false })

    if (error) {
      toast.error(error.message || "Unable to load churn history")
      setLoading(false)
      return
    }

    setCards(data || [])
    setFilteredCards(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadCards()
  }, [router])

  useEffect(() => {
    let filtered = cards

    // Filter by status
    if (filter === "active") {
      filtered = filtered.filter(c => c.status !== "cancelled")
    } else if (filter === "cancelled") {
      filtered = filtered.filter(c => c.status === "cancelled")
    }

    // Filter by bank
    if (bankFilter !== "all") {
      filtered = filtered.filter(c => c.bank === bankFilter)
    }

    setFilteredCards(filtered)
  }, [filter, bankFilter, cards])

  const calculateDaysSince = (date: string | null) => {
    if (!date) return null
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const calculateMonthsSince = (date: string | null) => {
    if (!date) return null
    const months = Math.floor(calculateDaysSince(date)! / 30)
    return months
  }

  const formatTimeAgo = (date: string | null) => {
    if (!date) return "N/A"
    const days = calculateDaysSince(date)
    if (!days) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days} days ago`
    const months = Math.floor(days / 30)
    if (months === 1) return "1 month ago"
    if (months < 12) return `${months} months ago`
    const years = Math.floor(months / 12)
    if (years === 1) return "1 year ago"
    return `${years} years ago`
  }

  const getEligibilityStatus = (card: UserCard) => {
    // Check if we can churn this bank again (12-month rule)
    const cancelDate = card.cancellation_date
    if (!cancelDate) return null

    const monthsSince = calculateMonthsSince(cancelDate)
    if (!monthsSince) return { eligible: false, message: "Just cancelled" }

    if (monthsSince >= 12) {
      return { eligible: true, message: "Eligible to reapply" }
    } else {
      const monthsLeft = 12 - monthsSince
      return { eligible: false, message: `${monthsLeft} months until eligible` }
    }
  }

  const uniqueBanks = Array.from(new Set(cards.map(c => c.bank).filter(Boolean))) as string[]

  // Calculate stats
  const stats = {
    totalChurned: cards.filter(c => c.status === "cancelled").length,
    activeCards: cards.filter(c => c.status !== "cancelled").length,
    banksChurned: new Set(cards.filter(c => c.status === "cancelled").map(c => c.bank)).size,
    eligibleBanks: cards.filter(c => {
      const eligibility = getEligibilityStatus(c)
      return eligibility?.eligible
    }).length
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
          Loading churn history...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] p-6 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Churn History
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Your churning timeline
              </h1>
              <p className="text-sm text-slate-300">
                Track your churning history and see when you're eligible to reapply
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Total Churned</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {stats.totalChurned}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Active Cards</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {stats.activeCards}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Banks Churned</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {stats.banksChurned}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Eligible Now</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-[var(--success)]">
              {stats.eligibleBanks}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="border-b border-[var(--border-default)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-white">Filter History</CardTitle>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cards</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="cancelled">Cancelled Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={bankFilter} onValueChange={setBankFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Banks</SelectItem>
                    {uniqueBanks.map(bank => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredCards.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-8">
                No cards match your filters
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCards.map((card) => {
                  const eligibility = getEligibilityStatus(card)
                  const isCancelled = card.status === "cancelled"

                  return (
                    <div
                      key={card.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        isCancelled
                          ? "border-[var(--border-default)]/50 bg-[var(--surface-muted)]/50"
                          : "border-[var(--border-default)] bg-[var(--surface)]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${isCancelled ? "text-slate-500" : "text-[var(--accent)]"}`}>
                            {isCancelled ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold ${isCancelled ? "text-slate-400" : "text-white"}`}>
                                {card.bank} - {card.name}
                              </p>
                              <Badge
                                variant={isCancelled ? "secondary" : "default"}
                                className={isCancelled ? "bg-slate-700" : ""}
                              >
                                {card.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Applied: {card.application_date || "N/A"}
                              </div>
                              {isCancelled && card.cancellation_date && (
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Cancelled: {formatTimeAgo(card.cancellation_date)}
                                </div>
                              )}
                              {card.annual_fee && (
                                <div>
                                  Fee: ${card.annual_fee}
                                </div>
                              )}
                            </div>
                            {card.notes && (
                              <p className="text-xs text-slate-500 mt-1">{card.notes}</p>
                            )}
                          </div>
                        </div>

                        {isCancelled && eligibility && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <Badge
                              variant={eligibility.eligible ? "default" : "secondary"}
                              className={eligibility.eligible
                                ? "bg-[var(--success-bg)] text-[var(--success-fg)]"
                                : "bg-[var(--warning-bg)] text-[var(--warning-fg)]"
                              }
                            >
                              {eligibility.message}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}