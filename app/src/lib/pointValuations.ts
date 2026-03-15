// AUD per point — based on AFF community standard valuations
export const POINT_VALUATIONS: Record<string, number> = {
  Qantas: 0.015, // QFF points redeemed for flights
  Velocity: 0.017, // Velocity points redeemed for flights
  MR: 0.01, // Amex Membership Rewards
  "MR Gateway": 0.01,
  "ANZ Rewards": 0.006,
  "NAB Rewards": 0.006,
  "CBA Awards": 0.006,
  Altitude: 0.006,
  Amplify: 0.006,
  "Bankwest More": 0.006,
  default: 0.006, // fallback for unknown programs
}

export function getPointValue(pointsProgram: string): number {
  return POINT_VALUATIONS[pointsProgram] ?? POINT_VALUATIONS["default"]
}

export function getFinancialYear(date: string): string {
  const d = new Date(date)
  const year = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1
  return `FY${year}/${String(year + 1).slice(2)}`
  // e.g. 'FY2025/26'
}
