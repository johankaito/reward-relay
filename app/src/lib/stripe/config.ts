export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY || "",
    name: "Pro Monthly",
    price: 9.99,
    interval: "month" as const,
    display: "$9.99/month",
  },
  annual: {
    priceId: process.env.STRIPE_PRICE_ANNUAL || "",
    name: "Pro Annual",
    price: 99,
    interval: "year" as const,
    display: "$99/year",
    savings: "$21 saved",
  },
} as const

if (
  process.env.NODE_ENV === "production" &&
  !process.env.STRIPE_PRICE_MONTHLY &&
  !process.env.STRIPE_PRICE_ANNUAL
) {
  throw new Error(
    "STRIPE_PRICE_MONTHLY and STRIPE_PRICE_ANNUAL must be set in production"
  )
}

export const FREE_CARD_LIMIT = 3
export const TRIAL_DAYS = 7
