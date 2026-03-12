"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { AddCardForm } from "@/components/cards/AddCardForm"
import { CardFilters } from "@/components/cards/CardFilters"
import { CardGrid, type CardRecord } from "@/components/cards/CardGrid"
import { AppShell } from "@/components/layout/AppShell"
import { useCatalog } from "@/contexts/CatalogContext"
import { supabase } from "@/lib/supabase/client"

export default function CardsPage() {
  const { catalogCards: allCards, loading: catalogLoading } = useCatalog()
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [bank, setBank] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = `/login?redirect=${encodeURIComponent("/cards")}`
        return
      }
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

        <AddCardForm cards={cards} onCreated={() => {
          // Redirect to dashboard to see the newly added card
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
