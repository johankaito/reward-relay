-- Email reminders tracking table
CREATE TABLE IF NOT EXISTS public.email_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_day', '14_day', '7_day')),
  email_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_reminders_user_card ON public.email_reminders(user_card_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_type ON public.email_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_email_reminders_sent_at ON public.email_reminders(sent_at);

-- Enable RLS
ALTER TABLE public.email_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can view their own reminders
CREATE POLICY "Users can view their own email reminders"
  ON public.email_reminders
  FOR SELECT
  USING (
    user_card_id IN (
      SELECT id FROM public.user_cards WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON public.email_reminders TO authenticated;
GRANT ALL ON public.email_reminders TO service_role;