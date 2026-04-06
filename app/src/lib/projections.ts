import type { Database } from "@/types/database.types"
import type { OnboardingCardEntry } from "./recommendations"
import { lookupExclusionPeriod, normalizeBankName } from "./bank-exclusions"
import type { BankExclusionPeriod } from "./bank-exclusions"
import { computeEligibility } from "./eligibility"

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

function getLastRelevantDate(userCards: UserCard[], bank: string): string | null {
  const bankLower = bank.toLowerCase()
  const isAmex = bankLower.includes("amex") || bankLower.includes("american express")
  let mostRecentDate: Date | null = null

  for (const card of userCards) {
    if (!card.bank || card.bank.toLowerCase() !== bankLower) continue
    const rawDate = isAmex ? card.application_date : card.cancellation_date
    if (!rawDate) continue
    const d = new Date(rawDate)
    if (!mostRecentDate || d > mostRecentDate) mostRecentDate = d
  }

  return mostRecentDate ? mostRecentDate.toISOString().split("T")[0] : null
}

/**
 * Generate single-card paths to goal
 */
function generateSingleCardPaths(
  goal: RedemptionGoal,
  currentPoints: number,
  catalogCards: Card[],
  userCards: UserCard[],
  exclusionPeriods: BankExclusionPeriod[] = []
): MultiCardPath[] {
  const paths: MultiCardPath[] = []
  const pointsNeeded = Math.max(0, goal.pointsRequired - currentPoints)

  for (const card of catalogCards) {
    if (!card.welcome_bonus_points || card.welcome_bonus_points === 0) continue

    // Check bank eligibility
    const eligibleAt = computeEligibility(normalizeBankName(card.bank) ?? card.bank, card.bank, getLastRelevantDate(userCards, card.bank), lookupExclusionPeriod(card.bank, exclusionPeriods)).eligibleDate
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
  userCards: UserCard[],
  exclusionPeriods: BankExclusionPeriod[] = []
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
      const eligibleAt1 = computeEligibility(normalizeBankName(card1.bank) ?? card1.bank, card1.bank, getLastRelevantDate(userCards, card1.bank), lookupExclusionPeriod(card1.bank, exclusionPeriods)).eligibleDate
      const eligibleAt2 = computeEligibility(normalizeBankName(card2.bank) ?? card2.bank, card2.bank, getLastRelevantDate(userCards, card2.bank), lookupExclusionPeriod(card2.bank, exclusionPeriods)).eligibleDate

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
  userCards: UserCard[],
  exclusionPeriods: BankExclusionPeriod[] = []
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

        const eligibleAt1 = computeEligibility(normalizeBankName(card1.bank) ?? card1.bank, card1.bank, getLastRelevantDate(userCards, card1.bank), lookupExclusionPeriod(card1.bank, exclusionPeriods)).eligibleDate
        const eligibleAt2 = computeEligibility(normalizeBankName(card2.bank) ?? card2.bank, card2.bank, getLastRelevantDate(userCards, card2.bank), lookupExclusionPeriod(card2.bank, exclusionPeriods)).eligibleDate
        const eligibleAt3 = computeEligibility(normalizeBankName(card3.bank) ?? card3.bank, card3.bank, getLastRelevantDate(userCards, card3.bank), lookupExclusionPeriod(card3.bank, exclusionPeriods)).eligibleDate

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
  currentPoints: number = 0,
  exclusionPeriods: BankExclusionPeriod[] = []
): MultiCardPath[] {
  const allPaths: MultiCardPath[] = []

  // Generate all possible paths (1-3 cards)
  allPaths.push(...generateSingleCardPaths(goal, currentPoints, catalogCards, userCards, exclusionPeriods))
  allPaths.push(...generateTwoCardPaths(goal, currentPoints, catalogCards, userCards, exclusionPeriods))
  allPaths.push(...generateThreeCardPaths(goal, currentPoints, catalogCards, userCards, exclusionPeriods))

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

export type SpendBand = 'lt1k' | '1k2k' | '2k4k' | '4k6k' | 'gt6k'

const SPEND_BAND_MIDPOINTS: Record<SpendBand, number> = {
  lt1k: 750,
  '1k2k': 1500,
  '2k4k': 3000,
  '4k6k': 5000,
  gt6k: 7500,
}

/**
 * Generate three-card paths without the high-points guard.
 * Used during onboarding where we want to show paths for any goal size.
 */
function generateThreeCardPathsUnrestricted(
  goal: RedemptionGoal,
  currentPoints: number,
  catalogCards: Card[],
  userCards: UserCard[],
  exclusionPeriods: BankExclusionPeriod[] = []
): MultiCardPath[] {
  const paths: MultiCardPath[] = []
  const pointsNeeded = Math.max(0, goal.pointsRequired - currentPoints)

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

        const eligibleAt1 = computeEligibility(normalizeBankName(card1.bank) ?? card1.bank, card1.bank, getLastRelevantDate(userCards, card1.bank), lookupExclusionPeriod(card1.bank, exclusionPeriods)).eligibleDate
        const eligibleAt2 = computeEligibility(normalizeBankName(card2.bank) ?? card2.bank, card2.bank, getLastRelevantDate(userCards, card2.bank), lookupExclusionPeriod(card2.bank, exclusionPeriods)).eligibleDate
        const eligibleAt3 = computeEligibility(normalizeBankName(card3.bank) ?? card3.bank, card3.bank, getLastRelevantDate(userCards, card3.bank), lookupExclusionPeriod(card3.bank, exclusionPeriods)).eligibleDate

        const applyDate1 = eligibleAt1 && now < eligibleAt1 ? eligibleAt1 : now
        const applyDate2 = new Date(applyDate1.getTime() + 180 * 24 * 60 * 60 * 1000)
        const applyDate3 = new Date(applyDate2.getTime() + 180 * 24 * 60 * 60 * 1000)

        if (eligibleAt2 && applyDate2 < eligibleAt2) continue
        if (eligibleAt3 && applyDate3 < eligibleAt3) continue

        const steps: PathStep[] = [
          { month: 0, action: "apply", card: card1, pointsAccumulated: 0, runningTotal: currentPoints, date: applyDate1 },
          { month: 3, action: "meet_spend", card: card1, pointsAccumulated: 0, runningTotal: currentPoints, date: new Date(applyDate1.getTime() + 90 * 24 * 60 * 60 * 1000) },
          { month: 4, action: "bonus_posts", card: card1, pointsAccumulated: card1.welcome_bonus_points, runningTotal: currentPoints + card1.welcome_bonus_points, date: new Date(applyDate1.getTime() + 120 * 24 * 60 * 60 * 1000) },
          { month: 6, action: "apply", card: card2, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points, date: applyDate2 },
          { month: 9, action: "meet_spend", card: card2, pointsAccumulated: 0, runningTotal: currentPoints + card1.welcome_bonus_points, date: new Date(applyDate2.getTime() + 90 * 24 * 60 * 60 * 1000) },
          { month: 10, action: "bonus_posts", card: card2, pointsAccumulated: card2.welcome_bonus_points, runningTotal: currentPoints + card1.welcome_bonus_points + card2.welcome_bonus_points, date: new Date(applyDate2.getTime() + 120 * 24 * 60 * 60 * 1000) },
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

        paths.push({ cards: [card1, card2, card3], totalPoints, totalCost, netValue, timeToGoal, steps, score, rank: "balanced" })
      }
    }
  }

  return paths
}

