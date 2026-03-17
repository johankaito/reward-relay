-- Add extraction tracking columns to cards table
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS change_hash text,
  ADD COLUMN IF NOT EXISTS last_extracted_at timestamptz,
  ADD COLUMN IF NOT EXISTS extraction_confidence numeric;

-- Create extraction_log table for audit trail
CREATE TABLE IF NOT EXISTS extraction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
  run_at timestamptz DEFAULT now(),
  model_used text,
  confidence_score numeric,
  change_hash text,
  hash_changed boolean DEFAULT false,
  conflicts_detected jsonb DEFAULT '[]'::jsonb,
  raw_output jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS for extraction_log
ALTER TABLE extraction_log ENABLE ROW LEVEL SECURITY;

-- Service role manages all
GRANT ALL ON extraction_log TO service_role;

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_extraction_log_card_id ON extraction_log(card_id);
CREATE INDEX IF NOT EXISTS idx_extraction_log_run_at ON extraction_log(run_at DESC);

-- Index for cards needing re-extraction (30+ days since last extraction)
CREATE INDEX IF NOT EXISTS idx_cards_last_extracted_at ON cards(last_extracted_at);
