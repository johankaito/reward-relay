-- ST-2: Extend user_cards with spending tracker fields

ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS bonus_spend_deadline DATE,
  ADD COLUMN IF NOT EXISTS alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS next_eligible_date DATE,
  ADD COLUMN IF NOT EXISTS bonus_earned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bonus_earned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bonus_earned_suggested BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill bonus_spend_deadline for existing rows that have application_date
-- and are linked to a card with bonus_spend_window_months
UPDATE public.user_cards uc
SET bonus_spend_deadline = (uc.application_date + (c.bonus_spend_window_months * INTERVAL '1 month'))::DATE
FROM public.cards c
WHERE uc.card_id = c.id
  AND uc.application_date IS NOT NULL
  AND c.bonus_spend_window_months IS NOT NULL
  AND uc.bonus_spend_deadline IS NULL;
