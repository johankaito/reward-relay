import type { Database } from "@/types/database.types"
import type { MultiCardPath } from "@/lib/projections"

type Card = Database["public"]["Tables"]["cards"]["Row"]

export interface UnavailableCardInfo {
  cardId: string
  cardName: string
  cardBank: string
  isInRecommendedPath: boolean
  pathIndex: number
}

/**
 * Check if any paths use unavailable cards
 * Returns info about the first unavailable card found in the recommended path
 */
export function checkForUnavailableCards(
  paths: MultiCardPath[]
): UnavailableCardInfo | null {
  if (paths.length === 0) return null

  // Check recommended path (first path)
  const recommendedPath = paths[0]

  for (const card of recommendedPath.cards) {
    if (card.is_active === false) {
      return {
        cardId: card.id,
        cardName: card.name,
        cardBank: card.bank,
        isInRecommendedPath: true,
        pathIndex: 0,
      }
    }
  }

  return null
}

/**
 * Get all unavailable cards across all paths
 * Useful for showing which alternative paths are also affected
 */
export function getAllUnavailableCards(
  paths: MultiCardPath[]
): Map<string, UnavailableCardInfo> {
  const unavailable = new Map<string, UnavailableCardInfo>()

  paths.forEach((path, pathIndex) => {
    path.cards.forEach((card) => {
      if (card.is_active === false && !unavailable.has(card.id)) {
        unavailable.set(card.id, {
          cardId: card.id,
          cardName: card.name,
          cardBank: card.bank,
          isInRecommendedPath: pathIndex === 0,
          pathIndex,
        })
      }
    })
  })

  return unavailable
}

/**
 * Filter out paths that contain unavailable cards
 * Returns only paths with all active cards
 */
export function filterValidPaths(paths: MultiCardPath[]): MultiCardPath[] {
  return paths.filter((path) => {
    return path.cards.every((card) => card.is_active !== false)
  })
}
