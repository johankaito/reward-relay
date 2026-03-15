export const AMEX_TRANSFER_PARTNERS = {
  qff: { ratio: 2, name: 'Qantas Frequent Flyer', minTransfer: 500 },
  velocity: { ratio: 2, name: 'Velocity Frequent Flyer', minTransfer: 500 },
  // Future: krisflyer, cathay
} as const

export type TransferPartner = keyof typeof AMEX_TRANSFER_PARTNERS

/**
 * Convert Amex MR points to partner program points.
 * 2 Amex MR = 1 partner point (ratio: 2).
 */
export function amexMrToPartnerPoints(
  amexBalance: number,
  partner: TransferPartner,
): number {
  return Math.floor(amexBalance / AMEX_TRANSFER_PARTNERS[partner].ratio)
}

/**
 * Calculate the effective loyalty balance for a route when Amex MR transfers
 * are included. Returns the combined balance and the number of points that
 * would come from transferring Amex MR.
 *
 * Minimum transfer is 500 partner points (= 1000 Amex MR at 2:1 ratio).
 */
export function calculateEffectiveBalance(
  routeBalance: number,
  amexBalance: number,
  program: TransferPartner,
): { effectiveBalance: number; transferredPoints: number } {
  const partner = AMEX_TRANSFER_PARTNERS[program]
  const minAmexRequired = partner.minTransfer * partner.ratio
  const transferredPoints =
    amexBalance >= minAmexRequired ? amexMrToPartnerPoints(amexBalance, program) : 0
  return {
    effectiveBalance: routeBalance + transferredPoints,
    transferredPoints,
  }
}
