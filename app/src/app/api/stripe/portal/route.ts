import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/client"
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

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const serviceClient = await getServiceClient()

    const { data: customer } = await serviceClient
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}
