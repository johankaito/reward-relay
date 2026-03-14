'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, ExternalLink } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RedemptionProgress } from '@/components/flights/RedemptionProgress'
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
  economy: 'bg-[var(--surface-strong)] text-[var(--text-secondary)]',
  business: 'bg-blue-100 text-blue-700',
  first: 'bg-purple-100 text-purple-700',
}

const PROGRAM_LABELS: Record<string, string> = {
  qff: 'Qantas FF',
  velocity: 'Velocity',
}

export default function FlightsPage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<RouteWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [hasBalances, setHasBalances] = useState(false)

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

      const [{ data: balancesData }, { data: routesData }] = await Promise.all([
        supabase.from('loyalty_balances' as never).select('*'),
        supabase
          .from('award_flight_routes' as never)
          .select('*')
          .order('points_required', { ascending: true }),
      ])

      const balances: LoyaltyBalance[] = (balancesData as LoyaltyBalance[] | null) ?? []
      setHasBalances(balances.length > 0)

      const balanceMap: Record<string, number> = balances.reduce(
        (acc, b) => ({ ...acc, [b.program]: b.balance }),
        {},
      )

      const rawRoutes = (routesData as AwardFlightRoute[] | null) ?? []
      const enriched: RouteWithBalance[] = rawRoutes.map((route) => {
        const userBalance = balanceMap[route.program] ?? 0
        const percentage = Math.min(100, Math.round((userBalance / route.points_required) * 100))
        const canBook = userBalance >= route.points_required
        const almostThere = percentage >= 70 && !canBook
        return { ...route, userBalance, percentage, canBook, almostThere }
      })

      setRoutes(enriched)
      setLoading(false)
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = routes.filter((r) => {
    if (programFilter !== 'all' && r.program !== programFilter) return false
    if (cabinFilter !== 'all' && r.cabin_class !== cabinFilter) return false
    if (originFilter !== 'all' && r.origin_iata !== originFilter) return false
    return true
  })

  const canBookRoutes = filtered.filter((r) => r.canBook)
  const almostThereRoutes = filtered.filter((r) => r.almostThere)
  const otherRoutes = filtered.filter((r) => !r.canBook && !r.almostThere)

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5">
          <div className="h-14 animate-pulse rounded-xl bg-[var(--surface)]" />
          <div className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
          <div className="h-64 animate-pulse rounded-xl bg-[var(--surface)]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Rewards
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Award Flights</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            What you can book with your points
          </p>
        </div>

        {/* No balances empty state */}
        {!hasBalances && (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="py-12 text-center">
              <Plane className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No loyalty balances found
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Add your loyalty balances to see what you can book
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={programFilter}
            onValueChange={(v) => setProgramFilter(v as ProgramFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              <SelectItem value="qff">Qantas FF</SelectItem>
              <SelectItem value="velocity">Velocity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cabinFilter} onValueChange={(v) => setCabinFilter(v as CabinFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Cabin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cabins</SelectItem>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First</SelectItem>
            </SelectContent>
          </Select>

          <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as OriginFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Origin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All origins</SelectItem>
              <SelectItem value="SYD">Sydney (SYD)</SelectItem>
              <SelectItem value="MEL">Melbourne (MEL)</SelectItem>
              <SelectItem value="BNE">Brisbane (BNE)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Can book now */}
        {canBookRoutes.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-600">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Can book now ({canBookRoutes.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canBookRoutes.map((route) => (
                <RouteCard key={route.id} route={route} accent="green" />
              ))}
            </div>
          </section>
        )}

        {/* Almost there */}
        {almostThereRoutes.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Almost there ({almostThereRoutes.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {almostThereRoutes.map((route) => (
                <RouteCard key={route.id} route={route} accent="amber" />
              ))}
            </div>
          </section>
        )}

        {/* All routes grid */}
        {otherRoutes.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              All routes ({otherRoutes.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherRoutes.map((route) => (
                <RouteCard key={route.id} route={route} accent="default" />
              ))}
            </div>
          </section>
        )}

        {/* Empty filtered state */}
        {filtered.length === 0 && hasBalances && (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No routes match your filters.
              </p>
            </CardContent>
          </Card>
        )}
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
  const borderClass =
    accent === 'green'
      ? 'border-green-200 bg-[var(--surface)]'
      : accent === 'amber'
        ? 'border-amber-200 bg-[var(--surface)]'
        : 'border-[var(--border-default)] bg-[var(--surface)]'

  return (
    <Card className={`border shadow-sm ${borderClass}`}>
      <CardContent className="space-y-3 p-4">
        {/* Program + cabin badges */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {PROGRAM_LABELS[route.program] ?? route.program}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${CABIN_STYLES[route.cabin_class] ?? CABIN_STYLES.economy}`}
          >
            {CABIN_LABELS[route.cabin_class] ?? route.cabin_class}
          </span>
        </div>

        {/* Route */}
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            {route.origin_city} ({route.origin_iata}) → {route.destination_city} (
            {route.destination_iata})
          </p>
        </div>

        {/* Points + taxes */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {route.points_required.toLocaleString()} pts
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            + ~${route.taxes_aud} taxes
          </span>
        </div>

        {/* Progress */}
        <RedemptionProgress
          userBalance={route.userBalance}
          pointsRequired={route.points_required}
          program={route.program}
        />

        {/* Book button */}
        {route.canBook && route.booking_url && (
          <Button
            size="sm"
            className="w-full bg-green-600 text-white hover:bg-green-700"
            onClick={() => window.open(route.booking_url!, '_blank')}
          >
            Book now
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
