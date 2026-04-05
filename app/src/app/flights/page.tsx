'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, MapPin, PlaneLanding, Search, CreditCard, ChevronRight } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type UserCard = Database['public']['Tables']['user_cards']['Row']
type CatalogCard = Database['public']['Tables']['cards']['Row']

interface LoyaltyBalance {
  id: string
  user_id: string
  program: 'qff' | 'velocity' | 'amex_mr'
  balance: number
  expiry_date: string | null
  last_updated: string | null
  notes: string | null
  created_at: string | null
}

// Static airline redemption data (Stitch design spec)
const AIRLINE_CARDS = [
  {
    id: 'qatar',
    airline: 'Qatar Airways',
    route: 'SYD → DOH → LHR',
    cabin: 'QSuite',
    cabinLabel: 'Business',
    points: 164000,
    taxes: 584,
    gap: -42500,
    canBook: false,
    accentColor: '#8b0000',
    gradient: 'linear-gradient(135deg, #7c1a2b 0%, #4a0010 100%)',
  },
  {
    id: 'singapore',
    airline: 'Singapore Airlines',
    route: 'SYD → SIN → LHR',
    cabin: 'Business',
    cabinLabel: 'Business',
    points: 118500,
    taxes: 120,
    surplus: 3000,
    canBook: true,
    accentColor: '#4edea3',
    gradient: 'linear-gradient(135deg, #003366 0%, #006672 100%)',
  },
  {
    id: 'emirates',
    airline: 'Emirates',
    route: 'SYD → DXB → LHR',
    cabin: 'First',
    cabinLabel: 'First Class',
    points: 242000,
    taxes: 982,
    gap: -120500,
    canBook: false,
    accentColor: '#c3c0ff',
    gradient: 'linear-gradient(135deg, #b8870a 0%, #6b4c08 100%)',
  },
] as const

