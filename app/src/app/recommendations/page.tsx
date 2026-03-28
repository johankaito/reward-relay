"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"
import { getRecommendations } from "@/lib/recommendations"
import { useCatalog } from "@/contexts/CatalogContext"
import type { Database } from "@/types/database.types"
import type { Recommendation } from "@/lib/recommendations"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

type FilterType = "all" | "eligible" | "coming_soon"
type SortType = "score" | "bonus" | "fee" | "bank"

const FILTER_CHIPS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "eligible", label: "Eligible Now" },
  { value: "coming_soon", label: "Coming Soon" },
]

const SORT_CHIPS: { value: SortType; label: string }[] = [
  { value: "score", label: "Best Match" },
  { value: "bonus", label: "Highest Bonus" },
  { value: "fee", label: "Lowest Fee" },
  { value: "bank", label: "By Bank" },
]

const CARD_GRADIENTS = [
  "from-surface-container to-background",
  "from-surface-container-high to-surface-container",
  "from-background to-surface-container-low",
  "from-surface-container-low to-background",
]

function getBadgeLabel(index: number, rec: Recommendation): string {
  if (index === 0) return "Best Match"
  if (rec.eligibleNow) return "Top Value"
  if ((rec.card.annual_fee ?? 0) === 0) return "Zero Fee"
  return "Recommended"
}

function formatBonus(rec: Recommendation): string {
  const pts = rec.card.welcome_bonus_points
  if (!pts) return "—"
  if (pts >= 1000) return `${pts.toLocaleString()} pts`
  return `${pts} pts`
}

