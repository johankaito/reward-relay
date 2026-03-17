-- Add change detection tracking fields to cards table
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS needs_verification boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS change_detected_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_priority text DEFAULT 'normal'
    CHECK (verification_priority IN ('low', 'normal', 'high'));

-- Index for efficient querying of cards needing verification
CREATE INDEX IF NOT EXISTS idx_cards_needs_verification
  ON cards(needs_verification)
  WHERE needs_verification = true;
