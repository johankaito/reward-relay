"use client"

import { useState, useMemo, useEffect } from "react"
import { useCatalog } from "@/contexts/CatalogContext"
import type { OnboardingCardEntry } from "@/lib/recommendations"
import { GOALS, calculateOnboardingPath, type SpendBand } from "@/lib/projections"
import { supabase } from "@/lib/supabase/client"
import type { BankExclusionPeriod } from "@/lib/bank-exclusions"
import { GeneralInfoDisclaimer } from "@/components/ui/GeneralInfoDisclaimer"

const ONBOARDING_GOALS = [
  {
    key: "domesticBusinessUpgrade",
    icon: "✈️",
    label: "Business class (domestic)",
    sublabel: "Sydney ↔ Melbourne in Business",
  },
  {
    key: "internationalBusinessUpgrade",
    icon: "🌏",
    label: "Business class (international)",
    sublabel: "Asia / Europe / USA in Business",
  },
  {
    key: "internationalFlight",
    icon: "🏝️",
    label: "Holiday flights + hotels",
    sublabel: "Economy flights to Asia or Pacific",
  },
  {
    key: "domesticFlight",
    icon: "💰",
    label: "Just get started",
    sublabel: "Free domestic flight as first win",
  },
  {
    key: "internationalPremiumUpgrade",
    icon: "🎯",
    label: "Not sure — show me",
    sublabel: "We'll show you what's possible",
  },
] as const

const SPEND_BANDS: { value: SpendBand; label: string; sublabel: string }[] = [
  { value: "lt1k", label: "< $1,000", sublabel: "per month" },
  { value: "1k2k", label: "$1–2k", sublabel: "per month" },
  { value: "2k4k", label: "$2–4k", sublabel: "per month" },
  { value: "4k6k", label: "$4–6k", sublabel: "per month" },
  { value: "gt6k", label: "$6k+", sublabel: "per month" },
]

const GOAL_CONTEXT: Record<string, { destination: string; points: number }> = {
  domesticBusinessUpgrade: { destination: "Sydney → Melbourne in Business", points: 25000 },
  internationalBusinessUpgrade: { destination: "Sydney → Tokyo in Business class", points: 130000 },
  internationalFlight: { destination: "Sydney → Bali return in Economy", points: 63500 },
  domesticFlight: { destination: "Sydney → Melbourne return", points: 10000 },
  internationalPremiumUpgrade: { destination: "Sydney → Tokyo in Premium Economy", points: 80000 },
}

const BANK_COLORS: Record<string, string> = {
  ANZ: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Amex: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "American Express": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  CBA: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  NAB: "bg-red-500/20 text-red-300 border-red-500/30",
  Westpac: "bg-orange-500/20 text-orange-300 border-orange-500/30",
}

interface NewChurnerOnboardingProps {
  onComplete: (data: {
    goalKey: string
    spendBand: SpendBand
    cardHistory: OnboardingCardEntry[]
  }) => void
}

type Step = "goal" | "spend" | "plans"

