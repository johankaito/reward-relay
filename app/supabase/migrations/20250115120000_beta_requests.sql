-- Beta access requests table
CREATE TABLE IF NOT EXISTS public.beta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  message TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on processed for efficient querying
CREATE INDEX IF NOT EXISTS idx_beta_requests_processed ON public.beta_requests(processed);
CREATE INDEX IF NOT EXISTS idx_beta_requests_created_at ON public.beta_requests(created_at);

-- Enable RLS
ALTER TABLE public.beta_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow anonymous users to INSERT (submit beta requests)
CREATE POLICY "Anyone can submit beta requests"
  ON public.beta_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow service_role to SELECT and UPDATE (for Edge Function processing)
CREATE POLICY "Service role can read and update beta requests"
  ON public.beta_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON public.beta_requests TO anon;
GRANT ALL ON public.beta_requests TO service_role;

-- Database trigger to invoke Edge Function on new beta request
-- Note: This trigger uses Supabase's pg_net extension to call the Edge Function
-- The Edge Function URL will be: https://<project-ref>.supabase.co/functions/v1/notify-beta-request

CREATE OR REPLACE FUNCTION public.handle_new_beta_request()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  request_id INT;
BEGIN
  -- Get the Supabase project URL from environment
  -- This will be configured when deploying the Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-beta-request';

  -- Make HTTP request to Edge Function using pg_net
  -- Note: You'll need to enable pg_net extension and configure this in Supabase dashboard
  -- For now, we'll use supabase_functions.http_request if available
  -- Otherwise, this will need to be configured as a webhook in Supabase dashboard

  -- Return the new record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_beta_request_created
  AFTER INSERT ON public.beta_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_beta_request();

-- Note: To complete the webhook setup, you'll need to configure Database Webhooks
-- in the Supabase dashboard:
-- 1. Go to Database > Webhooks
-- 2. Create a new webhook
-- 3. Table: beta_requests
-- 4. Events: INSERT
-- 5. Type: Supabase Edge Functions
-- 6. Function: notify-beta-request
-- This will automatically invoke the Edge Function when a row is inserted.
