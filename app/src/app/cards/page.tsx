"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CreditCard, Plus } from "lucide-react"

import { AddCardForm } from "@/components/cards/AddCardForm"
import type { CardRecord } from "@/components/cards/CardGrid"
import { AppShell } from "@/components/layout/AppShell"
import { useCatalog } from "@/contexts/CatalogContext"
import { getBankGradient } from "@/lib/bank-gradients"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]
type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

// UserCard enriched with joined catalog card data
type UserCardWithCatalog = UserCard & { card: CatalogCard | null }

function getCardStatus(card: UserCard): "ACTIVE" | "BEHIND" | "CANCEL SOON" {
  if (card.cancellation_date) {
    const daysLeft = (new Date(card.cancellation_date).getTime() - Date.now()) / 86_400_000
    if (daysLeft >= 0 && daysLeft <= 30) return "CANCEL SOON"
  }
  if (!card.bonus_earned && card.bonus_spend_deadline && card.application_date) {
    const total = new Date(card.bonus_spend_deadline).getTime() - new Date(card.application_date).getTime()
    const elapsed = Date.now() - new Date(card.application_date).getTime()
    const expectedPct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0
    // We don't know the target here without catalog, so just use deadline proximity
    const daysLeft = (new Date(card.bonus_spend_deadline).getTime() - Date.now()) / 86_400_000
    if (daysLeft < 14 && daysLeft >= 0) return "BEHIND"
  }
  return "ACTIVE"
}

function statusColor(status: string) {
  if (status === "CANCEL SOON") return "text-[#ffb4ab]"
  if (status === "BEHIND") return "text-yellow-400"
  return "text-[#4edea3]"
}

function statusDot(status: string) {
  if (status === "CANCEL SOON") return "bg-[#ffb4ab]"
  if (status === "BEHIND") return "bg-yellow-400"
  return "bg-[#4edea3]"
}

