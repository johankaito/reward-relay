-- Create card_corrections table for user-reported data issues
CREATE TABLE IF NOT EXISTS card_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
  field text NOT NULL,
  reported_value text NOT NULL,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE card_corrections ENABLE ROW LEVEL SECURITY;

-- Users can insert their own corrections
CREATE POLICY "users_insert_own_corrections" ON card_corrections
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Users can see their own corrections
CREATE POLICY "users_select_own_corrections" ON card_corrections
  FOR SELECT TO authenticated
  USING (reported_by = auth.uid());

-- Service role manages all (bypasses RLS)
GRANT ALL ON card_corrections TO service_role;
GRANT INSERT, SELECT ON card_corrections TO authenticated;
