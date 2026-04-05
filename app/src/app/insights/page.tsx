"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"
import { getEligibleDeals, type Deal } from "@/lib/deals"
import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

interface LoyaltyBalance {
  id: string
  program: string
  balance: number
  expiry_date: string | null
}

interface Insight {
  id: string
  type: "alert" | "info" | "expiry"
  icon: string
  title: string
  body: string
  urgency: "high" | "medium" | "low"
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function buildInsights(cards: UserCard[], loyaltyBalances: LoyaltyBalance[]): Insight[] {
  const insights: Insight[] = []
  const now = Date.now()

  for (const card of cards) {
    if (card.status !== "active") continue
    const name = [card.bank, card.name].filter(Boolean).join(" ")

    // Bonus spend deadline approaching (≤30 days)
    if (!card.bonus_earned && card.bonus_spend_deadline) {
      const days = daysUntil(card.bonus_spend_deadline)
      if (days >= 0 && days <= 30) {
        insights.push({
          id: `bonus-deadline-${card.id}`,
          type: "alert",
          icon: "timer",
          urgency: days <= 7 ? "high" : days <= 14 ? "medium" : "low",
          title: `${name} bonus deadline in ${days}d`,
          body: days <= 7
            ? `Only ${days} day${days !== 1 ? "s" : ""} left to hit your spend target — check your progress now.`
            : `${days} days remaining to complete your sign-up bonus spend requirement.`,
        })
      }
    }

    // Cancellation date approaching (≤30 days)
    if (card.cancellation_date) {
      const days = daysUntil(card.cancellation_date)
      if (days >= 0 && days <= 30) {
        insights.push({
          id: `cancel-${card.id}`,
          type: "alert",
          icon: "credit_card_off",
          urgency: days <= 7 ? "high" : "medium",
          title: `Cancel ${name} within ${days}d`,
          body: `Cancel before your next annual fee charges${card.annual_fee ? ` (${fmt(card.annual_fee)})` : ""} to protect your credit score.`,
        })
      }
    }

    // Annual fee due within 30 days of application anniversary
    if (card.application_date && card.annual_fee && card.annual_fee > 0) {
      const applied = new Date(card.application_date)
      const nextAnniversary = new Date(applied)
      nextAnniversary.setFullYear(new Date().getFullYear())
      if (nextAnniversary.getTime() < now) nextAnniversary.setFullYear(new Date().getFullYear() + 1)
      const days = Math.ceil((nextAnniversary.getTime() - now) / 86_400_000)
      if (days >= 0 && days <= 30) {
        insights.push({
          id: `fee-${card.id}`,
          type: "info",
          icon: "payments",
          urgency: days <= 7 ? "high" : "medium",
          title: `${fmt(card.annual_fee)} annual fee due in ${days}d`,
          body: `${name} annual fee charges in ${days} day${days !== 1 ? "s" : ""}. Decide whether to keep or cancel before it posts.`,
        })
      }
    }

    // Re-eligibility approaching (≤60 days)
    if (card.bonus_earned && card.application_date) {
      const applied = new Date(card.application_date)
      const reEligible = new Date(applied)
      reEligible.setMonth(reEligible.getMonth() + 18)
      const days = Math.ceil((reEligible.getTime() - now) / 86_400_000)
      if (days >= 0 && days <= 60) {
        insights.push({
          id: `reeligible-${card.id}`,
          type: "info",
          icon: "autorenew",
          urgency: "low",
          title: `${name} re-eligible in ${days}d`,
          body: `You'll be eligible to churn ${name} again in ${days} days. Start planning your next application.`,
        })
      }
    }
  }

  // Loyalty balance expiry warnings (≤90 days)
  for (const lb of loyaltyBalances) {
    if (!lb.expiry_date || lb.balance === 0) continue
    const days = daysUntil(lb.expiry_date)
    if (days >= 0 && days <= 90) {
      const programLabel =
        lb.program === "qff" ? "Qantas" : lb.program === "velocity" ? "Velocity" : "Amex MR"
      insights.push({
        id: `expiry-${lb.id}`,
        type: "expiry",
        icon: "hourglass_bottom",
        urgency: days <= 30 ? "high" : "medium",
        title: `${lb.balance.toLocaleString()} ${programLabel} pts expire in ${days}d`,
        body: `Your ${programLabel} balance expires ${new Date(lb.expiry_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}. Book a redemption or transfer to extend.`,
      })
    }
  }

  // Sort: high → medium → low
  const order = { high: 0, medium: 1, low: 2 }
  return insights.sort((a, b) => order[a.urgency] - order[b.urgency])
}

const URGENCY_STYLE: Record<string, { border: string; bg: string; icon: string }> = {
  high:   { border: "border-l-[#ef4444]", bg: "bg-[#ef4444]/5",  icon: "text-[#ef4444]" },
  medium: { border: "border-l-[#f59e0b]", bg: "bg-[#f59e0b]/5",  icon: "text-[#f59e0b]" },
  low:    { border: "border-l-[#4edea3]", bg: "bg-[#4edea3]/5",  icon: "text-[#4edea3]" },
}

const EXPIRY_STYLE = { border: "border-l-[#f59e0b]", bg: "bg-[#f59e0b]/5", icon: "text-[#f59e0b]" }

function InsightCard({ insight }: { insight: Insight }) {
  const style = insight.type === "expiry" ? EXPIRY_STYLE : URGENCY_STYLE[insight.urgency]
  return (
    <div className={`flex gap-4 rounded-xl border-l-4 px-5 py-4 ${style.border} ${style.bg}`}>
      <span
        className={`material-symbols-outlined mt-0.5 shrink-0 ${style.icon}`}
        style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
      >
        {insight.icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-on-surface">{insight.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">{insight.body}</p>
      </div>
    </div>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="glass-panel rounded-xl p-5 flex flex-col gap-3 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4edea3]">
            {deal.specific_issuer ?? "All Cards"}
          </p>
          <h4 className="mt-1 text-sm font-bold text-on-surface">{deal.title}</h4>
        </div>
        {deal.merchant && (
          <span className="shrink-0 rounded-full bg-surface-container-highest px-2.5 py-1 text-[10px] font-bold text-on-surface-variant border border-white/5">
            {deal.merchant}
          </span>
        )}
      </div>
      {deal.description && (
        <p className="text-xs text-on-surface-variant leading-relaxed">{deal.description}</p>
      )}
      {deal.valid_until && (
        <p className="text-[10px] text-on-surface-variant font-medium">
          Expires {new Date(deal.valid_until).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </p>
      )}
    </div>
  )
}

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<Insight[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace("/"); return }

      const [{ data: userCards }, loyaltyRes, eligibleDeals] = await Promise.all([
        supabase.from("user_cards").select("*").order("created_at", { ascending: false }),
        supabase.from("loyalty_balances" as never).select("*").eq("user_id" as never, session.user.id),
        getEligibleDeals(session.user.id, supabase),
      ])

      setInsights(buildInsights(
        (userCards ?? []) as UserCard[],
        ((loyaltyRes.data ?? []) as unknown) as LoyaltyBalance[],
      ))
      setDeals(eligibleDeals)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-2xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl space-y-10 pb-8">

        {/* Header */}
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Insights
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Personalised alerts and opportunities for your portfolio.
          </p>
        </div>

        {/* Alerts & action items */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
            Action Required
          </h2>
          {insights.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-surface-container px-6 py-10 text-center">
              <span
                className="material-symbols-outlined text-[#4edea3]"
                style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="mt-3 text-sm font-bold text-on-surface">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                No urgent actions on your portfolio right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((ins) => <InsightCard key={ins.id} insight={ins} />)}
            </div>
          )}
        </section>

        {/* Eligible deals */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
            Eligible Deals
          </h2>
          {deals.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-surface-container px-6 py-8 text-center">
              <p className="text-sm text-on-surface-variant">
                No deals available right now — check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {deals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
            </div>
          )}
        </section>

      </div>
    </AppShell>
  )
}