export default function CardsPage() {
  const router = useRouter()
  const { catalogCards } = useCatalog()
  const [userCards, setUserCards] = useState<UserCardWithCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCard, setSelectedCard] = useState<UserCardWithCatalog | null>(null)
  const [catalogMap, setCatalogMap] = useState<Map<string, CatalogCard>>(new Map())

  useEffect(() => {
    if (catalogCards.length > 0) {
      setCatalogMap(new Map(catalogCards.map((c) => [c.id, c])))
    }
  }, [catalogCards])

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent("/cards")}`)
        return
      }

      const { data, error } = await supabase
        .from("user_cards")
        .select(
          "id, bank, name, current_spend, application_date, bonus_spend_deadline, cancellation_date, bonus_earned, bonus_earned_at, annual_fee, status, card_id, created_at, user_id, notes, approval_date, next_eligible_date, spend_updated_at, alert_enabled, bonus_earned_suggested, is_business, card:cards(id, name, bank, bonus_spend_requirement, welcome_bonus_points, points_currency, annual_fee)"
        )
        .order("created_at", { ascending: false })

      if (error) {
        toast.error(error.message || "Unable to load cards")
        setLoading(false)
        return
      }

      const rows = (data ?? []) as unknown as UserCardWithCatalog[]
      setUserCards(rows)
      if (rows.length > 0) {
        setSelectedCard(rows[0])
      }
      setLoading(false)
    }
    load()
  }, [router])

  // Derived catalog card info — prefer joined card data, fall back to catalogMap
  const getCatalogCard = (uc: UserCardWithCatalog) => uc.card ?? (uc.card_id ? catalogMap.get(uc.card_id) : undefined)

  // Stats
  const stats = useMemo(() => {
    let totalLimit = 0
    let totalSpend = 0
    let totalPoints = 0
    for (const uc of userCards) {
      totalSpend += uc.current_spend ?? 0
      const cc = getCatalogCard(uc)
      if (cc?.welcome_bonus_points) totalPoints += cc.welcome_bonus_points
    }
    return { totalLimit, totalSpend, totalPoints, count: userCards.length }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCards, catalogMap])

  const activeCount = userCards.filter((c) => c.status === "active").length

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-20 animate-pulse rounded-xl bg-surface-container" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-container" />)}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* ── Header ── */}
      <header className="sticky top-0 w-full z-40 bg-background/50 backdrop-blur-md border-b border-white/5 -mx-4 md:-mx-8 px-4 md:px-0 mb-8">
        <div className="flex items-center justify-between px-4 md:px-8 h-20 w-full max-w-[1440px] mx-auto">
          <div>
            <h1 className="font-headline text-2xl font-black bg-gradient-to-br from-[#4edea3] to-[#10b981] bg-clip-text text-transparent">
              Card Portfolio
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">
              {activeCount} Active Line{activeCount !== 1 ? "s" : ""} of Credit
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-black shadow-lg shadow-[#4edea3]/20 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)" }}
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? "Cancel" : "Add Card"}
          </button>
        </div>
      </header>

      {/* ── Add Card Form ── */}
      {showAddForm && (
        <div className="mb-8">
          <AddCardForm
            cards={catalogCards.map((c) => ({
              id: c.id,
              bank: c.bank,
              name: c.name,
              annual_fee: c.annual_fee,
              welcome_bonus_points: c.welcome_bonus_points,
              points_currency: c.points_currency,
              min_income: c.min_income,
            }))}
            onCreated={() => {
              setShowAddForm(false)
              // Reload user cards
              supabase
                .from("user_cards")
                .select(
                  "id, bank, name, current_spend, application_date, bonus_spend_deadline, cancellation_date, bonus_earned, bonus_earned_at, annual_fee, status, card_id, created_at, user_id, notes, approval_date, next_eligible_date, spend_updated_at, alert_enabled, bonus_earned_suggested, is_business, card:cards(id, name, bank, bonus_spend_requirement, welcome_bonus_points, points_currency, annual_fee)"
                )
                .order("created_at", { ascending: false })
                .then(({ data }) => {
                  if (data) {
                    const rows = data as unknown as UserCardWithCatalog[]
                    setUserCards(rows)
                    if (rows.length > 0) setSelectedCard(rows[0])
                  }
                })
            }}
          />
        </div>
      )}

      {/* ── Empty state ── */}
      {userCards.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
            <CreditCard className="h-10 w-10 text-on-surface-variant" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Add your first card</h2>
            <p className="text-on-surface-variant text-sm max-w-sm">
              Track your credit cards, monitor bonus spend progress, and see your points portfolio at a glance.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 rounded-full font-bold text-sm text-black shadow-lg shadow-[#4edea3]/20"
            style={{ background: "linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)" }}
          >
            + Add your first card
          </button>
        </div>
      )}

      {/* ── Main portfolio grid ── */}
      {userCards.length > 0 && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="glass-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CreditCard className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-2">Total Cards</div>
                <div className="text-3xl font-headline font-bold tabular-nums text-on-surface">{userCards.length}</div>
              </div>
            </div>
            <div className="glass-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-[#4edea3]">
                <span className="text-8xl font-bold">$</span>
              </div>
              <div className="relative z-10">
                <div className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-2">Monthly Spend</div>
                <div className="text-3xl font-headline font-bold tabular-nums text-[#4edea3]">
                  ${stats.totalSpend.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            <div className="glass-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-tertiary">
                <span className="text-8xl font-bold">✦</span>
              </div>
              <div className="relative z-10">
                <div className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-2">Points Potential</div>
                <div className="text-3xl font-headline font-bold tabular-nums text-tertiary">
                  {stats.totalPoints >= 1000 ? `${(stats.totalPoints / 1000).toFixed(0)}k` : stats.totalPoints.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* xl: two-column grid layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left: card grid xl:col-span-8 */}
            <div className="xl:col-span-8">
              {/* Mobile: snap-scroll horizontal carousel; md+: grid */}
              <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-none md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 pb-3 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
                {userCards.map((uc) => {
                  const cc = getCatalogCard(uc)
                  const gradient = getBankGradient(uc.bank ?? "")
                  const isLight = uc.bank === "CommBank" || uc.bank === "CBA"
                  const textColor = isLight ? "rgba(0,0,0,0.9)" : "white"
                  const textMuted = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)"
                  const spendTarget = cc?.bonus_spend_requirement ?? 0
                  const currentSpend = uc.current_spend ?? 0
                  const pct = spendTarget > 0 ? Math.min(100, Math.round((currentSpend / spendTarget) * 100)) : 0
                  const hasBonus = spendTarget > 0 && !uc.bonus_earned
                  const cardStatus = getCardStatus(uc)
                  const isSelected = selectedCard?.id === uc.id

                  return (
                    <div
                      key={uc.id}
                      className={`snap-center shrink-0 min-w-[300px] md:min-w-0 md:w-auto max-w-[320px] md:max-w-none group cursor-pointer${isSelected ? " ring-2 ring-primary rounded-xl" : ""}`}
                      onClick={() => setSelectedCard(uc)}
                    >
                      {/* Card artwork tile */}
                      <div
                        className="relative w-full p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[#4edea3]/10 overflow-hidden"
                        style={{ background: gradient, aspectRatio: "1.586/1", borderRadius: "1rem" }}
                      >
                        <div className="absolute inset-0 bg-white/5 opacity-50 mix-blend-overlay" />
                        <div className="flex justify-between items-start relative z-10">
                          <div className="text-xs font-bold tracking-[0.2em]" style={{ color: textMuted }}>
                            {(uc.bank ?? "").toUpperCase()}
                          </div>
                          <span style={{ color: textMuted, fontSize: "1rem" }}>◎</span>
                        </div>
                        <div className="flex justify-between items-end relative z-10">
                          <div className="text-sm font-headline font-bold tracking-widest" style={{ color: textColor }}>
                            •••• •••• •••• ––––
                          </div>
                          <div className="text-[10px] font-bold italic" style={{ color: textColor }}>
                            {uc.bank}
                          </div>
                        </div>
                      </div>

                      {/* Card meta row below artwork */}
                      <div className="mt-4 px-2 flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-on-surface">{uc.bank} {uc.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${statusDot(cardStatus)}`} />
                            <span className={`text-[10px] font-semibold uppercase ${statusColor(cardStatus)}`}>
                              {uc.bonus_earned ? "Bonus Earned" : cardStatus}
                            </span>
                          </div>
                        </div>
                        {hasBonus && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-[#4edea3] tabular-nums">
                              ${currentSpend.toLocaleString()} / ${spendTarget.toLocaleString()}
                            </div>
                            <div className="w-24 h-2.5 bg-surface-container-highest rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-[#4edea3] rounded-full" style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(78,222,163,0.3)" }} />
                            </div>
                          </div>
                        )}
                        {uc.bonus_earned && cc?.welcome_bonus_points && (
                          <div className="text-right">
                            <div className="text-xs font-bold text-[#4edea3] tabular-nums">
                              {(cc.welcome_bonus_points / 1000).toFixed(0)}k pts
                            </div>
                            <div className="text-[10px] text-on-surface-variant">Earned</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Add another card */}
                <div
                  className="snap-center shrink-0 min-w-[300px] md:min-w-0 md:w-auto max-w-[320px] md:max-w-none border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/[0.02] transition-colors group"
                  style={{ aspectRatio: "1.586/1" }}
                  onClick={() => setShowAddForm(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <span className="text-sm font-bold text-on-surface-variant">Add Another Card</span>
                </div>
              </div>
            </div>

            {/* Right: detail panel xl:col-span-4 */}
            <aside className="xl:col-span-4 space-y-8">
              <section className="bg-surface-container rounded-lg p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/10 blur-[80px] rounded-full" />
                <h2 className="font-headline text-lg font-bold mb-6 flex items-center gap-2 text-on-surface">
                  <CreditCard className="h-5 w-5 text-[#4edea3]" />
                  Card Details
                </h2>

                {selectedCard ? (
                  <div className="space-y-5">
                    {/* Card preview mini */}
                    <div
                      className="w-full p-5 relative overflow-hidden"
                      style={{ background: getBankGradient(selectedCard.bank ?? ""), aspectRatio: "1.586/1", borderRadius: "1rem" }}
                    >
                      <div className="absolute inset-0 bg-white/5 opacity-50 mix-blend-overlay" />
                      <div className="relative z-10 flex justify-between items-start">
                        <span className="text-xs font-bold text-white/80 tracking-widest uppercase">{selectedCard.bank}</span>
                        <span className="text-white/40">◎</span>
                      </div>
                      <div className="relative z-10 absolute bottom-5 left-5 right-5">
                        <div className="text-sm font-bold text-white tracking-widest">•••• •••• •••• ––––</div>
                        <div className="text-[10px] text-white/60 mt-1 uppercase tracking-wider">
                          {selectedCard.bank} {selectedCard.name}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedCard.annual_fee != null && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Annual Fee</span>
                          <span className="text-sm font-bold tabular-nums text-on-surface">${selectedCard.annual_fee.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedCard.application_date && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Applied</span>
                          <span className="text-sm font-bold tabular-nums text-on-surface">
                            {new Date(selectedCard.application_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {selectedCard.bonus_spend_deadline && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Bonus Deadline</span>
                          <span className="text-sm font-bold tabular-nums text-on-surface">
                            {new Date(selectedCard.bonus_spend_deadline).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {selectedCard.cancellation_date && (
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Cancel By</span>
                          <span className="text-sm font-bold tabular-nums text-[#ffb4ab]">
                            {new Date(selectedCard.cancellation_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {selectedCard.status && (
                        <div className="flex justify-between items-center pb-2">
                          <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Status</span>
                          <span className="text-sm font-bold capitalize text-on-surface">{selectedCard.status}</span>
                        </div>
                      )}
                    </div>

                    {/* Bonus progress */}
                    {(() => {
                      const cc = getCatalogCard(selectedCard)
                      const target = cc?.bonus_spend_requirement ?? 0
                      const current = selectedCard.current_spend ?? 0
                      const bonusPts = cc?.welcome_bonus_points ?? 0
                      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
                      const daysLeft = selectedCard.bonus_spend_deadline
                        ? Math.max(0, Math.ceil((new Date(selectedCard.bonus_spend_deadline).getTime() - Date.now()) / 86400000))
                        : null

                      if (!selectedCard.bonus_earned && target > 0) {
                        return (
                          <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 mt-4">
                            <div className="text-xs font-bold mb-3 flex items-center gap-2 text-on-surface">
                              ✦ Bonus Progress
                            </div>
                            <div className="flex justify-between text-[10px] text-on-surface-variant mb-2 uppercase tracking-tighter">
                              <span>${current.toLocaleString()} Spent</span>
                              <span>${target.toLocaleString()} Target</span>
                            </div>
                            <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: "linear-gradient(to right, var(--primary-container), var(--primary))", boxShadow: "0 0 12px rgba(78,222,163,0.3)" }}
                              />
                            </div>
                            {daysLeft !== null && bonusPts > 0 && (
                              <div className="mt-3 text-[10px] text-center text-on-surface-variant italic">
                                Spend ${(target - current).toLocaleString()} more by {daysLeft}d to unlock {(bonusPts / 1000).toFixed(0)}k points
                              </div>
                            )}
                          </div>
                        )
                      }

                      if (selectedCard.bonus_earned && bonusPts > 0) {
                        return (
                          <div className="bg-[#4edea3]/10 border border-[#4edea3]/20 p-4 rounded-xl mt-4 text-center">
                            <div className="text-[#4edea3] font-bold text-sm">
                              {(bonusPts / 1000).toFixed(0)}k bonus points earned!
                            </div>
                          </div>
                        )
                      }

                      return null
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Select a card to view details</p>
                )}
              </section>

              {/* Browse catalog link */}
              <div className="text-center">
                <Link
                  href="/cards/catalog"
                  className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-widest"
                >
                  Browse Card Catalog →
                </Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  )
}
