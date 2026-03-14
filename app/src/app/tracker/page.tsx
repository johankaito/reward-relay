"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Wallet } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { SpendProgressBar } from "@/components/tracker/SpendProgressBar"
import { supabase } from "@/lib/supabase/client"
import { calculatePace } from "@/lib/spendPace"

type TrackerCard = {
  id: string
  bank: string | null
  name: string | null
  current_spend: number | null
  application_date: string | null
  bonus_spend_deadline: string | null
  bonus_earned: boolean
  card: {
    bonus_spend_requirement: number | null
    name: string
    bank: string
  } | null
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
}

export default function TrackerPage() {
  const [cards, setCards] = useState<TrackerCard[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const today = new Date().toISOString().split("T")[0]

      const { data } = await supabase
        .from("user_cards")
        .select("id, bank, name, current_spend, application_date, bonus_spend_deadline, bonus_earned, card:cards(bonus_spend_requirement, name, bank)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("bonus_earned", false)
        .not("bonus_spend_deadline", "is", null)
        .gte("bonus_spend_deadline", today)

      if (data) {
        const sorted = [...data].sort((a, b) => {
          const aPace = a.application_date && a.bonus_spend_deadline && a.card?.bonus_spend_requirement
            ? calculatePace(a.current_spend ?? 0, a.card.bonus_spend_requirement, a.application_date, a.bonus_spend_deadline).paceStatus
            : "on_track"
          const bPace = b.application_date && b.bonus_spend_deadline && b.card?.bonus_spend_requirement
            ? calculatePace(b.current_spend ?? 0, b.card.bonus_spend_requirement, b.application_date, b.bonus_spend_deadline).paceStatus
            : "on_track"

          const priority = { will_miss: 0, behind: 1, on_track: 2, completed: 3 } as const
          const aPri = priority[aPace as keyof typeof priority] ?? 2
          const bPri = priority[bPace as keyof typeof priority] ?? 2

          if (aPri !== bPri) return aPri - bPri
          return (a.bonus_spend_deadline ?? "").localeCompare(b.bonus_spend_deadline ?? "")
        })
        setCards(sorted as TrackerCard[])
      }
      setLoading(false)
    }
    load()
  }, [])

  // Summary metrics
  const activeCount = cards.length
  const behindCount = cards.filter((c) => {
    if (!c.application_date || !c.bonus_spend_deadline || !c.card?.bonus_spend_requirement) return false
    const p = calculatePace(c.current_spend ?? 0, c.card.bonus_spend_requirement, c.application_date, c.bonus_spend_deadline)
    return p.paceStatus === "behind" || p.paceStatus === "will_miss"
  }).length
  const totalRemaining = cards.reduce((sum, c) => {
    if (!c.card?.bonus_spend_requirement) return sum
    return sum + Math.max(0, c.card.bonus_spend_requirement - (c.current_spend ?? 0))
  }, 0)

  // ProGate: show only most recent card for free users, all for pro
  // Defaulting to pro (all cards shown) until billing is implemented
  const visibleCards = cards
  const hiddenCards: TrackerCard[] = []

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-48 items-center justify-center text-[var(--text-secondary)]">
          Loading…
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Spending Tracker</h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Track min-spend progress for your active bonus windows
          </p>
        </div>

        {/* Summary strip */}
        {cards.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{activeCount}</p>
              <p className="text-xs text-[var(--text-secondary)]">Active windows</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--danger,#dc2626)]">{behindCount}</p>
              <p className="text-xs text-[var(--text-secondary)]">Behind pace</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(totalRemaining)}</p>
              <p className="text-xs text-[var(--text-secondary)]">Total remaining</p>
            </div>
          </div>
        )}

        {/* Card list */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface)] py-16 text-center">
            <Wallet className="mb-3 h-10 w-10 text-[var(--text-secondary)]/40" />
            <p className="font-medium text-[var(--text-primary)]">No active spend windows</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Add a card with a bonus spend requirement to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleCards.map((card) => {
              const requirement = card.card?.bonus_spend_requirement ?? 0
              const cardName = card.name ?? card.card?.name ?? "Card"
              const bank = card.bank ?? card.card?.bank ?? ""

              if (!card.application_date || !card.bonus_spend_deadline || !requirement) return null

              return (
                <Link
                  key={card.id}
                  href={`/tracker/${card.id}`}
                  className="block rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-subtle)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{cardName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{bank}</p>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Due {new Date(card.bonus_spend_deadline).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <SpendProgressBar
                    currentSpend={card.current_spend ?? 0}
                    requirement={requirement}
                    applicationDate={card.application_date}
                    deadline={card.bonus_spend_deadline}
                    variant="compact"
                  />
                </Link>
              )
            })}

            {/* Blurred Pro gate for hidden cards */}
            {hiddenCards.map((card) => (
              <div key={card.id} className="relative overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
                <div className="pointer-events-none blur-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{card.name ?? "Card"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{card.bank ?? ""}</p>
                    </div>
                  </div>
                  <div className="h-4 w-full rounded bg-[var(--surface-strong)]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
                    Pro
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
