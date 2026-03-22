"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CreditCard, Plus, Wallet } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"
import { calculatePace } from "@/lib/spendPace"

type TrackerCard = {
  id: string
  bank: string | null
  name: string | null
  current_spend: number | null
  application_date: string | null
  bonus_spend_deadline: string | null
  cancellation_date: string | null
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

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

type CardStatus = "cancel_soon" | "behind" | "eligible" | "active"

function getCardStatus(card: TrackerCard): CardStatus {
  const { application_date, bonus_spend_deadline, card: catalogCard, current_spend } = card
  if (!application_date || !bonus_spend_deadline || !catalogCard?.bonus_spend_requirement) return "active"

  const today = new Date().toISOString().split("T")[0]
  const daysLeft = daysBetween(today, bonus_spend_deadline)

  if (daysLeft <= 30) return "cancel_soon"

  const pace = calculatePace(current_spend ?? 0, catalogCard.bonus_spend_requirement, application_date, bonus_spend_deadline)
  if (pace.paceStatus === "will_miss" || pace.paceStatus === "behind") return "behind"

  // 12-month eligibility window check
  const monthsElapsed = daysBetween(application_date, today) / 30
  if (monthsElapsed >= 12) return "eligible"

  return "active"
}

function statusBadge(status: CardStatus) {
  switch (status) {
    case "cancel_soon":
      return (
        <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold tracking-[0.08em] uppercase border border-destructive/20">
          Cancel Soon
        </span>
      )
    case "behind":
      return (
        <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-bold tracking-[0.08em] uppercase border border-amber-400/20">
          Behind
        </span>
      )
    case "eligible":
      return (
        <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold tracking-[0.08em] uppercase border border-secondary/20">
          Eligible
        </span>
      )
    default:
      return (
        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-[0.08em] uppercase border border-primary/20">
          Active
        </span>
      )
  }
}

export default function TrackerPage() {
  const [cards, setCards] = useState<TrackerCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const today = new Date().toISOString().split("T")[0]

      const { data } = await supabase
        .from("user_cards")
        .select("id, bank, name, current_spend, application_date, bonus_spend_deadline, cancellation_date, bonus_earned, card:cards(bonus_spend_requirement, name, bank)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("bonus_earned", false)
        .not("bonus_spend_deadline", "is", null)
        .gte("bonus_spend_deadline", today)

      if (data) {
        const priorityMap = { cancel_soon: 0, behind: 1, eligible: 2, active: 3 } as const
        const sorted = [...data].sort((a, b) => {
          const aStatus = getCardStatus(a as TrackerCard)
          const bStatus = getCardStatus(b as TrackerCard)
          const aPri = priorityMap[aStatus]
          const bPri = priorityMap[bStatus]
          if (aPri !== bPri) return aPri - bPri
          return (a.bonus_spend_deadline ?? "").localeCompare(b.bonus_spend_deadline ?? "")
        })
        setCards(sorted as TrackerCard[])
      }
      setLoading(false)
    }
    load()
  }, [])

  const activeCount = cards.length
  const behindCount = useMemo(() =>
    cards.filter((c) => {
      const s = getCardStatus(c)
      return s === "behind" || s === "cancel_soon"
    }).length,
    [cards]
  )
  const totalRemaining = useMemo(() =>
    cards.reduce((sum, c) => {
      if (!c.card?.bonus_spend_requirement) return sum
      return sum + Math.max(0, c.card.bonus_spend_requirement - (c.current_spend ?? 0))
    }, 0),
    [cards]
  )

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero Section */}
        <section>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl lg:text-5xl">
            Your Churn{" "}
            <span className="text-primary">Command Centre</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {activeCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                {activeCount} Active Track{activeCount !== 1 ? "s" : ""}
              </span>
            ) : null}
            <p className="text-on-surface-variant">
              {activeCount > 0
                ? `${behindCount > 0 ? `${behindCount} behind pace · ` : ""}${fmt(totalRemaining)} total remaining spend`
                : "No active bonus windows"}
            </p>
          </div>
        </section>

        {/* Timeline Section */}
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-surface-container py-16 text-center">
            <Wallet className="mb-3 h-10 w-10 text-on-surface-variant/40" />
            <p className="font-semibold text-on-surface">No active spend windows</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Add a card with a bonus spend requirement to get started.
            </p>
            <Link
              href="/cards"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Browse cards
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-12 gap-8 px-8 text-[10px] font-bold text-on-surface-variant tracking-[0.1em] uppercase">
              <div className="col-span-3">Card Identity</div>
              <div className="col-span-6">Application → Eligibility → Deadline Timeline</div>
              <div className="col-span-3 text-right">Status</div>
            </div>

            {/* Timeline rows */}
            {cards.map((card) => {
              const requirement = card.card?.bonus_spend_requirement ?? 0
              const cardName = card.name ?? card.card?.name ?? "Card"
              const bank = card.bank ?? card.card?.bank ?? ""

              if (!card.application_date || !card.bonus_spend_deadline || !requirement) return null

              const today = new Date().toISOString().split("T")[0]
              const totalDays = Math.max(1, daysBetween(card.application_date, card.bonus_spend_deadline))
              const daysPassed = Math.max(0, daysBetween(card.application_date, today))
              const progressPct = Math.min(100, Math.round((daysPassed / totalDays) * 100))
              const daysLeft = daysBetween(today, card.bonus_spend_deadline)
              const status = getCardStatus(card)

              // Timeline milestone: eligibility at ~70% of the window
              const eligibilityPct = Math.min(85, Math.round((365 / totalDays) * 100))

              const appliedLabel = new Date(card.application_date).toLocaleDateString("en-AU", {
                month: "short",
                year: "2-digit",
              }).toUpperCase()
              const deadlineLabel = new Date(card.bonus_spend_deadline).toLocaleDateString("en-AU", {
                month: "short",
                year: "2-digit",
              }).toUpperCase()

              const progressBarColor =
                status === "cancel_soon" ? "bg-destructive/60"
                : status === "behind" ? "bg-amber-400/60"
                : status === "eligible" ? "bg-secondary/40"
                : "bg-primary/40"

              const deadlineLabelColor =
                status === "cancel_soon" ? "text-destructive" : "text-on-surface-variant"

              return (
                <Link
                  key={card.id}
                  href={`/tracker/${card.id}`}
                  className="group block bg-surface-container hover:bg-surface-container-high transition-colors rounded-xl p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8"
                >
                  {/* Card identity */}
                  <div className="lg:col-span-3 flex items-center gap-4">
                    <div className="w-16 h-10 rounded-md bg-surface-container-highest border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                      <span className="text-[10px] font-extrabold text-on-surface-variant tracking-widest">
                        {bank.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-on-surface truncate max-w-[140px]">{cardName}</div>
                      <div className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{bank}</div>
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="lg:col-span-6 relative pt-5 pb-1">
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden relative">
                      {/* Progress fill */}
                      <div
                        className={`absolute left-0 top-0 h-full ${progressBarColor} rounded-full`}
                        style={{ width: `${progressPct}%` }}
                      />
                      {/* Applied marker */}
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-primary rounded-l-full" />
                      {/* Eligibility marker */}
                      <div
                        className="absolute top-0 h-full w-1.5 bg-secondary"
                        style={{ left: `${eligibilityPct}%` }}
                      />
                      {/* Deadline marker */}
                      <div className="absolute right-0 top-0 h-full w-1.5 bg-destructive rounded-r-full" />
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
                      <div className="flex flex-col">
                        <span>Applied</span>
                        <span className="text-on-surface tabular-nums mt-0.5">{appliedLabel}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Eligible</span>
                        <span className="text-secondary tabular-nums mt-0.5">
                          {progressPct >= eligibilityPct ? "✓ Met" : "Pending"}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span>Deadline</span>
                        <span className={`${deadlineLabelColor} tabular-nums mt-0.5`}>
                          {status === "cancel_soon" ? `${daysLeft}d left` : deadlineLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="lg:col-span-3 flex lg:justify-end">
                    {statusBadge(status)}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* FAB — mobile */}
        <div className="md:hidden fixed bottom-24 right-6 z-40">
          <Link
            href="/cards"
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-[0px_24px_48px_-12px_rgba(78,222,163,0.4)] text-on-primary transition-all hover:scale-110 active:scale-95"
            style={{ background: "var(--gradient-cta)" }}
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
