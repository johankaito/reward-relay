"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, CreditCard, TrendingUp } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { ProGate } from "@/components/ui/ProGate"
import { WalletCard } from "@/components/ui/WalletCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EditCardModal } from "@/components/cards/EditCardModal"
import { RecommendationCard } from "@/components/dashboard/RecommendationCard"
import { DailyInsights } from "@/components/dashboard/DailyInsights"
import { supabase } from "@/lib/supabase/client"
import { getRecommendations } from "@/lib/recommendations"
import { GOALS, calculateMultiCardPaths } from "@/lib/projections"
import { useCatalog } from "@/contexts/CatalogContext"
import { useAnalytics } from "@/contexts/AnalyticsContext"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

const CANCEL_ALERT_DAYS = 30

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

    setCards(userCardsResult || [])
    setLoading(false)

    if (showWelcome) {
      toast.success("Welcome back!")
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
    const bonusReady = cards.filter((c) => c.status === "active" && !c.bonus_earned).length

    const catalogById = new Map(catalogCards.map((c) => [c.id, c]))
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let totalPoints = 0
    let monthlyPoints = 0
    for (const uc of cards) {
      if (!uc.bonus_earned || !uc.card_id) continue
      const pts = catalogById.get(uc.card_id)?.welcome_bonus_points ?? 0
      totalPoints += pts
      if (uc.bonus_earned_at && new Date(uc.bonus_earned_at) >= monthStart) {
        monthlyPoints += pts
      }
    }

    const portfolioValue = totalPoints * 0.02 // 2¢ per point — AUD monetary value of earned bonuses
    return { active, pending, total: cards.length, bonusReady, totalPoints, monthlyPoints, portfolioValue }
  }, [cards, catalogCards])

  // Cards chasing a bonus spend target — active, unearned, with a deadline
  const bonusChasingCards = useMemo(() => {
    const catalogById = new Map(catalogCards.map((c) => [c.id, c]))
    return cards
      .filter((c) => c.status === "active" && !c.bonus_earned && c.bonus_spend_deadline && c.card_id)
      .map((c) => ({
        ...c,
        spendTarget: catalogById.get(c.card_id!)?.bonus_spend_requirement ?? 0,
        bonusPoints: catalogById.get(c.card_id!)?.welcome_bonus_points ?? 0,
      }))
      .filter((c) => c.spendTarget > 0)
      .slice(0, 2)
  }, [cards, catalogCards])

  // Recently earned bonuses — for activity feed
  const recentEarned = useMemo(() => {
    const catalogById = new Map(catalogCards.map((c) => [c.id, c]))
    return cards
      .filter((c) => c.bonus_earned && c.bonus_earned_at && c.card_id)
      .sort((a, b) => new Date(b.bonus_earned_at!).getTime() - new Date(a.bonus_earned_at!).getTime())
      .slice(0, 4)
      .map((c) => ({
        ...c,
        bonusPoints: catalogById.get(c.card_id!)?.welcome_bonus_points ?? 0,
      }))
  }, [cards, catalogCards])

  const cancelAlerts = useMemo(() => {
    const now = new Date().getTime()
    return cards.filter((c) => {
      if (!c.cancellation_date) return false
      const daysLeft = (new Date(c.cancellation_date).getTime() - now) / 86_400_000
      return daysLeft >= 0 && daysLeft <= CANCEL_ALERT_DAYS
    })
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

  const displayName = email ? email.split("@")[0] : null

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Alert strip — cancellations within 30 days */}
        {cancelAlerts.length > 0 && (
          <div className="bg-surface-container-high/50 border-l-4 border-primary p-4 rounded-r-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm font-medium">
                <span className="font-semibold text-primary">{cancelAlerts[0].name}</span>{" "}
                cancels {cancelAlerts[0].cancellation_date}.{" "}
                <Link href={`/dashboard/cards/${cancelAlerts[0].id}`} className="text-primary cursor-pointer hover:underline">
                  Take action before the date.
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Hero metric + quick stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-slate-500 text-sm font-semibold uppercase tracking-widest">
                {displayName ? `Hey, ${displayName}` : "Total Valuation (AUD)"}
              </h2>
              {stats.portfolioValue > 0 ? (
                <div className="flex items-baseline gap-4">
                  <span className="text-[48px] md:text-[64px] font-extrabold font-headline text-on-surface tabular-nums tracking-tighter">
                    ${stats.portfolioValue.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">total portfolio value</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-4">
                  <span className="text-[48px] md:text-[64px] font-extrabold font-headline text-on-surface tabular-nums tracking-tighter">
                    {stats.active}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                    {stats.active === 1 ? "card" : "cards"} working for you
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Points Sum", value: stats.totalPoints >= 1000 ? `${Math.round(stats.totalPoints / 1000)}k` : stats.totalPoints.toString() },
                { label: "Monthly Earning", value: stats.monthlyPoints >= 1000 ? `${Math.round(stats.monthlyPoints / 1000)}k` : stats.monthlyPoints.toString() },
                { label: "Cards Active", value: stats.active.toString() },
                { label: "Bonus Ready", value: stats.bonusReady.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-container p-6 rounded-lg border border-white/5 space-y-2">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                  <div className="text-xl font-bold tabular-nums">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Hero Visual */}
          <div className="bg-gradient-to-br from-[#1b1f2c] to-[#0a0e1a] p-8 rounded-xl border border-white/5 relative overflow-hidden flex flex-col justify-end">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <h3 className="text-xl font-bold mb-2">Next Flight Opportunity</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {stats.totalPoints > 0
                ? `You have ${stats.totalPoints.toLocaleString()} points — potentially enough for a redemption.`
                : "Start earning points to unlock your next redemption opportunity."}
            </p>
            <button
              onClick={() => router.push("/flights")}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all border border-white/10 self-start"
            >
              Explore Deals
            </button>
          </div>
        </section>

        {/* ── Bonus tracker bento ── */}
        {bonusChasingCards.length > 0 && (
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Bonus Tracker
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {bonusChasingCards.map((card) => {
                const pct = card.spendTarget > 0
                  ? Math.min(100, Math.round(((card.current_spend ?? 0) / card.spendTarget) * 100))
                  : 0
                const daysLeft = card.bonus_spend_deadline
                  ? Math.max(0, Math.ceil((new Date(card.bonus_spend_deadline).getTime() - Date.now()) / 86400000))
                  : null
                return (
                  <div key={card.id} className="bg-surface-container p-8 rounded-xl border border-white/5 flex flex-col justify-between group hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-on-surface">{card.bank} {card.name}</p>
                        {daysLeft !== null && (
                          <p className="mt-0.5 text-[10px] text-on-surface-variant">{daysLeft}d remaining</p>
                        )}
                      </div>
                      {card.bonusPoints > 0 && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {(card.bonusPoints / 1000).toFixed(0)}k pts
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-[10px] text-on-surface-variant">
                        <span>${Math.round(card.current_spend ?? 0).toLocaleString()} spent</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-on-surface-variant">
                        of ${card.spendTarget.toLocaleString()} target
                      </p>
                    </div>
                  </div>
                )
              })}
              <button
                onClick={() => router.push("/spending")}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/20 p-8 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <CreditCard className="h-4 w-4" />
                Track new bonus
              </button>
            </div>
          </div>
        )}

        {/* ── Credit Portfolio ── */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Your Cards
              </p>
              <Link href="/cards">
                <Button size="sm" variant="ghost" className="rounded-full text-on-surface-variant hover:text-on-surface">
                  Browse catalog
                </Button>
              </Link>
            </div>

            {cards.length === 0 ? (
              <div className="bg-surface-container rounded-xl border border-white/5 flex flex-col items-start gap-3 p-8">
                <p className="font-semibold text-on-surface">No cards tracked yet</p>
                <p className="text-sm text-on-surface-variant">
                  Add your current cards and churn targets to see reminders and eligibility.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/cards")}
                  className="rounded-full font-semibold text-on-primary"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Browse cards
                </Button>
              </div>
            ) : (
              <>
                {/* Stacked card visual for first 3 */}
                {cards.filter(c => c.status === "active").length >= 2 ? (
                  <div className="relative mb-6 overflow-x-hidden" style={{ height: 220 }}>
                    {cards
                      .filter(c => c.status === "active")
                      .slice(0, 3)
                      .reverse()
                      .map((card, revIdx, arr) => {
                        const idx = arr.length - 1 - revIdx
                        const stackStyles = [
                          "absolute top-16 left-0 w-full md:w-[450px] aspect-[1.58/1] rounded-xl bg-gradient-to-br from-[#1d1e22] to-[#343a40] shadow-2xl border border-white/10 p-8 transform -rotate-3 hover:-translate-y-[10px] transition-transform z-10",
                          "absolute top-8 left-4 w-full md:w-[450px] aspect-[1.58/1] rounded-xl bg-gradient-to-br from-[#4b3c1b] to-[#1c180e] shadow-2xl border border-white/10 p-8 transform rotate-1 z-20",
                          "absolute top-0 left-8 w-full md:w-[450px] aspect-[1.58/1] rounded-xl bg-gradient-to-br from-[#10b981] to-[#064e3b] shadow-2xl border border-white/20 p-8 transform -rotate-1 z-30",
                        ]
                        return (
                          <div
                            key={card.id}
                            className={`${stackStyles[idx] ?? stackStyles[0]} cursor-pointer`}
                            onClick={() => handleEditCard(card)}
                          >
                            <WalletCard card={card} showProgress />
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {cards.map((card) => (
                      <WalletCard key={card.id} card={card} showProgress onClick={() => handleEditCard(card)} />
                    ))}
                  </div>
                )}
                {/* All cards list link when stack shown */}
                {cards.filter(c => c.status === "active").length >= 2 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleEditCard(card)}
                        className="rounded-full border border-white/5 bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high"
                      >
                        {card.bank} {card.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Points Activity */}
          {recentEarned.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Recent Bonuses
              </p>
              <div className="bg-surface-container rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                {recentEarned.map((card) => {
                  const earnedDate = card.bonus_earned_at
                    ? new Date(card.bonus_earned_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                    : null
                  return (
                    <div key={card.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{card.bank} {card.name}</p>
                          {earnedDate && <p className="text-xs text-slate-500">Earned {earnedDate}</p>}
                        </div>
                      </div>
                      {card.bonusPoints > 0 && (
                        <span className="text-sm font-bold text-primary">+{card.bonusPoints.toLocaleString()} pts</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Top recommendation */}
        {topRecommendation && (
          <div>
            <p className="mb-2 text-sm font-medium text-on-surface-variant">Top opportunity</p>
            <RecommendationCard recommendation={topRecommendation} variant="hero" />
          </div>
        )}

        {/* Projection preview */}
        {projection && (
          <ProGate feature="goal projections & timeline">
            <Card className="border-primary/20 bg-surface-container shadow-sm">
              <CardContent className="pt-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-on-surface-variant">Goal projection</p>
                    </div>
                    <p className="text-xl font-semibold text-on-surface">
                      {projection.goal.label} in{" "}
                      <span className="text-primary">{projection.path.timeToGoal} months</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span>{projection.path.totalPoints.toLocaleString()} pts</span>
                      <span>·</span>
                      <span>${projection.path.totalCost} fees</span>
                      <span>·</span>
                      <span className="text-primary">
                        ${projection.path.netValue.toFixed(0)} net value
                      </span>
                    </div>
                  </div>
                  <Link href="/projections">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-surface-container-highest text-on-surface hover:bg-surface-container-highest"
                    >
                      View all goals
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </ProGate>
        )}

        {/* Daily insights */}
        {userId && (
          <ProGate feature="daily insights & deals">
            <div>
              <p className="mb-2 text-sm font-medium text-on-surface-variant">Today&apos;s activity</p>
              <DailyInsights userId={userId} />
            </div>
          </ProGate>
        )}
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
