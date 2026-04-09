"use client"

import { useState, useMemo, useEffect } from "react"
import { useCatalog } from "@/contexts/CatalogContext"
import type { OnboardingCardEntry } from "@/lib/recommendations"
import { getRecommendationsFromHistory } from "@/lib/recommendations"
import type { Database } from "@/types/database.types"
import { supabase } from "@/lib/supabase/client"
import type { BankExclusionPeriod } from "@/lib/bank-exclusions"
import { GeneralInfoDisclaimer } from "@/components/ui/GeneralInfoDisclaimer"

type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface CardDetail {
  month: string   // "01"–"12"
  year: string    // "2023"
  bonusReceived: "yes" | "no" | "unsure" | null
}

interface ChurnerOnboardingProps {
  onComplete: (cardHistory: OnboardingCardEntry[]) => void
  excludedCardIds?: Set<string>
  submitLabel?: string
  headingOverride?: string
  subheadingOverride?: string
}

export function ChurnerOnboarding({ onComplete, excludedCardIds, submitLabel, headingOverride, subheadingOverride }: ChurnerOnboardingProps) {
  const { catalogCards } = useCatalog()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [details, setDetails] = useState<Record<string, CardDetail>>({})
  const [exclusionPeriods, setExclusionPeriods] = useState<BankExclusionPeriod[]>([])

  useEffect(() => {
    supabase.from("bank_exclusion_periods").select("*").then(({ data }) => {
      if (data) setExclusionPeriods(data as BankExclusionPeriod[])
    })
  }, [])

  // Group catalog cards by bank for display
  const byBank = useMemo(() => {
    const map = new Map<string, CatalogCard[]>()
    for (const card of catalogCards) {
      if (!card.is_active) continue
      if (excludedCardIds?.has(card.id)) continue
      const existing = map.get(card.bank) ?? []
      existing.push(card)
      map.set(card.bank, existing)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [catalogCards, excludedCardIds])

  const toggleCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setDetails((d) => {
          const copy = { ...d }
          delete copy[id]
          return copy
        })
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

  // Cards that have all details filled in
  const completedCards = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const d = details[id]
      return d?.month && d?.year && d?.bonusReceived
    })
  }, [selectedIds, details])

  // Build card history from completed cards for live recommendation
  const cardHistory = useMemo<OnboardingCardEntry[]>(() => {
    return completedCards.map((id) => {
      const card = catalogCards.find((c) => c.id === id)!
      const d = details[id]
      return {
        bank: card.bank,
        cardId: id,
        applicationMonth: `${d.year}-${d.month}`,
        bonusReceived: d.bonusReceived === "yes",
      }
    })
  }, [completedCards, details, catalogCards])

  // Live recommendation from completed cards
  const topRec = useMemo(() => {
    if (cardHistory.length === 0) return null
    const recs = getRecommendationsFromHistory(cardHistory, catalogCards, { limit: 1 }, exclusionPeriods)
    return recs[0] ?? null
  }, [cardHistory, catalogCards, exclusionPeriods])

  // Eligibility status per completed card
  const eligibilityByBank = useMemo(() => {
    const map = new Map<string, { eligible: boolean; eligibleAt: Date | null; eligibilityUnconfirmed: boolean }>()
    if (cardHistory.length === 0) return map
    const recs = getRecommendationsFromHistory(cardHistory, catalogCards, { limit: 50 }, exclusionPeriods)
    for (const rec of recs) {
      map.set(rec.card.bank, { eligible: rec.eligibleNow, eligibleAt: rec.eligibleAt, eligibilityUnconfirmed: rec.eligibilityUnconfirmed })
    }
    return map
  }, [cardHistory, catalogCards, exclusionPeriods])

  const getEligibilityChip = (cardId: string) => {
    const card = catalogCards.find((c) => c.id === cardId)
    if (!card) return null
    const e = eligibilityByBank.get(card.bank)
    if (!e) return null
    if (e.eligible) {
      if (e.eligibilityUnconfirmed) {
        return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">⚠️ May be eligible (period unconfirmed)</span>
      }
      return <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs text-teal-400">✅ Eligible now</span>
    }
    if (e.eligibleAt) {
      const months = Math.ceil((e.eligibleAt.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))
      if (e.eligibilityUnconfirmed) {
        return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">⚠️ ~{months}mo wait (period unconfirmed)</span>
      }
      return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">⏳ {months}mo wait</span>
    }
    return null
  }

  const handleSubmit = () => {
    if (cardHistory.length === 0) return
    onComplete(cardHistory)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i))

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--surface-muted)] px-4 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{headingOverride ?? "Your card history"}</h1>
          <p className="text-on-surface-variant">
            {subheadingOverride ?? "Select every card you\u2019ve held in the last 3 years. We\u2019ll calculate your cooling periods instantly."}
          </p>
        </div>

        {/* Card picker grid */}
        <div className="space-y-6">
          {byBank.map(([bank, cards]) => (
            <div key={bank}>
              <p className="mb-2 text-sm font-medium text-on-surface-variant">{bank}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {cards.map((card) => {
                  const selected = selectedIds.has(card.id)
                  const d = details[card.id]
                  const hasDetails = d?.month && d?.year && d?.bonusReceived

                  return (
                    <div key={card.id} className="space-y-3">
                      <button
                        onClick={() => toggleCard(card.id)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.01] ${
                          selected
                            ? "border-teal-500 bg-teal-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{card.name}</p>
                            {card.welcome_bonus_points && (
                              <p className="text-xs text-on-surface-variant">
                                {card.welcome_bonus_points.toLocaleString()} pts bonus
                              </p>
                            )}
                          </div>
                          {selected && <span className="text-teal-400">✓</span>}
                        </div>
                      </button>

                      {/* Inline details for selected card */}
                      {selected && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                          <p className="text-sm text-on-surface-variant">When did you apply?</p>
                          <div className="flex gap-2">
                            <select
                              value={d?.month ?? ""}
                              onChange={(e) => updateDetail(card.id, "month", e.target.value)}
                              className="flex-1 rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-sm text-white"
                            >
                              <option value="">Month</option>
                              {MONTHS.map((m, i) => (
                                <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={d?.year ?? ""}
                              onChange={(e) => updateDetail(card.id, "year", e.target.value)}
                              className="w-28 rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-sm text-white"
                            >
                              <option value="">Year</option>
                              {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <p className="text-sm text-on-surface-variant">Did you receive the welcome bonus?</p>
                          <div className="flex gap-2">
                            {(["yes", "no", "unsure"] as const).map((v) => (
                              <button
                                key={v}
                                onClick={() => updateDetail(card.id, "bonusReceived", v)}
                                className={`flex-1 rounded-lg border py-2 text-sm capitalize transition-colors ${
                                  d?.bonusReceived === v
                                    ? "border-teal-500 bg-teal-500/20 text-teal-400"
                                    : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20"
                                }`}
                              >
                                {v === "unsure" ? "Not sure" : v.charAt(0).toUpperCase() + v.slice(1)}
                              </button>
                            ))}
                          </div>

                          {hasDetails && (
                            <div className="flex items-center gap-2">
                              {getEligibilityChip(card.id) ?? (
                                <span className="text-xs text-on-surface-variant">Calculating eligibility...</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AHA moment — live recommendation */}
        {topRec && (
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-6 space-y-4">
            <p className="text-sm font-medium uppercase tracking-wider text-teal-400">
              Your next card →
            </p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{topRec.card.name}</h2>
                <p className="text-on-surface-variant">{topRec.card.bank}</p>
                {topRec.card.welcome_bonus_points && (
                  <p className="mt-1 text-lg font-semibold text-teal-400">
                    {topRec.card.welcome_bonus_points.toLocaleString()} points bonus
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                topRec.eligibleNow
                  ? "bg-teal-500/20 text-teal-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {topRec.eligibleNow ? "Apply now" : topRec.reason}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant">{topRec.reason}</p>

            <button
              onClick={handleSubmit}
              className="w-full rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--gradient-cta)" }}
            >
              {submitLabel ?? "Start tracking this plan →"}
            </button>
          </div>
        )}

        {selectedIds.size > 0 && completedCards.length === 0 && (
          <p className="text-center text-sm text-on-surface-variant">
            Fill in the dates for your selected cards to see your recommendation.
          </p>
        )}

        {selectedIds.size === 0 && (
          <p className="text-center text-sm text-on-surface-variant">
            Select the cards you&apos;ve held above to get started.
          </p>
        )}

        <GeneralInfoDisclaimer />
      </div>
    </div>
  )
}