export function NewChurnerOnboarding({ onComplete }: NewChurnerOnboardingProps) {
  const { catalogCards } = useCatalog()
  const [step, setStep] = useState<Step>("goal")
  const [goalKey, setGoalKey] = useState<string | null>(null)
  const [spendBand, setSpendBand] = useState<SpendBand>("2k4k")
  const [exclusionPeriods, setExclusionPeriods] = useState<BankExclusionPeriod[]>([])

  useEffect(() => {
    supabase.from("bank_exclusion_periods").select("*").then(({ data }) => {
      if (data) setExclusionPeriods(data as BankExclusionPeriod[])
    })
  }, [])

  const goal = goalKey ? GOALS[goalKey as keyof typeof GOALS] : null
  const ctx = goalKey ? GOAL_CONTEXT[goalKey] : null

  const bestPath = useMemo(() => {
    if (!goal) return null
    return calculateOnboardingPath(goal, spendBand, [], catalogCards, exclusionPeriods)
  }, [goal, spendBand, catalogCards, exclusionPeriods])

  const conservativePath = useMemo(() => {
    if (!bestPath) return null
    const singleCard = bestPath.cards.slice(0, 1)
    const pts = singleCard.reduce((acc, c) => acc + (c.welcome_bonus_points ?? 0), 0)
    return { ...bestPath, cards: singleCard, totalPoints: pts }
  }, [bestPath])

  const handleGoalSelect = (key: string) => {
    setGoalKey(key)
    setStep("spend")
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--surface-muted)] px-4 py-10">
      <div className="w-full max-w-2xl space-y-8">

        {/* Step 1 — Goal picker */}
        {step === "goal" && (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">What do you want?</h1>
              <p className="text-on-surface-variant">Pick your dream reward. We&apos;ll build the fastest path to get there.</p>
            </div>
            <div className="space-y-3">
              {ONBOARDING_GOALS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => handleGoalSelect(g.key)}
                  className="w-full rounded-2xl border-2 border-white/10 bg-white/5 p-5 text-left transition-all hover:scale-[1.01] hover:border-teal-500/40 hover:bg-teal-500/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{g.label}</p>
                      <p className="text-sm text-on-surface-variant">{g.sublabel}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2 — Spend slider + live preview */}
        {step === "spend" && goal && (
          <>
            <div className="space-y-2">
              <button onClick={() => setStep("goal")} className="text-sm text-on-surface-variant hover:text-white">
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-white">How much do you spend monthly?</h1>
              <p className="text-on-surface-variant">This affects how quickly you can hit bonus spend targets.</p>
            </div>

            {/* Goal context */}
            {ctx && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-on-surface-variant">{ctx.destination}</p>
                <p className="text-lg font-semibold text-white">
                  ~{ctx.points.toLocaleString()} Qantas points needed
                </p>
              </div>
            )}

            {/* Spend band selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SPEND_BANDS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setSpendBand(b.value)}
                  className={`shrink-0 rounded-xl border-2 px-4 py-3 text-center transition-all ${
                    spendBand === b.value
                      ? "border-teal-500 bg-teal-500/20 text-teal-400"
                      : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold">{b.label}</p>
                  <p className="text-xs opacity-70">{b.sublabel}</p>
                </button>
              ))}
            </div>

            {/* Live path preview */}
            {bestPath && (
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-6 space-y-4">
                <p className="text-sm font-medium uppercase tracking-wider text-teal-400">
                  Fastest path to your goal
                </p>
                <div className="space-y-2">
                  {bestPath.cards.map((card, i) => (
                    <div key={card.id} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{card.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {card.welcome_bonus_points?.toLocaleString()} pts · {card.bank}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-surface-variant">Total points</p>
                    <p className="text-lg font-bold text-white">{bestPath.totalPoints.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant">Timeline</p>
                    <p className="text-lg font-bold text-white">~{bestPath.timeToGoal} months</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("plans")}
                className="flex-1 rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                See your plans →
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Recommended Plans */}
        {step === "plans" && (
          <>
            <div className="space-y-2">
              <button onClick={() => setStep("spend")} className="text-sm text-on-surface-variant hover:text-white">
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-white">Your recommended plans</h1>
              <p className="text-on-surface-variant">Choose the approach that fits your risk appetite.</p>
            </div>

            <div className="space-y-4">
              {/* Fast Track card */}
              {bestPath && (
                <div className="rounded-2xl border-2 border-teal-500/40 bg-teal-500/10 p-6 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">Fast Track</span>
                      <p className="mt-1 text-lg font-bold text-white">Maximum points, fastest path</p>
                    </div>
                    <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2.5 py-1 text-xs font-semibold text-teal-400">Recommended</span>
                  </div>

                  <div className="space-y-2">
                    {bestPath.cards.map((card, i) => (
                      <div key={card.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{card.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {card.welcome_bonus_points?.toLocaleString()} pts · {card.bank}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {bestPath.cards.map((card) => {
                      const colorClass = BANK_COLORS[card.bank] ?? "bg-white/10 text-white/60 border-white/10"
                      return (
                        <span key={card.id} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                          {card.bank}
                        </span>
                      )
                    })}
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-on-surface-variant">Total points</p>
                      <p className="text-lg font-bold text-white">{bestPath.totalPoints.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">Timeline</p>
                      <p className="text-lg font-bold text-white">~{bestPath.timeToGoal} months</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                    <span className="text-white/40">Est. Annual Value</span>
                    <span className="font-semibold text-teal-400">
                      ${Math.round(bestPath.totalPoints * 0.018).toLocaleString()}/yr
                    </span>
                  </div>
                </div>
              )}

              {/* Conservative card */}
              {conservativePath && conservativePath.cards.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Conservative</span>
                    <p className="mt-1 text-lg font-bold text-white">Single card, lower commitment</p>
                  </div>

                  <div className="space-y-2">
                    {conservativePath.cards.map((card, i) => (
                      <div key={card.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-white">{card.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {card.welcome_bonus_points?.toLocaleString()} pts · {card.bank}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {conservativePath.cards.map((card) => {
                      const colorClass = BANK_COLORS[card.bank] ?? "bg-white/10 text-white/60 border-white/10"
                      return (
                        <span key={card.id} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                          {card.bank}
                        </span>
                      )
                    })}
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-on-surface-variant">Total points</p>
                      <p className="text-lg font-bold text-white">{conservativePath.totalPoints.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-on-surface-variant">Timeline</p>
                      <p className="text-lg font-bold text-white">~{conservativePath.timeToGoal} months</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                    <span className="text-white/40">Est. Annual Value</span>
                    <span className="font-semibold text-teal-400">
                      ${Math.round(conservativePath.totalPoints * 0.018).toLocaleString()}/yr
                    </span>
                  </div>
                </div>
              )}

              {/* What’s Next teaser */}
              {bestPath && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20">
                      <span className="text-sm">🚀</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/50">What&apos;s Next</span>
                      <p className="text-sm font-bold text-white">Keep stacking after your first plan</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Once you complete Fast Track, we&apos;ll recommend your next sequence — most members unlock{" "}
                    <span className="text-white/80 font-medium">2–3× more points</span> in year two.
                  </p>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-white/40">Year 2 potential</span>
                    <span className="font-semibold text-white/70">
                      ~${Math.round(bestPath.totalPoints * 0.018 * 2.5).toLocaleString()}/yr
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { if (goalKey) onComplete({ goalKey, spendBand, cardHistory: [] }) }}
                className="flex-1 rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                Start tracking this plan →
              </button>
            </div>
          </>
        )}

        <GeneralInfoDisclaimer />
      </div>
    </div>
  )
}
