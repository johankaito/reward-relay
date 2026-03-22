'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, ExternalLink, Search } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

const CABIN_STYLES: Record<string, string> = {
  economy: 'bg-white/5 text-on-surface-variant',
  business: 'bg-blue-500/15 text-blue-300',
  first: 'bg-purple-500/15 text-purple-300',
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Rewards
          </p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
            Award Flights
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            What you can book with your points
          </p>
        </div>

        {/* Route Search — Qantas award pricing */}
        {awardRoutes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-on-surface">
              Qantas Classic Rewards — Route Search
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                value={routeSearch}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by IATA (SYD, LHR) or city name (Sydney, London)…"
                className="rounded-full pl-10"
              />
            </div>

            {/* Search results */}
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

            {/* Show all Qantas routes when no search active */}
            {!routeSearch.trim() && (
              <div className="grid gap-4 sm:grid-cols-2">
                {awardRoutes.map((route) => (
                  <AwardRouteCard key={route.id} route={route} centsPerPoint={CENTS_PER_POINT} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Divider */}
        {awardRoutes.length > 0 && (
          <div className="border-t border-white/5" />
        )}

        {/* My Points — balance-aware sweet spot */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-on-surface">
            My Points Sweet Spot
          </h2>

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
            <div className="mb-4 space-y-2">
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
            <div className="mb-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                Can book now ({canBookRoutes.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {canBookRoutes.map((route) => (
                  <RouteCard key={route.id} route={route} accent="green" />
                ))}
              </div>
            </div>
          )}

          {/* Almost there */}
          {almostThereRoutes.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                Almost there ({almostThereRoutes.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {almostThereRoutes.map((route) => (
                  <RouteCard key={route.id} route={route} accent="amber" />
                ))}
              </div>
            </div>
          )}

          {/* All routes grid */}
          {otherRoutes.length > 0 && hasBalances && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-on-surface">
                All routes ({otherRoutes.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  const accentBorder =
    accent === 'green'
      ? 'rgba(78, 222, 163, 0.2)'
      : accent === 'amber'
        ? 'rgba(251, 191, 36, 0.2)'
        : 'rgba(255,255,255,0.05)'

  const programGradient =
    route.program === 'qff'
      ? 'linear-gradient(135deg, #c0392b 0%, #8e0000 100%)'
      : 'linear-gradient(135deg, #1a56db 0%, #0a2e7a 100%)'

  return (
    <div
      className="glass-panel rounded-2xl overflow-hidden"
      style={{ borderColor: accentBorder }}
    >
      {/* Airline gradient header bar */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: programGradient }}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-white/90">
          {PROGRAM_LABELS[route.program] ?? route.program}
        </span>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white/90">
          {CABIN_LABELS[route.cabin_class] ?? route.cabin_class}
        </span>
      </div>
      <CardContent className="space-y-3 p-6">
        {/* Route */}
        <div>
          <p className="text-base font-semibold text-on-surface">
            {route.origin_city} ({route.origin_iata}) → {route.destination_city} (
            {route.destination_iata})
          </p>
        </div>

        {/* Points + taxes */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-on-surface">
            {route.points_required.toLocaleString()} pts
          </span>
          <span className="text-xs text-on-surface-variant">
            + ~${route.taxes_aud} taxes
          </span>
        </div>

        {/* Amex transfer badge */}
        {route.bookableViaTransfer && (
          <span className="inline-block rounded-full bg-blue-950/60 px-2 py-0.5 text-xs font-medium text-blue-300">
            Bookable via Amex MR transfer
          </span>
        )}

        {/* Progress */}
        <RedemptionProgress
          userBalance={route.userBalance}
          pointsRequired={route.points_required}
          program={route.program}
          transferredPoints={route.transferredPoints}
        />

        {/* Book button */}
        {route.canBook && route.booking_url && (
          <Button
            size="sm"
            className="w-full text-on-primary"
            style={{ background: "var(--gradient-cta)" }}
            onClick={() => window.open(route.booking_url!, '_blank')}
          >
            Book now
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </div>
  )
}
