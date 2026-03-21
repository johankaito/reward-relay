-- stripe_customers: maps Supabase user to Stripe customer
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- stripe_subscriptions: tracks active subscription state
CREATE TABLE stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own customer" ON stripe_customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own subscription" ON stripe_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role customers" ON stripe_customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role subscriptions" ON stripe_subscriptions FOR ALL USING (auth.role() = 'service_role');
