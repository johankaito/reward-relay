import type { Database } from "@/types/database.types"

type Card = Database["public"]["Tables"]["cards"]["Row"]
type UserCard = Database["public"]["Tables"]["user_cards"]["Row"]

export interface RedemptionGoal {
  id: string
  category: "domestic" | "international"
  type: "flight" | "business_upgrade" | "premium_upgrade"
  label: string
  description: string
  pointsRequired: number
  icon: string
}

export interface MultiCardPath {
  cards: Card[]
  totalPoints: number
  totalCost: number
  netValue: number
  timeToGoal: number // months
  steps: PathStep[]
  score: number
  rank: "fastest" | "cheapest" | "balanced"
}

export interface PathStep {
  month: number
  action: "apply" | "meet_spend" | "bonus_posts" | "cancel"
  card: Card
  pointsAccumulated: number
  runningTotal: number
  date: Date
}

// 6 redemption goals (3 domestic + 3 international)
export const GOALS: Record<string, RedemptionGoal> = {
  domesticFlight: {
    id: "domestic_flight",
    category: "domestic",
    type: "flight",
    label: "Free Domestic Flight",
    description: "Sydney to Melbourne return in Economy",
    pointsRequired: 10000,
    icon: "✈️",
  },
  domesticBusinessUpgrade: {
    id: "domestic_business_upgrade",
    category: "domestic",
    type: "business_upgrade",
    label: "Domestic Business Upgrade",
    description: "Upgrade to Business on domestic flight",
    pointsRequired: 25000,
    icon: "💼",
  },
  domesticPremiumUpgrade: {
    id: "domestic_premium_upgrade",
    category: "domestic",
    type: "premium_upgrade",
    label: "Domestic Premium Economy",
    description: "Premium Economy on domestic flight",
    pointsRequired: 18000,
    icon: "⭐",
  },
  internationalFlight: {
    id: "international_flight",
    category: "international",
    type: "flight",
    label: "Free International Flight",
    description: "Australia to Asia return in Economy",
    pointsRequired: 63500,
    icon: "🌏",
  },
  internationalBusinessUpgrade: {
    id: "international_business_upgrade",
    category: "international",
    type: "business_upgrade",
    label: "International Business Upgrade",
    description: "Upgrade to Business on international flight",
    pointsRequired: 130000,
    icon: "💎",
  },
  internationalPremiumUpgrade: {
    id: "international_premium_upgrade",
    category: "international",
    type: "premium_upgrade",
    label: "International Premium Economy",
    description: "Premium Economy on international flight",
    pointsRequired: 80000,
    icon: "🌟",
  },
}

/**
 * Calculate bank eligibility considering cooling periods
 * - AMEX: 18 months since last card
 * - Others: 12 months since last cancellation
 */
function getBankEligibilityDate(userCards: UserCard[], bank: string): Date | null {
  const bankLower = bank.toLowerCase()
  const isAmex = bankLower.includes("amex") || bankLower.includes("american express")
  const coolingPeriodMonths = isAmex ? 18 : 12

  // Find most recent relevant date for this bank
  let mostRecentDate: Date | null = null

  for (const card of userCards) {
    if (!card.bank || card.bank.toLowerCase() !== bankLower) continue

    let relevantDate: Date | null = null

    if (isAmex) {
      // AMEX: Use application date
      if (card.application_date) {
        relevantDate = new Date(card.application_date)
      }
    } else {
      // Others: Use cancellation date
      if (card.cancellation_date) {
        relevantDate = new Date(card.cancellation_date)
      }
    }

    if (relevantDate) {
      if (!mostRecentDate || relevantDate > mostRecentDate) {
        mostRecentDate = relevantDate
      }
    }
  }

  if (!mostRecentDate) return null

  // Calculate eligibility date
  const eligibleAt = new Date(mostRecentDate)
  eligibleAt.setMonth(eligibleAt.getMonth() + coolingPeriodMonths)

  return eligibleAt
}

