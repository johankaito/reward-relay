import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

export type Deal = Database["public"]["Tables"]["deals"]["Row"]

export async function getEligibleDeals(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<Deal[]> {
  const { data: allDeals } = await supabase
    .from("deals")
    .select("*")
    .eq("is_active", true)
    .gt("valid_until", new Date().toISOString())
    .order("created_at", { ascending: false })

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const { data: recentCancellations } = await supabase
    .from("user_cards")
    .select("bank, cancellation_date")
    .eq("user_id", userId)
    .eq("status", "cancelled")
    .gte("cancellation_date", twelveMonthsAgo.toISOString().split("T")[0])

  const ineligibleBanks = new Set(
    recentCancellations?.map((c) => c.bank?.toLowerCase() ?? "") ?? []
  )

  return (allDeals ?? []).filter((deal) => {
    if (!deal.specific_issuer) return true
    return !ineligibleBanks.has(deal.specific_issuer.toLowerCase())
  })
}
