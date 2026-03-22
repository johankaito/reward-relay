"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, Calendar, CreditCard, TrendingUp, Zap } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { ProGate } from "@/components/ui/ProGate"
import { WalletCard } from "@/components/ui/WalletCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { ActivityItem } from "@/components/ui/activity-item"
import { ProgressBar } from "@/components/ui/progress-bar"
import { EditCardModal } from "@/components/cards/EditCardModal"
import { RecommendationCard } from "@/components/dashboard/RecommendationCard"
import { DailyInsights } from "@/components/dashboard/DailyInsights"
import { supabase } from "@/lib/supabase/client"
import { getBankGradient } from "@/lib/bank-gradients"
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

  // Next upcoming date (cancellation or spend deadline) for mobile bento
  const nextDeadline = useMemo(() => {
    const all = cards
      .filter((c) => c.cancellation_date || c.bonus_spend_deadline)
      .map((c) => {
        const dates = [c.cancellation_date, c.bonus_spend_deadline].filter(Boolean) as string[]
        return Math.min(...dates.map((d) => new Date(d).getTime()))
      })
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b)
    return all.length > 0 ? new Date(all[0]) : null
  }, [cards])

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
      {/* ─── Mobile Layout (Stitch design) ─── */}
      <div className="md:hidden space-y-8 pb-4">
        {/* Alert strip */}
        {cancelAlerts.length > 0 && (
          <div
            className="flex items-center gap-3 rounded-r-xl border-l-4 px-4 py-3"
            style={{ borderColor: "rgba(78,222,163,0.6)", background: "rgba(78,222,163,0.05)" }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-medium text-on-surface">
              <span className="font-semibold text-primary">{cancelAlerts[0].name}</span>{" "}
              cancels {cancelAlerts[0].cancellation_date}
            </p>
          </div>
        )}

        {/* Hero Metric */}
        <section className="flex flex-col gap-2">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-semibold">
            Total Rewards Value
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-[40px] font-extrabold font-headline leading-none tracking-tighter text-on-surface">
              <span className="text-primary">$</span>
              {stats.portfolioValue.toLocaleString("en-AU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
            <span className="text-primary font-bold text-sm">AUD</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {cards.length > 0 && (
              <div className="flex -space-x-2">
                {cards.slice(0, 3).map((card) => (
                  <div
                    key={card.id}
                    className="w-6 h-6 rounded-full bg-surface-container-high border border-background flex items-center justify-center text-[10px] font-bold text-on-surface"
                  >
                    {(card.bank ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
            <p className="text-on-surface-variant text-xs font-medium">
              {stats.totalPoints > 0
                ? `${stats.totalPoints.toLocaleString()} pts total`
                : `${stats.total} card${stats.total !== 1 ? "s" : ""} tracked`}
            </p>
          </div>
        </section>

        {/* Wallet Swipeable Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-lg text-on-surface">Active Cards</h3>
            <Link href="/cards" className="text-primary text-sm font-semibold">
              Manage
            </Link>
          </div>
          {cards.filter((c) => c.status === "active").length === 0 ? (
            <div className="flex aspect-[1.58/1] w-full items-center justify-center rounded-xl border border-dashed border-primary/20 p-6">
              <div className="text-center">
                <CreditCard className="mx-auto h-8 w-8 text-on-surface-variant mb-2" />
                <p className="text-on-surface-variant text-sm">No active cards</p>
                <Link href="/cards" className="mt-2 inline-block text-primary text-xs font-semibold">
                  Add a card →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex overflow-x-auto scrollbar-hide gap-4 -mx-4 px-4 snap-x snap-mandatory pb-2">
              {cards
                .filter((c) => c.status === "active")
                .slice(0, 5)
                .map((card) => {
                  const gradient = getBankGradient(card.bank ?? "")
                  const isLight = card.bank === "CommBank"
                  const textColor = isLight ? "text-black/80" : "text-white"
                  const textMuted = isLight ? "text-black/50" : "text-white/60"
                  const currentSpend = card.current_spend ?? 0

                  return (
                    <button
                      key={card.id}
                      className="min-w-[300px] snap-center shrink-0 aspect-[1.58/1] rounded-xl p-6 relative overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] flex flex-col justify-between text-left"
                      style={{ background: gradient }}
                      onClick={() => handleEditCard(card)}
                    >
                      <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />
                      <div className={`relative z-10 flex items-start justify-between ${textColor}`}>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                            {card.bank}
                          </p>
                          <p className="text-xs font-medium opacity-60 mt-0.5">{card.name}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-tighter">
                          {card.bonus_earned ? "Earned" : "Active"}
                        </span>
                      </div>
                      <div className="relative z-10">
                        <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${textMuted}`}>
                          {card.bonus_earned ? "Bonus Earned" : "Spend Progress"}
                        </p>
                        {!card.bonus_earned && (
                          <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-primary rounded-full w-3/4" />
                          </div>
                        )}
                        <div className={`flex justify-between ${textColor}`}>
                          <span className="text-xs font-bold">
                            {card.bank} {card.name}
                          </span>
                          {currentSpend > 0 && (
                            <span className="text-xs font-bold">
                              ${Math.round(currentSpend).toLocaleString()} spent
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          )}
        </section>

        {/* Insights Bento */}
        <section className="flex flex-col gap-4">
          <h3 className="font-headline font-bold text-lg text-on-surface">Daily Insights</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 p-5 rounded-xl bg-surface-container flex flex-col gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
                  Bonus Ready
                </p>
                <p className="text-xl font-headline font-bold text-on-surface">
                  {stats.bonusReady}
                  <span className="text-xs ml-1 font-medium text-on-surface-variant">
                    {stats.bonusReady === 1 ? "card" : "cards"}
                  </span>
                </p>
              </div>
            </div>
            <div className="col-span-1 p-5 rounded-xl bg-surface-container flex flex-col gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
                  Due Soon
                </p>
                <p className="text-xl font-headline font-bold text-on-surface">
                  {nextDeadline
                    ? nextDeadline.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                    : "—"}
                </p>
              </div>
            </div>
            {/* Monthly ring tile — full width */}
            <div className="col-span-2 p-5 rounded-xl bg-surface-container flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
                  Monthly Earned
                </p>
                <p className="text-lg font-headline font-bold text-on-surface">
                  {stats.monthlyPoints.toLocaleString()} pts{" "}
                  {stats.totalPoints > 0 && (
                    <span className="text-primary text-xs ml-1">
                      {Math.round((stats.monthlyPoints / Math.max(stats.totalPoints, 1)) * 100)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 shrink-0 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                  <circle
                    className="text-surface-container-highest"
                    cx="24" cy="24" r="20"
                    fill="transparent" stroke="currentColor" strokeWidth="4"
                  />
                  <circle
                    className="text-primary"
                    cx="24" cy="24" r="20"
                    fill="transparent" stroke="currentColor" strokeWidth="4"
                    strokeDasharray="125.6"
                    strokeDashoffset={
                      125.6 * (1 - Math.min(1, stats.totalPoints > 0 ? stats.monthlyPoints / stats.totalPoints : 0))
                    }
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Bonus Tracker */}
        {bonusChasingCards.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">Bonus Tracker</h3>
              <Link href="/spending" className="text-primary text-sm font-semibold">
                Track all
              </Link>
            </div>
            <div className="space-y-3">
              {bonusChasingCards.map((card) => {
                const pct =
                  card.spendTarget > 0
                    ? Math.min(100, Math.round(((card.current_spend ?? 0) / card.spendTarget) * 100))
                    : 0
                const daysLeft = card.bonus_spend_deadline
                  ? Math.max(0, Math.ceil((new Date(card.bonus_spend_deadline).getTime() - Date.now()) / 86400000))
                  : null
                return (
                  <div key={card.id} className="bg-surface-container rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {card.bank} {card.name}
                        </p>
                        {daysLeft !== null && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{daysLeft}d remaining</p>
                        )}
                      </div>
                      {card.bonusPoints > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {Math.round(card.bonusPoints / 1000)}k pts
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                      <span>${Math.round(card.current_spend ?? 0).toLocaleString()} spent</span>
                      <span>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                    <p className="mt-1 text-[10px] text-on-surface-variant">
                      of ${card.spendTarget.toLocaleString()} target
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent Earns */}
        {recentEarned.length > 0 && (
          <section className="flex flex-col gap-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">Recent Earns</h3>
            <div className="flex flex-col divide-y divide-white/5 rounded-xl bg-surface-container overflow-hidden">
              {recentEarned.map((card) => {
                const earnedDate = card.bonus_earned_at
                  ? new Date(card.bonus_earned_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                    })
                  : null
                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 px-4 py-4 active:bg-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">
                        {card.bank} {card.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant">Welcome Bonus</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm">
                        +{card.bonusPoints.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">{earnedDate ?? ""}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Top recommendation */}
        {topRecommendation && (
          <section>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Top Opportunity
            </p>
            <RecommendationCard recommendation={topRecommendation} variant="hero" />
          </section>
        )}
      </div>

      {/* ─── Desktop Layout ─── */}
      <div className="hidden md:block">
        <div className="space-y-6">
          {/* Alert strip — cancellations within 30 days */}
          {cancelAlerts.length > 0 && (
            <div
              className="flex items-center justify-between gap-4 rounded-r-xl border-l-4 px-4 py-3"
              style={{
                borderColor: "rgba(78,222,163,0.6)",
                background: "rgba(78,222,163,0.05)",
              }}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm font-medium text-on-surface">
                  <span className="font-semibold text-primary">{cancelAlerts[0].name}</span>{" "}
                  cancels {cancelAlerts[0].cancellation_date} — take action before the date.
                </p>
              </div>
              <Link href={`/dashboard/cards/${cancelAlerts[0].id}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
                >
                  Take action
                </Button>
              </Link>
            </div>
          )}

          {/* Hero metric */}
          <div className="rounded-2xl bg-surface-container p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {displayName ? `Hey, ${displayName}` : "Dashboard"}
            </p>
            {stats.portfolioValue > 0 ? (
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-headline text-[48px] font-extrabold tabular-nums tracking-tighter text-primary md:text-6xl">
                  ${stats.portfolioValue.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-base text-on-surface-variant">total portfolio value</span>
              </div>
            ) : (
              <div className="mt-3 flex items-baseline gap-4">
                <span className="font-headline text-[48px] font-extrabold tabular-nums tracking-tighter text-primary md:text-6xl">
                  {stats.active}
                </span>
                <span className="text-base text-on-surface-variant">
                  {stats.active === 1 ? "card" : "cards"} working for you
                </span>
              </div>
            )}
            <Button
              size="sm"
              className="mt-6 rounded-full font-semibold text-on-primary shadow-sm"
              style={{ background: "var(--gradient-cta)" }}
              onClick={() => router.push("/cards")}
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Add card
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Points", value: stats.totalPoints >= 1000 ? `${Math.round(stats.totalPoints / 1000)}k` : stats.totalPoints.toString() },
              { label: "Monthly Earning", value: stats.monthlyPoints >= 1000 ? `${Math.round(stats.monthlyPoints / 1000)}k` : stats.monthlyPoints.toString() },
              { label: "Cards Active", value: stats.active.toString() },
              { label: "Bonus Ready", value: stats.bonusReady.toString() },
            ].map(({ label, value }) => (
              <StatCard key={label} label={label} value={value} accent />
            ))}
          </div>

          {/* Bonus tracker bento */}
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
                    <div key={card.id} className="glass-panel rounded-2xl p-5 transition-colors duration-200 hover:border-primary/30">
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
                        <ProgressBar value={pct} />
                        <p className="mt-1 text-[10px] text-on-surface-variant">
                          of ${card.spendTarget.toLocaleString()} target
                        </p>
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => router.push("/spending")}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/20 p-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  <CreditCard className="h-4 w-4" />
                  Track new bonus
                </button>
              </div>
            </div>
          )}

          {/* 3D wallet card stack */}
          <div>
            <div className="mb-4 flex items-center justify-between">
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
              <div className="glass-panel flex flex-col items-start gap-3 rounded-2xl p-6">
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
                {cards.filter(c => c.status === "active").length >= 2 ? (
                  <div className="relative mb-6 overflow-x-hidden" style={{ height: 180 }}>
                    {cards
                      .filter(c => c.status === "active")
                      .slice(0, 3)
                      .reverse()
                      .map((card, revIdx, arr) => {
                        const idx = arr.length - 1 - revIdx
                        const rotations = ["rotate-3", "rotate-1", "-rotate-1"]
                        const tops = [8, 4, 0]
                        return (
                          <div
                            key={card.id}
                            className={`absolute inset-x-0 ${rotations[idx] ?? ""} cursor-pointer transition-transform duration-300 hover:-translate-y-2`}
                            style={{ top: tops[idx] ?? 0, zIndex: idx + 1 }}
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
                {cards.filter(c => c.status === "active").length >= 2 && (
                  <div className="flex flex-wrap gap-2">
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

          {/* Recent points activity feed */}
          {recentEarned.length > 0 && (
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Recent Bonuses
              </p>
              <div className="glass-panel divide-y divide-white/5 rounded-2xl">
                {recentEarned.map((card) => {
                  const earnedDate = card.bonus_earned_at
                    ? new Date(card.bonus_earned_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                    : null
                  return (
                    <ActivityItem
                      key={card.id}
                      primary={`${card.bank} ${card.name}`}
                      secondary={earnedDate ? `Earned ${earnedDate}` : undefined}
                      value={card.bonusPoints > 0 ? `+${card.bonusPoints.toLocaleString()} pts` : undefined}
                    />
                  )
                })}
              </div>
            </div>
          )}

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
