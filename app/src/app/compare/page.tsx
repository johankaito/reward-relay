"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TrendingUp, DollarSign, Calendar, AlertCircle, Check, X } from "lucide-react"

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
type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

interface CardWithEligibility extends CatalogCard {
  eligibility: {
    canApply: boolean
    reason: string
    monthsUntilEligible?: number
    lastChurned?: string
  }
  netValue: number
  recommendation: {
    score: number
    reasons: string[]
  }
}

export default function ComparePage() {
  const router = useRouter()
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"netValue" | "bonus" | "fee" | "recommendation">("recommendation")
  const [filterEligible, setFilterEligible] = useState(true)

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace("/")
      return
    }

    // Load user's cards
    const { data: userCardsData, error: userError } = await supabase
      .from("user_cards")
      .select("*")
      .order("cancellation_date", { ascending: false })

    if (userError) {
      toast.error(userError.message || "Unable to load your cards")
      setLoading(false)
      return
    }

    // Load catalog cards
    const { data: catalogData, error: catalogError } = await supabase
      .from("cards")
      .select("*")
      .order("bank", { ascending: true })

    if (catalogError) {
      toast.error(catalogError.message || "Unable to load card catalog")
      setLoading(false)
      return
    }

    setUserCards(userCardsData || [])
    setCatalogCards(catalogData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [router])

  const calculateMonthsSince = (date: string | null) => {
    if (!date) return null
    const months = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30))
    return months
  }

  const checkEligibility = (card: CatalogCard): CardWithEligibility["eligibility"] => {
    // Find if user has churned this bank before
    const previousCards = userCards.filter(uc => uc.bank === card.bank && uc.status === "cancelled")

    if (previousCards.length === 0) {
      // Never churned this bank - eligible
      return {
        canApply: true,
        reason: "Never churned - eligible to apply"
      }
    }

    // Find most recent cancellation
    const mostRecent = previousCards.reduce((latest, card) => {
      if (!latest.cancellation_date) return card
      if (!card.cancellation_date) return latest
      return new Date(card.cancellation_date) > new Date(latest.cancellation_date) ? card : latest
    })

    if (!mostRecent.cancellation_date) {
      return {
        canApply: true,
        reason: "No cancellation date recorded"
      }
    }

    const monthsSince = calculateMonthsSince(mostRecent.cancellation_date)
    if (!monthsSince || monthsSince >= 12) {
      return {
        canApply: true,
        reason: `Eligible - ${monthsSince || 0} months since cancellation`,
        lastChurned: mostRecent.cancellation_date
      }
    }

    return {
      canApply: false,
      reason: `Wait ${12 - monthsSince} more months`,
      monthsUntilEligible: 12 - monthsSince,
      lastChurned: mostRecent.cancellation_date
    }
  }

  const calculateNetValue = (card: CatalogCard): number => {
    // Net value = (Welcome bonus points × value per point) - annual fee
    const pointValue = 0.01 // Default: 1 cent per point
    const bonusValue = (card.welcome_bonus_points || 0) * pointValue
    const fee = card.annual_fee || 0
    return bonusValue - fee
  }

  const calculateRecommendation = (card: CatalogCard, eligibility: CardWithEligibility["eligibility"], netValue: number): CardWithEligibility["recommendation"] => {
    let score = 0
    const reasons: string[] = []

    // Eligibility is most important
    if (!eligibility.canApply) {
      return { score: 0, reasons: ["Not eligible yet"] }
    }

    // High net value is great
    if (netValue > 500) {
      score += 40
      reasons.push(`High net value: $${netValue.toFixed(0)}`)
    } else if (netValue > 200) {
      score += 25
      reasons.push(`Good net value: $${netValue.toFixed(0)}`)
    } else if (netValue > 0) {
      score += 10
      reasons.push(`Positive net value: $${netValue.toFixed(0)}`)
    }

    // Large bonus is attractive
    if ((card.welcome_bonus_points || 0) >= 100000) {
      score += 30
      reasons.push("Excellent bonus points")
    } else if ((card.welcome_bonus_points || 0) >= 50000) {
      score += 20
      reasons.push("Good bonus points")
    }

    // Low/no annual fee is good
    if (!card.annual_fee || card.annual_fee === 0) {
      score += 20
      reasons.push("No annual fee")
    } else if (card.annual_fee <= 200) {
      score += 10
      reasons.push("Low annual fee")
    }

    // Reasonable spend requirement
    if (!card.bonus_spend_requirement || card.bonus_spend_requirement <= 3000) {
      score += 10
      reasons.push("Easy spend requirement")
    }

    // Check if currently holding cards from same bank
    const activeFromBank = userCards.filter(uc =>
      uc.bank === card.bank && uc.status !== "cancelled"
    ).length
    if (activeFromBank > 0) {
      score -= 20
      reasons.push("Already have card from this bank")
    }

    return { score, reasons }
  }

  const cardsWithAnalysis = useMemo(() => {
    const analyzed = catalogCards.map(card => {
      const eligibility = checkEligibility(card)
      const netValue = calculateNetValue(card)
      const recommendation = calculateRecommendation(card, eligibility, netValue)

      return {
        ...card,
        eligibility,
        netValue,
        recommendation
      } as CardWithEligibility
    })

    // Filter if needed
    let filtered = analyzed
    if (filterEligible) {
      filtered = filtered.filter(c => c.eligibility.canApply)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recommendation":
          return b.recommendation.score - a.recommendation.score
        case "netValue":
          return b.netValue - a.netValue
        case "bonus":
          return (b.welcome_bonus_points || 0) - (a.welcome_bonus_points || 0)
        case "fee":
          return (a.annual_fee || 0) - (b.annual_fee || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [catalogCards, userCards, sortBy, filterEligible])

  // Calculate stats
  const stats = {
    eligibleCards: cardsWithAnalysis.filter(c => c.eligibility.canApply).length,
    avgNetValue: cardsWithAnalysis.filter(c => c.eligibility.canApply).reduce((sum, c) => sum + c.netValue, 0) /
                 (cardsWithAnalysis.filter(c => c.eligibility.canApply).length || 1),
    bestCard: cardsWithAnalysis[0],
    totalPotentialValue: cardsWithAnalysis
      .filter(c => c.eligibility.canApply)
      .slice(0, 3)
      .reduce((sum, c) => sum + c.netValue, 0)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
          Loading card comparison...
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
                Card Comparison
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Find your next churn
              </h1>
              <p className="text-sm text-slate-300">
                Compare eligible cards by net value and see personalized recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Eligible Cards</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              {stats.eligibleCards}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Avg Net Value</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-[var(--success)]">
              ${stats.avgNetValue.toFixed(0)}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Best Card Value</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-[var(--info)]">
              ${stats.bestCard?.netValue.toFixed(0) || 0}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-400">Next 3 Cards</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">
              ${stats.totalPotentialValue.toFixed(0)}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="border-b border-[var(--border-default)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-white">Card Rankings</CardTitle>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommendation">Recommended</SelectItem>
                    <SelectItem value="netValue">Net Value</SelectItem>
                    <SelectItem value="bonus">Bonus Points</SelectItem>
                    <SelectItem value="fee">Annual Fee</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={filterEligible ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterEligible(!filterEligible)}
                >
                  {filterEligible ? "Eligible Only" : "Show All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {cardsWithAnalysis.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-8">
                No cards match your criteria
              </div>
            ) : (
              <div className="space-y-4">
                {cardsWithAnalysis.slice(0, 10).map((card, index) => (
                  <div
                    key={card.id}
                    className={`rounded-2xl border p-4 ${
                      index === 0 && card.eligibility.canApply
                        ? "border-[var(--accent)] bg-[var(--surface)] ring-1 ring-[var(--accent)]/20"
                        : "border-[var(--border-default)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">
                                {card.bank} - {card.name}
                              </p>
                              {index === 0 && card.eligibility.canApply && (
                                <Badge className="bg-[var(--accent)] text-white">
                                  Top Pick
                                </Badge>
                              )}
                              {!card.eligibility.canApply && (
                                <Badge variant="secondary" className="bg-red-900/20 text-red-400">
                                  Not Eligible
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {card.welcome_bonus_points?.toLocaleString() || 0} points
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${card.annual_fee || 0} fee
                              </div>
                              {card.bonus_spend_requirement && (
                                <div>
                                  Spend ${card.bonus_spend_requirement.toLocaleString()} in {card.bonus_spend_window_months || 3} months
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Eligibility Status */}
                        <div className="flex items-center gap-2 text-sm">
                          {card.eligibility.canApply ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={card.eligibility.canApply ? "text-green-400" : "text-red-400"}>
                            {card.eligibility.reason}
                          </span>
                        </div>

                        {/* Recommendation Reasons */}
                        {card.recommendation.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {card.recommendation.reasons.slice(0, 3).map((reason, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Net Value Display */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Net Value</p>
                          <p className={`text-2xl font-bold ${
                            card.netValue > 0 ? "text-green-400" : "text-red-400"
                          }`}>
                            ${card.netValue.toFixed(0)}
                          </p>
                        </div>
                        {card.recommendation.score > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 w-2 rounded-full ${
                                    i < Math.floor(card.recommendation.score / 20)
                                      ? "bg-[var(--accent)]"
                                      : "bg-slate-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-400">
                              {card.recommendation.score}%
                            </span>
                          </div>
                        )}
                        {card.eligibility.canApply && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => router.push("/cards")}
                          >
                            Track Card
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eligibility Calculator Info */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface-muted)] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-[var(--accent)]" />
              How Eligibility Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p>
              <strong className="text-white">12-Month Rule:</strong> Most Australian banks require you to wait 12 months after cancelling before you can receive welcome bonuses again.
            </p>
            <p>
              <strong className="text-white">Net Value:</strong> Calculated as (Welcome Bonus Points × $0.01) - Annual Fee. This gives you the first-year value of each card.
            </p>
            <p>
              <strong className="text-white">Recommendations:</strong> Based on eligibility, net value, spend requirements, and your current portfolio. Higher scores mean better matches for your situation.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}