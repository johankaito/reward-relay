'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, ExternalLink, Search } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RedemptionProgress } from '@/components/flights/RedemptionProgress'
import { AwardRouteCard, type AwardRouteRow } from '@/components/flights/AwardRouteCard'
import { supabase } from '@/lib/supabase/client'
import { calculateEffectiveBalance, type TransferPartner } from '@/lib/transferPartners'

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

interface AwardFlightRoute {
  id: string
  program: 'qff' | 'velocity'
  origin_city: string
  origin_iata: string
  destination_city: string
  destination_iata: string
  cabin_class: 'economy' | 'business' | 'first'
  points_required: number
  taxes_aud: number
  booking_url: string | null
}

interface RouteWithBalance extends AwardFlightRoute {
  userBalance: number
  percentage: number
  canBook: boolean
  almostThere: boolean
  transferredPoints: number
  bookableViaTransfer: boolean
}

type ProgramFilter = 'all' | 'qff' | 'velocity'
type CabinFilter = 'all' | 'economy' | 'business' | 'first'
type OriginFilter = 'all' | 'SYD' | 'MEL' | 'BNE'

const CABIN_LABELS: Record<string, string> = {
  economy: 'Economy',
  business: 'Business',
  first: 'First',
}

const PROGRAM_LABELS: Record<string, string> = {
  qff: 'Qantas FF',
  velocity: 'Velocity',
}

/** Conversion rate: cents per point for dollar value display */
const CENTS_PER_POINT = 2

