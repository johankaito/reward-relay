"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, Plus, Lock, Star } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"
import { useCatalog } from "@/contexts/CatalogContext"
import { useSubscription } from "@/hooks/useSubscription"
import type { Database } from "@/types/database.types"

type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

const FREE_TIER_LIMIT = 3

function fmtAud(n: number | null | undefined) {
  if (n == null) return "—"
  return `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0 })}`
}

function fmtPts(n: number | null | undefined) {
  if (n == null) return "—"
  return `${n.toLocaleString("en-AU")} pts`
}

function calcNetValue(card: CatalogCard) {
  return (card.welcome_bonus_points || 0) * 0.01 - (card.annual_fee || 0)
}

const COMPARE_ROWS: {
  label: string
  key: keyof CatalogCard | "net_value"
  fmt: (card: CatalogCard) => string
}[] = [
  { label: "Annual Fee", key: "annual_fee", fmt: (c) => fmtAud(c.annual_fee) },
  { label: "Welcome Bonus", key: "welcome_bonus_points", fmt: (c) => fmtPts(c.welcome_bonus_points) },
  {
    label: "Spend Requirement",
    key: "bonus_spend_requirement",
    fmt: (c) =>
      c.bonus_spend_requirement
        ? `${fmtAud(c.bonus_spend_requirement)} in ${c.bonus_spend_window_months ?? "?"}mo`
        : "—",
  },
  {
    label: "Earn Rate (Primary)",
    key: "earn_rate_primary",
    fmt: (c) => (c.earn_rate_primary != null ? `${c.earn_rate_primary}x` : "—"),
  },
  { label: "Points Currency", key: "points_currency", fmt: (c) => c.points_currency ?? "—" },
  {
    label: "Net Value (Est.)",
    key: "net_value",
    fmt: (c) => fmtAud(calcNetValue(c)),
  },
]

