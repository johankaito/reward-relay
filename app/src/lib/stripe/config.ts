export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY || '',
    price: 9.99,
    display: '$9.99/month',
    interval: 'month' as const,
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL || '',
    price: 99,
    display: '$99/year',
    interval: 'year' as const,
    savings: '$21 saved',
  },
  business_monthly: {
    priceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
    price: 19.99,
    display: '$19.99/month',
    interval: 'month' as const,
  },
  business_annual: {
    priceId: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || '',
    price: 199,
    display: '$199/year',
    interval: 'year' as const,
    savings: '$41 saved',
  },
} as const

export type PlanKey = keyof typeof PLANS

export const BUSINESS_PRICE_IDS = [
  PLANS.business_monthly.priceId,
  PLANS.business_annual.priceId,
]

export const PRO_PRICE_IDS = [
  PLANS.monthly.priceId,
  PLANS.annual.priceId,
]
