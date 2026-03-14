import { getPointValue } from './pointValuations'

// AU FBT year runs 1 April – 31 March (not 1 July – 30 June like income tax)
export function getFbtYear(date: Date): string {
  const month = date.getMonth() // 0-indexed; March = 2, April = 3
  const year = date.getFullYear()
  const fbtYear = month >= 3 ? year : year - 1
  return `FBT ${fbtYear}/${String(fbtYear + 1).slice(2)}`
}

export interface FbtResult {
  fbtYear: string
  totalBusinessPoints: number
  totalBusinessAud: number
  thresholdExceeded: boolean
  estimatedTaxableValue: number
  estimatedFbtLiability: number
  disclaimer: string
}

const FBT_THRESHOLD_POINTS = 250_000
const FBT_RATE = 0.47

interface BusinessCardInput {
  bonus_earned_at: string | null
  welcomeBonusPoints: number
  pointsProgram: string
}

export function calculateFbtExposure(businessCards: BusinessCardInput[]): FbtResult[] {
  const byYear = new Map<string, BusinessCardInput[]>()

  for (const card of businessCards) {
    if (!card.bonus_earned_at) continue
    const year = getFbtYear(new Date(card.bonus_earned_at))
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(card)
  }

  return Array.from(byYear.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([fbtYear, cards]) => {
      const totalPoints = cards.reduce((sum, c) => sum + c.welcomeBonusPoints, 0)
      const totalAud = cards.reduce(
        (sum, c) => sum + c.welcomeBonusPoints * getPointValue(c.pointsProgram),
        0,
      )
      const thresholdExceeded = totalPoints > FBT_THRESHOLD_POINTS
      const taxableValue = thresholdExceeded ? totalAud : 0
      const estimatedFbtLiability = taxableValue * FBT_RATE

      return {
        fbtYear,
        totalBusinessPoints: totalPoints,
        totalBusinessAud: totalAud,
        thresholdExceeded,
        estimatedTaxableValue: taxableValue,
        estimatedFbtLiability,
        disclaimer:
          'This is an indicative estimate only and does not constitute tax advice. Consult a registered tax agent for your FBT obligations.',
      }
    })
}
