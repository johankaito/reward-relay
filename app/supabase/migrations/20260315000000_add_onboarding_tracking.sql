-- Add onboarding progress tracking columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS has_added_card boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_set_spending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_viewed_gap boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;

-- Backfill: users who already have cards
UPDATE user_profiles
SET has_added_card = true
WHERE user_id IN (
  SELECT DISTINCT user_id FROM user_cards
);

-- Backfill: users who already have a spending profile
UPDATE user_profiles
SET has_set_spending = true
WHERE user_id IN (
  SELECT DISTINCT user_id FROM spending_profiles
  WHERE monthly_spend IS NOT NULL AND monthly_spend > 0
);

-- RLS policies: users can only update their own onboarding state
-- (existing RLS on user_profiles covers read/write by user_id)