export default function FlightsPage() {
  const router = useRouter()
  const [balanceMap, setBalanceMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  // Card recommendations (merged from /projections)
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([])

  // Hero search form state (display only — no live DB search)
  const [origin, setOrigin] = useState('Sydney (SYD)')
  const [destination, setDestination] = useState('London (LHR)')
  const [cabinClass, setCabinClass] = useState('Business Class')
  const [departure, setDeparture] = useState('Anytime 2024')

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent('/flights')}`)
        return
      }

      const [balancesResult, userCardsResult, catalogResult] = await Promise.all([
        supabase.from('loyalty_balances' as never).select('*'),
        supabase.from('user_cards').select('*'),
        supabase.from('cards').select('*').eq('is_active', true).order('welcome_bonus_points', { ascending: false }),
      ])

      const balances: LoyaltyBalance[] = ((balancesResult.data as LoyaltyBalance[] | null) ?? [])
      const map: Record<string, number> = balances.reduce(
        (acc, b) => ({ ...acc, [b.program]: b.balance }),
        {},
      )
      setBalanceMap(map)
      setUserCards((userCardsResult.data as UserCard[]) ?? [])
      setCatalogCards((catalogResult.data as CatalogCard[]) ?? [])
      setLoading(false)
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPoints = Object.values(balanceMap).reduce((sum, v) => sum + v, 0)
  const qffBalance = balanceMap['qff'] ?? 0
  const velocityBalance = balanceMap['velocity'] ?? 0
  const amexBalance = balanceMap['amex_mr'] ?? 0

  // Redemption goal: SYD→LHR Business via Qatar (164k pts)
  const GOAL_POINTS = 164000
  const currentPool = totalPoints
  const goalPct = Math.min(100, Math.round((currentPool / GOAL_POINTS) * 100))
  const pointsGap = Math.max(0, GOAL_POINTS - currentPool)

  // Card recommendations to close the gap (merged from /projections)
  const ownedCardIds = useMemo(() => new Set(userCards.map((uc) => uc.card_id).filter(Boolean)), [userCards])
  const topRecommendations = useMemo(
    () => catalogCards.filter((c) => !ownedCardIds.has(c.id) && (c.welcome_bonus_points ?? 0) > 0).slice(0, 3),
    [catalogCards, ownedCardIds],
  )
  const monthlyEarning = useMemo(() => {
    if (userCards.length === 0) return 0
    const ownedCatalog = catalogCards.filter((c) => ownedCardIds.has(c.id))
    if (ownedCatalog.length === 0) return 0
    const avgRate = ownedCatalog.reduce((sum, c) => sum + (c.earn_rate_primary ?? 1), 0) / ownedCatalog.length
    return Math.round(avgRate * 3000)
  }, [userCards, catalogCards, ownedCardIds])
  const monthsToClose = useMemo(() => {
    if (pointsGap <= 0 || monthlyEarning <= 0) return null
    return Math.ceil(pointsGap / monthlyEarning)
  }, [pointsGap, monthlyEarning])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-[380px] animate-pulse rounded-3xl bg-surface-container" />
          <div className="h-40 animate-pulse rounded-3xl bg-surface-container" />
          <div className="grid grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl bg-surface-container" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 w-full z-40 bg-background/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-headline font-bold text-on-surface tracking-tight">Reward Flights</h2>
          <div className="h-4 w-[1px] bg-white/10 hidden md:block mx-2" />
          <span className="hidden md:block px-3 py-1 bg-surface-container/50 border border-white/5 rounded-full text-[10px] font-bold text-[#4edea3] uppercase tracking-widest">Global Search</span>
        </div>
        {/* Your Points summary */}
        {totalPoints > 0 && (
          <div className="hidden md:flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Total Points Pool</p>
              <p className="text-lg font-headline font-bold text-on-surface tabular-nums">{totalPoints.toLocaleString()} pts</p>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-[1440px] mx-auto p-8 space-y-10">

        {/* ── Hero Search ── */}
        <div className="relative rounded-3xl overflow-hidden min-h-[380px] flex flex-col justify-end p-10 shadow-2xl border border-white/5">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-surface-container-low" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#4edea3]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-tertiary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
          </div>

          <div className="relative z-10 w-full">
            <div className="mb-10 max-w-2xl">
              <h3 className="text-5xl font-headline font-extrabold tracking-tight text-white mb-4 leading-tight">
                Target Your Next Cabin.
              </h3>
              <p className="text-on-surface font-medium text-lg leading-relaxed">
                Instantly check reward availability across premium partner airlines and bridge the point gap.
              </p>
            </div>

            {/* 4-field glass-card search form */}
            <div className="glass-card rounded-2xl p-3 flex flex-col lg:flex-row gap-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Origin */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-[#4edea3] font-bold mb-1.5 opacity-80">Origin</label>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#4edea3]/70 shrink-0" />
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-on-surface-variant/30 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
                {/* Destination */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-1.5">Destination</label>
                  <div className="flex items-center gap-3">
                    <PlaneLanding className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-on-surface-variant/30 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
                {/* Cabin Class */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-1.5">Cabin Class</label>
                  <div className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <input
                      value={cabinClass}
                      onChange={(e) => setCabinClass(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-on-surface-variant/30 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
                {/* Departure */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-1.5">Departure</label>
                  <div className="flex items-center gap-3">
                    <span className="text-on-surface-variant text-lg shrink-0">📅</span>
                    <input
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-on-surface-variant/30 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
              </div>
              <button
                className="text-on-primary font-black px-12 rounded-xl hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 py-4 lg:py-0 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)' }}
              >
                <Search className="w-4 h-4" />
                <span className="tracking-widest text-sm uppercase">Find Rewards</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Redemption Goal ── */}
        <div className="bg-surface-container-low/80 rounded-3xl p-10 border border-white/5 relative overflow-hidden group shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#4edea3]/10 to-transparent pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4edea3]" />
                </span>
                <span className="text-[11px] font-extrabold text-[#4edea3] uppercase tracking-[0.25em]">Active Redemption Goal</span>
              </div>
              <h4 className="text-4xl font-headline font-extrabold tabular-nums tracking-tighter">
                {goalPct}% to Business SYD → LHR
              </h4>
              <p className="text-on-surface-variant max-w-lg text-lg leading-relaxed font-medium">
                {pointsGap > 0
                  ? <>You&apos;re closing in on your goal. Secure <span className="text-white font-bold underline decoration-primary/40 underline-offset-4">{pointsGap.toLocaleString()} more points</span> to book via Qatar Airways.</>
                  : <>You have enough points to book this redemption. Book via <span className="text-white font-bold">Singapore Airlines</span> now.</>
                }
              </p>
            </div>
            <div className="w-full lg:w-[420px] bg-background/40 p-8 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Current Points Pool</span>
                  <span className="text-xl font-bold text-white tracking-tight tabular-nums">
                    {currentPool > 0 ? currentPool.toLocaleString() : '121,500'} / {GOAL_POINTS.toLocaleString()}
                  </span>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${goalPct >= 100 ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/30' : goalPct >= 70 ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {goalPct >= 100 ? 'Ready to Book' : goalPct >= 70 ? 'Almost there' : 'In Progress'}
                </span>
              </div>
              <div className="relative h-4 bg-surface-container-highest/50 rounded-full overflow-hidden p-1 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#4edea3] via-[#6ffbbe] to-[#10b981] rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${currentPool > 0 ? goalPct : 74}%` }}
                >
                  <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-r from-transparent to-white/20" />
                </div>
              </div>
              {/* Points breakdown */}
              {totalPoints > 0 && (
                <div className="mt-6 space-y-2">
                  {qffBalance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Qantas FF</span>
                      <span className="text-on-surface font-bold tabular-nums">{qffBalance.toLocaleString()} pts</span>
                    </div>
                  )}
                  {velocityBalance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Velocity</span>
                      <span className="text-on-surface font-bold tabular-nums">{velocityBalance.toLocaleString()} pts</span>
                    </div>
                  )}
                  {amexBalance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Amex MR</span>
                      <span className="text-on-surface font-bold tabular-nums">{amexBalance.toLocaleString()} pts</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Top Redemption Matches ── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-headline font-bold tracking-tight">Top Redemption Matches</h3>
              <p className="text-on-surface-variant text-base font-medium mt-1">Real-time availability based on your point balance.</p>
            </div>
            <div className="hidden md:flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high/40 rounded-full text-xs font-bold text-on-surface border border-white/10 hover:bg-surface-bright transition-all">
                Sort by Value
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high/40 rounded-full text-xs font-bold text-on-surface border border-white/10 hover:bg-surface-bright transition-all">
                Filter Airlines
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {AIRLINE_CARDS.map((card) => (
              <AirlineRedemptionCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* ── Top Cards to Close the Gap (merged from /projections) ── */}
        {topRecommendations.length > 0 && (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-headline font-bold tracking-tight">Top Cards to Close the Gap</h3>
                <p className="mt-1 text-base font-medium text-on-surface-variant">
                  Ranked by welcome bonus — highest points first
                  {monthsToClose && (
                    <span className="ml-2 text-sm text-[#4edea3]">· est. {monthsToClose} months at current earn rate</span>
                  )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {topRecommendations.map((card, idx) => {
                const bonus = card.welcome_bonus_points ?? 0
                const newTotal = currentPool + bonus
                const newGap = GOAL_POINTS - newTotal
                const wouldSuffice = newGap <= 0
                const isTop = idx === 0
                return (
                  <div
                    key={card.id}
                    className={`flex flex-col overflow-hidden rounded-3xl border transition-all duration-500 ${
                      isTop
                        ? 'border-[#4edea3]/40 ring-1 ring-[#4edea3]/20 scale-[1.02] shadow-[0_24px_48px_-12px_rgba(78,222,163,0.15)]'
                        : 'border-white/5 hover:border-[#4edea3]/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]'
                    }`}
                    style={{ background: 'rgba(23,27,40,0.5)' }}
                  >
                    <div className="relative flex h-32 items-end overflow-hidden p-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-surface-container to-surface-container-high" />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
                      <div
                        className="absolute left-5 top-4 rounded-full border border-white/10 px-3 py-1"
                        style={{ background: 'rgba(27,31,44,0.6)', backdropFilter: 'blur(24px)' }}
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">{card.bank}</span>
                      </div>
                      <div className="relative z-10 flex w-full items-end justify-between">
                        <div>
                          <span className="font-headline text-4xl font-extrabold tabular-nums tracking-tighter text-white">
                            {bonus.toLocaleString()}
                          </span>
                          <span className="ml-2 text-[11px] font-bold uppercase tracking-widest text-[#4edea3]">Bonus pts</span>
                        </div>
                        {isTop && (
                          <span className="rounded bg-[#4edea3] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-on-primary">Best</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-sm font-semibold text-on-surface-variant">Card</span>
                          <span className="text-sm font-bold text-white">{card.name}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-sm font-semibold text-on-surface-variant">Annual Fee</span>
                          <span className="text-sm font-bold tabular-nums text-white">${(card.annual_fee ?? 0).toLocaleString()} AUD</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-on-surface-variant">Earn Rate</span>
                          <span className="text-sm font-bold tabular-nums text-white">{card.earn_rate_primary ?? 1} pt / $1</span>
                        </div>
                      </div>
                      <div className="mt-auto space-y-3">
                        <div
                          className={`rounded-2xl border p-3 ${
                            wouldSuffice ? 'border-[#4edea3]/20 bg-[#4edea3]/10' : 'border-white/5 bg-surface-container/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold uppercase tracking-widest ${wouldSuffice ? 'text-[#4edea3]' : 'text-on-surface-variant'}`}>
                              {wouldSuffice ? 'Would cover goal' : 'Remaining gap'}
                            </span>
                            <span className={`font-headline text-base font-extrabold tabular-nums ${wouldSuffice ? 'text-[#4edea3]' : 'text-white'}`}>
                              {wouldSuffice ? `+${Math.abs(newGap).toLocaleString()} surplus` : `-${newGap.toLocaleString()} pts`}
                            </span>
                          </div>
                        </div>
                        <a
                          href="/cards"
                          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold uppercase tracking-widest transition-all ${
                            isTop
                              ? 'text-on-primary shadow-lg shadow-[#4edea3]/20 hover:opacity-90 hover:scale-[1.02]'
                              : 'border border-white/10 bg-white/5 text-on-surface hover:bg-white/10 hover:text-on-surface'
                          }`}
                          style={isTop ? { background: 'linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)' } : undefined}
                        >
                          <CreditCard className="h-4 w-4" />
                          View Card Details
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

type AirlineCard = (typeof AIRLINE_CARDS)[number]

function AirlineRedemptionCard({ card }: { card: AirlineCard }) {
  const isSingapore = card.id === 'singapore'
  const isEmiratesFirst = card.id === 'emirates'

  return (
    <div
      className={`group rounded-3xl overflow-hidden border transition-all duration-500 flex flex-col relative ${
        isSingapore
          ? 'border-[#4edea3]/40 ring-1 ring-[#4edea3]/20 hover:shadow-[0_24px_48px_-12px_rgba(78,222,163,0.2)] scale-[1.02]'
          : 'border-white/10 hover:border-[#4edea3]/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]'
      }`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* ── Card header with gradient background ── */}
      <div className="h-56 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: card.gradient }} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />

        {/* Airline name pill — glass card style */}
        <div
          className="absolute top-5 left-5 px-4 py-1.5 rounded-full"
          style={{
            background: 'rgba(27,31,44,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">{card.airline}</span>
        </div>

        {/* Points + cabin badge */}
        <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
          <div>
            <span className="text-4xl font-headline font-extrabold text-white tabular-nums tracking-tighter">
              {card.points.toLocaleString()}
            </span>
            <span className={`text-[11px] font-bold uppercase ml-2 tracking-widest ${isEmiratesFirst ? 'text-tertiary' : 'text-[#4edea3]'}`}>
              Points
            </span>
          </div>
          <span className={`px-3 py-1 text-[10px] font-black rounded border uppercase tracking-widest ${
            isSingapore
              ? 'bg-[#4edea3] text-on-primary border-transparent'
              : isEmiratesFirst
              ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
              : 'bg-white/10 backdrop-blur-md text-white border-white/20'
          }`}>
            {card.cabin}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="space-y-5 mb-8">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-sm font-semibold text-on-surface-variant">Route Path</span>
            <span className="text-sm font-bold text-on-surface tracking-tight">
              {card.route.split(' → ').map((seg, i, arr) => (
                <span key={i}>
                  {seg}
                  {i < arr.length - 1 && (
                    <span className={`mx-1 ${isEmiratesFirst ? 'text-tertiary' : 'text-[#4edea3]'}`}>→</span>
                  )}
                </span>
              ))}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-sm font-semibold text-on-surface-variant">Cabin Class</span>
            <span className="text-sm font-bold text-on-surface">{card.cabinLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-on-surface-variant">Total Taxes</span>
            <span className="text-sm font-bold text-on-surface tabular-nums">${card.taxes} AUD</span>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          {card.canBook ? (
            <>
              <div className="bg-[#4edea3]/10 p-4 rounded-2xl border border-[#4edea3]/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#4edea3] uppercase tracking-widest">Balance Status</span>
                  <span className="text-lg font-extrabold text-[#4edea3] tabular-nums">
                    +{('surplus' in card ? card.surplus : 0).toLocaleString()} surplus
                  </span>
                </div>
              </div>
              <button
                className="w-full py-4 rounded-2xl text-sm font-black text-on-primary hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all uppercase tracking-widest shadow-xl shadow-[#4edea3]/20"
                style={{ background: 'linear-gradient(135deg, #3DFFA0 0%, #00C878 100%)' }}
              >
                Book Redemption
              </button>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-2xl border ${isEmiratesFirst ? 'bg-surface-container-highest/30 border-white/5' : 'bg-[#ffb4ab]/5 border-[#ffb4ab]/10'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest ${isEmiratesFirst ? 'text-on-surface-variant' : 'text-[#ffb4ab]'}`}>
                    Gap to target
                  </span>
                  <span className="text-lg font-extrabold text-white tabular-nums">
                    {'gap' in card ? card.gap.toLocaleString() : ''} pts
                  </span>
                </div>
              </div>
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-on-surface hover:text-white transition-all uppercase tracking-widest shadow-lg">
                {isEmiratesFirst ? 'Analyze Transfers' : 'View Availability'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
