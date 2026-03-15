CREATE TABLE IF NOT EXISTS public.loyalty_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program TEXT NOT NULL CHECK (program IN ('qff', 'velocity', 'amex_mr')),
  balance INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  last_updated TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, program)  -- one row per program per user
);

CREATE INDEX IF NOT EXISTS idx_loyalty_balances_user ON public.loyalty_balances(user_id);

ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own balances" ON public.loyalty_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own balances" ON public.loyalty_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own balances" ON public.loyalty_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own balances" ON public.loyalty_balances FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON public.loyalty_balances TO authenticated;
