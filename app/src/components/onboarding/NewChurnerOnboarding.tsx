"use client"

import { useState, useMemo, useEffect } from "react"
import { useCatalog } from "@/contexts/CatalogContext"
import type { OnboardingCardEntry } from "@/lib/recommendations"
import { GOALS, calculateOnboardingPath, type SpendBand } from "@/lib/projections"
import type { Database } from "@/types/database.types"
import { supabase } from "@/lib/supabase/client"
import type { BankExclusionPeriod } from "@/lib/bank-exclusions"
import { GeneralInfoDisclaimer } from "@/components/ui/GeneralInfoDisclaimer"

type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

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
    key: "internationalBusinessUpgrade",
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface CardDetail {
  month: string
  year: string
  bonusReceived: "yes" | "no" | "unsure" | null
}

interface NewChurnerOnboardingProps {
  onComplete: (data: {
    goalKey: string
    spendBand: SpendBand
    cardHistory: OnboardingCardEntry[]
  }) => void
}

type Step = "goal" | "spend" | "history"

export function NewChurnerOnboarding({ onComplete }: NewChurnerOnboardingProps) {
  const { catalogCards } = useCatalog()
  const [step, setStep] = useState<Step>("goal")
  const [goalKey, setGoalKey] = useState<string | null>(null)
  const [spendBand, setSpendBand] = useState<SpendBand>("2k4k")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [details, setDetails] = useState<Record<string, CardDetail>>({})
  const [exclusionPeriods, setExclusionPeriods] = useState<BankExclusionPeriod[]>([])

  useEffect(() => {
    supabase.from("bank_exclusion_periods").select("*").then(({ data }) => {
      if (data) setExclusionPeriods(data as BankExclusionPeriod[])
    })
  }, [])

  const goal = goalKey ? GOALS[goalKey as keyof typeof GOALS] : null
  const ctx = goalKey ? GOAL_CONTEXT[goalKey] : null

  // Live path calculation (goal + spend band + history)
  const cardHistory = useMemo<OnboardingCardEntry[]>(() => {
    return Array.from(selectedIds)
      .filter((id) => {
        const d = details[id]
        return d?.month && d?.year && d?.bonusReceived
      })
      .map((id) => {
        const card = catalogCards.find((c) => c.id === id)!
        const d = details[id]
        return {
          bank: card.bank,
          cardId: id,
          applicationMonth: `${d.year}-${d.month}`,
          bonusReceived: d.bonusReceived === "yes",
        }
      })
  }, [selectedIds, details, catalogCards])

  const bestPath = useMemo(() => {
    if (!goal) return null
    return calculateOnboardingPath(goal, spendBand, cardHistory, catalogCards, exclusionPeriods)
  }, [goal, spendBand, cardHistory, catalogCards, exclusionPeriods])

  // Card picker state (step: history)
  const byBank = useMemo(() => {
    const map = new Map<string, CatalogCard[]>()
    for (const card of catalogCards) {
      if (!card.is_active) continue
      const existing = map.get(card.bank) ?? []
      existing.push(card)
      map.set(card.bank, existing)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [catalogCards])

  const toggleCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setDetails((d) => { const c = { ...d }; delete c[id]; return c })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const updateDetail = (id: string, field: keyof CardDetail, value: string) => {
    setDetails((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { month: "", year: "", bonusReceived: null }), [field]: value },
    }))
  }

  const handleGoalSelect = (key: string) => {
    setGoalKey(key)
    setStep("spend")
  }

  const handleSubmit = () => {
    if (!goalKey) return
    onComplete({ goalKey, spendBand, cardHistory })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i))

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
                onClick={() => setStep("history")}
                className="flex-1 rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                Refine my eligibility →
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-on-surface-variant hover:border-white/20 hover:text-white"
              >
                Skip →
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Card history (optional eligibility check) */}
        {step === "history" && goal && (
          <>
            <div className="space-y-2">
              <button onClick={() => setStep("spend")} className="text-sm text-on-surface-variant hover:text-white">
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-white">Have you held any of these cards recently?</h1>
              <p className="text-on-surface-variant">
                Helps us route around eligibility blocks. Skip if you haven&apos;t held any.
              </p>
            </div>

            {/* Card picker */}
            <div className="space-y-6">
              {byBank.map(([bank, cards]) => (
                <div key={bank}>
                  <p className="mb-2 text-sm font-medium text-on-surface-variant">{bank}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {cards.map((card) => {
                      const selected = selectedIds.has(card.id)
                      const d = details[card.id]

                      return (
                        <div key={card.id} className="space-y-2">
                          <button
                            onClick={() => toggleCard(card.id)}
                            className={`w-full rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.01] ${
                              selected
                                ? "border-teal-500 bg-teal-500/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-white">{card.name}</p>
                              {selected && <span className="text-teal-400">✓</span>}
                            </div>
                          </button>

                          {selected && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                              <p className="text-xs text-on-surface-variant">When did you apply?</p>
                              <div className="flex gap-2">
                                <select
                                  value={d?.month ?? ""}
                                  onChange={(e) => updateDetail(card.id, "month", e.target.value)}
                                  className="flex-1 rounded-lg border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white"
                                >
                                  <option value="">Month</option>
                                  {MONTHS.map((m, i) => (
                                    <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                                  ))}
                                </select>
                                <select
                                  value={d?.year ?? ""}
                                  onChange={(e) => updateDetail(card.id, "year", e.target.value)}
                                  className="w-24 rounded-lg border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white"
                                >
                                  <option value="">Year</option>
                                  {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                {(["yes", "no", "unsure"] as const).map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => updateDetail(card.id, "bonusReceived", v)}
                                    className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${
                                      d?.bonusReceived === v
                                        ? "border-teal-500 bg-teal-500/20 text-teal-400"
                                        : "border-white/10 text-on-surface-variant hover:border-white/20"
                                    }`}
                                  >
                                    {v === "unsure" ? "Not sure" : v === "yes" ? "Yes" : "No"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Live updated path if cards selected */}
            {bestPath && selectedIds.size > 0 && (
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-5 space-y-3">
                <p className="text-sm text-teal-400 font-medium">Updated plan based on your history</p>
                <div className="space-y-1.5">
                  {bestPath.cards.map((card, i) => (
                    <div key={card.id} className="flex items-center gap-2 text-sm">
                      <span className="text-teal-400 font-bold">{i + 1}.</span>
                      <span className="text-white">{card.name}</span>
                      <span className="text-on-surface-variant">· {card.welcome_bonus_points?.toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-on-surface-variant">
                  ~{bestPath.totalPoints.toLocaleString()} total points in ~{bestPath.timeToGoal} months
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--gradient-cta)" }}
              >
                Start tracking this plan →
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-on-surface-variant hover:border-white/20 hover:text-white"
              >
                Skip
              </button>
            </div>
          </>
        )}
        <GeneralInfoDisclaimer />
      </div>
    </div>
  )
}
