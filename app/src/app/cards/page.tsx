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
            <p className="text-xs text-slate-500 font-medium">
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

      {/* ── Mobile carousel ── */}
      {!loading && (
        <div className="md:hidden">
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {filtered.map((card) => (
              <div key={card.id} className="min-w-[310px] shrink-0 snap-start">
                <CatalogCardThumb
                  card={card}
                  selected={selectedCard?.id === card.id}
                  onClick={() => setSelectedCard(card)}
                />
                <p className="mt-2 truncate text-sm font-medium text-on-surface">{card.name}</p>
                <p className="text-xs text-on-surface-variant">{card.bank}</p>
              </div>
            ))}
          </div>
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
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Total Cards</div>
                    <div className="text-3xl font-headline font-bold tabular-nums text-on-surface">{cards.length}</div>
                  </div>
                </div>
                <div className="bg-surface-container p-6 rounded-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Showing</div>
                    <div className="text-3xl font-headline font-bold tabular-nums text-primary">{filtered.length}</div>
                  </div>
                </div>
                <div className="bg-surface-container p-6 rounded-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-2">Banks</div>
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
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bank</span>
                      <span className="text-sm font-bold">{selectedCard.bank}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Card</span>
                      <span className="text-sm font-bold">{selectedCard.name}</span>
                    </div>
                    {selectedCard.annual_fee != null && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Annual Fee</span>
                        <span className="text-sm font-bold tabular-nums">${selectedCard.annual_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedCard.welcome_bonus_points != null && (
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Welcome Bonus</span>
                        <span className="text-sm font-bold text-primary tabular-nums">
                          {selectedCard.welcome_bonus_points.toLocaleString()} {selectedCard.points_currency ?? "pts"}
                        </span>
                      </div>
                    )}
                    {selectedCard.min_income != null && (
                      <div className="flex justify-between items-center pb-4">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Min Income</span>
                        <span className="text-sm font-bold tabular-nums">${selectedCard.min_income.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-4">Select a card to view details</p>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  )
}