export default function FlightsPage() {
  const router = useRouter()

  // Legacy routes from award_flight_routes (balance-aware sweet spot)
  const [routes, setRoutes] = useState<AwardFlightRoute[]>([])
  const [balanceMap, setBalanceMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [hasBalances, setHasBalances] = useState(false)
  const [includeAmexTransfers, setIncludeAmexTransfers] = useState(false)

  // Award routes search (qantas_routes table)
  const [awardRoutes, setAwardRoutes] = useState<AwardRouteRow[]>([])
  const [routeSearch, setRouteSearch] = useState('')
  const [searchResults, setSearchResults] = useState<AwardRouteRow[]>([])
  const [searchNotFound, setSearchNotFound] = useState(false)

  const [programFilter, setProgramFilter] = useState<ProgramFilter>('all')
  const [cabinFilter, setCabinFilter] = useState<CabinFilter>('all')
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all')

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent('/flights')}`)
        return
      }

      const [{ data: balancesData }, { data: routesData }, { data: awardRoutesData }] =
        await Promise.all([
          supabase.from('loyalty_balances' as never).select('*'),
          supabase
            .from('award_flight_routes' as never)
            .select('*')
            .order('points_required', { ascending: true }),
          supabase
            .from('award_routes' as never)
            .select('*')
            .eq('program', 'qantas')
            .order('distance_miles', { ascending: true }),
        ])

      const balances: LoyaltyBalance[] = (balancesData as LoyaltyBalance[] | null) ?? []
      setHasBalances(balances.length > 0)

      const map: Record<string, number> = balances.reduce(
        (acc, b) => ({ ...acc, [b.program]: b.balance }),
        {},
      )
      setBalanceMap(map)
      setRoutes((routesData as AwardFlightRoute[] | null) ?? [])
      setAwardRoutes((awardRoutesData as AwardRouteRow[] | null) ?? [])
      setLoading(false)
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enrichedRoutes: RouteWithBalance[] = routes.map((route) => {
    const rawBalance = balanceMap[route.program] ?? 0
    const amexBalance = balanceMap['amex_mr'] ?? 0
    const isTransferEligible = route.program === 'qff' || route.program === 'velocity'

    let userBalance = rawBalance
    let transferredPoints = 0
    let bookableViaTransfer = false

    if (includeAmexTransfers && isTransferEligible && amexBalance > 0) {
      const result = calculateEffectiveBalance(rawBalance, amexBalance, route.program as TransferPartner)
      const wasBookable = rawBalance >= route.points_required
      userBalance = result.effectiveBalance
      transferredPoints = result.transferredPoints
      bookableViaTransfer = !wasBookable && result.effectiveBalance >= route.points_required
    }

    const percentage = Math.min(100, Math.round((userBalance / route.points_required) * 100))
    const canBook = userBalance >= route.points_required
    const almostThere = percentage >= 70 && !canBook

    return { ...route, userBalance, percentage, canBook, almostThere, transferredPoints, bookableViaTransfer }
  })

  const filtered = enrichedRoutes.filter((r) => {
    if (programFilter !== 'all' && r.program !== programFilter) return false
    if (cabinFilter !== 'all' && r.cabin_class !== cabinFilter) return false
    if (originFilter !== 'all' && r.origin_iata !== originFilter) return false
    return true
  })

  const canBookRoutes = filtered.filter((r) => r.canBook)
  const almostThereRoutes = filtered.filter((r) => r.almostThere)
  const otherRoutes = filtered.filter((r) => !r.canBook && !r.almostThere)

  const handleSearch = (query: string) => {
    setRouteSearch(query)
    if (!query.trim()) {
      setSearchResults([])
      setSearchNotFound(false)
      return
    }
    const q = query.toLowerCase().trim()
    const results = awardRoutes.filter((r) => {
      return (
        r.origin_iata.toLowerCase().includes(q) ||
        r.destination_iata.toLowerCase().includes(q) ||
        (r.origin_city?.toLowerCase().includes(q) ?? false) ||
        (r.destination_city?.toLowerCase().includes(q) ?? false) ||
        `${r.origin_iata}${r.destination_iata}`.toLowerCase().includes(q.replace(/[\s–-]/g, '')) ||
        `${r.origin_iata}-${r.destination_iata}`.toLowerCase().includes(q)
      )
    })
    setSearchResults(results)
    setSearchNotFound(results.length === 0)
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-32 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
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
      </header>

      <div className="max-w-[1440px] mx-auto p-8 space-y-10">

        {/* Hero search section */}
        <div className="relative rounded-3xl overflow-hidden min-h-[380px] flex flex-col justify-end p-10 shadow-2xl border border-white/10">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e2640 0%, #111827 60%, #0a0e1a 100%)' }}></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f131f]/60 via-transparent to-transparent"></div>
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

            {/* Route Search — Qantas award pricing */}
            {awardRoutes.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <Input
                    value={routeSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by IATA (SYD, LHR) or city name (Sydney, London)…"
                    className="rounded-full pl-10"
                  />
                </div>

                {/* Search results — only when user has typed */}
                {routeSearch.trim() && searchResults.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {searchResults.map((route) => (
                      <AwardRouteCard key={route.id} route={route} centsPerPoint={CENTS_PER_POINT} />
                    ))}
                  </div>
                )}

                {/* Not found fallback */}
                {searchNotFound && (
                  <div className="glass-panel rounded-2xl py-6 text-center">
                    <Plane className="mx-auto mb-3 h-7 w-7 text-on-surface-variant/40" />
                    <p className="text-sm font-medium text-on-surface">
                      Route not in our database
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Check{' '}
                      <a
                        href="https://www.qantas.com/us/en/frequent-flyer/use-points/classic-flight-rewards.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        qantas.com
                        <ExternalLink className="h-3 w-3" />
                      </a>{' '}
                      for the full zone chart.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Qantas Classic Rewards full route table — below the hero */}
        {awardRoutes.length > 0 && !routeSearch.trim() && (
          <div className="bg-surface-container-low rounded-3xl p-8 border border-white/5">
            <h3 className="text-lg font-headline font-bold mb-6 text-on-surface">Qantas Classic Rewards — Route Search</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {awardRoutes.map((route) => (
                <AwardRouteCard key={route.id} route={route} centsPerPoint={CENTS_PER_POINT} />
              ))}
            </div>
          </div>
        )}

        {/* Balance progress bar section */}
        <div className="bg-[#171b28]/80 rounded-3xl p-10 border border-white/5 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>

          <section>
            <div className="flex items-center justify-between pt-4 mb-8">
              <div>
                <h3 className="text-3xl font-headline font-bold tracking-tight">Top Redemption Matches</h3>
                <p className="text-slate-400 text-base font-medium mt-1">Real-time availability based on your point balance.</p>
              </div>
            </div>

            {/* No balances empty state */}
            {!hasBalances && (
              <div className="glass-panel rounded-2xl py-12 text-center">
                <Plane className="mx-auto mb-3 h-8 w-8 text-on-surface-variant" />
                <p className="text-sm font-medium text-on-surface">
                  No loyalty balances found
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Add your loyalty balances to see what you can book
                </p>
              </div>
            )}

            {/* Filters — horizontal scrollable chip row */}
            {hasBalances && (
              <div className="mb-8 space-y-2">
                <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                  {/* Program chips */}
                  {(['all', 'qff', 'velocity'] as ProgramFilter[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setProgramFilter(v)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        programFilter === v
                          ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                          : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-bright)]'
                      }`}
                    >
                      {v === 'all' ? 'All programs' : v === 'qff' ? 'Qantas FF' : 'Velocity'}
                    </button>
                  ))}
                  <span className="mx-1 self-center text-white/10">|</span>
                  {/* Cabin chips */}
                  {(['all', 'economy', 'business', 'first'] as CabinFilter[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setCabinFilter(v)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        cabinFilter === v
                          ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                          : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-bright)]'
                      }`}
                    >
                      {v === 'all' ? 'All cabins' : v}
                    </button>
                  ))}
                  <span className="mx-1 self-center text-white/10">|</span>
                  {/* Origin chips */}
                  {(['all', 'SYD', 'MEL', 'BNE'] as OriginFilter[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setOriginFilter(v)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        originFilter === v
                          ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                          : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-bright)]'
                      }`}
                    >
                      {v === 'all' ? 'All origins' : v}
                    </button>
                  ))}
                </div>
                {/* Amex MR toggle */}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/5 bg-surface-container px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest">
                  <input
                    type="checkbox"
                    checked={includeAmexTransfers}
                    onChange={(e) => setIncludeAmexTransfers(e.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Include Amex MR transfers
                </label>
              </div>
            )}

            {/* Can book now */}
            {canBookRoutes.length > 0 && (
              <div className="mb-8">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  Can book now ({canBookRoutes.length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {canBookRoutes.map((route) => (
                    <RouteCard key={route.id} route={route} accent="green" />
                  ))}
                </div>
              </div>
            )}

            {/* Almost there */}
            {almostThereRoutes.length > 0 && (
              <div className="mb-8">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Almost there ({almostThereRoutes.length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {almostThereRoutes.map((route) => (
                    <RouteCard key={route.id} route={route} accent="amber" />
                  ))}
                </div>
              </div>
            )}

            {/* All routes grid */}
            {otherRoutes.length > 0 && hasBalances && (
              <div>
                <h4 className="mb-4 text-sm font-semibold text-on-surface">
                  All routes ({otherRoutes.length})
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {otherRoutes.map((route) => (
                    <RouteCard key={route.id} route={route} accent="default" />
                  ))}
                </div>
              </div>
            )}

            {/* Empty filtered state */}
            {filtered.length === 0 && hasBalances && (
              <div className="glass-panel rounded-2xl py-12 text-center">
                <p className="text-sm text-on-surface-variant">
                  No routes match your filters.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function RouteCard({
  route,
  accent,
}: {
  route: RouteWithBalance
  accent: 'green' | 'amber' | 'default'
}) {
  const programGradient =
    route.program === 'qff'
      ? 'linear-gradient(135deg, #c0392b 0%, #8e0000 100%)'
      : 'linear-gradient(135deg, #1a56db 0%, #0a2e7a 100%)'

  const gap = route.points_required - route.userBalance

  return (
    <div className="group bg-surface-container-low/50 rounded-3xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 flex flex-col">
      {/* h-56 image header */}
      <div className="h-56 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: programGradient }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>

        {/* Airline name pill */}
        <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
          <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">
            {PROGRAM_LABELS[route.program] ?? route.program}
          </span>
        </div>

        {/* Points display at bottom */}
        <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
          <div>
            <span className="text-4xl font-headline font-extrabold text-white tabular-nums tracking-tighter">
              {route.points_required.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-primary uppercase ml-2 tracking-widest">Points</span>
          </div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black rounded border border-white/20 uppercase tracking-widest">
            {CABIN_LABELS[route.cabin_class] ?? route.cabin_class}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="space-y-5 mb-8">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-sm font-semibold text-slate-400">Route Path</span>
            <span className="text-sm font-bold text-on-surface">
              {route.origin_iata} → {route.destination_iata}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-sm font-semibold text-slate-400">Cabin Class</span>
            <span className="text-sm font-bold text-on-surface">
              {CABIN_LABELS[route.cabin_class] ?? route.cabin_class}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-400">Total Taxes</span>
            <span className="text-sm font-bold text-on-surface tabular-nums">${route.taxes_aud} AUD</span>
          </div>
        </div>

        {/* Amex transfer badge */}
        {route.bookableViaTransfer && (
          <div className="mb-4">
            <span className="inline-block rounded-full bg-blue-950/60 px-2 py-0.5 text-xs font-medium text-blue-300">
              Bookable via Amex MR transfer
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <RedemptionProgress
            userBalance={route.userBalance}
            pointsRequired={route.points_required}
            program={route.program}
            transferredPoints={route.transferredPoints}
          />
        </div>

        <div className="mt-auto space-y-4">
          {route.canBook ? (
            <button
              onClick={() => route.booking_url && window.open(route.booking_url, '_blank')}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container rounded-2xl text-sm font-black text-on-primary hover:opacity-90 transition-all uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              Book Redemption
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-error/5 p-4 rounded-2xl border border-error/10 flex justify-between items-center">
                <span className="text-xs font-bold text-error uppercase">Gap to target</span>
                <span className="text-lg font-extrabold text-white">{gap.toLocaleString()} pts</span>
              </div>
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-slate-200 uppercase tracking-widest transition-all">
                View Availability
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
