'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
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

type Action = {
  key: string
  icon: string
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}

function computeAction(userCards: UserCardSlim[], exclusionRecords: BankExclusionPeriod[]): Action | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const activeCards = userCards.filter((c) => c.status === 'active')

  // Priority 1: active card with bonus_spend_deadline within 21 days
  for (const card of activeCards) {
    if (!card.bonus_spend_deadline || card.bonus_earned) continue
    const deadline = new Date(card.bonus_spend_deadline)
    deadline.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
    if (daysLeft >= 0 && daysLeft <= 21) {
      return {
        key: `spend_deadline_${card.id}`,
        icon: '⏰',
        title: 'Meet your spend target',
        body: `${card.bank ?? ''} ${card.name ?? ''} — deadline ${deadline.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        ctaLabel: 'Track Spend',
        ctaHref: '/spending',
      }
    }
  }

  // Priority 2: active card where application_date + 12 months is within 30 days and annual_fee > 0
  for (const card of activeCards) {
    const refDate = card.application_date || card.approval_date
    if (!refDate || !card.annual_fee || card.annual_fee <= 0) continue
    const renewDate = new Date(refDate)
    renewDate.setFullYear(renewDate.getFullYear() + 1)
    renewDate.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((renewDate.getTime() - now.getTime()) / 86400000)
    if (daysUntil >= 0 && daysUntil <= 30) {
      return {
        key: `annual_fee_${card.id}`,
        icon: '✦',
        title: 'Annual fee decision',
        body: `$${card.annual_fee} renews in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — keep or cancel?`,
        ctaLabel: 'View Card',
        ctaHref: '/cards',
      }
    }
  }

  // Priority 3 & 4: eligibility checks across all banks in history
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

  let soonestEligible: { bank: string; date: Date; days: number } | null = null

  for (const [bank, refDate] of bankMap.entries()) {
    const exclusion = lookupExclusionPeriod(bank, exclusionRecords)
    const result = computeEligibility(bank, bank, refDate, exclusion)

    if (result.isEligible && !activeCards.find((c) => c.bank === bank)) {
      return {
        key: `eligible_now_${bank}`,
        icon: '✓',
        title: "You're eligible again",
        body: `${bank} cooling-off has ended — see your top card`,
        ctaLabel: 'See Cards',
        ctaHref: '/recommendations',
      }
    }

    if (!result.isEligible && result.daysUntilEligible !== null && result.daysUntilEligible <= 30 && result.eligibleDate) {
      if (!soonestEligible || result.daysUntilEligible < soonestEligible.days) {
        soonestEligible = { bank, date: result.eligibleDate, days: result.daysUntilEligible }
      }
    }
  }

  if (soonestEligible) {
    return {
      key: `eligible_soon_${soonestEligible.bank}`,
      icon: '✦',
      title: 'Eligibility restoring soon',
      body: `${soonestEligible.bank} eligible from ${soonestEligible.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} — start planning`,
      ctaLabel: 'Plan Ahead',
      ctaHref: '/recommendations',
    }
  }

  return null
}

export function WeeklyActionCard({ userCards, exclusionRecords }: Props) {
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem('weeklyAction_dismissed')
      if (raw) {
        const parsed = JSON.parse(raw) as { key: string; until: number }
        if (parsed.until > Date.now()) {
          setDismissed(parsed.key)
        } else {
          localStorage.removeItem('weeklyAction_dismissed')
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const action = useMemo(() => computeAction(userCards, exclusionRecords), [userCards, exclusionRecords])

  if (!mounted || !action || action.key === dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(
      'weeklyAction_dismissed',
      JSON.stringify({ key: action.key, until: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    )
    setDismissed(action.key)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5 shrink-0">{action.icon}</span>
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">This Week</p>
          <h3 className="text-base font-bold text-on-surface">{action.title}</h3>
          <p className="text-sm text-on-surface-variant">{action.body}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Link
          href={action.ctaHref}
          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold whitespace-nowrap"
        >
          {action.ctaLabel}
        </Link>
        <button
          onClick={handleDismiss}
          className="text-[10px] text-on-surface-variant hover:text-on-surface"
        >
          Dismiss 7d
        </button>
      </div>
    </div>
  )
}
