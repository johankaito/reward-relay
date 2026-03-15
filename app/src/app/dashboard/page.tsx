"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, TrendingUp, CreditCard, Clock } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditCardModal } from "@/components/cards/EditCardModal"
import { RecommendationCard } from "@/components/dashboard/RecommendationCard"
import { DailyInsights } from "@/components/dashboard/DailyInsights"
import { BonusConfirmationBanner } from "@/components/dashboard/BonusConfirmationBanner"
import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay"
import { BadgeGrid } from "@/components/gamification/BadgeGrid"
import { triggerCelebration } from "@/components/gamification/CelebrationOverlay"
import { supabase } from "@/lib/supabase/client"
import { getOnboardingProgress } from "@/lib/onboarding"
import { getRecommendations } from "@/lib/recommendations"
import { GOALS, calculateMultiCardPaths } from "@/lib/projections"
import { formatPointsWithValue } from "@/lib/points"
import { useCatalog } from "@/contexts/CatalogContext"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import type { Database } from "@/types/database.types"

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
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false)

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

    analytics.identifyUser(session.user.id, {
      email: session.user.email,
      created_at: session.user.created_at,
    })

    const { data: userCardsResult, error } = await supabase
      .from("user_cards")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(error.message || "Unable to load your cards")
      setLoading(false)
      return
    }

    const loadedCards = userCardsResult || []
    setCards(loadedCards)
    setLoading(false)

    if (showWelcome) {
      toast.success("Welcome back!")
    }

    // Check for newly earned badges in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentBadges } = await supabase
      .from('user_badges')
      .select('badge_type, earned_at, badge_definitions(name, icon_emoji)')
      .eq('user_id', session.user.id)
      .gte('earned_at', fiveMinutesAgo)

    if (recentBadges && recentBadges.length > 0) {
      void triggerCelebration('medium')
      recentBadges.forEach((badge) => {
        const def = badge.badge_definitions as { name: string; icon_emoji: string } | null
        if (def) {
          toast.success(`${def.icon_emoji} Badge unlocked: ${def.name}!`)
        }
      })
    }

    // Show welcome overlay for new users: no cards and onboarding not completed/dismissed
    if (loadedCards.length === 0) {
      const progress = await getOnboardingProgress(session.user.id)
      if (!progress.onboardingCompletedAt && !progress.onboardingDismissedAt) {
        setShowWelcomeOverlay(true)
      }
    }
  }

  useEffect(() => {
    const checkAndLoad = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const isNewLogin = !!(session && !email)
      loadCards(isNewLogin)
    }
    checkAndLoad()
  }, [router])

  const handleEditCard = (card: UserCard) => {
    setEditingCard(card)
    setIsEditModalOpen(true)
  }

  const handleUpdateComplete = () => {
    loadCards(false)
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

  useEffect(() => {
    if (topRecommendation && userId) {
      analytics.trackEvent("recommendation_viewed", {
        card_index: 0,
        is_pro: false,
        days_since_signup: 0,
      })
    }
  }, [topRecommendation, userId, analytics])

  const projection = useMemo(() => {
    if (catalogCards.length === 0) return null
    const goal = GOALS.domesticFlight
    const paths = calculateMultiCardPaths(goal, cards, catalogCards, 0)
    return paths.length > 0 ? { path: paths[0], goal } : null
  }, [cards, catalogCards])

  // Derive display name from email
  const displayName = email ? email.split("@")[0] : null

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
          <div className="h-48 animate-pulse rounded-xl bg-[var(--surface)]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {showWelcomeOverlay && userId && (
        <WelcomeOverlay
          userId={userId}
          displayName={displayName}
          onDismiss={() => setShowWelcomeOverlay(false)}
        />
      )}

      <div className="space-y-5">
        {/* Bonus confirmation banners */}
        <BonusConfirmationBanner />

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {displayName ? `Hey, ${displayName}` : "Dashboard"}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              Your credit card rewards overview
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-full text-white shadow-sm"
            style={{ background: "var(--gradient-cta)" }}
            onClick={() => router.push("/cards")}
          >
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Add card
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                Active cards
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              <p className="text-3xl font-semibold text-[var(--text-primary)]">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              <p className="text-3xl font-semibold text-[var(--text-primary)]">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-[var(--text-secondary)]">
                Total tracked
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              <p className="text-3xl font-semibold text-[var(--text-primary)]">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Your cards */}
        <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="flex flex-col gap-2 space-y-0 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-[var(--text-primary)]">Your cards</CardTitle>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                Status, applied dates, and cancel targets
              </p>
            </div>
            <Link href="/cards">
              <Button size="sm" variant="outline" className="rounded-full">
                Browse catalog
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)] p-5">
                <p className="font-medium text-[var(--text-primary)]">No cards tracked yet</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Add your current cards and churn target to start seeing reminders and eligibility.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/cards")}
                  className="rounded-full"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Browse cards
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {cards.map((card) => {
                  const status = card.status || "active"
                  return (
                    <Link
                      key={card.id}
                      href={`/dashboard/cards/${card.id}`}
                      className="group flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--accent)]/50 hover:shadow-sm"
                      data-card-item
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className="bg-[var(--info-bg)] text-[var(--info-fg)]"
                            >
                              {card.bank || "Custom"}
                            </Badge>
                            {card.is_business && (
                              <Badge style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-fg)', opacity: 0.8 }}>
                                Business
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {card.name || "Untitled card"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                            className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                            Applied
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                            {card.application_date || "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                            Cancel by
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                            {card.cancellation_date || (
                              <span className="text-[var(--text-secondary)]">Add date</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {card.notes && (
                        <p className="rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]">
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

        {/* Top recommendation */}
        {topRecommendation && (
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              Top opportunity
            </p>
            <RecommendationCard recommendation={topRecommendation} variant="hero" />
          </div>
        )}

        {/* Projection preview */}
        {projection && (
          <Card className="border border-[var(--accent)]/20 bg-[var(--surface)] shadow-sm">
            <CardContent className="pt-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      Goal projection
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-[var(--text-primary)]">
                    {projection.goal.label} in{" "}
                    <span className="text-[var(--accent)]">
                      {projection.path.timeToGoal} months
                    </span>
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                    <span>{formatPointsWithValue(projection.path.totalPoints, "qantas", "flights_business")}</span>
                    <span>·</span>
                    <span>${projection.path.totalCost} fees</span>
                    <span>·</span>
                    <span className="text-[var(--success-fg)]">
                      ${projection.path.netValue.toFixed(0)} net value
                    </span>
                  </div>
                </div>
                <Link href="/projections">
                  <Button variant="outline" size="sm" className="rounded-full">
                    View all goals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily insights — shown last, supplementary */}
        {userId && (
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              Today&apos;s activity
            </p>
            <DailyInsights userId={userId} />
          </div>
        )}

        {/* Achievements */}
        {userId && <BadgeGrid userId={userId} />}
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
    return { backgroundColor: "var(--surface-strong)", color: "var(--text-secondary)" }
  }
  return {}
}
