import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"
import type Stripe from "stripe"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      get() { return undefined },
      set() {},
      remove() {},
    },
  })
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0]
  return {
    start: item ? new Date(item.current_period_start * 1000).toISOString() : null,
    end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
  }
}

async function upsertSubscription(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  subscription: Stripe.Subscription
) {
  const period = getSubscriptionPeriod(subscription)
  await supabase.from("stripe_subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId || !session.subscription) break

      const subId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id
      const response = await stripe.subscriptions.retrieve(subId)
      await upsertSubscription(supabase, userId, response as unknown as Stripe.Subscription)

      if (response.status === "trialing") {
        await supabase
          .from("stripe_customers")
          .update({ has_used_trial: true })
          .eq("user_id", userId)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      let resolvedUserId: string | null = subscription.metadata?.supabase_user_id || null

      if (!resolvedUserId) {
        const { data: customer } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", getCustomerId(subscription.customer))
          .maybeSingle()
        resolvedUserId = customer?.user_id || null
      }

      if (!resolvedUserId) break
      await upsertSubscription(supabase, resolvedUserId, subscription)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from("stripe_subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const subDetails = invoice.parent?.subscription_details
      if (subDetails?.subscription) {
        const subId = typeof subDetails.subscription === "string"
          ? subDetails.subscription
          : subDetails.subscription.id
        await supabase
          .from("stripe_subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
