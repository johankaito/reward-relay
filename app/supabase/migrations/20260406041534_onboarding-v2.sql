ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS has_churned_before boolean,
  ADD COLUMN IF NOT EXISTS onboarding_path text CHECK (onboarding_path IN ('experienced', 'new')),
  ADD COLUMN IF NOT EXISTS spend_band text CHECK (spend_band IN ('lt1k', '1k2k', '2k4k', '4k6k', 'gt6k')),
  ADD COLUMN IF NOT EXISTS onboarding_card_history jsonb;
