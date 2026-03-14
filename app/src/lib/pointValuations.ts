/**
 * Point valuations in AUD per point for loyalty programs.
 * Values based on typical redemption rates for Australian programs.
 */

const POINT_VALUES: Record<string, number> = {
  Qantas: 0.015,   // $0.015 per Qantas FF point
  Velocity: 0.017, // $0.017 per Velocity point
  MR: 0.010,       // $0.010 per Amex Membership Rewards point
  default: 0.010,
}

/**
 * Returns the AUD value per point for a given currency/program label.
 */
export function getPointValue(currency: string): number {
  return POINT_VALUES[currency] ?? POINT_VALUES.default
}
