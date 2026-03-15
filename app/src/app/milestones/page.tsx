'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { Leaderboard } from '@/components/gamification/Leaderboard'
import { supabase } from '@/lib/supabase/client'

export default function MilestonesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent('/milestones')}`)
        return
      }
      setUserId(session.user.id)
      const meta = session.user.user_metadata as Record<string, unknown>
      setIsPro(meta?.is_pro === true || ['pro', 'business'].includes(String(meta?.subscription_tier ?? '')))
      setLoading(false)
    }
    void load()
  }, [router])

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-[var(--surface-subtle)]" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
            Achievements
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Milestones</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your badges and leaderboard ranking
          </p>
        </div>

        {userId ? (
          <>
            <BadgeGrid userId={userId} />
            <Leaderboard isPro={isPro} />
          </>
        ) : (
          <Card className="border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="mb-3 h-10 w-10 text-[var(--text-secondary)]/40" />
              <p className="text-sm text-[var(--text-secondary)]">Loading your milestones…</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
