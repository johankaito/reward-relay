-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add scraping-related fields to cards table
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scrape_source TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Track scraping history
CREATE TABLE IF NOT EXISTS public.scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  cards_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track card changes over time
CREATE TABLE IF NOT EXISTS public.card_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_last_scraped ON public.cards(last_scraped_at);
CREATE INDEX IF NOT EXISTS idx_card_history_card_id ON public.card_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_changed_at ON public.card_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_created_at ON public.scrape_logs(created_at);

-- RLS policies for new tables
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_history ENABLE ROW LEVEL SECURITY;

-- Admin-only access to scrape logs
CREATE POLICY "Only admins can manage scrape logs"
  ON public.scrape_logs
  FOR ALL
  USING (
    auth.jwt() ->> 'email' LIKE '%@rewardrelay.au'
    OR auth.jwt() ->> 'email' = 'john.g.keto+rewardrelay@gmail.com'
  );

-- Public read access to card history (shows changes)
CREATE POLICY "Anyone can read card history"
  ON public.card_history
  FOR SELECT
  USING (true);

-- Admin-only write access to card history
CREATE POLICY "Only admins can write card history"
  ON public.card_history
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' LIKE '%@rewardrelay.au'
    OR auth.jwt() ->> 'email' = 'john.g.keto+rewardrelay@gmail.com'
  );

-- Grant permissions
GRANT SELECT ON public.card_history TO authenticated;
GRANT SELECT ON public.scrape_logs TO authenticated;
GRANT ALL ON public.card_history TO service_role;
GRANT ALL ON public.scrape_logs TO service_role;