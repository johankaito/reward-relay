-- Add spending tracking fields to user_cards table
ALTER TABLE public.user_cards
ADD COLUMN IF NOT EXISTS current_spend DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS spend_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create transactions table for detailed spending tracking
CREATE TABLE IF NOT EXISTS public.spending_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spending_transactions_user_card ON public.spending_transactions(user_card_id);
CREATE INDEX IF NOT EXISTS idx_spending_transactions_user ON public.spending_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_transactions_date ON public.spending_transactions(transaction_date);

-- Enable RLS
ALTER TABLE public.spending_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for spending_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.spending_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.spending_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.spending_transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.spending_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.spending_transactions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Function to update current_spend when transactions change
CREATE OR REPLACE FUNCTION update_card_spending()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.user_cards
    SET current_spend = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.spending_transactions
      WHERE user_card_id = NEW.user_card_id
    ),
    spend_updated_at = NOW()
    WHERE id = NEW.user_card_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_cards
    SET current_spend = (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.spending_transactions
      WHERE user_card_id = OLD.user_card_id
    ),
    spend_updated_at = NOW()
    WHERE id = OLD.user_card_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update current_spend
CREATE TRIGGER update_card_spending_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.spending_transactions
FOR EACH ROW
EXECUTE FUNCTION update_card_spending();