import { createHash } from 'crypto'
import type { EarnRate } from '@/types/extraction'

export interface HashableCard {
  annualFee: number
  earnRates: Pick<EarnRate, 'category' | 'pointsPerDollar'>[]
  bonusPoints: number
  spendReq: number
}

export function computeChangeHash(card: HashableCard): string {
  // Sort earn rates by category for deterministic ordering
  const sortedEarnRates = [...card.earnRates].sort((a, b) =>
    a.category.localeCompare(b.category)
  )

  const canonical = {
    annualFee: card.annualFee,
    earnRates: sortedEarnRates.map((r) => ({
      cat: r.category,
      ppd: r.pointsPerDollar,
    })),
    bonusPoints: card.bonusPoints,
    spendReq: card.spendReq,
  }

  return createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex')
    .slice(0, 16)
}

export interface HashComparisonResult {
  newHash: string
  hasChanged: boolean
  shouldScheduleValidation: boolean
}

export function compareHashes(
  newHash: string,
  storedHash: string | null,
  lastExtractedAt: string | null
): HashComparisonResult {
  const hasChanged = storedHash !== null && newHash !== storedHash

  // Schedule validation if same hash for 30+ days
  const shouldScheduleValidation =
    !hasChanged &&
    lastExtractedAt !== null &&
    Date.now() - new Date(lastExtractedAt).getTime() > 30 * 24 * 60 * 60 * 1000

  return { newHash, hasChanged, shouldScheduleValidation }
}
