CREATE TABLE IF NOT EXISTS public.bank_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank TEXT NOT NULL UNIQUE,
  rule_months INTEGER NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('bonus_cooldown', 'application_cooldown')) DEFAULT 'bonus_cooldown',
  rule_description TEXT NOT NULL,
  source_url TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')) DEFAULT 'medium',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bank_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bank rules are publicly readable" ON public.bank_rules FOR SELECT USING (true);

-- Seed data — AU bank rules as of early 2026
INSERT INTO public.bank_rules (bank, rule_months, rule_type, rule_description, source_url, confidence) VALUES
('ANZ',           12, 'bonus_cooldown',      'Must wait 12 months after receiving an ANZ welcome bonus before being eligible for another bonus from the same card product.', 'https://www.australianfrequentflyer.com.au/credit-cards/bank-crackdown-credit-card-churning/', 'high'),
('American Express', 12, 'bonus_cooldown',   'Amex applies a 12-month rule: if you have held or currently hold an Amex card of the same type, you are not eligible for the welcome bonus. Additionally, only one new Amex card approval per 90 days.', 'https://www.pointhacks.com.au/amex-bonus-points-eligibility/', 'high'),
('NAB',           18, 'bonus_cooldown',      'As of February 2025, NAB increased exclusion period to 18 months. You must not have received a NAB welcome bonus or held a NAB rewards card in the previous 18 months.', 'https://www.australianfrequentflyer.com.au/credit-cards/bank-crackdown-credit-card-churning/', 'high'),
('Westpac',       12, 'bonus_cooldown',      'Must not have held a Westpac credit card or received a Westpac welcome bonus in the previous 12 months. Includes Bank of Melbourne and St.George (same banking group).', 'https://www.pointhacks.com.au/westpac-altitude-black/', 'high'),
('CBA',           12, 'bonus_cooldown',      'Commonwealth Bank requires 12 months since last receiving a CBA credit card welcome bonus. Applies across all CBA card products.', 'https://www.commbank.com.au/credit-cards/awards.html', 'medium'),
('St.George',     12, 'bonus_cooldown',      'St.George is part of the Westpac Group. 12-month exclusion applies across Westpac, St.George, Bank of Melbourne, and BankSA.', 'https://www.pointhacks.com.au/stgeorge-amplify-signature/', 'high'),
('Bankwest',      12, 'bonus_cooldown',      'Bankwest (owned by CBA) applies a 12-month waiting period. Separate from CBA — the exclusion periods are tracked independently.', 'https://www.pointhacks.com.au/bankwest-more-world/', 'medium'),
('HSBC',          12, 'bonus_cooldown',      'HSBC Australia requires 12 months since last receiving an HSBC welcome bonus. Applies per card product.', 'https://www.hsbc.com.au/credit-cards/terms/', 'medium'),
('Virgin Money',  12, 'bonus_cooldown',      'Virgin Money Velocity cards require 12 months since last receiving a Virgin Money welcome bonus.', 'https://www.virginmoney.com.au/credit-cards/', 'medium'),
('Macquarie',     12, 'bonus_cooldown',      'Macquarie applies a 12-month exclusion period per card product for welcome bonuses.', 'https://www.macquarie.com.au/personal-banking/credit-cards.html', 'low'),
('Citi',          12, 'bonus_cooldown',      'Citi Australia (cards now issued by NAB following acquisition) — 12-month exclusion applies. Check current NAB T&Cs as product migration ongoing.', 'https://www.pointhacks.com.au/citi-nab-acquisition/', 'medium')
ON CONFLICT (bank) DO UPDATE SET
  rule_months = EXCLUDED.rule_months,
  rule_description = EXCLUDED.rule_description,
  updated_at = now();
