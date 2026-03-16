import { differenceInDays } from 'date-fns'
import { getPointValue } from './pointValuations'

export interface LoyaltyBalance {
  id: string
  user_id: string
  program: string
  balance: number
  expiry_date: string | null
  last_updated: string | null
  notes: string | null
  created_at: string | null
}

const PROGRAM_TO_CURRENCY: Record<string, string> = {
  qff:      'Qantas',
  velocity: 'Velocity',
  amex_mr:  'MR',
}

export interface NetWorthBreakdown {
  program: string
  balance: number
  ratePerPoint: number
  audValue: number
  expiryDate: string | null
  isExpiringSoon: boolean  // within 60 days
}

export function calculateNetWorth(balances: LoyaltyBalance[]): {
  breakdown: NetWorthBreakdown[]
  total: number
} {
  const breakdown = balances.map(b => {
    const currency = PROGRAM_TO_CURRENCY[b.program] ?? 'default'
    const rate = getPointValue(currency)
    const audValue = b.balance * rate
    const isExpiringSoon = b.expiry_date
      ? differenceInDays(new Date(b.expiry_date), new Date()) <= 60
      : false

    return {
      program: b.program,
      balance: b.balance,
      ratePerPoint: rate,
      audValue,
      expiryDate: b.expiry_date,
      isExpiringSoon,
    }
  })

  return {
    breakdown,
    total: breakdown.reduce((sum, b) => sum + b.audValue, 0),
  }
}
