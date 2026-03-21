import Stripe from "stripe"

let _stripe: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    if (!_stripe) {
      const key = process.env.STRIPE_SECRET_KEY
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not set")
      }
      _stripe = new Stripe(key, { typescript: true })
    }
    const value = Reflect.get(_stripe, prop, receiver)
    if (typeof value === "function") {
      return value.bind(_stripe)
    }
    return value
  },
})
