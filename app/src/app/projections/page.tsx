"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plane,
  MapPin,
  TrendingUp,
  Clock,
  CreditCard,
  ChevronRight,
} from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"
import { GOALS } from "@/lib/projections"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]
type UserPoints = Database["public"]["Tables"]["user_points"]["Row"]
type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

const CABIN_CLASSES = [
  { id: "economy", label: "Economy", pointsRequired: 63500 },
  { id: "business", label: "Business", pointsRequired: 130000 },
  { id: "first", label: "First", pointsRequired: 200000 },
] as const

type CabinClassId = (typeof CABIN_CLASSES)[number]["id"]

const POPULAR_ROUTES = [
  { origin: "SYD", destination: "LHR", label: "London" },
  { origin: "SYD", destination: "NRT", label: "Tokyo" },
  { origin: "SYD", destination: "LAX", label: "Los Angeles" },
  { origin: "MEL", destination: "SIN", label: "Singapore" },
]

export default function ProjectionsPage() {
  const router = useRouter()
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState("SYD")
  const [destination, setDestination] = useState("LHR")
  const [cabinClass, setCabinClass] = useState<CabinClassId>("business")

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/")
        return
      }

      const [userCardsResult, pointsResult, catalogResult] = await Promise.all([
        supabase.from("user_cards").select("*"),
        supabase
          .from("user_points")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase
          .from("cards")
          .select("*")
          .eq("is_active", true)
          .order("welcome_bonus_points", { ascending: false }),
      ])

      if (userCardsResult.error) {
        toast.error("Unable to load your cards")
        setLoading(false)
        return
      }

      setUserCards(userCardsResult.data || [])
      setUserPoints(pointsResult.data)
      setCatalogCards(catalogResult.data || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const selectedCabin = CABIN_CLASSES.find((c) => c.id === cabinClass)!
  const pointsRequired = selectedCabin.pointsRequired
  const currentPoints = userPoints?.qantas_ff_balance ?? 0
  const gap = pointsRequired - currentPoints
  const percentage = Math.min(100, Math.floor((currentPoints / pointsRequired) * 100))
  const isSufficient = gap <= 0

  // Monthly earning rate estimate: avg earn_rate across user cards × $3,000/month spend
  const monthlyEarning = useMemo(() => {
    if (userCards.length === 0) return 0
    const owned = userCards
      .map((uc) => uc.card_id)
      .filter(Boolean)
    const ownedCatalogCards = catalogCards.filter((c) => owned.includes(c.id))
    if (ownedCatalogCards.length === 0) return 0
    const avgEarnRate =
      ownedCatalogCards.reduce((sum, c) => sum + (c.earn_rate_primary ?? 1), 0) /
      ownedCatalogCards.length
    return Math.round(avgEarnRate * 3000)
  }, [userCards, catalogCards])

  const monthsToClose = useMemo(() => {
    if (isSufficient || monthlyEarning <= 0) return null
    return Math.ceil(gap / monthlyEarning)
  }, [gap, monthlyEarning, isSufficient])

  // Top 3 card recommendations not in user's current portfolio
  const ownedCardIds = new Set(userCards.map((uc) => uc.card_id).filter(Boolean))
  const topRecommendations = catalogCards
    .filter((c) => !ownedCardIds.has(c.id) && (c.welcome_bonus_points ?? 0) > 0)
    .slice(0, 3)

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-3xl bg-surface-container" />
          <div className="h-40 animate-pulse rounded-3xl bg-surface-container" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-surface-container" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
              Plan
            </p>
            <h1 className="mt-1 font-[var(--font-grotesk)] text-2xl font-bold tracking-tight text-white">
              Reward Flights
            </h1>
          </div>
          <span className="rounded-full border border-white/10 bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            Gap Analysis
          </span>
        </div>

        {/* Route selector — glass card */}
        <div
          className="rounded-3xl border border-white/5 p-4 shadow-2xl"
          style={{
            background: "rgba(27, 31, 44, 0.6)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Origin */}
            <div className="flex cursor-pointer flex-col gap-1.5 rounded-2xl border border-white/5 bg-surface-container/60 p-4 transition-colors hover:bg-surface-container-high">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                Origin
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary/70" />
                <input
                  className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/40"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="SYD"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Destination */}
            <div className="flex cursor-pointer flex-col gap-1.5 rounded-2xl border border-white/5 bg-surface-container/60 p-4 transition-colors hover:bg-surface-container-high">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                Destination
              </label>
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-on-surface-variant" />
                <input
                  className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/40"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase().slice(0, 3))}
                  placeholder="LHR"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Cabin Class */}
            <div className="flex flex-col gap-1.5 rounded-2xl border border-white/5 bg-surface-container/60 p-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                Cabin Class
              </label>
              <div className="flex gap-1.5">
                {CABIN_CLASSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCabinClass(c.id)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      cabinClass === c.id
                        ? "bg-primary text-on-primary"
                        : "bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-on-surface"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick routes */}
            <div className="flex flex-col gap-1.5 rounded-2xl border border-white/5 bg-surface-container/60 p-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                Quick Routes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r.destination}
                    onClick={() => {
                      setOrigin(r.origin)
                      setDestination(r.destination)
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-on-surface transition-all hover:border-primary/30 hover:text-primary"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gap analysis progress bar */}
        <div
          className="relative overflow-hidden rounded-3xl border border-white/5 p-8"
          style={{ background: "rgba(23, 27, 40, 0.8)" }}
        >
          {/* Emerald glow on right */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/8 to-transparent" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: label + headline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary">
                  Active Redemption Goal
                </span>
              </div>
              <h2 className="font-[var(--font-grotesk)] text-3xl font-extrabold tracking-tight text-white">
                {percentage}% to {selectedCabin.label}{" "}
                <span className="text-primary">
                  {origin} → {destination}
                </span>
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-on-surface-variant">
                {isSufficient ? (
                  <>
                    You have enough points for a{" "}
                    <span className="font-bold text-white">{selectedCabin.label}</span> redemption.
                    You have a surplus of{" "}
                    <span className="font-bold text-primary">
                      {Math.abs(gap).toLocaleString()} pts
                    </span>
                    .
                  </>
                ) : (
                  <>
                    You need{" "}
                    <span className="font-bold text-white underline decoration-[#4edea3]/40 underline-offset-4">
                      {gap.toLocaleString()} more points
                    </span>{" "}
                    to book a{" "}
                    <span className="font-bold text-white">{selectedCabin.label}</span> to{" "}
                    {destination}.
                  </>
                )}
              </p>
              {monthsToClose && !isSufficient && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Clock className="h-4 w-4 text-on-surface-variant" />
                  <span>
                    Est.{" "}
                    <span className="font-semibold text-white">{monthsToClose} months</span> to
                    close at current earning rate
                  </span>
                </div>
              )}
            </div>

            {/* Right: points card + bar */}
            <div className="w-full rounded-2xl border border-white/5 bg-surface/40 p-6 backdrop-blur-md lg:w-[400px]">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Current Points Pool
                  </p>
                  <p className="font-[var(--font-grotesk)] text-xl font-bold tabular-nums tracking-tight text-white">
                    {currentPoints.toLocaleString()}{" "}
                    <span className="text-on-surface-variant">/ {pointsRequired.toLocaleString()}</span>
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    isSufficient
                      ? "border-[#4edea3]/20 bg-primary/10 text-primary"
                      : "border-white/10 bg-white/5 text-on-surface"
                  }`}
                >
                  {isSufficient ? "Ready" : `${percentage}%`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-4 overflow-hidden rounded-full bg-surface-container-highest/50 p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    background:
                      "linear-gradient(to right, #4edea3, #6ffbbe, #10b981)",
                  }}
                >
                  <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/20" />
                </div>
              </div>

              {/* Gap indicator */}
              <div
                className={`mt-4 flex items-center justify-between rounded-2xl border p-3 ${
                  isSufficient
                    ? "border-primary/20 bg-primary/10"
                    : "border-red-500/10 bg-red-500/5"
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${
                    isSufficient ? "text-primary" : "text-red-400"
                  }`}
                >
                  {isSufficient ? "Balance Status" : "Gap to target"}
                </span>
                <span
                  className={`font-[var(--font-grotesk)] text-lg font-extrabold tabular-nums ${
                    isSufficient ? "text-primary" : "text-white"
                  }`}
                >
                  {isSufficient
                    ? `+${Math.abs(gap).toLocaleString()} surplus`
                    : `-${gap.toLocaleString()} pts`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top card recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-[var(--font-grotesk)] text-2xl font-bold tracking-tight text-white">
                Top Cards to Close the Gap
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Ranked by welcome bonus — highest points first
              </p>
            </div>
          </div>

          {topRecommendations.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-surface-container p-12 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-on-surface-variant" />
              <p className="mt-4 text-lg font-semibold text-white">No recommendations available</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                All active cards are already in your portfolio
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {topRecommendations.map((card, idx) => {
                const bonusPoints = card.welcome_bonus_points ?? 0
                const newTotal = currentPoints + bonusPoints
                const newGap = pointsRequired - newTotal
                const wouldSuffice = newGap <= 0
                const isHighlighted = idx === 0

                return (
                  <div
                    key={card.id}
                    className={`flex flex-col overflow-hidden rounded-3xl border transition-all duration-500 ${
                      isHighlighted
                        ? "border-primary/40 ring-1 ring-primary/20 scale-[1.02] shadow-[0_24px_48px_-12px_rgba(78,222,163,0.15)]"
                        : "border-white/5 hover:border-primary/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]"
                    }`}
                    style={{ background: "rgba(23, 27, 40, 0.5)" }}
                  >
                    {/* Card banner */}
                    <div className="relative flex h-32 items-end overflow-hidden p-5">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${
                            idx === 0
                              ? "#003824, #005236"
                              : idx === 1
                              ? "#1b1f2c, #262a37"
                              : "#171b28, #1b1f2c"
                          })`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />

                      {/* Airline label pill */}
                      <div
                        className="absolute left-5 top-4 rounded-full border border-white/10 px-3 py-1"
                        style={{
                          background: "rgba(27, 31, 44, 0.4)",
                          backdropFilter: "blur(24px)",
                        }}
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
                          {card.bank}
                        </span>
                      </div>

                      {/* Points badge */}
                      <div className="relative z-10 flex w-full items-end justify-between">
                        <div>
                          <span className="font-[var(--font-grotesk)] text-4xl font-extrabold tabular-nums tracking-tighter text-white">
                            {bonusPoints.toLocaleString()}
                          </span>
                          <span className="ml-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                            Bonus pts
                          </span>
                        </div>
                        {isHighlighted && (
                          <span className="rounded bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-widest text-on-primary">
                            Best
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card details */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-sm font-semibold text-on-surface-variant">Card</span>
                          <span className="text-sm font-bold text-white">{card.name}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-sm font-semibold text-on-surface-variant">Annual Fee</span>
                          <span className="text-sm font-bold text-white tabular-nums">
                            ${(card.annual_fee ?? 0).toLocaleString()} AUD
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-on-surface-variant">Earn Rate</span>
                          <span className="text-sm font-bold text-white tabular-nums">
                            {card.earn_rate_primary ?? 1} pt / $1
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        {/* Gap status after this card */}
                        <div
                          className={`rounded-2xl border p-3 ${
                            wouldSuffice
                              ? "border-primary/20 bg-primary/10"
                              : "border-white/5 bg-surface-container/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold uppercase tracking-widest ${
                                wouldSuffice ? "text-primary" : "text-on-surface-variant"
                              }`}
                            >
                              {wouldSuffice ? "Would cover goal" : "Remaining gap"}
                            </span>
                            <span
                              className={`font-[var(--font-grotesk)] text-base font-extrabold tabular-nums ${
                                wouldSuffice ? "text-primary" : "text-white"
                              }`}
                            >
                              {wouldSuffice
                                ? `+${Math.abs(newGap).toLocaleString()} surplus`
                                : `-${newGap.toLocaleString()} pts`}
                            </span>
                          </div>
                        </div>

                        <a
                          href="/cards"
                          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold uppercase tracking-widest transition-all ${
                            isHighlighted
                              ? "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 hover:scale-[1.02]"
                              : "border border-white/10 bg-white/5 text-on-surface hover:bg-white/10 hover:text-on-surface"
                          }`}
                        >
                          <CreditCard className="h-4 w-4" />
                          View Card Details
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
