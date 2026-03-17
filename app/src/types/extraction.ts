export interface AnnualFee {
  amount: number
  currency: 'AUD'
  waiverCondition: string | null
  firstYearDiscount: number | null
}

export interface EarnRate {
  category: string
  pointsPerDollar: number
  programName: string
  monthlyCapDollars: number | null
  cappedRate: number | null
}

export interface BonusOffer {
  bonusPoints: number
  spendRequirement: number
  timeframeMonths: number
  additionalCredit: number | null
  expiryDate: string | null
  newCustomersOnly: boolean
  eligibilityNotes: string | null
}

export interface ExtractedCard {
  cardName: string
  issuer: string
  network: 'Visa' | 'Mastercard' | 'Amex' | 'Diners' | null
  annualFee: AnnualFee
  earnRates: EarnRate[]
  bonusOffer: BonusOffer | null
  purchaseRate: number | null
  cashAdvanceRate: number | null
  interestFreeDays: number | null
  minIncome: number | null
  minCreditLimit: number | null
  confidenceScore: number
  lowConfidenceFields: string[]
  extractionNotes: string
}

export type ConfidenceTier = 'auto-publish' | 'publish-reverify' | 'hold-for-review' | 'manual-review'

export function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 0.90) return 'auto-publish'
  if (score >= 0.75) return 'publish-reverify'
  if (score >= 0.60) return 'hold-for-review'
  return 'manual-review'
}
