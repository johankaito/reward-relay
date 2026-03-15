"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { AddCardForm } from "@/components/cards/AddCardForm"
import { CardFilters } from "@/components/cards/CardFilters"
import { CardGrid, type CardRecord } from "@/components/cards/CardGrid"
import { CardsEmptyState } from "@/components/cards/CardsEmptyState"
import { AppShell } from "@/components/layout/AppShell"
import { useCatalog } from "@/contexts/CatalogContext"
import { supabase } from "@/lib/supabase/client"

export default function CardsPage() {
  const { catalogCards: allCards, loading: catalogLoading } = useCatalog()
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [bank, setBank] = useState<string | null>(null)
  const [userCardCount, setUserCardCount] = useState<number | null>(null)

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Cards
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            Australian cards
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
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

        {loading ? (
          <div className="space-y-5">
            <div className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
            <div className="h-48 animate-pulse rounded-xl bg-[var(--surface)]" />
          </div>
        ) : (
          <CardGrid cards={filtered} />
        )}
      </div>
    </AppShell>
  )
}
