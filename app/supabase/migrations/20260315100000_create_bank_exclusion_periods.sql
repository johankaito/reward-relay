CREATE TABLE IF NOT EXISTS public.bank_exclusion_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  bank_slug text UNIQUE NOT NULL,
  exclusion_months int,
  exclusion_note text,
  tc_exact_quote text,
  applies_to text,
  confidence_pct int,
  source_url text,
  data_last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bank_exclusion_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read-only for authenticated users" ON public.bank_exclusion_periods
  FOR SELECT TO authenticated USING (true);

-- Seed data (idempotent via upsert on bank_slug)
INSERT INTO public.bank_exclusion_periods
  (bank_name, bank_slug, exclusion_months, exclusion_note, applies_to, confidence_pct, data_last_updated)
VALUES
  (
    'ANZ',
    'anz',
    24,
    'Must not have received a welcome bonus on any ANZ rewards credit card in the preceding 24 months.',
    'per_card_product',
    95,
    '2025-01-01'
  ),
  (
    'Westpac',
    'westpac',
    24,
    'Must not have held a Westpac rewards card or received a bonus in the previous 24 months.',
    'per_card_product',
    95,
    '2025-01-01'
  ),
  (
    'St.George / Bank of Melbourne / BankSA',
    'stgeorge-bom-banksa',
    24,
    'All three brands share the same T&C exclusion period — 24 months across the family.',
    'brand_family',
    90,
    '2025-01-01'
  ),
  (
    'Bankwest',
    'bankwest',
    24,
    'Must not have held a Bankwest credit card that earned points in the last 24 months.',
    'per_card_product',
    95,
    '2025-01-01'
  ),
  (
    'CommBank',
    'commbank',
    24,
    'Must not have received a bonus on a CommBank awards card in the previous 24 months.',
    'per_card_product',
    95,
    '2025-01-01'
  ),
  (
    'NAB',
    'nab',
    24,
    'Changed from 18 months to 24 months in Sep 2025. Qantas Rewards family and NAB Rewards family are tracked independently — holding one does not affect eligibility for the other.',
    'per_rewards_family',
    90,
    '2025-09-01'
  ),
  (
    'Amex AU',
    'amex-au',
    18,
    'Applies across ALL personal Amex products — receiving a welcome bonus on any personal Amex card starts the 18-month exclusion window for all other personal Amex cards.',
    'all_personal_amex',
    95,
    '2025-01-01'
  ),
  (
    'HSBC AU (Qantas)',
    'hsbc-au-qantas',
    12,
    'HSBC Qantas card — 12-month exclusion period from last bonus on HSBC Qantas product.',
    'qantas_card_only',
    80,
    '2025-01-01'
  ),
  (
    'HSBC AU (Star Alliance)',
    'hsbc-au-star-alliance',
    18,
    'HSBC Star Alliance card — 18-month exclusion period from last bonus on HSBC Star Alliance product.',
    'star_alliance_card_only',
    80,
    '2025-01-01'
  ),
  (
    'Virgin Money AU',
    'virgin-money-au',
    NULL,
    'No confirmed month-based exclusion window found. T&C language references "new applicants" but does not specify a time period. Verify on Virgin Money website before applying.',
    'unknown',
    40,
    '2025-01-01'
  ),
  (
    'Macquarie',
    'macquarie',
    NULL,
    'Only "new applicants" language found in T&C — no confirmed exclusion period. Verify on Macquarie website before applying.',
    'unknown',
    40,
    '2025-01-01'
  )
ON CONFLICT (bank_slug) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  exclusion_months = EXCLUDED.exclusion_months,
  exclusion_note = EXCLUDED.exclusion_note,
  applies_to = EXCLUDED.applies_to,
  confidence_pct = EXCLUDED.confidence_pct,
  data_last_updated = EXCLUDED.data_last_updated;
