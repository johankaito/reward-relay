/**
 * Type-safe event definitions for PostHog analytics
 * Focus on CAC optimization and conversion tracking
 */

// ===== Acquisition Funnel Events =====

export interface LandingPageViewEvent {
  page: string
  referrer?: string
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  utm_content?: string
  utm_term?: string
}

export interface SignupStartedEvent {
  source: string // utm_source or 'direct'
  campaign?: string // utm_campaign
  medium?: string // utm_medium
}

export interface SignupCompletedEvent {
  source: string
  campaign?: string
  medium?: string
  cac_estimate?: number // Estimated CAC based on source
}

// ===== Activation Funnel Events =====

export interface TrialStartedEvent {
  source: string
  campaign?: string
  tier: 'pro' // Always pro for trial
  trial_days: number // Usually 7
  has_credit_card: boolean // false for no-CC trial
}

export interface CardAddedEvent {
  issuer: string // 'American Express', 'ANZ', etc.
  card_name: string // 'Platinum Charge', etc.
  cards_total: number // Total cards user has now
  days_since_signup: number
}

export interface RecommendationViewedEvent {
  card_index: number // 0 for first recommendation
  is_pro: boolean
  days_since_signup: number
}

export interface ValueRealizedEvent {
  feature: 'recommendation' | 'projection' | 'goal' | 'comparison'
  estimated_savings: number // Dollar value shown to user
  days_since_signup: number
}

// ===== Monetization Funnel Events =====

export interface CardLimitHitEvent {
  current_count: number // Usually 2 for free tier
  attempted_feature: 'add_card' | 'view_recommendation' | 'view_projection' | 'view_goal'
  days_since_signup: number
}

export interface PaywallShownEvent {
  feature: 'recommendation' | 'projection' | 'goal' | 'comparison' | 'card_limit'
  context: string // Where paywall was triggered
  cards_count: number
  days_in_trial?: number
}

export interface UpgradeClickedEvent {
  source: 'paywall' | 'dashboard' | 'pricing_page' | 'trial_ending_email'
  feature_blocked?: string // What feature they wanted
  days_in_trial?: number
}

export interface CheckoutStartedEvent {
  tier: 'pro'
  trial_status: 'in_trial' | 'trial_ended' | 'no_trial'
  days_since_signup: number
}

export interface SubscriptionActivatedEvent {
  tier: 'pro'
  source: string // Original acquisition source
  campaign?: string
  total_cac: number // Actual CAC for this user
  days_to_convert: number
  mrr: number // $39
}

// ===== Retention & LTV Events =====

export interface SubscriptionRenewedEvent {
  tier: 'pro'
  months_active: number
  ltv: number // Total revenue from this user
}

export interface SubscriptionCancelledEvent {
  tier: 'pro'
  reason?: string
  days_active: number
  total_ltv: number
  churn_category: 'early' | 'mid' | 'late' // <30, 30-90, >90 days
}

export interface ReferralSentEvent {
  method: 'email' | 'link' | 'social'
}

export interface ReferralCompletedEvent {
  referee_tier: 'free' | 'trial' | 'pro'
  cac_saved: number // Usually ~$20-25
}

// ===== Engagement & Onboarding Events =====

export interface DailyInsightsViewedEvent {
  count: number
  types: string[]
}

export interface DailyInsightClickedEvent {
  tip_type: string
  title: string
}

export interface DealClickedEvent {
  deal_id: string
  title: string
  merchant: string
}

export interface OnboardingQuestionAnsweredEvent {
  question: string
  answer: string
  step: number
}

export interface OnboardingCompletedEvent {
  spending_category: string
  optimization_goal: string
  churning_goal: string
}

// ===== Helper type for all events =====

export type AnalyticsEvent =
  | { name: 'landing_page_view'; properties: LandingPageViewEvent }
  | { name: 'signup_started'; properties: SignupStartedEvent }
  | { name: 'signup_completed'; properties: SignupCompletedEvent }
  | { name: 'trial_started'; properties: TrialStartedEvent }
  | { name: 'card_added'; properties: CardAddedEvent }
  | { name: 'recommendation_viewed'; properties: RecommendationViewedEvent }
  | { name: 'value_realized'; properties: ValueRealizedEvent }
  | { name: 'card_limit_hit'; properties: CardLimitHitEvent }
  | { name: 'paywall_shown'; properties: PaywallShownEvent }
  | { name: 'upgrade_clicked'; properties: UpgradeClickedEvent }
  | { name: 'checkout_started'; properties: CheckoutStartedEvent }
  | { name: 'subscription_activated'; properties: SubscriptionActivatedEvent }
  | { name: 'subscription_renewed'; properties: SubscriptionRenewedEvent }
  | { name: 'subscription_cancelled'; properties: SubscriptionCancelledEvent }
  | { name: 'referral_sent'; properties: ReferralSentEvent }
  | { name: 'referral_completed'; properties: ReferralCompletedEvent }
  | { name: 'daily_insights_viewed'; properties: DailyInsightsViewedEvent }
  | { name: 'daily_insight_clicked'; properties: DailyInsightClickedEvent }
  | { name: 'deal_clicked'; properties: DealClickedEvent }
  | { name: 'onboarding_question_answered'; properties: OnboardingQuestionAnsweredEvent }
  | { name: 'onboarding_completed'; properties: OnboardingCompletedEvent }

// ===== CAC Estimation by Source =====

export const CAC_ESTIMATES: Record<string, number> = {
  google: 25,
  facebook: 30,
  reddit: 5,
  ozbargain: 5,
  referral: 10,
  organic: 0,
  direct: 0,
}

export function estimateCAC(source?: string): number {
  if (!source) return 0
  return CAC_ESTIMATES[source.toLowerCase()] || 20 // Default to $20
}
