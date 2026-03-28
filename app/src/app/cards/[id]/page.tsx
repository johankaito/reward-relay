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
          className="flex items-center gap-2 text-on-surface-variant hover:text-[#4edea3] transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back</span>
        </button>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* LEFT: Card visual + key dates */}
          <div className="space-y-8">

            {/* Wallet card */}
            <section className="relative aspect-[1.58/1] w-full rounded-xl overflow-hidden shadow-[0px_24px_48px_-12px_rgba(0,0,0,0.6)] group">
              <div className="absolute inset-0" style={{ background: gradient }} />
              {/* Dot-grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              {/* Glow overlays */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#4edea3]/10 blur-[80px] -mr-32 -mt-32" />
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
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-highest p-4 lg:p-6 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center lg:block lg:text-left">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-2 font-bold block">Applied</span>
                <p className="font-headline font-bold text-sm lg:text-lg tabular-nums">{fmtDate(card.application_date)}</p>
              </div>
              <div className="bg-surface-container-highest p-4 lg:p-6 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center lg:block lg:text-left">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-2 font-bold block">Annual Fee Due</span>
                <p className="font-headline font-bold text-sm lg:text-lg tabular-nums">{card.card?.annual_fee != null ? fmt(card.card.annual_fee) : "—"}</p>
              </div>
              <div className="bg-surface-container-highest p-4 lg:p-6 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center lg:block lg:text-left">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-2 font-bold block">Cancel By</span>
                <p className="font-headline font-bold text-sm lg:text-lg tabular-nums text-destructive">{fmtDate(card.cancellation_date)}</p>
              </div>
              <div className="bg-surface-container-highest p-4 lg:p-6 rounded-lg border border-white/5 flex flex-col items-center justify-center text-center lg:block lg:text-left">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-[0.1em] mb-2 font-bold block">Re-Eligible</span>
                <p className="font-headline font-bold text-sm lg:text-lg tabular-nums text-[#4edea3]">{reEligible}</p>
              </div>
            </section>

          </div>

          {/* RIGHT: Bonus progress bento + Recent activity */}
          <div className="space-y-8">

            {/* Bonus progress bento card (arc + bar) */}
            {requirement > 0 ? (
              <section className="bg-surface-container p-8 rounded-xl space-y-10 border border-white/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#4edea3]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="flex flex-col items-center">
                  <h2 className="font-headline font-extrabold text-xl mb-8">Bonus Progress</h2>
                  {/* Full-circle arc, clipped to top half */}
                  <div className="relative w-64 h-40 flex justify-center overflow-hidden">
                    <svg className="w-64 h-64 -rotate-180" viewBox="0 0 100 100">
                      <circle
                        className="text-surface-container-highest"
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="141.37"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="url(#arcGradientCircle)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="141.37"
                        strokeDashoffset={141.37 * (1 - spentPct / 100)}
                      />
                      <defs>
                        <linearGradient id="arcGradientCircle" x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" stopColor="#4edea3" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute bottom-4 text-center">
                      <span className="block text-4xl font-headline font-black tabular-nums">{fmt(currentSpend)}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                        of {fmt(requirement)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Progress bar detail */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-bold text-on-surface">Sign-up Bonus Goal</p>
                      {card.card?.welcome_bonus_points && (
                        <p className="text-xs text-on-surface-variant">
                          {card.card.welcome_bonus_points.toLocaleString()} {card.card.points_currency ?? "pts"}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-headline font-black text-[#4edea3] tabular-nums">{spentPct}%</p>
                  </div>
                  <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full shadow-[0_0_12px_rgba(78,222,163,0.3)]"
                      style={{ width: `${spentPct}%`, background: "var(--gradient-cta)" }}
                    />
                  </div>
                  {pace && remaining > 0 && (
                    <p className="text-xs text-on-surface-variant italic text-center">
                      Remaining: {fmt(remaining)} due in {pace.daysRemaining} day{pace.daysRemaining !== 1 ? "s" : ""}
                    </p>
                  )}
                  {remaining === 0 && (
                    <p className="text-xs text-[#4edea3] font-bold text-center">Bonus spend target reached!</p>
                  )}
                </div>
              </section>
            ) : null}

            {/* Card activity */}
            <section className="bg-surface-container rounded-xl border border-white/5 overflow-hidden shadow-xl">
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-surface-container-low/50">
                <h3 className="font-headline font-bold text-lg">Card Activity</h3>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { Icon: Utensils, label: "Dining", sub: "Spend tracked here", color: "text-tertiary" },
                  { Icon: Plane, label: "Travel", sub: "Spend tracked here", color: "text-secondary" },
                  { Icon: ShoppingBag, label: "Shopping", sub: "Spend tracked here", color: "text-on-surface-variant" },
                ].map(({ Icon, label, sub, color }) => (
                  <div
                    key={label}
                    className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{label}</p>
                        <p className="text-xs text-on-surface-variant">{sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs text-on-surface-variant py-4 px-8 italic">
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
