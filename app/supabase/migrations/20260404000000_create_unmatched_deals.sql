-- CDP-3: Store unmatched deal feed items for admin review
-- Previously these were console.log'd and lost; now stored for manual linking.

CREATE TABLE IF NOT EXISTS unmatched_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,              -- 'ozbargain' | 'pointhacks'
  raw_title text,
  extracted_issuer text,
  extracted_card_name text,
  bonus_points integer,
  source_url text,
  created_at timestamptz DEFAULT now()
);

-- Admin can review and dismiss rows; keep index for efficient recent queries
CREATE INDEX IF NOT EXISTS unmatched_deals_created_at_idx ON unmatched_deals (created_at DESC);

-- Service role only — no RLS needed (admin-only table)
ALTER TABLE unmatched_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON unmatched_deals
  USING (auth.role() = 'service_role');
