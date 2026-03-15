'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, ExternalLink, Sparkles, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { getEligibleDeals, type Deal } from '@/lib/deals'

function isElevated(deal: Deal): boolean {
  if (!deal.title && !deal.description) return false
  const text = `${deal.title ?? ''} ${deal.description ?? ''}`.toLowerCase()
  return text.includes('elevated') || text.includes('limited') || text.includes('exclusive')
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent('/deals')}`)
        return
      }
      setUserId(session.user.id)
      const eligible = await getEligibleDeals(session.user.id, supabase)
      setDeals(eligible)
      setLoading(false)
    }
    void load()
  }, [router])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--surface-subtle)]" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">Rewards</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Deals</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Personalised offers based on your eligibility
          </p>
        </div>

        {deals.length === 0 ? (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-[var(--text-secondary)]/40" />
              <p className="text-sm font-medium text-[var(--text-primary)]">No deals available right now</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Check back soon — new offers sync every 6 hours
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <Card
                key={deal.id}
                className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {isElevated(deal) && (
                          <Flame className="h-4 w-4 shrink-0 text-orange-400" />
                        )}
                        <p className="font-medium text-[var(--text-primary)]">
                          {deal.title ?? 'Untitled deal'}
                        </p>
                      </div>
                      {deal.description && (
                        <p className="text-sm text-[var(--text-secondary)]">{deal.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {deal.specific_issuer && (
                          <Badge variant="outline" className="text-xs">
                            {deal.specific_issuer}
                          </Badge>
                        )}
                        {deal.valid_until && (
                          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                            <Sparkles className="h-3 w-3" />
                            Expires {new Date(deal.valid_until).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {deal.source_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(deal.source_url!, '_blank')}
                        className="shrink-0"
                      >
                        View
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
