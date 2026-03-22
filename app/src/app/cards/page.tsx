"use client"

import { useEffect, useMemo, useState } from "react"
import { Wifi } from "lucide-react"

import { AddCardForm } from "@/components/cards/AddCardForm"
import { CardFilters } from "@/components/cards/CardFilters"
import { type CardRecord } from "@/components/cards/CardGrid"
import { CardsEmptyState } from "@/components/cards/CardsEmptyState"
import { AppShell } from "@/components/layout/AppShell"
import { useCatalog } from "@/contexts/CatalogContext"
import { getBankGradient } from "@/lib/bank-gradients"
import { supabase } from "@/lib/supabase/client"

function CatalogCardThumb({ card, selected, onClick }: { card: CardRecord; selected: boolean; onClick: () => void }) {
  const gradient = getBankGradient(card.bank)
  const isLight = card.bank === "CommBank"
  const textColor = isLight ? "text-black/80" : "text-white"
  const textMuted = isLight ? "text-black/50" : "text-white/60"

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div
        className={`relative aspect-[1.586/1] w-full rounded-xl p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-primary/10 overflow-hidden${selected ? " ring-2 ring-primary" : ""}`}
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-50 mix-blend-overlay" />
        <div className={`flex justify-between items-start relative z-10 ${textColor}`}>
          <div className="text-xs font-bold tracking-[0.2em] text-white/80">{card.bank}</div>
          <Wifi className="h-4 w-4 rotate-90 opacity-40 text-white" />
        </div>
        <div className="flex justify-between items-end relative z-10">
          <div className={`text-sm font-headline font-bold tracking-widest ${textColor}`}>{card.name}</div>
          {card.welcome_bonus_points ? (
            <div className={`text-[10px] tabular-nums ${textMuted}`}>
              {card.welcome_bonus_points.toLocaleString()} {card.points_currency ?? "pts"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function CardsPage() {
  const { catalogCards: allCards, loading: catalogLoading } = useCatalog()
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [bank, setBank] = useState<string | null>(null)
  const [userCardCount, setUserCardCount] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardRecord | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = `/login?redirect=${encodeURIComponent("/cards")}`
        return
      }

      // Check if user has any tracked cards for empty state
      const { count } = await supabase
        .from("user_cards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
      setUserCardCount(count ?? 0)
      setLoading(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    // Map catalog cards to the CardRecord format
    if (allCards.length > 0) {
      const mapped = allCards.map(card => ({
        id: card.id,
        bank: card.bank,
        name: card.name,
        annual_fee: card.annual_fee,
        welcome_bonus_points: card.welcome_bonus_points,
        points_currency: card.points_currency,
        min_income: card.min_income
      }))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCards(mapped)
    }
  }, [allCards])

  const filtered = useMemo(() => {
    return cards.filter((card) => {
      const matchesBank = bank ? card.bank === bank : true
      const matchesSearch =
        !search ||
        card.name.toLowerCase().includes(search.toLowerCase()) ||
        card.bank.toLowerCase().includes(search.toLowerCase())
      return matchesBank && matchesSearch
    })
  }, [cards, bank, search])

  const uniqueBanks = useMemo(
    () => new Set(filtered.map((c) => c.bank)).size,
    [filtered],
  )

  return (
    <AppShell>
      {/* ── Header ── */}
      <header className="sticky top-0 w-full z-40 bg-[#0f131f]/50 backdrop-blur-md border-b border-white/5 -mx-4 md:-mx-8 px-4 md:px-0">
        <div className="flex items-center justify-between px-8 h-20 w-full max-w-[1440px] mx-auto">
          <div>
            <h1 className="font-headline text-2xl font-black bg-gradient-to-br from-[#4edea3] to-[#10b981] bg-clip-text text-transparent">
              Card Portfolio
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">
              {userCardCount !== null ? `${userCardCount} Active Lines of Credit` : "Card Catalog"}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="px-5 py-2 rounded-full bg-gradient-to-br from-[#4edea3] to-[#10b981] text-sm font-bold text-black hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            {showAddForm ? "Cancel" : "+ Add Card"}
          </button>
        </div>
      </header>

      {/* ── Value-driven empty state when no cards tracked yet ── */}
      {userCardCount === 0 && <CardsEmptyState />}

      {/* ── Add Card Form — collapsible ── */}
      {showAddForm && (
        <AddCardForm cards={cards} onCreated={() => {
          setUserCardCount((c) => (c ?? 0) + 1)
          setShowAddForm(false)
          window.location.href = '/dashboard';
        }} />
      )}

      <CardFilters
        cards={cards}
        onFilter={({ search, bank }) => {
          setSearch(search)
          setBank(bank)
        }}
      />

      {/* ── Mobile Layout (Stitch design) ── */}
      {!loading && (
        <div className="md:hidden space-y-8 pb-4">
          {/* Page header */}
          <div className="pt-2">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Card Portfolio
            </h2>
            <p className="text-on-surface-variant text-sm font-medium mt-1">
              {cards.length} Cards Available
              {filtered.length < cards.length ? ` • ${filtered.length} shown` : ""}
            </p>
          </div>

          {/* Horizontal wallet carousel */}
          <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 -mx-4 px-4 pb-2">
            {filtered.slice(0, 8).map((card) => {
              const gradient = getBankGradient(card.bank)
              const isLight = card.bank === "CommBank"
              const textMuted = isLight ? "text-black/50" : "text-white/70"
              const bonusPts = card.welcome_bonus_points ?? 0
              const feeLabel = card.annual_fee != null ? `$${card.annual_fee.toLocaleString()} annual fee` : "No annual fee"

              return (
                <button
                  key={card.id}
                  className={`snap-center shrink-0 w-[310px] aspect-[1.58/1] rounded-xl relative overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] p-6 flex flex-col justify-between text-left transition-all duration-200 ${
                    selectedCard?.id === card.id ? "ring-2 ring-primary" : ""
                  }`}
                  style={{ background: gradient }}
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="absolute inset-0 bg-white/5 mix-blend-overlay pointer-events-none" />
                  {/* Card top row */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                        {card.bank}
                      </p>
                      <p className="text-xs font-medium text-white/60 mt-0.5">{card.name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Active
                    </span>
                  </div>
                  {/* Card bottom row */}
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-bold font-headline text-white tabular-nums">
                        {bonusPts > 0 ? bonusPts.toLocaleString() : "—"}
                      </span>
                      {bonusPts > 0 && (
                        <span className="text-[10px] font-bold text-primary">
                          {card.points_currency ?? "pts"}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: bonusPts > 0 ? "75%" : "0%" }} />
                    </div>
                    <p className={`text-[10px] ${textMuted}`}>{feeLabel}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected card detail (if selected) */}
          {selectedCard && (
            <div className="bg-surface-container rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-on-surface">{selectedCard.name}</p>
                  <p className="text-xs text-on-surface-variant">{selectedCard.bank}</p>
                </div>
                <button
                  className="text-[10px] text-on-surface-variant hover:text-on-surface"
                  onClick={() => setSelectedCard(null)}
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selectedCard.welcome_bonus_points != null && (
                  <div className="bg-surface-container-high rounded-lg p-3">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Welcome Bonus</p>
                    <p className="text-base font-bold text-primary tabular-nums mt-1">
                      {selectedCard.welcome_bonus_points.toLocaleString()} {selectedCard.points_currency ?? "pts"}
                    </p>
                  </div>
                )}
                {selectedCard.annual_fee != null && (
                  <div className="bg-surface-container-high rounded-lg p-3">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Annual Fee</p>
                    <p className="text-base font-bold text-on-surface tabular-nums mt-1">
                      ${selectedCard.annual_fee.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Rewards — top cards by bonus */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-headline">
                Top Bonuses
              </h3>
              <span className="text-[10px] font-semibold text-on-surface-variant">
                {filtered.length} cards
              </span>
            </div>
            <div className="space-y-3">
              {filtered
                .filter((c) => c.welcome_bonus_points != null)
                .sort((a, b) => (b.welcome_bonus_points ?? 0) - (a.welcome_bonus_points ?? 0))
                .slice(0, 3)
                .map((card) => {
                  const gradient = getBankGradient(card.bank)
                  return (
                    <button
                      key={card.id}
                      className="w-full bg-surface-container rounded-xl p-4 flex items-center justify-between text-left active:bg-surface-container-high transition-colors"
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: gradient }}
                        >
                          {card.bank.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{card.name}</p>
                          <p className="text-xs text-on-surface-variant">{card.bank}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">
                          {(card.welcome_bonus_points ?? 0).toLocaleString()} pts
                        </p>
                        {card.annual_fee != null && (
                          <p className="text-[10px] text-on-surface-variant">${card.annual_fee.toLocaleString()} fee</p>
                        )}
                      </div>
                    </button>
                  )
                })}
            </div>
          </section>

          {/* Insights Bento */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant font-headline mb-4">
              Portfolio Insights
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
                <p className="text-primary text-xl font-bold">↑</p>
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                    Highest Bonus
                  </p>
                  <p className="text-lg font-bold text-on-surface tabular-nums">
                    {filtered.length > 0
                      ? `${Math.round(Math.max(...filtered.map((c) => c.welcome_bonus_points ?? 0)) / 1000)}k pts`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3">
                <p className="text-on-surface-variant text-xl font-bold">$</p>
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                    Banks Available
                  </p>
                  <p className="text-lg font-bold text-on-surface">{uniqueBanks}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Desktop: Stitch xl:col-span-8/4 grid ── */}
      <div className="hidden md:block">
        {loading ? (
          <div className="space-y-5">
            <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
            <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
          </div>
        ) : (
          <div className="p-8 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1440px] mx-auto w-full -mx-8">
            {/* Left col: xl:col-span-8 */}
            <div className="xl:col-span-8 space-y-10">
              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container p-6 rounded-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-2">Total Cards</div>
                    <div className="text-3xl font-headline font-bold tabular-nums text-on-surface">{cards.length}</div>
                  </div>
                </div>
                <div className="bg-surface-container p-6 rounded-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-2">Showing</div>
                    <div className="text-3xl font-headline font-bold tabular-nums text-primary">{filtered.length}</div>
                  </div>
                </div>
                <div className="bg-surface-container p-6 rounded-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest mb-2">Banks</div>
                    <div className="text-3xl font-headline font-bold tabular-nums text-on-surface">{uniqueBanks}</div>
                  </div>
                </div>
              </div>

              {/* Cards bento grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filtered.map((card) => (
                  <CatalogCardThumb
                    key={card.id}
                    card={card}
                    selected={selectedCard?.id === card.id}
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
              </div>
            </div>

            {/* Right col: xl:col-span-4 detail panel */}
            <aside className="xl:col-span-4 space-y-8">
              <section className="bg-surface-container rounded-lg p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full" />
                <h2 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">Card Details</h2>
                {selectedCard ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Bank</span>
                      <span className="text-sm font-bold">{selectedCard.bank}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Card</span>
                      <span className="text-sm font-bold">{selectedCard.name}</span>
                    </div>
                    {selectedCard.annual_fee != null && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Annual Fee</span>
                        <span className="text-sm font-bold tabular-nums">${selectedCard.annual_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedCard.welcome_bonus_points != null && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Welcome Bonus</span>
                        <span className="text-sm font-bold text-primary tabular-nums">
                          {selectedCard.welcome_bonus_points.toLocaleString()} {selectedCard.points_currency ?? "pts"}
                        </span>
                      </div>
                    )}
                    {selectedCard.min_income != null && (
                      <div className="flex justify-between items-center pb-4">
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Min Income</span>
                        <span className="text-sm font-bold tabular-nums">${selectedCard.min_income.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant mt-4">Select a card to view details</p>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
