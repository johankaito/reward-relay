import { supabase } from "@/lib/supabase/client"

export type OnboardingProgress = {
  step: 0 | 1 | 2 | 3
  hasAddedCard: boolean
  hasSetSpending: boolean
  hasViewedGap: boolean
  onboardingCompletedAt: string | null
  onboardingDismissedAt: string | null
}

export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "has_added_card, has_set_spending, has_viewed_gap, onboarding_completed_at, onboarding_dismissed_at",
    )
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return {
      step: 0,
      hasAddedCard: false,
      hasSetSpending: false,
      hasViewedGap: false,
      onboardingCompletedAt: null,
      onboardingDismissedAt: null,
    }
  }

  const hasAddedCard = data.has_added_card ?? false
  const hasSetSpending = data.has_set_spending ?? false
  const hasViewedGap = data.has_viewed_gap ?? false

  let step: 0 | 1 | 2 | 3 = 0
  if (hasAddedCard) step = 1
  if (hasAddedCard && hasSetSpending) step = 2
  if (hasAddedCard && hasSetSpending && hasViewedGap) step = 3

  return {
    step,
    hasAddedCard,
    hasSetSpending,
    hasViewedGap,
    onboardingCompletedAt: data.onboarding_completed_at ?? null,
    onboardingDismissedAt: data.onboarding_dismissed_at ?? null,
  }
}

export async function markOnboardingStep(
  userId: string,
  field: "has_added_card" | "has_set_spending" | "has_viewed_gap",
): Promise<void> {
  await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, [field]: true }, { onConflict: "user_id" })
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      has_added_card: true,
      has_set_spending: true,
      has_viewed_gap: true,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )
}

export async function dismissOnboarding(userId: string): Promise<void> {
  await supabase.from("user_profiles").upsert(
    { user_id: userId, onboarding_dismissed_at: new Date().toISOString() },
    { onConflict: "user_id" },
  )
}
