"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditCardModal } from "@/components/cards/EditCardModal"
import { RecommendationCard } from "@/components/dashboard/RecommendationCard"
import { DailyInsights } from "@/components/dashboard/DailyInsights"
import { supabase } from "@/lib/supabase/client"
import { getRecommendations } from "@/lib/recommendations"
import { GOALS, calculateMultiCardPaths } from "@/lib/projections"
import { useCatalog } from "@/contexts/CatalogContext"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import type { Database } from "@/types/database.types"
import type { Recommendation } from "@/lib/recommendations"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

export default function DashboardPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const analytics = useAnalytics()
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [cards, setCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCard, setEditingCard] = useState<UserCard | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadCards = async (showWelcome = false) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.replace("/")
      return
    }

    setEmail(session.user.email ?? null)
    setUserId(session.user.id)

    // Identify user in PostHog
    analytics.identifyUser(session.user.id, {
      email: session.user.email,
      created_at: session.user.created_at,
    })

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

    // Show welcome message on initial load from login
    if (showWelcome) {
      toast.success("Welcome back!")
    }
  }

  useEffect(() => {
    // Check if coming from login by looking for a fresh session
    const checkAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const isNewLogin = !!(session && !email) // Fresh session and no email set yet
      loadCards(isNewLogin)
    }
    checkAndLoad()
  }, [router])

  const handleEditCard = (card: UserCard) => {
    setEditingCard(card)
    setIsEditModalOpen(true)
  }

  const handleUpdateComplete = () => {
    loadCards(false) // Reload cards after edit/delete
  }

  const stats = useMemo(() => {
    const active = cards.filter((c) => c.status === "active").length
    const pending = cards.filter((c) => c.status === "pending").length
    return { active, pending, total: cards.length }
  }, [cards])

  const recommendations = useMemo(() => {
    if (cards.length === 0 || catalogCards.length === 0) return []
    return getRecommendations(cards, catalogCards)
  }, [cards, catalogCards])

  const topRecommendation = recommendations.length > 0 ? recommendations[0] : null

  // Track recommendation_viewed when recommendations are shown
  useEffect(() => {
    if (topRecommendation && userId) {
      const signupDate = new Date() // We'll use current date as approximation
      const daysSinceSignup = 0 // Placeholder - could be calculated properly

      analytics.trackEvent("recommendation_viewed", {
        card_index: 0, // First recommendation
        is_pro: false, // Free tier for now
        days_since_signup: daysSinceSignup,
      })
    }
  }, [topRecommendation, userId, analytics])

  // Calculate projection to domestic flight (most achievable goal)
  const projection = useMemo(() => {
    if (catalogCards.length === 0) return null
    const goal = GOALS.domesticFlight // 10,000 points
    const paths = calculateMultiCardPaths(goal, cards, catalogCards, 0)
    return paths.length > 0 ? { path: paths[0], goal } : null
  }, [cards, catalogCards])

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
          Loading dashboard...
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Daily Insights with Streak Tracking */}
        {userId && <DailyInsights userId={userId} />}

        {topRecommendation && (
          <div className="space-y-3">
            <RecommendationCard recommendation={topRecommendation} variant="hero" />
            <p className="text-center text-sm text-slate-400">
              Simple workflow: 1. Add your cards 2. Get instant recommendations
            </p>
          </div>
        )}

        {/* Projection Preview */}
        {projection && (
          <Card className="border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--surface)] to-[color-mix(in_srgb,var(--accent)_5%,transparent)] shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{projection.goal.icon}</span>
                    <p className="text-lg font-semibold text-white">Your Goal Path</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--accent)]">
                    {projection.goal.label} in {projection.path.timeToGoal} months
                  </p>
                  <p className="text-sm text-slate-300">
                    With {projection.path.cards.length} card{projection.path.cards.length > 1 ? 's' : ''}: {projection.path.cards.map(c => c.bank).join(' + ')}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{projection.path.totalPoints.toLocaleString()} points earned</span>
                    <span>•</span>
                    <span>${projection.path.totalCost} total fees</span>
                    <span>•</span>
                    <span>${projection.path.netValue.toFixed(0)} net value</span>
                  </div>
                </div>
                <div>
                  <Link href="/projections">
                    <Button
                      className="rounded-full text-white shadow-sm"
                      style={{ background: "var(--gradient-cta)" }}
                    >
                      View All Goals
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface)] p-6 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                Reward Relay
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Welcome{email ? `, ${email}` : ""} 👋
              </h1>
              <p className="text-sm text-slate-300">
                Track your cards, stay ahead of fees, and know which bank you can churn next.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="rounded-full px-3 py-2 text-xs font-semibold text-[var(--accent-contrast)]"
                style={{ background: "var(--gradient-accent)" }}
              >
                Week 1: Add your cards + churn target
              </div>
              <Button
                size="sm"
                className="rounded-full text-white shadow-sm"
                style={{ background: "var(--gradient-cta)" }}
                onClick={() => router.push("/cards")}
              >
                Start tracking
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">Active cards</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-semibold text-white">
              {stats.active}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">Pending / Applied</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-semibold text-white">
              {stats.pending}
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">Total tracked</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-semibold text-white">
              {stats.total}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-md">
          <CardHeader className="flex flex-col gap-2 space-y-0 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-white">Your cards</CardTitle>
              <p className="text-sm text-slate-300">Status, applied dates, and cancel targets.</p>
            </div>
            <Link href="/cards">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                Browse catalog
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-5 text-sm text-slate-200">
                <p className="text-base font-semibold text-white">No cards tracked yet</p>
                <p>Add your cards and churn target to start seeing reminders and eligibility.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push("/cards")}
                    className="rounded-full"
                  >
                    View card ideas
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {cards.map((card) => {
                  const status = card.status || "active"
                  return (
                    <Link
                      key={card.id}
                      href={`/dashboard/cards/${card.id}`}
                      className="flex flex-col gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--accent)] hover:shadow-md"
                      data-card-item
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Badge variant="secondary" className="bg-[var(--info-bg)] text-[var(--info-fg)]">
                            {card.bank || "Custom"}
                          </Badge>
                          <p className="text-base font-semibold text-white">
                            {card.name || "Untitled card"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="capitalize" style={statusStyle(status)}>
                            {status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault()
                              handleEditCard(card)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 md:text-sm">
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Applied
                          </p>
                          <p className="font-semibold text-white">
                            {card.application_date || "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            Cancel by
                          </p>
                          <p className="font-semibold text-white">
                            {card.cancellation_date || "Add date"}
                          </p>
                        </div>
                      </div>
                      {card.notes && (
                        <p className="rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-xs text-slate-200 ring-1 ring-[var(--border-default)]">
                          {card.notes}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditCardModal
        card={editingCard}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCard(null)
        }}
        onUpdate={handleUpdateComplete}
      />
    </AppShell>
  )
}

function statusStyle(status: string) {
  if (status === "active") {
    return { backgroundColor: "var(--success-bg)", color: "var(--success-fg)" }
  }
  if (status === "pending" || status === "applied") {
    return { backgroundColor: "var(--warning-bg)", color: "var(--warning-fg)" }
  }
  if (status === "cancelled") {
    return { backgroundColor: "var(--surface-strong)", color: "var(--text-primary)" }
  }
  return {}
}
