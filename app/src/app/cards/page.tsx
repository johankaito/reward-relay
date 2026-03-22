"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Wifi } from "lucide-react"
import { toast } from "sonner"

import { AddCardForm } from "@/components/cards/AddCardForm"
import { CardFilters } from "@/components/cards/CardFilters"
import { CardGrid, type CardRecord } from "@/components/cards/CardGrid"
import { CardsEmptyState } from "@/components/cards/CardsEmptyState"
import { AppShell } from "@/components/layout/AppShell"
import { useCatalog } from "@/contexts/CatalogContext"
import { getBankGradient } from "@/lib/bank-gradients"
import { supabase } from "@/lib/supabase/client"

function CatalogCardThumb({ card }: { card: CardRecord }) {
  const gradient = getBankGradient(card.bank)
  const isLight = card.bank === "CommBank"
  const textColor = isLight ? "text-black/80" : "text-white"
  const textMuted = isLight ? "text-black/50" : "text-white/60"

  return (
    <div
      className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-xl p-5"
      style={{ background: gradient, boxShadow: "var(--shadow-card)" }}
    >
      <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
      <div className={`relative z-10 flex items-start justify-between ${textColor}`}>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{card.bank}</span>
        <Wifi className="h-4 w-4 rotate-90 opacity-40" />
      </div>
      <div className="relative z-10">
        <p className={`font-headline text-sm font-bold tracking-wide ${textColor}`}>{card.name}</p>
        {card.welcome_bonus_points ? (
          <p className={`mt-0.5 tabular-nums text-[10px] ${textMuted}`}>
            {card.welcome_bonus_points.toLocaleString()} {card.points_currency ?? "pts"}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface-container p-4">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline tabular-nums text-3xl font-extrabold text-primary">{value}</p>
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
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Cards
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-on-surface">
            Australian cards
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Search, filter, and start tracking a card.
          </p>
        </div>

        {/* Value-driven empty state when no cards tracked yet */}
        {userCardCount === 0 && <CardsEmptyState />}

        <AddCardForm cards={cards} onCreated={() => {
          setUserCardCount((c) => (c ?? 0) + 1)
          window.location.href = '/dashboard';
        }} />

        <CardFilters
          cards={cards}
          onFilter={({ search, bank }) => {
            setSearch(search)
            setBank(bank)
          }}
        />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Cards" value={cards.length} />
          <StatCard label="Showing" value={filtered.length} />
          <StatCard label="Banks" value={uniqueBanks} />
        </div>

        {loading ? (
          <div className="space-y-5">
            <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
            <div className="h-48 animate-pulse rounded-xl bg-surface-container" />
          </div>
        ) : (
          <>
            {/* Mobile carousel */}
            <div className="md:hidden">
              <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                {filtered.map((card) => (
                  <div key={card.id} className="min-w-[310px] shrink-0 snap-start" style={{ minWidth: "310px" }}>
                    <CatalogCardThumb card={card} />
                    <p className="mt-2 truncate text-sm font-medium text-on-surface">{card.name}</p>
                    <p className="text-xs text-on-surface-variant">{card.bank}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: 12-col split — grid + detail aside */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-6">
              {/* Left col: card grid */}
              <div className="md:col-span-8">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filtered.map((card) => (
                    <button
                      key={card.id}
                      className="w-full text-left"
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className={`transition-all ${selectedCard?.id === card.id ? "ring-2 ring-primary rounded-2xl" : ""}`}>
                        <CatalogCardThumb card={card} />
                        <p className="mt-2 truncate text-sm font-medium text-on-surface">{card.name}</p>
                        <p className="text-xs text-on-surface-variant">{card.bank}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right col: detail aside */}
              <aside className="md:col-span-4">
                <div
                  className="sticky top-6 rounded-2xl p-6"
                  style={{ backgroundColor: "#1b1f2c", border: "1px solid rgba(78,222,163,0.1)" }}
                >
                  <h3 className="mb-4 text-lg font-bold text-on-surface">Card Details</h3>
                  {selectedCard ? (
                    <div className="space-y-4">
                      <CatalogCardThumb card={selectedCard} />
                      <div className="space-y-3 pt-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Bank</p>
                          <p className="mt-0.5 text-sm font-semibold text-on-surface">{selectedCard.bank}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Card</p>
                          <p className="mt-0.5 text-sm font-semibold text-on-surface">{selectedCard.name}</p>
                        </div>
                        {selectedCard.welcome_bonus_points != null && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Welcome Bonus</p>
                            <p className="mt-0.5 text-sm font-bold text-primary tabular-nums">
                              {selectedCard.welcome_bonus_points.toLocaleString()} {selectedCard.points_currency ?? "pts"}
                            </p>
                          </div>
                        )}
                        {selectedCard.annual_fee != null && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Annual Fee</p>
                            <p className="mt-0.5 text-sm font-semibold text-on-surface tabular-nums">
                              ${selectedCard.annual_fee.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedCard.min_income != null && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Min Income</p>
                            <p className="mt-0.5 text-sm font-semibold text-on-surface tabular-nums">
                              ${selectedCard.min_income.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">Select a card to view details</p>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
