-- User profiles for onboarding quiz answers
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,

  -- Onboarding quiz answers
  spending_category TEXT CHECK (spending_category IN ('groceries', 'dining', 'travel', 'shopping', 'mixed')),
  optimization_goal TEXT CHECK (optimization_goal IN ('points', 'cashback', 'both')),
  churning_goal TEXT CHECK (churning_goal IN ('domestic', 'international', 'cashback', 'unsure')),
  onboarding_completed_at TIMESTAMPTZ,

  -- Engagement tracking
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_active_date DATE,
  free_days_earned INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deals table for curated card-linked offers
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deal info
  title TEXT NOT NULL,
  description TEXT,
  merchant TEXT NOT NULL,
  deal_url TEXT NOT NULL,

  -- Card matching
  card_network TEXT, -- 'visa', 'mastercard', 'amex', 'any'
  specific_issuer TEXT, -- 'anz', 'westpac', 'amex', null for any

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  -- Source tracking
  source TEXT DEFAULT 'ozbargain', -- 'ozbargain', 'manual', 'merchant'
  source_url TEXT,

  -- Engagement
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for active deals
CREATE INDEX deals_active_idx ON deals (is_active, valid_until) WHERE is_active = true;

-- Row Level Security (all users can view active deals)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active deals"
  ON deals FOR SELECT
  USING (is_active = true AND valid_until > now());

-- Daily insights table (pre-computed personalized tips)
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  -- Insight content
  insight_date DATE NOT NULL,
  tip_type TEXT NOT NULL, -- 'spending', 'fee_warning', 'churn_reminder', 'deal'
  title TEXT NOT NULL,
  description TEXT,
  card_id UUID REFERENCES user_cards,

  -- Associated deal
  deal_id UUID REFERENCES deals,

  -- Engagement
  viewed_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, insight_date, tip_type)
);

-- Index for today's insights
CREATE INDEX daily_insights_today_idx ON daily_insights (user_id, insight_date) WHERE viewed_at IS NULL;

-- RLS
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON daily_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON daily_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update streaks
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_active_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_active_date, current_streak_days, longest_streak_days
  INTO v_last_active_date, v_current_streak, v_longest_streak
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If never active or last active was before yesterday, reset streak
  IF v_last_active_date IS NULL OR v_last_active_date < CURRENT_DATE - 1 THEN
    v_current_streak := 1;
  -- If last active was yesterday, increment streak
  ELSIF v_last_active_date = CURRENT_DATE - 1 THEN
    v_current_streak := v_current_streak + 1;
  -- If last active was today, don't change streak
  ELSIF v_last_active_date = CURRENT_DATE THEN
    -- No change needed
    RETURN;
  END IF;

  -- Check if earned a free day (every 7 days)
  IF v_current_streak % 7 = 0 THEN
    UPDATE user_profiles
    SET free_days_earned = free_days_earned + 1
    WHERE user_id = p_user_id;
  END IF;

  -- Update profile
  UPDATE user_profiles
  SET
    current_streak_days = v_current_streak,
    longest_streak_days = GREATEST(v_current_streak, COALESCE(v_longest_streak, 0)),
    last_active_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
