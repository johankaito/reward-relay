"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, CreditCard, TrendingUp, Star, DollarSign, Zap } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { EditCardModal } from "@/components/cards/EditCardModal"
import { ProgressBar } from "@/components/ui/progress-bar"
import { supabase } from "@/lib/supabase/client"
import { getBankGradient } from "@/lib/bank-gradients"
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let yearlyFees = 0
    for (const uc of cards) {
      if (uc.annual_fee) yearlyFees += uc.annual_fee
      if (!uc.bonus_earned || !uc.card_id) continue
      const pts = catalogById.get(uc.card_id)?.welcome_bonus_points ?? 0
      totalPoints += pts
      if (uc.bonus_earned_at && new Date(uc.bonus_earned_at) >= monthStart) {
        monthlyPoints += pts
      }
    }

    const portfolioValue = totalPoints * 0.02
    const valueSavedYTD = portfolioValue - yearlyFees
    return { active, pending, total: cards.length, bonusReady, totalPoints, monthlyPoints, portfolioValue, yearlyFees, valueSavedYTD }
  }, [cards, catalogCards])

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
  }, [cards, catalogCards])

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

  // Cards that are behind bonus spend pace
  const behindPaceCards = useMemo(() => {
    return bonusChasingCards.filter((c) => {
      if (!c.bonus_spend_deadline || !c.application_date) return false
      const total = new Date(c.bonus_spend_deadline).getTime() - new Date(c.application_date).getTime()
      const elapsed = Date.now() - new Date(c.application_date).getTime()
      const expectedPct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0
      const actualPct = c.spendTarget > 0 ? ((c.current_spend ?? 0) / c.spendTarget) * 100 : 0
      return actualPct < expectedPct - 10
    })
  }, [bonusChasingCards])

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
      {/* ── Header breadcrumb (desktop) ── */}
      <div className="hidden md:flex items-center gap-2 text-on-surface-variant font-medium text-sm mb-2">
        <span>Dashboard</span>
        <span className="text-on-surface-variant">›</span>
        <span className="text-on-surface">Overview</span>
      </div>

      <div className="space-y-10 pb-8">
        {/* ── Alert Banner ── */}
        {(cancelAlerts.length > 0 || behindPaceCards.length > 0) && (
          <div
            className="flex items-center justify-between gap-4 rounded-r-xl border-l-4 px-4 py-3"
            style={{ borderColor: "var(--primary)", background: "rgba(78,222,163,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm font-medium text-on-surface">
                {cancelAlerts.length > 0 ? (
                  <>
                    <span className="font-semibold text-primary">{cancelAlerts[0].name}</span>
                    {" "}cancels {cancelAlerts[0].cancellation_date} — take action before the date.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-primary">{behindPaceCards.length} card{behindPaceCards.length !== 1 ? "s" : ""}</span>
                    {" "}need attention — behind bonus spend pace.{" "}
                    <Link href="/spending" className="text-primary hover:underline">Check spend now.</Link>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Hero Metric + Stats Row ── */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest">
              Total Valuation (AUD)
            </h2>
            <div className="flex items-baseline gap-4 flex-wrap">
              <span
                className="font-headline font-extrabold tabular-nums tracking-tighter text-on-surface"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
              >
                ${stats.portfolioValue.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {stats.totalPoints > 0 && (
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stats.totalPoints.toLocaleString()} pts
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container p-6 rounded-lg border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Points Sum</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-on-surface">
                {stats.totalPoints >= 1000 ? `${(stats.totalPoints / 1000).toFixed(0)}k` : stats.totalPoints.toLocaleString()}
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-lg border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Active Cards</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-on-surface">{stats.active}</div>
            </div>
            <div className="bg-surface-container p-6 rounded-lg border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-on-surface-variant" />
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Yearly Fees</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-on-surface">
                ${stats.yearlyFees > 0 ? stats.yearlyFees.toLocaleString() : "0"}
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-lg border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Saved (YTD)</span>
              </div>
              <div className="text-xl font-bold tabular-nums text-primary">
                ${Math.max(0, stats.valueSavedYTD).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Active Bonus Trackers ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline text-on-surface">Active Bonus Trackers</h2>
            <Link
              href="/spending"
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
            >
              View All Cards →
            </Link>
          </div>

          {bonusChasingCards.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Empty state tracker slot */}
              <div className="border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => router.push("/cards")}
              >
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-5 w-5 text-on-surface-variant" />
                </div>
                <span className="text-sm font-bold text-on-surface-variant">No active bonus trackers</span>
                <span className="text-xs text-on-surface-variant mt-1">Add a card with a spend target to track</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bonusChasingCards.map((card) => {
                const pct = card.spendTarget > 0
                  ? Math.min(100, Math.round(((card.current_spend ?? 0) / card.spendTarget) * 100))
                  : 0
                const daysLeft = card.bonus_spend_deadline
                  ? Math.max(0, Math.ceil((new Date(card.bonus_spend_deadline).getTime() - Date.now()) / 86400000))
                  : null
                const gradient = getBankGradient(card.bank ?? "")
                const bankInitials = (card.bank ?? "?").slice(0, 4).toUpperCase()

                return (
                  <div
                    key={card.id}
                    className="bg-surface-container p-8 rounded-xl border border-white/5 flex flex-col justify-between group hover:border-primary/30 transition-all duration-300 cursor-pointer"
                    onClick={() => handleEditCard(card)}
                  >
                    <div className="flex justify-between items-start mb-12">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                          {card.bank} {card.name}
                        </span>
                        <h4 className="text-lg font-bold text-on-surface">
                          {card.bonusPoints > 0
                            ? `${(card.bonusPoints / 1000).toFixed(0)}k Bonus Points`
                            : "Bonus Tracker"}
                        </h4>
                      </div>
                      <div
                        className="w-12 h-8 rounded-md flex items-center justify-center border border-white/10"
                        style={{ background: gradient }}
                      >
                        <span className="text-[9px] font-bold text-white tracking-widest">{bankInitials}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-on-surface-variant">Spend Progress</span>
                        <span className="text-on-surface tabular-nums">
                          ${Math.round(card.current_spend ?? 0).toLocaleString()} / ${card.spendTarget.toLocaleString()}
                        </span>
                      </div>
                      <ProgressBar value={pct} height="md" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                          {daysLeft !== null ? `${daysLeft}d remaining` : card.bonus_spend_deadline ?? ""}
                        </span>
                        <span className="text-primary text-xs font-bold">
                          {pct >= 95 ? "Almost There!" : `${pct}% Done`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add new tracker CTA */}
              <div
                className="border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => router.push("/cards")}
              >
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-5 w-5 text-on-surface-variant" />
                </div>
                <span className="text-sm font-bold text-on-surface-variant">Track New Bonus</span>
              </div>
            </div>
          )}
        </section>

        {/* ── Credit Portfolio (wallet card stack) ── */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-headline text-on-surface">Credit Portfolio</h2>

            {cards.length === 0 ? (
              <div className="flex aspect-[2/1] w-full items-center justify-center rounded-xl border border-dashed border-primary/20 p-6">
                <div className="text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-on-surface-variant mb-3" />
                  <p className="text-on-surface-variant font-semibold">No cards tracked yet</p>
                  <Link href="/cards" className="mt-2 inline-block text-primary text-sm font-bold hover:underline">
                    Add your first card →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="relative w-full" style={{ height: Math.min(cards.filter(c => c.status === "active").length, 3) * 56 + 140 }}>
                {cards
                  .filter((c) => c.status === "active")
                  .slice(0, 3)
                  .reverse()
                  .map((card, revIdx, arr) => {
                    const idx = arr.length - 1 - revIdx
                    const rotations = [-3, 1, -1]
                    const tops = [idx === 0 ? 16 : idx === 1 ? 8 : 0]
                    const gradient = getBankGradient(card.bank ?? "")
                    const isLight = card.bank === "CommBank"
                    const textColor = isLight ? "black" : "white"

                    return (
                      <div
                        key={card.id}
                        className="absolute inset-x-0 cursor-pointer transition-transform duration-300 hover:-translate-y-3"
                        style={{
                          top: (idx * 8),
                          zIndex: idx + 1,
                          transform: `rotate(${rotations[idx] ?? 0}deg)`,
                        }}
                        onClick={() => handleEditCard(card)}
                      >
                        <div
                          className="w-full md:w-[420px] rounded-xl p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                          style={{ background: gradient, aspectRatio: "1.58/1" }}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-base font-bold" style={{ color: textColor }}>{card.bank}</span>
                            <span className="text-white/40 text-sm">◎</span>
                          </div>
                          <div className="absolute bottom-8 left-8 right-8">
                            <div className="text-lg tracking-[0.2em] font-medium mb-2" style={{ color: `${textColor}`, opacity: 0.7 }}>
                              •••• •••• •••• ––––
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs uppercase font-bold tracking-widest" style={{ color: textColor, opacity: 0.5 }}>
                                {card.bank} {card.name}
                              </div>
                              <div
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(0,0,0,0.2)", color: textColor }}
                              >
                                {card.status?.toUpperCase() ?? "ACTIVE"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Recent Points section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline text-on-surface">Recent Points</h2>

            {recentEarned.length === 0 ? (
              <div className="bg-surface-container rounded-xl border border-white/5 p-6 text-center">
                <p className="text-on-surface-variant text-sm">Bonuses you earn will appear here</p>
              </div>
            ) : (
              <div className="bg-surface-container rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
                {recentEarned.map((card) => {
                  const earnedDate = card.bonus_earned_at
                    ? new Date(card.bonus_earned_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
                    : null
                  const gradient = getBankGradient(card.bank ?? "")
                  return (
                    <div
                      key={card.id}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: gradient }}
                        >
                          {(card.bank ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">
                            {card.bank} {card.name}
                          </span>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold">Welcome Bonus</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary tabular-nums">
                          {card.bonusPoints > 0 ? `+${card.bonusPoints.toLocaleString()}` : "Earned"}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">{earnedDate ?? ""}</div>
                      </div>
                    </div>
                  )
                })}
                <div className="p-4 text-center">
                  <Link href="/spending" className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                    View All Activity
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
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
