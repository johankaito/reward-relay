"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TrendingUp, DollarSign, Clock, Sparkles } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecommendationCard } from "@/components/dashboard/RecommendationCard"
import { supabase } from "@/lib/supabase/client"
import { getRecommendations } from "@/lib/recommendations"
import { useCatalog } from "@/contexts/CatalogContext"
import type { Database } from "@/types/database.types"
import type { Recommendation } from "@/lib/recommendations"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

type FilterType = "all" | "eligible" | "coming_soon"
type SortType = "score" | "bonus" | "fee" | "bank"

export default function RecommendationsPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const [cards, setCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [sort, setSort] = useState<SortType>("score")

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace("/")
      return
    }

    // Load user cards
    const { data: userCardsResult, error } = await supabase
      .from("user_cards")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(error.message || "Unable to load your cards")
      setLoading(false)
      return
    }

    setCards(userCardsResult || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [router])

  const allRecommendations = useMemo(() => {
    if (cards.length === 0 || catalogCards.length === 0) return []
    return getRecommendations(cards, catalogCards, { limit: 50 })
  }, [cards, catalogCards])

  const filteredRecommendations = useMemo(() => {
    let filtered = allRecommendations

    // Apply filter
    if (filter === "eligible") {
      filtered = filtered.filter(r => r.eligibleNow)
    } else if (filter === "coming_soon") {
      filtered = filtered.filter(r => !r.eligibleNow)
    }

    // Apply sort
    const sorted = [...filtered]
    switch (sort) {
      case "bonus":
        sorted.sort((a, b) => (b.card.welcome_bonus_points || 0) - (a.card.welcome_bonus_points || 0))
        break
      case "fee":
        sorted.sort((a, b) => (a.card.annual_fee || 0) - (b.card.annual_fee || 0))
        break
      case "bank":
        sorted.sort((a, b) => (a.card.bank || "").localeCompare(b.card.bank || ""))
        break
      case "score":
      default:
        // Already sorted by score from getRecommendations
        break
    }

    return sorted
  }, [allRecommendations, filter, sort])

  const stats = useMemo(() => {
    const eligible = allRecommendations.filter(r => r.eligibleNow).length
    const comingSoon = allRecommendations.filter(r => !r.eligibleNow).length
    return { total: allRecommendations.length, eligible, comingSoon }
  }, [allRecommendations])

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
          Loading recommendations...
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
                Smart Recommendations
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Your next card opportunities
              </h1>
              <p className="text-sm text-slate-300">
                Personalized recommendations based on your churning history and bank eligibility
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Total Cards</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {stats.total}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Eligible Now</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-[var(--success)]">
              {stats.eligible}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-[var(--warning)]">
              {stats.comingSoon}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Sort */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="border-b border-[var(--border-default)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-white">Filter & Sort</CardTitle>
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cards</SelectItem>
                    <SelectItem value="eligible">Eligible Now</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        By Score
                      </div>
                    </SelectItem>
                    <SelectItem value="bonus">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        By Bonus
                      </div>
                    </SelectItem>
                    <SelectItem value="fee">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        By Fee
                      </div>
                    </SelectItem>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        By Bank
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredRecommendations.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-8">
                {filter === "eligible"
                  ? "No cards are currently eligible. Check back later!"
                  : filter === "coming_soon"
                  ? "No upcoming cards at this time"
                  : "No recommendations available. Add some cards to get started!"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecommendations.map((recommendation, index) => (
                  <div key={recommendation.card.id}>
                    {index === 0 && filter === "all" && (
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className="bg-[var(--accent-bg)] text-[var(--accent-fg)]">
                          Top Pick
                        </Badge>
                      </div>
                    )}
                    <RecommendationCard
                      recommendation={recommendation}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