/**
 * Generate single-card paths to goal
 */
function generateSingleCardPaths(
  goal: RedemptionGoal,
  currentPoints: number,
  catalogCards: Card[],
  userCards: UserCard[]
): MultiCardPath[] {
  const paths: MultiCardPath[] = []
  const pointsNeeded = Math.max(0, goal.pointsRequired - currentPoints)

  for (const card of catalogCards) {
    if (!card.welcome_bonus_points || card.welcome_bonus_points === 0) continue

    // Check bank eligibility
    const eligibleAt = getBankEligibilityDate(userCards, card.bank)
    const isEligibleNow = !eligibleAt || new Date() >= eligibleAt

    // Skip if not enough points even with this card
    if (card.welcome_bonus_points < pointsNeeded) continue

    const now = new Date()
    const applyDate = isEligibleNow ? now : eligibleAt!

    // Steps: apply (month 0), meet spend (month 3), bonus posts (month 4)
    const steps: PathStep[] = [
      {
        month: 0,
        action: "apply",
        card,
        pointsAccumulated: 0,
        runningTotal: currentPoints,
        date: applyDate,
      },
      {
        month: 3,
        action: "meet_spend",
        card,
        pointsAccumulated: 0,
        runningTotal: currentPoints,
        date: new Date(applyDate.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        month: 4,
        action: "bonus_posts",
        card,
        pointsAccumulated: card.welcome_bonus_points,
        runningTotal: currentPoints + card.welcome_bonus_points,
        date: new Date(applyDate.getTime() + 120 * 24 * 60 * 60 * 1000),
      },
    ]

    const timeToGoal = isEligibleNow ? 4 : Math.ceil((eligibleAt!.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 4
    const totalCost = card.annual_fee || 0
    const netValue = (card.welcome_bonus_points * 0.01) - totalCost

    // Calculate score: prioritize speed, then value
    const speedScore = 1000 / timeToGoal
    const valueScore = netValue / 10
    const score = speedScore + valueScore

    paths.push({
      cards: [card],
      totalPoints: card.welcome_bonus_points,
      totalCost,
      netValue,
      timeToGoal,
      steps,
      score,
      rank: "balanced",
    })
  }

  return paths
}

/**
 * Generate two-card paths to goal
 * Requires 6-month spacing between applications
 */
function generateTwoCardPaths(
  goal: RedemptionGoal,
  currentPoints: number,
  catalogCards: Card[],
  userCards: UserCard[]
): MultiCardPath[] {
  const paths: MultiCardPath[] = []
  const pointsNeeded = Math.max(0, goal.pointsRequired - currentPoints)

  for (let i = 0; i < catalogCards.length; i++) {
    const card1 = catalogCards[i]
    if (!card1.welcome_bonus_points) continue

    for (let j = i + 1; j < catalogCards.length; j++) {
      const card2 = catalogCards[j]
      if (!card2.welcome_bonus_points) continue

      // Avoid same bank (would violate cooling period)
      if (card1.bank.toLowerCase() === card2.bank.toLowerCase()) continue

      const totalPoints = card1.welcome_bonus_points + card2.welcome_bonus_points
      if (totalPoints < pointsNeeded) continue

      const now = new Date()

      // Check eligibility for both cards
      const eligibleAt1 = getBankEligibilityDate(userCards, card1.bank)
      const eligibleAt2 = getBankEligibilityDate(userCards, card2.bank)

      const isEligible1 = !eligibleAt1 || now >= eligibleAt1
      const isEligible2 = !eligibleAt2 || now >= eligibleAt2

      const applyDate1 = isEligible1 ? now : eligibleAt1!
      // 6-month spacing between applications
      const applyDate2 = new Date(applyDate1.getTime() + 180 * 24 * 60 * 60 * 1000)

      // Ensure card 2 is also eligible at that time
      if (eligibleAt2 && applyDate2 < eligibleAt2) continue

      const steps: PathStep[] = [
        // Card 1
        { month: 0, action: "apply", card: card1, pointsAccumulated: 0, runningTotal: currentPoints, date: applyDate1 },
        { month: 3, action: "meet_spend", card: card1, pointsAccumulated: 0, runningTotal: currentPoints, date: new Date(applyDate1.getTime() + 90 * 24 * 60 * 60 * 1000) },
        { month: 4, action: "bonus_posts", card: card1, pointsAccumulated: card1.welcome_bonus_points, runningTotal: currentPoints + card1.welcome_bonus_points, date: new Date(applyDate1.getTime() + 120 * 24 * 60 * 60 * 1000) },

        // Card 2 (6 months after card 1)
        { month: 6, action: "apply", card: card2, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points, date: applyDate2 },
        { month: 9, action: "meet_spend", card: card2, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points, date: new Date(applyDate2.getTime() + 90 * 24 * 60 * 60 * 1000) },
        { month: 10, action: "bonus_posts", card: card2, pointsAccumulated: card2.welcome_bonus_points, runningTotal: currentPoints + totalPoints, date: new Date(applyDate2.getTime() + 120 * 24 * 60 * 60 * 1000) },
      ]

      const timeToGoal = isEligible1 ? 10 : Math.ceil((applyDate1.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 10
      const totalCost = (card1.annual_fee || 0) + (card2.annual_fee || 0)
      const netValue = (totalPoints * 0.01) - totalCost

      const speedScore = 1000 / timeToGoal
      const valueScore = netValue / 10
      const score = speedScore + valueScore

      paths.push({
        cards: [card1, card2],
        totalPoints,
        totalCost,
        netValue,
        timeToGoal,
        steps,
        score,
        rank: "balanced",
      })
    }
  }

  return paths
}

/**
 * Generate three-card paths to goal
 * Maximum recommended to avoid credit score impact
 */
function generateThreeCardPaths(
  goal: RedemptionGoal,
  currentPoints: number,
  catalogCards: Card[],
  userCards: UserCard[]
): MultiCardPath[] {
  const paths: MultiCardPath[] = []
  const pointsNeeded = Math.max(0, goal.pointsRequired - currentPoints)

  // Only consider for very high point goals (100k+)
  if (pointsNeeded < 100000) return paths

  for (let i = 0; i < catalogCards.length; i++) {
    const card1 = catalogCards[i]
    if (!card1.welcome_bonus_points) continue

    for (let j = i + 1; j < catalogCards.length; j++) {
      const card2 = catalogCards[j]
      if (!card2.welcome_bonus_points) continue
      if (card1.bank.toLowerCase() === card2.bank.toLowerCase()) continue

      for (let k = j + 1; k < catalogCards.length; k++) {
        const card3 = catalogCards[k]
        if (!card3.welcome_bonus_points) continue
        if (card1.bank.toLowerCase() === card3.bank.toLowerCase()) continue
        if (card2.bank.toLowerCase() === card3.bank.toLowerCase()) continue

        const totalPoints = card1.welcome_bonus_points + card2.welcome_bonus_points + card3.welcome_bonus_points
        if (totalPoints < pointsNeeded) continue

        const now = new Date()

        const eligibleAt1 = getBankEligibilityDate(userCards, card1.bank)
        const eligibleAt2 = getBankEligibilityDate(userCards, card2.bank)
        const eligibleAt3 = getBankEligibilityDate(userCards, card3.bank)

        const applyDate1 = eligibleAt1 && now < eligibleAt1 ? eligibleAt1 : now
        const applyDate2 = new Date(applyDate1.getTime() + 180 * 24 * 60 * 60 * 1000)
        const applyDate3 = new Date(applyDate2.getTime() + 180 * 24 * 60 * 60 * 1000)

        // Ensure all cards are eligible at their apply dates
        if (eligibleAt2 && applyDate2 < eligibleAt2) continue
        if (eligibleAt3 && applyDate3 < eligibleAt3) continue

        const steps: PathStep[] = [
          // Card 1
          { month: 0, action: "apply", card: card1, pointsAccumulated: 0, runningTotal: currentPoints, date: applyDate1 },
          { month: 3, action: "meet_spend", card: card1, pointsAccumulated: 0, runningTotal: currentPoints, date: new Date(applyDate1.getTime() + 90 * 24 * 60 * 60 * 1000) },
          { month: 4, action: "bonus_posts", card: card1, pointsAccumulated: card1.welcome_bonus_points, runningTotal: currentPoints + card1.welcome_bonus_points, date: new Date(applyDate1.getTime() + 120 * 24 * 60 * 60 * 1000) },

          // Card 2
          { month: 6, action: "apply", card: card2, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points, date: applyDate2 },
          { month: 9, action: "meet_spend", card: card2, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points, date: new Date(applyDate2.getTime() + 90 * 24 * 60 * 60 * 1000) },
          { month: 10, action: "bonus_posts", card: card2, pointsAccumulated: card2.welcome_bonus_points, runningTotal: currentPoints + card1.welcome_bonus_points + card2.welcome_bonus_points, date: new Date(applyDate2.getTime() + 120 * 24 * 60 * 60 * 1000) },

          // Card 3
          { month: 12, action: "apply", card: card3, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points + card2.welcome_bonus_points, date: applyDate3 },
          { month: 15, action: "meet_spend", card: card3, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points + card2.welcome_bonus_points, date: new Date(applyDate3.getTime() + 90 * 24 * 60 * 60 * 1000) },
          { month: 16, action: "bonus_posts", card: card3, pointsAccumulated: card3.welcome_bonus_points, runningTotal: currentPoints + totalPoints, date: new Date(applyDate3.getTime() + 120 * 24 * 60 * 60 * 1000) },
        ]

        const timeToGoal = Math.ceil((applyDate1.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 16
        const totalCost = (card1.annual_fee || 0) + (card2.annual_fee || 0) + (card3.annual_fee || 0)
        const netValue = (totalPoints * 0.01) - totalCost

        const speedScore = 1000 / timeToGoal
        const valueScore = netValue / 10
        const score = speedScore + valueScore

        paths.push({
          cards: [card1, card2, card3],
          totalPoints,
          totalCost,
          netValue,
          timeToGoal,
          steps,
          score,
          rank: "balanced",
        })
      }
    }
  }

  return paths
}

/**
 * Calculate multi-card paths to reach goal
 * Returns top 10 paths ranked by speed, cost, and balance
 */
export function calculateMultiCardPaths(
  goal: RedemptionGoal,
  userCards: UserCard[],
  catalogCards: Card[],
  currentPoints: number = 0
): MultiCardPath[] {
  const allPaths: MultiCardPath[] = []

  // Generate all possible paths (1-3 cards)
  allPaths.push(...generateSingleCardPaths(goal, currentPoints, catalogCards, userCards))
  allPaths.push(...generateTwoCardPaths(goal, currentPoints, catalogCards, userCards))
  allPaths.push(...generateThreeCardPaths(goal, currentPoints, catalogCards, userCards))

  // Sort by score
  allPaths.sort((a, b) => b.score - a.score)

  // Take top 10
  const topPaths = allPaths.slice(0, 10)

  // Assign ranks
  if (topPaths.length > 0) {
    // Fastest: minimum timeToGoal
    const fastest = topPaths.reduce((min, p) => p.timeToGoal < min.timeToGoal ? p : min, topPaths[0])
    fastest.rank = "fastest"

    // Cheapest: maximum netValue (or minimum cost if values are similar)
    const cheapest = topPaths.reduce((max, p) => p.netValue > max.netValue ? p : max, topPaths[0])
    if (cheapest !== fastest) cheapest.rank = "cheapest"

    // Balanced: best overall score (already sorted)
    if (topPaths[0] !== fastest && topPaths[0] !== cheapest) {
      topPaths[0].rank = "balanced"
    }
  }

  return topPaths
}
