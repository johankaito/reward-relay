import type { Database } from "@/types/database.types";

type Card = Database["public"]["Tables"]["cards"]["Row"];
type UserCard = Database["public"]["Tables"]["user_cards"]["Row"];

export interface Recommendation {
  card: Card;
  score: number;
  reason: string;
  eligibleAt: Date | null;
  eligibleNow: boolean;
}

interface BankEligibility {
  bank: string;
  lastCancellation: Date | null;
  eligibleAt: Date;
  eligible: boolean;
}

/**
 * Calculate bank eligibility based on churning rules
 * - AMEX: 18 months since last card (any status)
 * - All others: 12 months since last cancellation
 */
export function calculateBankEligibility(
  userCards: UserCard[]
): BankEligibility[] {
  const bankMap = new Map<string, BankEligibility>();

  for (const card of userCards) {
    if (!card.bank) continue;

    const bankLower = card.bank.toLowerCase();
    const isAmex = bankLower.includes("amex") || bankLower.includes("american express");
    const coolingPeriodMonths = isAmex ? 18 : 12;

    let relevantDate: Date | null = null;

    if (isAmex) {
      // For AMEX: Use application date (most restrictive)
      if (card.application_date) {
        relevantDate = new Date(card.application_date);
      }
    } else {
      // For other banks: Use cancellation date
      if (card.cancellation_date) {
        relevantDate = new Date(card.cancellation_date);
      }
    }

    if (relevantDate) {
      const existing = bankMap.get(card.bank);

      // Keep the most recent relevant date per bank
      if (!existing || !existing.lastCancellation || relevantDate > existing.lastCancellation) {
        const eligibleAt = new Date(relevantDate);
        eligibleAt.setMonth(eligibleAt.getMonth() + coolingPeriodMonths);

        bankMap.set(card.bank, {
          bank: card.bank,
          lastCancellation: relevantDate,
          eligibleAt,
          eligible: new Date() >= eligibleAt,
        });
      }
    }
  }

  return Array.from(bankMap.values());
}

/**
 * Calculate card value score based on welcome bonus and spend requirement
 * Higher score = better value
 */
function calculateCardScore(card: Card): number {
  const bonusPoints = card.welcome_bonus_points || 0;
  const spendReq = card.bonus_spend_requirement || 1;
  const annualFee = card.annual_fee || 0;

  // Points per dollar spent on bonus
  const pointsPerDollar = bonusPoints / spendReq;

  // Adjust for annual fee (assuming 1 point = $0.01 value)
  const netValue = bonusPoints * 0.01 - annualFee;
  const netValueScore = netValue / 100; // Normalize

  // Combine metrics (weighted)
  return pointsPerDollar * 10 + netValueScore;
}

/**
 * Lightweight card history entry collected during onboarding
 * (before cards are saved to user_cards table)
 */
export interface OnboardingCardEntry {
  bank: string
  cardId: string
  applicationMonth: string  // "YYYY-MM"
  bonusReceived: boolean
}

export interface RecommendationOptions {
  limit?: number;
  pointsCurrency?: 'Qantas' | 'Velocity' | 'all';
  includeFirstCardOnly?: boolean;
}

/**
 * Get personalized card recommendations based on user's portfolio
 * Returns top recommendations sorted by score
 *
 * @param pointsCurrency - Filter by points type ('Qantas', 'Velocity', or 'all')
 * @param includeFirstCardOnly - If false, exclude cards that require first-time bank customers
 */
export function getRecommendations(
  userCards: UserCard[],
  catalogCards: Card[],
  options?: RecommendationOptions
): Recommendation[] {
  const limit = options?.limit || 5;
  const pointsCurrency = options?.pointsCurrency || 'all';
  const includeFirstCardOnly = options?.includeFirstCardOnly ?? true;
  // Calculate bank eligibility
  const eligibility = calculateBankEligibility(userCards);
  const eligibilityMap = new Map(eligibility.map((e) => [e.bank.toLowerCase(), e]));

  // Get user's active card IDs to exclude
  const activeCardIds = new Set(
    userCards.filter((c) => c.status === "active").map((c) => c.card_id)
  );

  // Get set of banks user has/had cards with (for first-card-only filtering)
  const userBanks = new Set(
    userCards.map((c) => c.bank?.toLowerCase()).filter(Boolean) as string[]
  );

  // Filter and score catalog cards
  const recommendations: Recommendation[] = catalogCards
    .filter((card) => {
      // Exclude if user already has this card active
      if (activeCardIds.has(card.id)) return false;

      // Exclude inactive/expired cards (treat null as active for backward compatibility)
      if (card.is_active === false) return false;

      // Must have welcome bonus
      if (!card.welcome_bonus_points || card.welcome_bonus_points === 0) return false;

      // Points currency filter
      if (pointsCurrency && pointsCurrency !== 'all') {
        if (card.points_currency !== pointsCurrency) return false;
      }

      // First-card-only filter
      if (!includeFirstCardOnly && card.first_card_only) {
        // If card requires first-time customer and user has had ANY card from this bank, exclude it
        const hasHadBankCard = userBanks.has(card.bank.toLowerCase());
        if (hasHadBankCard) return false;
      }

      return true;
    })
    .map((card) => {
      const bankEligibility = eligibilityMap.get(card.bank.toLowerCase());
      const eligibleNow = bankEligibility ? bankEligibility.eligible : true;
      const eligibleAt = bankEligibility ? bankEligibility.eligibleAt : null;

      const score = calculateCardScore(card);

      // Generate reason
      let reason = "";
      if (eligibleNow) {
        reason = "Eligible now";
        if (score > 15) {
          reason = "High value, eligible now";
        } else if (score > 10) {
          reason = "Good value, eligible now";
        }
      } else if (eligibleAt) {
        const daysUntil = Math.ceil(
          (eligibleAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil < 30) {
          reason = `Eligible in ${daysUntil} days`;
        } else {
          const monthsUntil = Math.ceil(daysUntil / 30);
          reason = `Eligible in ${monthsUntil} ${monthsUntil === 1 ? "month" : "months"}`;
        }
      }

      return {
        card,
        score,
        reason,
        eligibleAt,
        eligibleNow,
      };
    })
    .sort((a, b) => {
      // Prioritize eligible cards
      if (a.eligibleNow && !b.eligibleNow) return -1;
      if (!a.eligibleNow && b.eligibleNow) return 1;

      // Then by score
      return b.score - a.score;
    })
    .slice(0, limit);

  return recommendations;
}

/**
 * Get recommendations from onboarding card history (before cards are in user_cards).
 * Converts OnboardingCardEntry[] into a UserCard-compatible shape and reuses
 * the same eligibility + scoring pipeline as getRecommendations().
 */
export function getRecommendationsFromHistory(
  cardHistory: OnboardingCardEntry[],
  catalogCards: Card[],
  options?: RecommendationOptions
): Recommendation[] {
  // Build minimal UserCard-compatible objects for eligibility calculation.
  // For Amex: application_date is the relevant date (18-month rule from application).
  // For others: we set cancellation_date to application + 1 month to be conservative
  // (we don't know when they cancelled, but at minimum they'd cancel after a month).
  const virtualUserCards: UserCard[] = cardHistory.map((entry) => {
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

  return getRecommendations(virtualUserCards, catalogCards, options)
}