/**
 * Convert onboarding card history to minimal UserCard-compatible shape
 * for eligibility calculation in projections.
 */
function historyToUserCards(cardHistory: OnboardingCardEntry[]): UserCard[] {
  return cardHistory.map((entry) => {
    const bankLower = entry.bank.toLowerCase()
    const isAmex = bankLower.includes("amex") || bankLower.includes("american express")
    const appDate = `${entry.applicationMonth}-01`
    const cancelDate = (() => {
      if (isAmex) return null
      const d = new Date(`${entry.applicationMonth}-01`)
      d.setMonth(d.getMonth() + 1)
      return d.toISOString().split("T")[0]
    })()
    return {
      id: entry.cardId,
      user_id: "",
      card_id: entry.cardId,
      bank: entry.bank,
      name: null,
      status: "cancelled",
      application_date: appDate,
      approval_date: null,
      cancellation_date: cancelDate,
      annual_fee: null,
      notes: null,
      current_spend: null,
      spend_updated_at: null,
      bonus_spend_deadline: null,
      alert_enabled: false,
      next_eligible_date: null,
      bonus_earned: entry.bonusReceived,
      bonus_earned_at: null,
      bonus_earned_suggested: false,
      created_at: null,
      updated_at: null,
    } as unknown as UserCard
  })
}

/**
 * Calculate the best card path for onboarding users (Path B new churner flow).
 * Unlike calculateMultiCardPaths, this:
 *  - Has no minimum points threshold for 3-card paths
 *  - Accepts OnboardingCardEntry[] history instead of UserCard[]
 *  - Adjusts timeToGoal based on spend band (how fast the user can meet bonus spend requirements)
 *  - Returns the single best path (highest score)
 */
export function calculateOnboardingPath(
  goal: RedemptionGoal,
  spendBand: SpendBand,
  cardHistory: OnboardingCardEntry[],
  catalogCards: Card[],
  exclusionPeriods: BankExclusionPeriod[] = []
): MultiCardPath | null {
  const userCards = historyToUserCards(cardHistory)
  const monthlySpend = SPEND_BAND_MIDPOINTS[spendBand]

  const allPaths: MultiCardPath[] = [
    ...generateSingleCardPaths(goal, 0, catalogCards, userCards, exclusionPeriods),
    ...generateTwoCardPaths(goal, 0, catalogCards, userCards, exclusionPeriods),
    ...generateThreeCardPathsUnrestricted(goal, 0, catalogCards, userCards, exclusionPeriods),
  ]

  if (allPaths.length === 0) return null

  // Adjust timeToGoal for each path based on how quickly the user can meet
  // each card's bonus spend requirement given their spend band.
  const adjusted = allPaths.map((path) => {
    let extraMonths = 0
    for (const card of path.cards) {
      const spendReq = card.bonus_spend_requirement ?? 0
      if (spendReq > 0 && monthlySpend > 0) {
        const monthsToMeetSpend = Math.ceil(spendReq / monthlySpend)
        // Default timeline assumes 3 months to meet spend; adjust if different
        extraMonths += Math.max(0, monthsToMeetSpend - 3)
      }
    }
    return { ...path, timeToGoal: path.timeToGoal + extraMonths }
  })

  adjusted.sort((a, b) => b.score - a.score)
  return adjusted[0]
}
