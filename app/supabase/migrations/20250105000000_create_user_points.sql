-- Create user_points table for tracking Qantas FF points balance
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qantas_ff_balance INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one row per user
  CONSTRAINT user_points_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own points"
  ON public.user_points
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
  ON public.user_points
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON public.user_points
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
