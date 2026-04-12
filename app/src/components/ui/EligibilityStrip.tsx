'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { computeEligibility } from '@/lib/eligibility'
import { lookupExclusionPeriod } from '@/lib/bank-exclusions'
import type { BankExclusionPeriod } from '@/lib/bank-exclusions'

type UserCardSlim = {
  id: string
  bank: string | null
  name: string | null
  application_date: string | null
  approval_date: string | null
  cancellation_date: string | null
  bonus_spend_deadline: string | null
  annual_fee: number | null
  status: string | null
  bonus_earned: boolean
}

type Props = {
  userCards: UserCardSlim[]
  exclusionRecords: BankExclusionPeriod[]
}

export function EligibilityStrip({ userCards, exclusionRecords }: Props) {
  const chips = useMemo(() => {
    const bankMap = new Map<string, string>()
    for (const card of userCards) {
      if (!card.bank) continue
      const refDate = card.cancellation_date || card.application_date || card.approval_date
      if (!refDate) continue
      const existing = bankMap.get(card.bank)
      if (!existing || new Date(refDate) > new Date(existing)) {
        bankMap.set(card.bank, refDate)
      }
    }

    return Array.from(bankMap.entries()).map(([bank, refDate]) => {
      const exclusion = lookupExclusionPeriod(bank, exclusionRecords)
      const result = computeEligibility(bank, bank, refDate, exclusion)
      const totalDays = (exclusion?.exclusion_months ?? 0) * 30
      const elapsed = totalDays - (result.daysUntilEligible ?? 0)
      const pct = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100))) : 100
      return { bank, result, pct, totalDays }
    })
  }, [userCards, exclusionRecords])

  if (chips.length === 0) return null

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
        Your Eligibility Windows
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {chips.map(({ bank, result, pct }) => {
          if (result.isEligible) {
            return (
              <div
                key={bank}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-1.5"
              >
                <span className="text-xs font-bold text-on-surface">{bank}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold w-fit">
                  Eligible now
                </span>
                <Link
                  href="/recommendations"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-0.5"
                >
                  See cards →
                </Link>
              </div>
            )
          }

          const daysLeft = result.daysUntilEligible ?? null
          const eligibleDateStr = result.eligibleDate
            ? result.eligibleDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
            : null

          return (
            <div
              key={bank}
              className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1.5"
            >
              <span className="text-xs font-bold text-on-surface">{bank}</span>
              {daysLeft !== null ? (
                <span className="text-[11px] text-on-surface-variant">{daysLeft} days remaining</span>
              ) : (
                <span className="text-[11px] text-on-surface-variant">Unknown window</span>
              )}
              {eligibleDateStr && (
                <span className="text-[10px] text-on-surface-variant opacity-70">{eligibleDateStr}</span>
              )}
              <div className="w-full h-1.5 rounded-full bg-white/10 mt-2">
                <div
                  className="h-full rounded-full bg-amber-400/60"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
