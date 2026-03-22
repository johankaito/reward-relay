'use client'

import { ExternalLink, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface AwardRouteRow {
  id: string
  origin_iata: string
  destination_iata: string
  origin_city: string | null
  destination_city: string | null
  distance_miles: number
  program: string
  zone: number | null
  economy_pts: number | null
  premium_economy_pts: number | null
  business_pts: number | null
  first_pts: number | null
  is_domestic: boolean
  is_dynamic: boolean
  notes: string | null
  data_last_updated: string
}

interface AwardRouteCardProps {
  route: AwardRouteRow
  /** Cents per point used for dollar value calculation */
  centsPerPoint?: number
}

const CABIN_LABELS: Record<string, string> = {
  economy: 'Economy',
  premium_economy: 'Prem Economy',
  business: 'Business Class',
  first: 'First Class',
}

const CABIN_STYLES: Record<string, string> = {
  economy: 'bg-white/5 text-on-surface-variant',
  premium_economy: 'bg-sky-500/15 text-sky-300',
  business: 'bg-blue-500/15 text-blue-300',
  first: 'bg-purple-500/15 text-purple-300',
}

function formatPts(pts: number): string {
  return pts.toLocaleString('en-AU')
}

function calcValue(pts: number, centsPerPoint: number): string {
  const aud = (pts * centsPerPoint) / 100
  return `$${Math.round(aud).toLocaleString('en-AU')}`
}

export function AwardRouteCard({ route, centsPerPoint = 2 }: AwardRouteCardProps) {
  const cabins: { key: string; pts: number | null }[] = [
    { key: 'economy', pts: route.economy_pts },
    { key: 'premium_economy', pts: route.premium_economy_pts },
    { key: 'business', pts: route.business_pts },
    { key: 'first', pts: route.first_pts },
  ]

  const availableCabins = cabins.filter((c) => c.pts !== null)
  const bestValueCabin = availableCabins.reduce(
    (best, cabin) => {
      if (!best || cabin.key === 'business') return cabin
      return best
    },
    null as { key: string; pts: number | null } | null,
  )

  return (
    <Card className="overflow-hidden border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
      {/* Gradient destination header bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #0f2d24 100%)" }}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-primary/90">
          {route.origin_iata} → {route.destination_iata}
        </span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white/60">
          {route.distance_miles.toLocaleString('en-AU')} mi
        </span>
      </div>
      <CardContent className="space-y-3 p-6">
        {/* Route header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-on-surface">
              {route.origin_city ?? route.origin_iata} → {route.destination_city ?? route.destination_iata}
            </p>
            <p className="text-xs text-on-surface-variant">
              {route.origin_iata}–{route.destination_iata}
              {route.zone !== null && (
                <>
                  {' · '}
                  <a
                    href="https://www.qantas.com/us/en/frequent-flyer/use-points/classic-flight-rewards.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[var(--accent)] hover:underline"
                  >
                    Zone {route.zone}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </>
              )}
              {' · '}
              {route.distance_miles.toLocaleString('en-AU')} mi
              {route.is_domestic && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  Domestic
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Cabin class pricing */}
        <div className="space-y-1.5">
          {availableCabins.map((cabin) => {
            const isBestValue = cabin.key === bestValueCabin?.key
            return (
              <div
                key={cabin.key}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{
                  background: isBestValue ? 'rgba(78,222,163,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isBestValue ? '1px solid rgba(78,222,163,0.2)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${CABIN_STYLES[cabin.key] ?? CABIN_STYLES.economy}`}
                  >
                    {CABIN_LABELS[cabin.key] ?? cabin.key}
                  </span>
                  {isBestValue && (
                    <span className="text-xs font-medium text-primary">Best value</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-on-surface">
                    {formatPts(cabin.pts!)} pts
                  </span>
                  <span className="ml-2 text-xs text-on-surface-variant">
                    ({calcValue(cabin.pts!, centsPerPoint)} value)
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic pricing warning */}
        {route.is_dynamic && (
          <p className="text-xs text-amber-400">
            Dynamic pricing — points shown are minimums. Actual redemptions vary by availability.
          </p>
        )}

        {/* Notes / caveats */}
        {route.notes && (
          <div className="flex items-start gap-1.5 rounded-lg px-3 py-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-300">{route.notes}</p>
          </div>
        )}

        {/* Data freshness */}
        <p className="text-xs text-on-surface-variant/60">
          Data as of {new Date(route.data_last_updated).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
          {' · '}
          <a
            href="https://www.qantas.com/us/en/frequent-flyer/use-points/classic-flight-rewards.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            Verify on qantas.com
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
