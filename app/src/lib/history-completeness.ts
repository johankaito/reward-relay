import type { Database } from "@/types/database.types"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

// Types
export type CompletenessLevel = "empty" | "sparse" | "good" | "complete"

export interface HistoryCompleteness {
  score: number
  cardCount: number
  missingDates: UserCard[]
  missingCancellationDates: UserCard[]
  level: CompletenessLevel
}

// Helper
function isAmex(bank: string): boolean {
  const b = bank.toLowerCase()
  return b.includes("amex") || b.includes("american express")
}

// Main function
export function getHistoryCompleteness(userCards: UserCard[]): HistoryCompleteness {
  const historical = userCards.filter(c => c.status !== "active")
  const cardCount = historical.length
  const missingDates = historical.filter(c => !c.application_date)
  const nonAmexCancelled = historical.filter(c => c.status === "cancelled" && !isAmex(c.bank ?? ""))
  const missingCancellationDates = nonAmexCancelled.filter(c => !c.cancellation_date)

  const cardScore = Math.min(40, cardCount * 10)
  const appDateScore = historical.length > 0
    ? Math.round(30 * (historical.length - missingDates.length) / historical.length)
    : 0
  const cancelScore = nonAmexCancelled.length > 0
    ? Math.round(30 * (nonAmexCancelled.length - missingCancellationDates.length) / nonAmexCancelled.length)
    : 30

  const score = cardScore + appDateScore + cancelScore

  const level: CompletenessLevel =
    score === 0 ? "empty" :
    score < 60 ? "sparse" :
    score < 100 ? "good" :
    "complete"

  return { score, cardCount, missingDates, missingCancellationDates, level }
}
