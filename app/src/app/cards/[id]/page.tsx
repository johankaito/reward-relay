"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, Utensils, Plane, Wifi } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { supabase } from "@/lib/supabase/client"
import { getBankGradient } from "@/lib/bank-gradients"
import { calculatePace } from "@/lib/spendPace"

type UserCard = {
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
    welcome_bonus_points: number | null
    points_currency: string | null
    annual_fee: number | null
  } | null
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()
}

function fmtDateShort(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-AU", { month: "short", year: "numeric" }).toUpperCase()
}

export default function CardDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [card, setCard] = useState<UserCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from("user_cards")
        .select("id, bank, name, current_spend, application_date, bonus_spend_deadline, cancellation_date, bonus_earned, card:cards(bonus_spend_requirement, name, bank, welcome_bonus_points, points_currency, annual_fee)")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

      if (!data) { setNotFound(true); setLoading(false); return }
      setCard(data as UserCard)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-8 w-32 animate-pulse rounded-full bg-surface-container" />
          <div className="aspect-[1.58/1] w-full animate-pulse rounded-xl bg-surface-container" />
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-40 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </AppShell>
    )
  }

  if (notFound || !card) {
    return (
      <AppShell>
        <p className="text-on-surface-variant">Card not found.</p>
      </AppShell>
    )
  }

  const requirement = card.card?.bonus_spend_requirement ?? 0
  const currentSpend = card.current_spend ?? 0
  const cardName = card.name ?? card.card?.name ?? "Card"
  const bank = card.bank ?? card.card?.bank ?? ""
  const gradient = getBankGradient(bank)
  const isLight = bank === "CommBank"
  const textColor = isLight ? "text-black/80" : "text-white"
  const textMuted = isLight ? "text-black/50" : "text-white/60"

  const spentPct = requirement > 0 ? Math.min(100, Math.round((currentSpend / requirement) * 100)) : 0
  const remaining = Math.max(0, requirement - currentSpend)

  const pace = (requirement > 0 && card.application_date && card.bonus_spend_deadline)
    ? calculatePace(currentSpend, requirement, card.application_date, card.bonus_spend_deadline)
    : null

  // Arc: half-circle SVG, stroke-dasharray 125.6 for r=40 half arc
  const arcTotal = 125.6
  const arcOffset = arcTotal * (1 - spentPct / 100)

  // Re-eligibility: ~18 months after application
  const reEligible = card.application_date
    ? (() => {
        const d = new Date(card.application_date)
        d.setMonth(d.getMonth() + 18)
        return d.toLocaleDateString("en-AU", { month: "short", year: "numeric" }).toUpperCase()
      })()
    : "—"

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </button>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT: Card visual + key dates + bonus tracker */}
          <div className="lg:col-span-7 space-y-8">

            {/* Wallet card */}
            <section className="relative aspect-[1.58/1] w-full rounded-xl overflow-hidden shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.6)] group">
              <div className="absolute inset-0" style={{ background: gradient }} />
              {/* Glow overlays */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blur-[60px] -ml-24 -mb-24" />
              <div className={`relative h-full p-8 flex flex-col justify-between ${textColor}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-headline font-extrabold text-lg tracking-tight">{cardName}</p>
                    <p className={`text-sm font-medium ${textMuted}`}>{bank}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
                    <Wifi className="h-5 w-5 rotate-90 opacity-40 text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-8 bg-gradient-to-r from-yellow-500 to-yellow-200 rounded-sm opacity-80" />
                    <p className="text-2xl font-headline font-bold tracking-[0.2em] tabular-nums">•••• •••• •••• ––––</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={`text-[10px] uppercase tracking-widest mb-1 ${textMuted}`}>Card Holder</p>
                      <p className="text-sm font-semibold uppercase tracking-wider">— — —</p>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-widest mb-1 ${textMuted}`}>Expires</p>
                      <p className="text-sm font-semibold tabular-nums">–– / ––</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Key dates grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Applied</span>
                <p className="font-headline font-extrabold text-sm tabular-nums">{fmtDate(card.application_date)}</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col items-center justify-center text-center border-b-2 border-primary/30">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Annual Fee</span>
                <p className="font-headline font-extrabold text-sm tabular-nums">{fmtDate(card.annual_fee_date)}</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Cancel By</span>
                <p className="font-headline font-extrabold text-sm tabular-nums text-destructive">{fmtDate(card.cancellation_date)}</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">Re-Eligible</span>
                <p className="font-headline font-extrabold text-sm tabular-nums text-primary">{reEligible}</p>
              </div>
            </section>

            {/* Bonus tracker progress bar */}
            {requirement > 0 ? (
              <section className="bg-surface-container p-8 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline text-lg font-extrabold">Welcome Bonus Progress</h3>
                  {card.card?.welcome_bonus_points ? (
                    <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
                      {card.card.welcome_bonus_points.toLocaleString()} {card.card.points_currency ?? "pts"}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">
                      Spent: <strong className="text-on-surface tabular-nums">{fmt(currentSpend)}</strong>
                    </span>
                    <span className="text-on-surface-variant">
                      Target: <strong className="text-on-surface tabular-nums">{fmt(requirement)}</strong>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full shadow-[0_0_12px_rgba(78,222,163,0.3)]"
                      style={{ width: `${spentPct}%`, background: "var(--gradient-cta)" }}
                    />
                  </div>
                  {pace && (
                    <p className="text-xs text-on-surface-variant text-center">
                      {remaining > 0
                        ? `${fmt(remaining)} remaining · ${pace.daysRemaining} day${pace.daysRemaining !== 1 ? "s" : ""} left`
                        : "Bonus spend target reached!"}
                    </p>
                  )}
                </div>
              </section>
            ) : null}
          </div>

          {/* RIGHT: Arc + Recent activity */}
          <div className="lg:col-span-5 space-y-8">

            {/* Spend arc */}
            {requirement > 0 ? (
              <section className="bg-surface-container p-8 rounded-lg flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                <h3 className="font-headline text-sm font-extrabold text-on-surface-variant uppercase tracking-widest mb-8">
                  Bonus Spend Progress
                </h3>
                <div className="relative w-48 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 60">
                    <path
                      className="text-surface-container-highest"
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="url(#arcGradient)"
                      strokeDasharray={arcTotal}
                      strokeDashoffset={arcOffset}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                    <defs>
                      <linearGradient id="arcGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="#4edea3" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span className="text-3xl font-headline font-extrabold tabular-nums">{fmt(currentSpend)}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                      of {fmt(requirement)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-8">
                  <div className="text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Progress</p>
                    <p className="font-bold tabular-nums">{spentPct}%</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Remaining</p>
                    <p className="font-bold tabular-nums">{fmt(remaining)}</p>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Recent activity placeholder */}
            <section className="bg-surface-container rounded-lg border border-white/5 overflow-hidden">
              <div className="p-6 flex justify-between items-center border-b border-white/5">
                <h3 className="font-headline text-lg font-extrabold">Recent Activity</h3>
              </div>
              <div className="space-y-1 p-4">
                {/* Activity items — static placeholder since transaction data isn't in scope */}
                {[
                  { icon: ShoppingBag, label: "Shopping", amount: null },
                  { icon: Utensils, label: "Dining", amount: null },
                  { icon: Plane, label: "Travel", amount: null },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{label}</p>
                        <p className="text-[10px] text-on-surface-variant">No transactions yet</p>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-on-surface-variant py-4">
                  Transaction history coming soon
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
