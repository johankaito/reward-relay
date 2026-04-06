import type { Database } from "@/types/database.types"

export type BankExclusionPeriod = Database["public"]["Tables"]["bank_exclusion_periods"]["Row"]

export const LOW_CONFIDENCE_THRESHOLD = 80

export function normalizeBankName(bankName: string): string | null {
  const lower = bankName.toLowerCase()
  if (lower.includes("amex") || lower.includes("american express")) return "amex-au"
  if (lower === "anz") return "anz"
  if (lower.includes("westpac")) return "westpac"
  if (lower.includes("st.george") || lower.includes("bank of melbourne") || lower.includes("banksa")) return "stgeorge-bom-banksa"
  if (lower.includes("bankwest")) return "bankwest"
  if (lower.includes("commonwealth") || lower.includes("commbank") || lower === "cba") return "commbank"
  if (lower === "nab" || lower.includes("national australia")) return "nab"
  if (lower.includes("hsbc")) return "hsbc-au-qantas"
  if (lower.includes("virgin money")) return "virgin-money-au"
  if (lower.includes("macquarie")) return "macquarie"
  return null
}

export function lookupExclusionPeriod(
  bankName: string,
  exclusionPeriods: BankExclusionPeriod[]
): BankExclusionPeriod | null {
  const slug = normalizeBankName(bankName)
  if (!slug) return null
  return exclusionPeriods.find((p) => p.bank_slug === slug) ?? null
}
