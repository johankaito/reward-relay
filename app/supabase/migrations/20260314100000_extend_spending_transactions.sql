-- ST-1: Extend spending_transactions with merchant, excluded, exclusion_reason
-- and update trigger to exclude flagged transactions from current_spend

-- Add new columns
ALTER TABLE public.spending_transactions
  ADD COLUMN IF NOT EXISTS merchant TEXT,
  ADD COLUMN IF NOT EXISTS excluded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exclusion_reason TEXT CHECK (
    exclusion_reason IS NULL OR
    exclusion_reason IN ('annual_fee', 'cash_advance', 'bpay', 'balance_transfer', 'other')
  );

-- Backfill merchant from description for existing rows
UPDATE public.spending_transactions
SET merchant = description
WHERE merchant IS NULL AND description IS NOT NULL;

-- Update the trigger function to exclude rows where excluded = TRUE
CREATE OR REPLACE FUNCTION update_card_spending()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.user_cards
    SET current_spend = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.spending_transactions
      WHERE user_card_id = NEW.user_card_id
        AND excluded = FALSE
    ),
    spend_updated_at = NOW()
    WHERE id = NEW.user_card_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_cards
    SET current_spend = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.spending_transactions
      WHERE user_card_id = OLD.user_card_id
        AND excluded = FALSE
    ),
    spend_updated_at = NOW()
    WHERE id = OLD.user_card_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
