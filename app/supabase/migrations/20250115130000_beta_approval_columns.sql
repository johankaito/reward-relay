-- Add approval tracking columns to beta_requests table
ALTER TABLE public.beta_requests
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Create index on approved for efficient querying
CREATE INDEX IF NOT EXISTS idx_beta_requests_approved ON public.beta_requests(approved);

-- Database trigger to invoke Edge Function on approval
CREATE OR REPLACE FUNCTION public.handle_beta_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if approved was changed from false to true
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Set invited_at timestamp
    NEW.invited_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for approval
DROP TRIGGER IF EXISTS on_beta_approved ON public.beta_requests;
CREATE TRIGGER on_beta_approved
  BEFORE UPDATE OF approved ON public.beta_requests
  FOR EACH ROW
  WHEN (NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false))
  EXECUTE FUNCTION public.handle_beta_approval();

-- Note: To complete the webhook setup for welcome emails:
-- 1. Go to Database > Webhooks in Supabase dashboard
-- 2. Create a new webhook
-- 3. Table: beta_requests
-- 4. Events: UPDATE
-- 5. Type: Supabase Edge Functions
-- 6. Function: send-beta-welcome
-- 7. HTTP Headers: Filter by approved = true
