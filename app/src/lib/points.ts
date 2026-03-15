/**
 * Points-to-dollar conversion utility.
 *
 * Conversion rates (AUD per point) are based on Australian Frequent Flyer
 * community benchmarks and AFF valuations.
 */

export type PointsProgram = string

export type RedemptionType = "flights_business" | "flights_economy" | "cashback" | "gift_cards" | "default"

const BASE_RATES: Record<string, number> = {
  qantas: 0.02,         // QFF — business class benchmark
  "qantas frequent flyer": 0.02,
  velocity: 0.017,      // Velocity — business class benchmark
  "velocity frequent flyer": 0.017,
  "amex membership rewards": 0.01,
  mr: 0.01,
  "mr gateway": 0.01,
  "anz rewards": 0.006,
  "nab rewards": 0.006,
  "cba awards": 0.006,
  altitude: 0.006,
  amplify: 0.006,
  "bankwest more": 0.006,
}

const REDEMPTION_MULTIPLIERS: Record<RedemptionType, number> = {
  flights_business: 1.0,    // Full rate — aspirational benchmark
  flights_economy: 0.6,
  cashback: 0.4,
  gift_cards: 0.5,
  default: 1.0,
}

/**
 * Convert points to an AUD dollar value.
 * @param pts Number of points
 * @param program Points program name (case-insensitive)
 * @param redemptionType Redemption context (defaults to flights_business)
 */
export function pointsToDollars(
  pts: number,
  program: PointsProgram = "default",
  redemptionType: RedemptionType = "default",
): number {
  const key = program.toLowerCase().trim()
  const rate = BASE_RATES[key] ?? 0.006  // conservative fallback
  const multiplier = REDEMPTION_MULTIPLIERS[redemptionType] ?? 1.0
  return Math.round(pts * rate * multiplier * 100) / 100
}

/**
 * Format a points count with its dollar equivalent.
 * e.g. "45,000 pts ($900 value)"
 */
export function formatPointsWithValue(
  pts: number,
  program: PointsProgram = "default",
  redemptionType: RedemptionType = "default",
): string {
  const dollars = pointsToDollars(pts, program, redemptionType)
  const dollarsFormatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(dollars)

  return `${pts.toLocaleString("en-AU")} pts (${dollarsFormatted} value)`
}

/**
 * Format just the dollar value for primary display contexts.
 */
export function formatPointsAsDollars(
  pts: number,
  program: PointsProgram = "default",
  redemptionType: RedemptionType = "default",
): string {
  const dollars = pointsToDollars(pts, program, redemptionType)
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(dollars)
}

/**
 * Calculate annual earn in dollars from earn rate + monthly spend.
 */
export function annualEarnDollars(
  earnRatePerDollar: number,
  monthlySpend: number,
  program: PointsProgram = "default",
  redemptionType: RedemptionType = "default",
): number {
  const annualPoints = earnRatePerDollar * monthlySpend * 12
  return pointsToDollars(annualPoints, program, redemptionType)
}
