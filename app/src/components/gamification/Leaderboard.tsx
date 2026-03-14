'use client'

import { useEffect, useState } from 'react'
import { createHash } from 'crypto'
import { Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ProGate } from '@/components/ui/ProGate'
import type { Database } from '@/types/database.types'

type LeaderboardRow = Database['public']['Tables']['leaderboard_cache']['Row']

interface LeaderboardProps {
  isPro: boolean
}

function hashUserId(userId: string): string {
  return createHash('sha256').update(userId).digest('hex')
}

function displayName(hash: string): string {
  return `Churner #${hash.slice(-4)}`
}

function fmtAud(n: number): string {
  return n.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  })
}

export function Leaderboard({ isPro }: LeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [currentUserHash, setCurrentUserHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setCurrentUserHash(hashUserId(user.id))
      }

      const { data } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .order('rank', { ascending: true })
        .limit(100)

      setRows(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="mt-3 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-[var(--surface-muted)]" />
          ))}
        </div>
      </div>
    )
  }

  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
            <th className="px-4 py-2.5 text-left font-medium">Rank</th>
            <th className="px-4 py-2.5 text-left font-medium">Churner ID</th>
            <th className="px-4 py-2.5 text-right font-medium">Net Earned</th>
            <th className="px-4 py-2.5 text-right font-medium">Cards</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isCurrentUser = currentUserHash && row.user_hash === currentUserHash
            return (
              <tr
                key={row.user_hash}
                className={`border-b border-[var(--border-default)] last:border-0 ${
                  isCurrentUser ? 'bg-[var(--accent)]/10' : ''
                }`}
              >
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                  {row.rank <= 3 ? (
                    <span className="flex items-center gap-1">
                      {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : '🥉'}
                      {row.rank}
                    </span>
                  ) : (
                    row.rank
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--text-primary)]">
                  {isCurrentUser ? (
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                      ▶ YOU {displayName(row.user_hash)}
                    </span>
                  ) : (
                    displayName(row.user_hash)
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                  {fmtAud(row.total_aud_earned)}
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                  {row.cards_churned}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-[var(--text-secondary)]"
              >
                No leaderboard data yet. Check back tomorrow after the daily refresh.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <Trophy className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Churners</h3>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{ background: 'var(--gradient-cta)', color: 'white' }}
        >
          Pro
        </span>
      </div>
      <ProGate feature="leaderboard" isPro={isPro} previewRows={3}>
        {tableContent}
      </ProGate>
    </div>
  )
}
