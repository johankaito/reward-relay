import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { PLANS, TRIAL_DAYS, assertStripeConfigured } from "@/lib/stripe/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"
import { cookies } from "next/headers"

async function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  const cookieStore = await cookies()
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set() {},
      remove() {},
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    assertStripeConfigured()
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const plan = body.plan as "monthly" | "annual"

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = PLANS[plan].priceId
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 })
    }

    const serviceClient = await getServiceClient()

    // Lookup or create Stripe customer
    const { data: existingCustomer } = await serviceClient
      .from("stripe_customers")
      .select("stripe_customer_id, has_used_trial")
      .eq("user_id", user.id)
      .maybeSingle()

    let stripeCustomerId: string

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      await serviceClient.from("stripe_customers").insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        ...(existingCustomer?.has_used_trial ? {} : { trial_period_days: TRIAL_DAYS }),
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${appUrl}/recommendations?upgraded=true`,
      cancel_url: `${appUrl}/dashboard`,
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
