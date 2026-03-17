-- Create cdr_products table for CDR Open Banking data
CREATE TABLE IF NOT EXISTS cdr_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  bank_slug text NOT NULL,
  bank_name text NOT NULL,
  product_name text NOT NULL,
  product_category text,
  annual_fee_amount numeric,
  annual_fee_waiver_condition text,
  loyalty_program_name text,
  purchase_rate numeric,
  min_credit_limit numeric,
  raw_json jsonb NOT NULL,
  cdr_effective_from timestamptz,
  last_fetched_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bank_slug, product_id)
);

-- RLS policies
ALTER TABLE cdr_products ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "authenticated_select_cdr_products" ON cdr_products
  FOR SELECT TO authenticated USING (true);

-- Service role can do everything (bypasses RLS by default)
-- Ensure service role has full access
GRANT ALL ON cdr_products TO service_role;
GRANT SELECT ON cdr_products TO authenticated;
