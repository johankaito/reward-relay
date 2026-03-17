import type { ExtractedCard } from '@/types/extraction'

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

export function reconcileCardData(
  cdrProduct: CdrProduct,
  extractedCard: ExtractedCard
): ReconciliationResult {
  const conflicts: Conflict[] = []
  let resolvedAnnualFee: number | null = null
  let requiresReview = false

  // Check if product is discontinued in CDR
  const isDiscontinued = cdrProduct.is_active === false

  // Annual fee reconciliation
  if (cdrProduct.annual_fee_amount !== null && extractedCard.annualFee?.amount !== undefined) {
    const cdrFee = cdrProduct.annual_fee_amount
    const extractedFee = extractedCard.annualFee.amount
    const difference = Math.abs(cdrFee - extractedFee)

    if (difference > 10) {
      // Significant discrepancy — flag as conflict
      conflicts.push({
        field: 'annualFee',
        cdrValue: cdrFee,
        extractedValue: extractedFee,
        difference,
      })
      requiresReview = true
      console.warn(
        `Annual fee conflict for ${cdrProduct.product_name}: CDR=$${cdrFee}, LLM=$${extractedFee} (diff=$${difference})`
      )
    } else {
      // Within tolerance — use CDR value as authoritative
      resolvedAnnualFee = cdrFee
    }
  } else if (cdrProduct.annual_fee_amount !== null) {
    // CDR has fee but LLM didn't extract it — use CDR
    resolvedAnnualFee = cdrProduct.annual_fee_amount
  } else if (extractedCard.annualFee?.amount !== undefined) {
    // No CDR data — use LLM extracted value
    resolvedAnnualFee = extractedCard.annualFee.amount
  }

  // Loyalty program name check (informational only, no conflict flagging)
  if (
    cdrProduct.loyalty_program_name &&
    extractedCard.earnRates?.length > 0
  ) {
    const extractedPrograms = extractedCard.earnRates.map((r) =>
      r.programName.toLowerCase()
    )
    const cdrProgram = cdrProduct.loyalty_program_name.toLowerCase()
    const programMatches = extractedPrograms.some(
      (p) => p.includes(cdrProgram) || cdrProgram.includes(p)
    )
    if (!programMatches) {
      conflicts.push({
        field: 'loyaltyProgram',
        cdrValue: cdrProduct.loyalty_program_name,
        extractedValue: extractedCard.earnRates[0]?.programName ?? null,
      })
    }
  }

  return {
    conflicts,
    resolvedAnnualFee,
    requiresReview: requiresReview || isDiscontinued,
    isDiscontinued,
  }
}
