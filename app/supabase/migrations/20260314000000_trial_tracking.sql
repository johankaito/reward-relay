-- Add trial tracking to stripe_customers
-- Prevents the same user from claiming the free trial more than once
ALTER TABLE stripe_customers ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;
