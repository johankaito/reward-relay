CREATE TABLE IF NOT EXISTS public.credit_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank TEXT NOT NULL,
  card_name TEXT NOT NULL,
  application_date DATE NOT NULL,
  outcome TEXT CHECK (outcome IN ('approved', 'declined', 'pending', 'withdrawn')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_credit_inquiries_user ON public.credit_inquiries(user_id);
CREATE INDEX idx_credit_inquiries_date ON public.credit_inquiries(user_id, application_date DESC);

ALTER TABLE public.credit_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own inquiries" ON public.credit_inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inquiries" ON public.credit_inquiries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own inquiries" ON public.credit_inquiries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own inquiries" ON public.credit_inquiries FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON public.credit_inquiries TO authenticated;

-- Updated_at trigger
CREATE TRIGGER update_credit_inquiries_updated_at
  BEFORE UPDATE ON public.credit_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
