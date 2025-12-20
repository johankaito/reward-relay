-- =========================================
-- REWARDIFY RLS POLICIES
-- =========================================
-- Row Level Security policies for Reward Relay tables

-- Enable RLS for all tables
ALTER TABLE "user_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spending_profiles" ENABLE ROW LEVEL SECURITY;

-- =========================================
-- CARDS TABLE POLICIES (Global card catalog)
-- =========================================

-- Anyone can read the global card catalog
DROP POLICY IF EXISTS "Cards are publicly readable" ON "cards";
CREATE POLICY "Cards are publicly readable"
  ON "cards"
  FOR SELECT
  USING (true);

-- Only admins can manage the global card catalog
DROP POLICY IF EXISTS "Only admins can manage cards" ON "cards";
CREATE POLICY "Only admins can manage cards"
  ON "cards"
  FOR ALL
  USING (
    auth.jwt() ->> 'email' LIKE '%@rewardify.au'
    OR auth.jwt() ->> 'email' = 'john.g.keto+rewardrelay@gmail.com'
  );

-- =========================================
-- USER_CARDS TABLE POLICIES
-- =========================================

-- Users can only see their own cards
DROP POLICY IF EXISTS "Users can only see their own cards" ON "user_cards";
CREATE POLICY "Users can only see their own cards"
  ON "user_cards"
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Users can only insert their own cards
DROP POLICY IF EXISTS "Users can only insert their own cards" ON "user_cards";
CREATE POLICY "Users can only insert their own cards"
  ON "user_cards"
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can only update their own cards
DROP POLICY IF EXISTS "Users can only update their own cards" ON "user_cards";
CREATE POLICY "Users can only update their own cards"
  ON "user_cards"
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Users can only delete their own cards
DROP POLICY IF EXISTS "Users can only delete their own cards" ON "user_cards";
CREATE POLICY "Users can only delete their own cards"
  ON "user_cards"
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- =========================================
-- SPENDING_PROFILES TABLE POLICIES
-- =========================================

-- Users can only see their own spending profile
DROP POLICY IF EXISTS "Users can only see their own spending profile" ON "spending_profiles";
CREATE POLICY "Users can only see their own spending profile"
  ON "spending_profiles"
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Users can only insert their own spending profile
DROP POLICY IF EXISTS "Users can only insert their own spending profile" ON "spending_profiles";
CREATE POLICY "Users can only insert their own spending profile"
  ON "spending_profiles"
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can only update their own spending profile
DROP POLICY IF EXISTS "Users can only update their own spending profile" ON "spending_profiles";
CREATE POLICY "Users can only update their own spending profile"
  ON "spending_profiles"
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Users can only delete their own spending profile
DROP POLICY IF EXISTS "Users can only delete their own spending profile" ON "spending_profiles";
CREATE POLICY "Users can only delete their own spending profile"
  ON "spending_profiles"
  FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT USAGE ON SCHEMA "public" TO authenticated;
