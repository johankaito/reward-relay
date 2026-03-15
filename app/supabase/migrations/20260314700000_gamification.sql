CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('free', 'pro')) DEFAULT 'free'
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL REFERENCES public.badge_definitions(badge_type),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts badges" ON public.user_badges FOR INSERT WITH CHECK (true);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badge definitions publicly readable" ON public.badge_definitions FOR SELECT USING (true);

GRANT SELECT ON public.badge_definitions TO authenticated;
GRANT SELECT ON public.user_badges TO authenticated;

-- Seed badge definitions
INSERT INTO public.badge_definitions (badge_type, name, description, icon_emoji, tier) VALUES
('first_card',          'First Track',        'Added your first card to Reward Relay',                  '💳', 'free'),
('first_bonus_earned',  'First Bonus',        'Confirmed receiving your first signup bonus',             '🎯', 'free'),
('hundred_k_club',      '100K Club',          'Earned 100,000+ bonus points across all cards',          '💯', 'free'),
('five_hundred_k_club', '500K Club',          'Earned 500,000+ bonus points — elite churner',           '🚀', 'pro'),
('streak_7',            '7-Day Streak',       'Logged transactions 7 days in a row',                    '🔥', 'free'),
('streak_30',           '30-Day Streak',      'Logged transactions 30 days in a row',                   '⚡', 'pro'),
('first_cancellation',  'Strategic Exit',     'Cancelled your first card after earning the bonus',      '✂️', 'free'),
('churn_master',        'Churn Master',       'Successfully churned 5+ cards (bonus earned on each)',   '👑', 'pro'),
('deal_hunter',         'Deal Hunter',        'Clicked through on 5 eligible deals',                    '🔍', 'free'),
('net_profit_500',      '$500 Club',          'Reached $500 net profit from churning',                  '💰', 'free'),
('net_profit_2000',     '$2K Earner',         'Reached $2,000 net profit from churning',                '🏆', 'pro')
ON CONFLICT (badge_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  rank INTEGER NOT NULL,
  user_hash TEXT NOT NULL UNIQUE,
  total_aud_earned NUMERIC(10,2) NOT NULL,
  cards_churned INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard publicly readable" ON public.leaderboard_cache FOR SELECT USING (true);
