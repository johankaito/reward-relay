import type { Database } from "@/types/database.types"
import { getPointValue } from "@/lib/pointValuations"

type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]
type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]
type SpendingProfile = Database["public"]["Tables"]["spending_profiles"]["Row"]

export type GapAnalysis = {
  currentAnnualEarnings: number
  optimisedAnnualEarnings: number
  gap: number
  bestCard: CatalogCard | null
}

/**
 * Calculate the annual dollar value earned by the user's current card mix.
 * Uses primary earn rate × monthly spend × point value × 12 months.
 */
export function calculateCurrentEarnings(
  userCards: UserCard[],
  catalogCards: CatalogCard[],
  spendingProfile: SpendingProfile | null,
): number {
  const monthlySpend = spendingProfile?.monthly_spend ?? 2000
  const activeCards = userCards.filter((uc) => uc.status === "active" || uc.status === "pending")

  if (activeCards.length === 0) return 0

  // Use the best earn rate among the user's active cards
  let bestEarnRate = 0
  let bestPointValue = 0.006

  for (const uc of activeCards) {
    const catalog = catalogCards.find((c) => c.id === uc.card_id)
    if (!catalog) continue

    const earnRate = catalog.earn_rate_primary ?? 1
    const pointValue = getPointValue(catalog.points_currency ?? "")
    const effectiveRate = earnRate * pointValue

    if (effectiveRate > bestEarnRate * bestPointValue) {
      bestEarnRate = earnRate
      bestPointValue = pointValue
    }
  }

  return Math.round(monthlySpend * bestEarnRate * bestPointValue * 12)
}

/**
 * Calculate the maximum achievable annual earnings from the catalog.
 * Returns the best card and its dollar value per year.
 */
export function calculateOptimisedEarnings(
  catalogCards: CatalogCard[],
  spendingProfile: SpendingProfile | null,
): { value: number; bestCard: CatalogCard | null } {
  const monthlySpend = spendingProfile?.monthly_spend ?? 2000
  const activeCards = catalogCards.filter((c) => c.is_active)

  let bestValue = 0
  let bestCard: CatalogCard | null = null

  for (const card of activeCards) {
    const earnRate = card.earn_rate_primary ?? 1
    const pointValue = getPointValue(card.points_currency ?? "")
    const annualValue = monthlySpend * earnRate * pointValue * 12

    if (annualValue > bestValue) {
      bestValue = annualValue
      bestCard = card
    }
  }

  return { value: Math.round(bestValue), bestCard }
}

export function buildGapAnalysis(
  userCards: UserCard[],
  catalogCards: CatalogCard[],
  spendingProfile: SpendingProfile | null,
): GapAnalysis {
  const currentAnnualEarnings = calculateCurrentEarnings(userCards, catalogCards, spendingProfile)
  const { value: optimisedAnnualEarnings, bestCard } = calculateOptimisedEarnings(
    catalogCards,
    spendingProfile,
  )

  return {
    currentAnnualEarnings,
    optimisedAnnualEarnings,
    gap: Math.max(0, optimisedAnnualEarnings - currentAnnualEarnings),
    bestCard,
  }
}