function formatEligibility(rec: Recommendation): { label: string; color: string } {
  if (rec.eligibleNow) return { label: "Eligible", color: "text-primary" }
  if (rec.eligibleAt) {
    const days = Math.max(0, Math.ceil((rec.eligibleAt.getTime() - Date.now()) / 86400000))
    if (days <= 90) return { label: `${days}d`, color: "text-secondary" }
  }
  return { label: "Coming Soon", color: "text-on-surface-variant" }
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const [cards, setCards] = useState<UserCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>("all")
  const [sort, setSort] = useState<SortType>("score")

  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/")
        return
      }

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
    void loadData()
  }, [router])

  const allRecommendations = useMemo(() => {
    if (cards.length === 0 || catalogCards.length === 0) return []
    return getRecommendations(cards, catalogCards, { limit: 50 })
  }, [cards, catalogCards])

  const filteredRecommendations = useMemo(() => {
    let filtered = allRecommendations

    if (filter === "eligible") {
      filtered = filtered.filter((r) => r.eligibleNow)
    } else if (filter === "coming_soon") {
      filtered = filtered.filter((r) => !r.eligibleNow)
    }

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
      default:
        break
    }

    return sorted
  }, [allRecommendations, filter, sort])

  const stats = useMemo(() => {
    const eligible = allRecommendations.filter((r) => r.eligibleNow).length
    const comingSoon = allRecommendations.filter((r) => !r.eligibleNow).length
    return { total: allRecommendations.length, eligible, comingSoon }
  }, [allRecommendations])

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 space-y-6">
          <div className="h-16 animate-pulse rounded-2xl bg-surface-container" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-16 space-y-10">

        {/* ── Hero ── */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
              Cards Matched for You
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
              Based on your spending profile and churning history, these assets maximise your velocity and yield.
            </p>
          </div>

          {/* Sort chips */}
          <div className="flex flex-wrap gap-2 pb-2">
            {SORT_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => setSort(chip.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  sort === chip.value
                    ? "bg-surface-container-highest text-primary border border-primary/20"
                    : "bg-surface-container text-on-surface-variant border border-white/5 hover:text-on-surface"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Filter chips ── */}
        <div className="flex flex-wrap gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilter(chip.value)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 whitespace-nowrap ${
                filter === chip.value
                  ? "bg-primary-container text-on-primary font-bold"
                  : "bg-surface-container text-on-surface-variant border border-white/5 hover:bg-surface-container-high"
              }`}
            >
              {chip.label}
              {chip.value === "eligible" && stats.eligible > 0 && (
                <span className="ml-2 text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5">
                  {stats.eligible}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Card grid ── */}
        {filteredRecommendations.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-2xl">
            <p className="font-headline text-xl font-bold text-on-surface mb-2">No cards found</p>
            <p className="text-on-surface-variant text-sm">
              {filter === "eligible"
                ? "No cards are currently eligible. Check back later!"
                : filter === "coming_soon"
                ? "No upcoming cards at this time."
                : "Add cards to your wallet to get personalised recommendations."}
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecommendations.map((rec, index) => {
              const isBestMatch = index === 0 && filter === "all"
              const badgeLabel = getBadgeLabel(index, rec)
              const bonus = formatBonus(rec)
              const elig = formatEligibility(rec)
              const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]

              return (
                <div key={rec.card.id} className={`relative group ${isBestMatch ? "" : ""}`}>
                  {/* Glow for best match */}
                  {isBestMatch && (
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-primary-container rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
                  )}

                  <div
                    className={`relative bg-surface-container rounded-2xl p-6 flex flex-col h-full border transition-all ${
                      isBestMatch
                        ? "border-primary/20 shadow-lg"
                        : "border-white/5 hover:border-white/10 hover:bg-surface-container-high"
                    }`}
                  >
                    {/* Badge row */}
                    <div className="flex justify-between items-start mb-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          isBestMatch
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-surface-container-highest text-on-surface-variant border-white/5"
                        }`}
                      >
                        {badgeLabel}
                      </span>
                      {isBestMatch && (
                        <span className="text-xs font-medium uppercase tracking-tighter text-on-surface-variant">
                          Gold Tier
                        </span>
                      )}
                    </div>

                    {/* Card visual */}
                    <div
                      className={`aspect-[1.58/1] w-full mb-6 rounded-xl overflow-hidden bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between relative shadow-xl transition-all duration-300 ${!isBestMatch ? "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100" : ""}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="w-8 h-8 bg-primary/20 rounded-full border border-primary/30 flex items-center justify-center">
                          <span className="text-primary text-xs font-bold">
                            {rec.card.bank?.charAt(0)?.toUpperCase() ?? "R"}
                          </span>
                        </div>
                        {isBestMatch && (
                          <div className="w-8 h-1 bg-primary rounded-full" />
                        )}
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] text-white/60 tracking-widest uppercase mb-1">
                          {rec.card.points_currency ?? rec.card.bank ?? "Rewards"}
                        </p>
                        <p className="text-white/80 font-bold tracking-tighter text-sm">
                          {rec.card.bank?.toUpperCase() ?? "CARD"}
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full -mr-8 -mt-8" />
                    </div>

                    {/* Card info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-headline text-on-surface mb-1">{rec.card.name}</h3>
                      <p className="text-on-surface-variant text-sm mb-4">{rec.card.bank}</p>

                      {/* Bonus box */}
                      <div className="bg-surface-container-low rounded-xl p-4 mb-6 border border-white/5">
                        <p
                          className={`font-black text-lg tabular-nums ${
                            isBestMatch ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {bonus}
                        </p>
                        {rec.card.bonus_spend_requirement && rec.card.bonus_spend_window_months ? (
                          <p className="text-on-surface-variant text-[11px] uppercase tracking-wider mt-0.5">
                            after ${rec.card.bonus_spend_requirement.toLocaleString()} spend in {rec.card.bonus_spend_window_months} mos
                          </p>
                        ) : (
                          <p className="text-on-surface-variant text-[11px] uppercase tracking-wider mt-0.5">
                            welcome bonus
                          </p>
                        )}
                      </div>

                      {/* Fee + Status row */}
                      <div className="flex justify-between items-center mb-6 px-1">
                        <div>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Annual Fee</p>
                          <p className="text-sm font-bold tabular-nums">
                            {rec.card.annual_fee ? `$${rec.card.annual_fee}` : "$0"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Status</p>
                          <p className={`text-xs font-bold ${elig.color}`}>{elig.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    {isBestMatch ? (
                      <button
                        className="w-full py-4 rounded-full font-bold text-sm text-black transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                        style={{ background: "var(--gradient-cta)" }}
                      >
                        View Details
                      </button>
                    ) : (
                      <button className="w-full py-4 rounded-full font-bold text-sm bg-transparent border border-white/10 text-on-surface hover:bg-white/5 transition-all hover:scale-[1.02]">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Insights bento card */}
            {filteredRecommendations.length > 0 && filter === "all" && (
              <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between border border-primary/5">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-headline text-2xl font-extrabold mb-4">Precision Analysis Active</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                    We&apos;ve cross-referenced your current card history with recent approval trends. Your profile suggests a high probability of approval for premium tier cards.
                  </p>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface">Live Data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface">
                        {stats.eligible} Eligible Now
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-56 bg-surface-container-highest rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
                  <p className="text-4xl font-headline font-extrabold text-primary tabular-nums">{stats.total}</p>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant text-center">Matched Cards</p>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: stats.total > 0 ? `${Math.min((stats.eligible / stats.total) * 100, 100)}%` : "0%" }}
                    />
                  </div>
                  <p className="text-[10px] text-primary font-bold">
                    {stats.total > 0 ? Math.round((stats.eligible / stats.total) * 100) : 0}% eligible
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Strategy banner ── */}
        {filteredRecommendations.length > 0 && (
          <section className="bg-gradient-to-r from-surface-container to-surface-container-high rounded-2xl p-8 border-l-4 border-primary">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface mb-1">Churning Strategy Analysis</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-3xl">
                  You currently have{" "}
                  <span className="text-primary font-bold">{stats.eligible} eligible</span>{" "}
                  card{stats.eligible !== 1 ? "s" : ""} ready to apply for.
                  {stats.comingSoon > 0 && (
                    <> {stats.comingSoon} more become eligible as your waiting periods expire.</>
                  )}{" "}
                  Focus on cards with the highest bonus-to-fee ratio for maximum velocity.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
