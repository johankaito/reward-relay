import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"
import { lookupExclusionPeriod } from "./bank-exclusions"
import type { BankExclusionPeriod } from "./bank-exclusions"

export type Deal = Database["public"]["Tables"]["deals"]["Row"]

export async function getEligibleDeals(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<Deal[]> {
  const [allDealsResult, exclusionPeriodsResult, cancelledCardsResult] = await Promise.all([
    supabase
      .from("deals")
      .select("*")
      .eq("is_active", true)
      .gt("valid_until", new Date().toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("bank_exclusion_periods").select("*"),
    supabase
      .from("user_cards")
      .select("bank, cancellation_date")
      .eq("user_id", userId)
      .eq("status", "cancelled"),
  ])

  const exclusionPeriods: BankExclusionPeriod[] = (exclusionPeriodsResult.data as BankExclusionPeriod[]) ?? []
  const allCancellations = cancelledCardsResult.data ?? []
  const now = new Date()

  const ineligibleBanks = new Set<string>()
  for (const card of allCancellations) {
    if (!card.bank || !card.cancellation_date) continue
    const exclusionRecord = lookupExclusionPeriod(card.bank, exclusionPeriods)
    const coolingMonths = exclusionRecord?.exclusion_months ?? 18
    const eligibleAt = new Date(card.cancellation_date)
    eligibleAt.setMonth(eligibleAt.getMonth() + coolingMonths)
    if (now < eligibleAt) {
      ineligibleBanks.add(card.bank.toLowerCase())
    }
  }

  return (allDealsResult.data ?? []).filter((deal) => {
    if (!deal.specific_issuer) return true
    return !ineligibleBanks.has(deal.specific_issuer.toLowerCase())
  })
}
