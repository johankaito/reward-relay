export interface BankExclusionPeriod {
  bank_slug: string
  bank_name: string
  exclusion_months: number | null
  exclusion_note: string | null
  applies_to: string | null
}

export interface EligibilityResult {
  bankSlug: string
  bankName: string
  lastApplicationDate: string | null
  exclusionMonths: number | null
  eligibleDate: Date | null
  daysUntilEligible: number | null
  isEligible: boolean
  hasUnknownWindow: boolean
  note: string | null
}

/**
 * Compute re-eligibility status for a bank given the last application date
 * and the bank's exclusion period data.
 *
 * Logic:
 *   eligibleDate = lastApplicationDate + exclusionMonths
 *   daysUntilEligible = eligibleDate - today
 *   if daysUntilEligible <= 0: eligible now
 *   if exclusionMonths = NULL: unknown window
 */
export function computeEligibility(
  bankSlug: string,
  bankName: string,
  lastApplicationDate: string | null,
  exclusionPeriod: BankExclusionPeriod | null,
): EligibilityResult {
  const exclusionMonths = exclusionPeriod?.exclusion_months ?? null
  const note = exclusionPeriod?.exclusion_note ?? null

  if (!lastApplicationDate) {
    return {
      bankSlug,
      bankName,
      lastApplicationDate: null,
      exclusionMonths,
      eligibleDate: null,
      daysUntilEligible: null,
      isEligible: true,
      hasUnknownWindow: exclusionMonths === null,
      note,
    }
  }

  if (exclusionMonths === null) {
    return {
      bankSlug,
      bankName,
      lastApplicationDate,
      exclusionMonths: null,
      eligibleDate: null,
      daysUntilEligible: null,
      isEligible: false,
      hasUnknownWindow: true,
      note,
    }
  }

  const appDate = new Date(lastApplicationDate)
  const eligibleDate = new Date(appDate)
  eligibleDate.setMonth(eligibleDate.getMonth() + exclusionMonths)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysRemaining = Math.ceil((eligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilEligible = daysRemaining > 0 ? daysRemaining : 0

  return {
    bankSlug,
    bankName,
    lastApplicationDate,
    exclusionMonths,
    eligibleDate,
    daysUntilEligible,
    isEligible: daysUntilEligible === 0,
    hasUnknownWindow: false,
    note,
  }
}

/**
 * Format eligibility date display string.
 */
export function formatEligibilityLabel(result: EligibilityResult): string {
  if (result.hasUnknownWindow) {
    return 'Check eligibility on bank website'
  }
  if (result.isEligible) {
    return 'Eligible now'
  }
  if (result.daysUntilEligible !== null) {
    if (result.daysUntilEligible < 30) {
      return `Eligible in ${result.daysUntilEligible} day${result.daysUntilEligible === 1 ? '' : 's'}`
    }
    const months = Math.ceil(result.daysUntilEligible / 30)
    const dateStr = result.eligibleDate
      ? result.eligibleDate.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''
    return `Eligible in ${months} month${months === 1 ? '' : 's'}${dateStr ? ` (${dateStr})` : ''}`
  }
  return 'Eligible now'
}
