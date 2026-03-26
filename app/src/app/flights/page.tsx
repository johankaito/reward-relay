'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, MapPin, PlaneLanding, Search } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { supabase } from '@/lib/supabase/client'

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
    gradient: 'linear-gradient(135deg, #1a3a2a 0%, #0d2218 100%)',
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
    gradient: 'linear-gradient(135deg, #1a1a3e 0%, #0a0a2a 100%)',
  },
] as const

export default function FlightsPage() {
  const router = useRouter()
  const [balanceMap, setBalanceMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

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

      const { data: balancesData } = await supabase
        .from('loyalty_balances' as never)
        .select('*')

      const balances: LoyaltyBalance[] = (balancesData as LoyaltyBalance[] | null) ?? []
      const map: Record<string, number> = balances.reduce(
        (acc, b) => ({ ...acc, [b.program]: b.balance }),
        {},
      )
      setBalanceMap(map)
      setLoading(false)
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPoints = Object.values(balanceMap).reduce((sum, v) => sum + v, 0)
  const qffBalance = balanceMap['qff'] ?? 0
  const velocityBalance = balanceMap['velocity'] ?? 0
  const amexBalance = balanceMap['amex_mr'] ?? 0

  // Redemption goal: 80k QFF pts toward SYD→LHR Business
  const GOAL_POINTS = 164000
  const currentPool = totalPoints
  const goalPct = Math.min(100, Math.round((currentPool / GOAL_POINTS) * 100))
  const pointsGap = Math.max(0, GOAL_POINTS - currentPool)

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
      <header className="sticky top-0 w-full z-40 bg-[#0f131f]/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-headline font-bold text-on-surface tracking-tight">Reward Flights</h2>
          <div className="h-4 w-[1px] bg-white/10 hidden md:block mx-2" />
          <span className="hidden md:block px-3 py-1 bg-surface-container/50 border border-white/5 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">Global Search</span>
        </div>
        {/* Your Points summary */}
        {totalPoints > 0 && (
          <div className="hidden md:flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Total Points Pool</p>
              <p className="text-lg font-headline font-bold text-on-surface tabular-nums">{totalPoints.toLocaleString()} pts</p>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-[1440px] mx-auto p-8 space-y-10">

        {/* ── Hero Search ── */}
        <div className="relative rounded-3xl overflow-hidden min-h-[380px] flex flex-col justify-end p-10 shadow-2xl border border-white/5">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e2640 0%, #111827 60%, #0a0e1a 100%)' }} />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f131f]/80 via-[#0f131f]/40 to-transparent" />
          </div>

          <div className="relative z-10 w-full">
            <div className="mb-10 max-w-2xl">
              <h3 className="text-5xl font-headline font-extrabold tracking-tight text-white mb-4 leading-tight">
                Target Your Next Cabin.
              </h3>
              <p className="text-slate-300 font-medium text-lg leading-relaxed">
                Instantly check reward availability across premium partner airlines and bridge the point gap.
              </p>
            </div>

            {/* 4-field glass-card search form */}
            <div className="glass-card rounded-2xl p-3 flex flex-col lg:flex-row gap-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Origin */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-primary font-bold mb-1.5 opacity-80">Origin</label>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary/70 shrink-0" />
                    <input
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-slate-600 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
                {/* Destination */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1.5">Destination</label>
                  <div className="flex items-center gap-3">
                    <PlaneLanding className="w-5 h-5 text-slate-500 shrink-0" />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-slate-600 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
                {/* Cabin Class */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1.5">Cabin Class</label>
                  <div className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-slate-500 shrink-0" />
                    <input
                      value={cabinClass}
                      onChange={(e) => setCabinClass(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-slate-600 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
                {/* Departure */}
                <div className="bg-surface-container/60 p-4 rounded-xl group hover:bg-surface-bright/80 transition-all cursor-pointer border border-white/5">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1.5">Departure</label>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-lg shrink-0">📅</span>
                    <input
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      className="bg-transparent font-bold text-on-surface text-lg placeholder:text-slate-600 focus:outline-none w-full truncate"
                    />
                  </div>
                </div>
              </div>
              <button className="bg-primary text-[#003824] font-black px-12 rounded-xl hover:shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 py-4 lg:py-0 whitespace-nowrap">
                <Search className="w-4 h-4" />
                <span className="tracking-widest text-sm uppercase">Find Rewards</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Redemption Goal ── */}
        <div className="bg-[#171b28]/80 rounded-3xl p-10 border border-white/5 relative overflow-hidden group shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-[0.25em]">Active Redemption Goal</span>
              </div>
              <h4 className="text-4xl font-headline font-extrabold tabular-nums tracking-tighter">
                {goalPct}% to Business SYD → LHR
              </h4>
              <p className="text-slate-400 max-w-lg text-lg leading-relaxed font-medium">
                {pointsGap > 0
                  ? <>You&apos;re closing in on your goal. Secure <span className="text-white font-bold underline decoration-primary/40 underline-offset-4">{pointsGap.toLocaleString()} more points</span> to book via Qatar Airways.</>
                  : <>You have enough points to book this redemption. Book via <span className="text-white font-bold">Singapore Airlines</span> now.</>
                }
              </p>
            </div>
            <div className="w-full lg:w-[420px] bg-background/40 p-8 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Points Pool</span>
                  <span className="text-xl font-bold text-white tracking-tight tabular-nums">
                    {currentPool > 0 ? currentPool.toLocaleString() : '121,500'} / {GOAL_POINTS.toLocaleString()}
                  </span>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${goalPct >= 100 ? 'bg-primary/20 text-primary border-primary/30' : goalPct >= 70 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {goalPct >= 100 ? 'Ready to Book' : goalPct >= 70 ? 'Almost there' : 'In Progress'}
                </span>
              </div>
              <div className="relative h-4 bg-surface-container-highest/50 rounded-full overflow-hidden p-1 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary via-[#6ffbbe] to-primary-container rounded-full transition-all duration-1000 ease-out relative"
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
                      <span className="text-slate-500 font-medium">Qantas FF</span>
                      <span className="text-on-surface font-bold tabular-nums">{qffBalance.toLocaleString()} pts</span>
                    </div>
                  )}
                  {velocityBalance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Velocity</span>
                      <span className="text-on-surface font-bold tabular-nums">{velocityBalance.toLocaleString()} pts</span>
                    </div>
                  )}
                  {amexBalance > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Amex MR</span>
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
              <p className="text-slate-400 text-base font-medium mt-1">Real-time availability based on your point balance.</p>
            </div>
            <div className="hidden md:flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high/40 rounded-full text-xs font-bold text-slate-200 border border-white/10 hover:bg-surface-bright transition-all">
                Sort by Value
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high/40 rounded-full text-xs font-bold text-slate-200 border border-white/10 hover:bg-surface-bright transition-all">
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
      className={`group bg-surface-container-low/50 rounded-3xl overflow-hidden border transition-all duration-500 flex flex-col relative ${
        isSingapore
          ? 'border-primary/40 ring-1 ring-primary/20 hover:shadow-[0_24px_48px_-12px_rgba(78,222,163,0.2)] scale-[1.02]'
          : 'border-white/5 hover:border-primary/20 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* ── Card header with gradient background ── */}
      <div className="h-56 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: card.gradient }} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />

        {/* Airline name pill */}
        <div className={`absolute top-5 left-5 px-4 py-1.5 rounded-full backdrop-blur-md border ${isSingapore ? 'bg-primary/20 border-primary/30' : 'bg-white/10 border-white/20'}`}>
          <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">{card.airline}</span>
        </div>

        {/* Points + cabin badge */}
        <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
          <div>
            <span className="text-4xl font-headline font-extrabold text-white tabular-nums tracking-tighter">
              {card.points.toLocaleString()}
            </span>
            <span className={`text-[11px] font-bold uppercase ml-2 tracking-widest ${isEmiratesFirst ? 'text-[#c3c0ff]' : 'text-primary'}`}>
              Points
            </span>
          </div>
          <span className={`px-3 py-1 text-[10px] font-black rounded border uppercase tracking-widest ${
            isSingapore
              ? 'bg-primary text-[#003824] border-transparent'
              : isEmiratesFirst
              ? 'bg-[#c3c0ff]/10 text-[#c3c0ff] border-[#c3c0ff]/20'
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
            <span className="text-sm font-semibold text-slate-400">Route Path</span>
            <span className="text-sm font-bold text-on-surface tracking-tight">
              {card.route.split(' → ').map((seg, i, arr) => (
                <span key={i}>
                  {seg}
                  {i < arr.length - 1 && (
                    <span className={`mx-1 ${isEmiratesFirst ? 'text-[#c3c0ff]' : 'text-primary'}`}>→</span>
                  )}
                </span>
              ))}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-sm font-semibold text-slate-400">Cabin Class</span>
            <span className="text-sm font-bold text-on-surface">{card.cabinLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-400">Total Taxes</span>
            <span className="text-sm font-bold text-on-surface tabular-nums">${card.taxes} AUD</span>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          {card.canBook ? (
            <>
              <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Balance Status</span>
                  <span className="text-lg font-extrabold text-primary tabular-nums">
                    +{('surplus' in card ? card.surplus : 0).toLocaleString()} surplus
                  </span>
                </div>
              </div>
              <button className="w-full py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl text-sm font-black text-[#003824] hover:opacity-90 hover:scale-[1.02] active:scale-100 transition-all uppercase tracking-widest shadow-xl shadow-primary/20">
                Book with Points
              </button>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-2xl border ${isEmiratesFirst ? 'bg-surface-container-highest/30 border-white/5' : 'bg-error/5 border-error/10'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest ${isEmiratesFirst ? 'text-slate-500' : 'text-error'}`}>
                    Gap to target
                  </span>
                  <span className="text-lg font-extrabold text-white tabular-nums">
                    {'gap' in card ? card.gap.toLocaleString() : ''} pts
                  </span>
                </div>
              </div>
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-slate-200 hover:text-white transition-all uppercase tracking-widest shadow-lg">
                {isEmiratesFirst ? 'Analyze Transfers' : 'View Availability'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
