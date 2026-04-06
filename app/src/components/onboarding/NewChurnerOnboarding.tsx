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

interface NewChurnerOnboardingProps {
  onComplete: (data: {
    goalKey: string
    spendBand: SpendBand
    cardHistory: OnboardingCardEntry[]
  }) => void
}

type Step = "goal" | "spend"

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
