'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type BadgeDefinition = Database['public']['Tables']['badge_definitions']['Row']
type UserBadge = Pick<Database['public']['Tables']['user_badges']['Row'], 'badge_type' | 'earned_at'>

interface BadgeGridProps {
  userId: string
}

function formatDate(isoString: string | null): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BadgeGrid({ userId }: BadgeGridProps) {
  const [definitions, setDefinitions] = useState<BadgeDefinition[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [earnedSet, setEarnedSet] = useState<Set<string>>(new Set())
  const [earnedDates, setEarnedDates] = useState<Map<string, string | null>>(new Map())
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    async function load() {
      const [defsResult, badgesResult] = await Promise.all([
        supabase.from('badge_definitions').select('*').order('tier').order('name'),
        supabase
          .from('user_badges')
          .select('badge_type, earned_at')
          .eq('user_id', userId),
      ])

      const defs = defsResult.data ?? []
      const badges = badgesResult.data ?? []

      setDefinitions(defs)
      setUserBadges(badges)

      const earned = new Set(badges.map((b) => b.badge_type))
      const dates = new Map(badges.map((b) => [b.badge_type, b.earned_at]))
      setEarnedSet(earned)
      setEarnedDates(dates)

      const earnedCount = earned.size
      setIsExpanded(earnedCount <= 3)
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
          ))}
        </div>
      </div>
    )
  }

  const earnedCount = earnedSet.size
  const earnedBadges = definitions.filter((d) => earnedSet.has(d.badge_type))
  const lockedBadges = definitions.filter((d) => !earnedSet.has(d.badge_type))

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Achievements</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background: 'var(--accent)',
              color: 'white',
            }}
          >
            {earnedCount}/{definitions.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {earnedBadges.length > 0 && (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                Earned
              </p>
              <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {earnedBadges.map((badge) => {
                  const earnedAt = earnedDates.get(badge.badge_type)
                  return (
                    <div
                      key={badge.badge_type}
                      title={`${badge.name} — earned ${formatDate(earnedAt)}`}
                      className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3 text-center transition-all hover:border-[var(--accent)]/50 hover:shadow-sm"
                    >
                      <span className="text-2xl">{badge.icon_emoji}</span>
                      <span className="text-[10px] font-medium leading-tight text-[var(--text-primary)]">
                        {badge.name}
                      </span>
                      {earnedAt && (
                        <span className="text-[9px] text-[var(--text-secondary)]">
                          {formatDate(earnedAt)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {lockedBadges.length > 0 && (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                Locked
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.badge_type}
                    title={badge.description}
                    className="relative flex flex-col items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] p-3 text-center opacity-40"
                  >
                    <span className="text-2xl">{badge.icon_emoji}</span>
                    <span className="text-[10px] font-medium leading-tight text-[var(--text-primary)]">
                      {badge.name}
                    </span>
                    <Lock className="absolute right-1.5 top-1.5 h-2.5 w-2.5 text-[var(--text-secondary)]" />
                  </div>
                ))}
              </div>
            </>
          )}

          {definitions.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--text-secondary)]">
              No badges available yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
