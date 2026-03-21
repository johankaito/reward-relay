import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"

async function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase env vars for service client")
  }

  const cookieStore = await cookies()
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Server component context
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        } catch {
          // Server component context
        }
      },
    },
  })
}

export async function getSubscriptionStatus(userId: string) {
  const supabase = await getServiceClient()

  const { data: subscription } = await supabase
    .from("stripe_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const isPro =
    subscription?.status === "active" || subscription?.status === "trialing"

  return {
    isPro,
    status: subscription?.status || "inactive",
    currentPeriodEnd: subscription?.current_period_end || null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
  }
}