export default function ComparePage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const { isPro } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CatalogCard[]>([])
  const [search, setSearch] = useState("")
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/")
        return
      }
      setLoading(false)
    }
    void checkAuth()
  }, [router])

  const maxCards = isPro ? Infinity : FREE_TIER_LIMIT

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return catalogCards
      .filter(
        (c) =>
          !selected.some((s) => s.id === c.id) &&
          (c.name?.toLowerCase().includes(q) || c.bank?.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [search, catalogCards, selected])

  function addCard(card: CatalogCard) {
    if (selected.length >= maxCards) {
      setShowUpgradePrompt(true)
      return
    }
    setSelected((prev) => [...prev, card])
    setSearch("")
  }

  function removeCard(id: string) {
    setSelected((prev) => prev.filter((c) => c.id !== id))
    setShowUpgradePrompt(false)
  }

  // Best value card = highest net value among selected
  const bestCardId = useMemo(() => {
    if (selected.length === 0) return null
    return selected.reduce((best, c) =>
      calcNetValue(c) > calcNetValue(best) ? c : best
    ).id
  }, [selected])

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 space-y-6">
          <div className="h-16 animate-pulse rounded-2xl bg-surface-container" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-16 space-y-10">

        {/* ── Hero ── */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
              Compare Cards
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
              Select up to {isPro ? "unlimited" : FREE_TIER_LIMIT} cards and compare side-by-side.
              {!isPro && (
                <span className="ml-1 text-[#4edea3] font-semibold">
                  Pro unlocks unlimited.
                </span>
              )}
            </p>
          </div>
          {!isPro && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
              <span>{selected.length} / {FREE_TIER_LIMIT} slots used</span>
            </div>
          )}
        </section>

        {/* ── Card selector ── */}
        <section className="bg-surface-container rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="relative">
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3 border border-white/5 focus-within:border-[#4edea3]/30 transition-colors">
              <Plus className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by card name or bank…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
              />
            </div>

            {/* Dropdown results */}
            {filteredCatalog.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                {filteredCatalog.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => addCard(card)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-container-highest transition-colors text-left"
                  >
                    <span>
                      <span className="font-semibold text-on-surface">{card.bank}</span>
                      <span className="text-on-surface-variant ml-2">{card.name}</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant tabular-nums">
                      {fmtPts(card.welcome_bonus_points)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected pills */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((card) => (
                <span
                  key={card.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    card.id === bestCardId
                      ? "bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30"
                      : "bg-surface-container-highest text-on-surface border-white/5"
                  }`}
                >
                  {card.id === bestCardId && <Star className="w-3 h-3" />}
                  {card.bank} {card.name}
                  <button
                    onClick={() => removeCard(card.id)}
                    className="hover:text-on-surface transition-colors"
                    aria-label={`Remove ${card.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Upgrade prompt (inline, when free cap hit) */}
          {showUpgradePrompt && !isPro && (
            <div className="flex items-center justify-between rounded-xl border border-[#4edea3]/20 bg-[#4edea3]/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-[#4edea3] flex-shrink-0" />
                <p className="text-sm text-on-surface">
                  <span className="font-semibold text-[#4edea3]">Pro</span> unlocks unlimited card comparison.
                </p>
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-upgrade-modal"))}
                className="text-xs font-bold text-black rounded-full px-4 py-2 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #4edea3 0%, #10b981 100%)" }}
              >
                Start Free Trial
              </button>
            </div>
          )}
        </section>

        {/* ── Comparison table ── */}
        {selected.length >= 2 ? (
          <section className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-40 text-left px-4 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold sticky left-0 bg-background z-10">
                    Field
                  </th>
                  {selected.map((card) => (
                    <th
                      key={card.id}
                      className={`px-6 py-4 text-center min-w-[180px] rounded-t-2xl border-x border-t transition-colors ${
                        card.id === bestCardId
                          ? "border-[#4edea3]/20 bg-[#4edea3]/5"
                          : "border-white/5 bg-surface-container"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {card.id === bestCardId && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#4edea3] flex items-center gap-1">
                            <Star className="w-2.5 h-2.5" /> Best Value
                          </span>
                        )}
                        <span className="text-xs font-bold text-on-surface">{card.bank}</span>
                        <span className="text-[11px] text-on-surface-variant leading-tight text-center">
                          {card.name}
                        </span>
                        <button
                          onClick={() => removeCard(card.id)}
                          className="mt-1 text-on-surface-variant hover:text-on-surface transition-colors"
                          aria-label={`Remove ${card.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, rowIdx) => {
                  // Find best raw value for numeric highlighting
                  const values = selected.map((c) => {
                    if (row.key === "net_value") return calcNetValue(c)
                    if (row.key === "annual_fee") return c.annual_fee ?? 0
                    if (row.key === "welcome_bonus_points") return c.welcome_bonus_points ?? 0
                    if (row.key === "earn_rate_primary") return c.earn_rate_primary ?? 0
                    return null
                  })
                  const isLastRow = rowIdx === COMPARE_ROWS.length - 1

                  return (
                    <tr key={row.key}>
                      <td
                        className={`px-4 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant sticky left-0 z-10 bg-background ${
                          isLastRow ? "rounded-bl-2xl" : ""
                        }`}
                      >
                        {row.label}
                      </td>
                      {selected.map((card, colIdx) => {
                        const val = values[colIdx]
                        const allVals = values.filter((v) => v != null) as number[]
                        // For fee and spend: lower is better; for the rest: higher is better
                        const lowerBetter = row.key === "annual_fee" || row.key === "bonus_spend_requirement"
                        const best = lowerBetter ? Math.min(...allVals) : Math.max(...allVals)
                        const isBest = val != null && val === best && allVals.length > 1

                        return (
                          <td
                            key={card.id}
                            className={`px-6 py-4 text-center text-sm border-x transition-colors ${
                              isLastRow ? "border-b rounded-b-2xl" : ""
                            } ${
                              card.id === bestCardId
                                ? "border-[#4edea3]/20 bg-[#4edea3]/5"
                                : "border-white/5 bg-surface-container"
                            }`}
                          >
                            <span
                              className={`font-semibold tabular-nums ${
                                isBest ? "text-[#4edea3]" : "text-on-surface"
                              }`}
                            >
                              {row.fmt(card)}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="py-20 text-center bg-surface-container rounded-2xl border border-white/5">
            <p className="font-headline text-xl font-bold text-on-surface mb-2">
              Select at least 2 cards to compare
            </p>
            <p className="text-on-surface-variant text-sm">
              Search for cards above and they&apos;ll appear side-by-side here.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  )
}
