import type { ExtractedCard } from '@/types/extraction'

// Placeholder — full implementation in CA-7
export interface CdrProduct {
  id: string
  product_id: string
  bank_slug: string
  bank_name: string
  product_name: string
  annual_fee_amount: number | null
  loyalty_program_name: string | null
  is_active: boolean | null
}

export interface Conflict {
  field: string
  cdrValue: unknown
  extractedValue: unknown
  difference?: number
}

export interface ReconciliationResult {
  conflicts: Conflict[]
  resolvedAnnualFee: number | null
  requiresReview: boolean
  isDiscontinued: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function reconcileCardData(
  _cdrProduct: CdrProduct,
  _extractedCard: ExtractedCard
): ReconciliationResult {
  // Placeholder implementation — CA-7 will complete this
  return {
    conflicts: [],
    resolvedAnnualFee: null,
    requiresReview: false,
    isDiscontinued: false,
  }
}
