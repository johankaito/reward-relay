"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { AddCardForm } from "@/components/cards/AddCardForm"
import { CardFilters } from "@/components/cards/CardFilters"
import { CardGrid, type CardRecord } from "@/components/cards/CardGrid"
import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"

export default function CardsPage() {
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [bank, setBank] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = `/login?redirect=${encodeURIComponent("/cards")}`
        return
      }

      const { data, error } = await supabase
        .from("cards")
        .select("id, bank, name, annual_fee, welcome_bonus_points, points_currency, min_income")
        .order("bank", { ascending: true })
      if (error) {
        toast.error(error.message || "Failed to load cards")
        setLoading(false)
        return
      }
      setCards(data || [])
      setLoading(false)
    }
    void load()
  }, [])

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
        <div className="overflow-hidden rounded-3xl border border-[var(--border-default)]/80 bg-[var(--surface)] p-6 shadow-md">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
              Catalog
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-white">
                  Australian cards
                </h1>
                <p className="text-sm text-slate-300">
                  Search, filter, and track a card. Start with your AMEX + next churn target.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--accent-strong)] ring-1 ring-[color:var(--ring-strong)]/30">
                30 cards seeded
              </div>
            </div>
          </div>
        </div>

        <AddCardForm cards={cards} />

        <CardFilters
          cards={cards}
          onFilter={({ search, bank }) => {
            setSearch(search)
            setBank(bank)
          }}
        />

        {loading ? (
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] p-6 text-sm text-slate-200 shadow-sm">
            Loading cards...
          </div>
        ) : (
          <CardGrid cards={filtered} />
        )}
      </div>
    </AppShell>
  )
}
