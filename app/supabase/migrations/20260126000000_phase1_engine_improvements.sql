-- Phase 1: Critical Engine Improvements
-- Add fields for points currency filtering and first-time-only tracking

-- Add new columns to cards table
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS first_card_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_annual_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS eligibility_restriction_months INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS bonus_structure JSONB,
  ADD COLUMN IF NOT EXISTS offer_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT now();

-- Add comment explaining fields
COMMENT ON COLUMN public.cards.first_card_only IS 'True if welcome bonus only available to customers who have never held a card from this bank';
COMMENT ON COLUMN public.cards.total_annual_fee IS 'Total annual fee including card fee + rewards program fee';
COMMENT ON COLUMN public.cards.eligibility_restriction_months IS 'Months user must wait between cancelling and reapplying (12 or 24 typically)';
COMMENT ON COLUMN public.cards.bonus_structure IS 'JSON structure for multi-year bonuses: {structure: "multi_year", year_1: {...}, year_2: {...}}';
COMMENT ON COLUMN public.cards.offer_expiry_date IS 'Date when current welcome bonus offer expires';
COMMENT ON COLUMN public.cards.last_verified_at IS 'Last time card details were verified (manual or automated)';

-- Update existing cards with known values from research
-- ANZ: 24-month restriction
UPDATE public.cards
SET eligibility_restriction_months = 24,
    last_verified_at = now()
WHERE bank = 'ANZ';

-- Westpac: 24-month restriction
UPDATE public.cards
SET eligibility_restriction_months = 24,
    last_verified_at = now()
WHERE bank = 'Westpac';

-- St.George: 24-month restriction
UPDATE public.cards
SET eligibility_restriction_months = 24,
    last_verified_at = now()
WHERE bank = 'St.George';

-- CBA: 24-month restriction
UPDATE public.cards
SET eligibility_restriction_months = 24,
    last_verified_at = now()
WHERE bank = 'CBA' OR bank = 'Commonwealth Bank';

-- AMEX: 18-month restriction (already handled in code)
UPDATE public.cards
SET eligibility_restriction_months = 18,
    last_verified_at = now()
WHERE bank = 'American Express';

-- St.George Amplify Signature: Add total fee including rewards program fee
UPDATE public.cards
SET total_annual_fee = 354, -- $279 card + $75 rewards fee
    last_verified_at = now()
WHERE bank = 'St.George'
  AND name LIKE '%Amplify%Signature%'
  AND name LIKE '%Qantas%';

-- Westpac Altitude Black: Multi-year bonus structure
UPDATE public.cards
SET bonus_structure = '{
  "structure": "multi_year",
  "total_points": 150000,
  "year_1": {
    "points": 90000,
    "spend_requirement": 6000,
    "timeframe_months": 4
  },
  "year_2": {
    "points": 60000,
    "spend_requirement": 6000,
    "timeframe_months": 4
  }
}'::jsonb,
last_verified_at = now()
WHERE bank = 'Westpac'
  AND name LIKE '%Altitude%Black%'
  AND name LIKE '%Qantas%';

-- Create index for filtering by points currency
CREATE INDEX IF NOT EXISTS idx_cards_points_currency ON public.cards(points_currency);

-- Create index for first-time-only filtering
CREATE INDEX IF NOT EXISTS idx_cards_first_card_only ON public.cards(first_card_only) WHERE first_card_only = true;

-- Create index for active cards with points currency
CREATE INDEX IF NOT EXISTS idx_cards_active_currency ON public.cards(is_active, points_currency) WHERE is_active = true;
