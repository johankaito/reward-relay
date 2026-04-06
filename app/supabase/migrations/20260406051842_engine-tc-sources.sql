-- Fix CommBank: was 24mo but correct is 18mo (CommBank Awards T&C Oct 2024)
UPDATE public.bank_exclusion_periods
SET exclusion_months = 18,
    exclusion_note = 'Must not have held any CommBank Awards card in the past 18 months. Source: CommBank Awards T&Cs Oct 2024.',
    data_last_updated = '2024-10-01'
WHERE bank_slug = 'commbank';

-- Add source tracking columns
ALTER TABLE public.bank_exclusion_periods
  ADD COLUMN IF NOT EXISTS official_tc_url text,
  ADD COLUMN IF NOT EXISTS tc_exact_quote text,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS verified_by text;

-- Seed official TC URLs
UPDATE public.bank_exclusion_periods SET official_tc_url = 'https://www.anz.com.au/content/dam/anzcomau/documents/pdf/anz-rewards-program-terms-conditions.pdf', last_verified_at = '2025-01-01', verified_by = 'manual' WHERE bank_slug = 'anz';
UPDATE public.bank_exclusion_periods SET official_tc_url = 'https://www.westpac.com.au/personal-banking/credit-cards/', last_verified_at = '2025-01-01', verified_by = 'manual' WHERE bank_slug = 'westpac';
UPDATE public.bank_exclusion_periods SET official_tc_url = 'https://www.nab.com.au/content/dam/nabrwd/documents/terms-and-conditions/personal/nab-rewards-terms-and-conditions.pdf', last_verified_at = '2025-09-01', verified_by = 'manual' WHERE bank_slug = 'nab';
UPDATE public.bank_exclusion_periods SET official_tc_url = 'https://www.bankwest.com.au/terms-conditions', last_verified_at = '2025-01-01', verified_by = 'manual' WHERE bank_slug = 'bankwest';
UPDATE public.bank_exclusion_periods SET official_tc_url = 'https://www.commbank.com.au/content/dam/commbank/personal-banking/credit-cards/awards-cc-tcs.pdf', last_verified_at = '2024-10-01', verified_by = 'manual' WHERE bank_slug = 'commbank';
UPDATE public.bank_exclusion_periods SET official_tc_url = 'https://www.americanexpress.com/en-au/network/amex-credit-cards/', last_verified_at = '2025-01-01', verified_by = 'manual' WHERE bank_slug = 'amex';
