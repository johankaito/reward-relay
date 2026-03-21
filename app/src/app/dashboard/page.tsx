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
    return { active, pending, total: cards.length }
  }, [cards])

  const cancelAlerts = useMemo(() => {
    const now = Date.now()
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
          <div className="h-14 animate-pulse rounded-xl bg-[#1b1f2c]" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1b1f2c]" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl bg-[#1b1f2c]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Alert strip — cancellations within 30 days */}
        {cancelAlerts.length > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#ffb4ab]/20 bg-[#93000a]/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#ffb4ab]" />
              <p className="text-sm font-medium text-[#dfe2f3]">
                <span className="font-semibold text-[#ffb4ab]">{cancelAlerts[0].name}</span>{" "}
                cancels {cancelAlerts[0].cancellation_date} — take action before the date.
              </p>
            </div>
            <Link href={`/dashboard/cards/${cancelAlerts[0].id}`}>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 rounded-full text-[#ffb4ab] hover:bg-[#ffb4ab]/10 hover:text-[#ffb4ab]"
              >
                Take action
              </Button>
            </Link>
          </div>
        )}

        {/* Hero metric */}
        <div className="rounded-2xl bg-[#1b1f2c] p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {displayName ? `Hey, ${displayName}` : "Dashboard"}
          </p>
          <div className="mt-2 flex items-baseline gap-4">
            <span className="font-headline text-5xl font-bold tabular-nums tracking-tighter text-[#4edea3]">
              {stats.active}
            </span>
            <span className="text-sm font-medium text-slate-400">active cards tracked</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {stats.total} total · {stats.pending} pending
          </p>
          <Button
            size="sm"
            className="mt-5 rounded-full font-semibold text-[#003824] shadow-sm"
            style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)" }}
            onClick={() => router.push("/cards")}
          >
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Add card
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active cards", value: stats.active },
            { label: "Pending", value: stats.pending },
            { label: "Total tracked", value: stats.total },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-[#1b1f2c] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#dfe2f3]">{value}</p>
            </div>
          ))}
        </div>

        {/* Your cards as WalletCards */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#dfe2f3]">Your cards</h2>
            <Link href="/cards">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-slate-400 hover:text-[#dfe2f3]"
              >
                Browse catalog
              </Button>
            </Link>
          </div>

          {cards.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#313442] bg-[#1b1f2c] p-6">
              <p className="font-medium text-[#dfe2f3]">No cards tracked yet</p>
              <p className="text-sm text-slate-400">
                Add your current cards and churn targets to see reminders and eligibility.
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/cards")}
                className="rounded-full font-semibold text-[#003824]"
                style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)" }}
              >
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Browse cards
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {cards.map((card) => (
                <WalletCard
                  key={card.id}
                  card={card}
                  showProgress
                  onClick={() => handleEditCard(card)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top recommendation */}
        {topRecommendation && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-400">Top opportunity</p>
            <RecommendationCard recommendation={topRecommendation} variant="hero" />
          </div>
        )}

        {/* Projection preview */}
        {projection && (
          <ProGate feature="goal projections & timeline">
            <Card className="border-[#4edea3]/20 bg-[#1b1f2c] shadow-sm">
              <CardContent className="pt-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#4edea3]" />
                      <p className="text-sm font-medium text-slate-400">Goal projection</p>
                    </div>
                    <p className="text-xl font-semibold text-[#dfe2f3]">
                      {projection.goal.label} in{" "}
                      <span className="text-[#4edea3]">{projection.path.timeToGoal} months</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{projection.path.totalPoints.toLocaleString()} pts</span>
                      <span>·</span>
                      <span>${projection.path.totalCost} fees</span>
                      <span>·</span>
                      <span className="text-[#4edea3]">
                        ${projection.path.netValue.toFixed(0)} net value
                      </span>
                    </div>
                  </div>
                  <Link href="/projections">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#313442] text-[#dfe2f3] hover:bg-[#313442]"
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
              <p className="mb-2 text-sm font-medium text-slate-400">Today&apos;s activity</p>
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
