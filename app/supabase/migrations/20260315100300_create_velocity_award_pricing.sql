CREATE TABLE IF NOT EXISTS public.velocity_award_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_iata char(3) NOT NULL,
  destination_iata char(3) NOT NULL,
  origin_city text,
  destination_city text,
  partner text,
  economy_pts_min int,
  economy_pts_max int,
  business_pts_min int,
  business_pts_max int,
  is_domestic boolean NOT NULL DEFAULT false,
  is_dynamic boolean NOT NULL DEFAULT false,
  notes text,
  data_last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(origin_iata, destination_iata)
);

ALTER TABLE public.velocity_award_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.velocity_award_pricing FOR SELECT USING (true);

-- Domestic routes (Virgin Australia, dynamic — store minimums, is_dynamic = true)
INSERT INTO public.velocity_award_pricing
  (origin_iata, destination_iata, origin_city, destination_city, partner, economy_pts_min, economy_pts_max, business_pts_min, business_pts_max, is_domestic, is_dynamic, notes, data_last_updated)
VALUES
  ('SYD', 'MEL', 'Sydney', 'Melbourne', 'Virgin Australia', 5900, NULL, 15500, NULL, true, true, 'Dynamic pricing on Virgin Australia metal. Minimum points shown — actual prices vary by availability and date.', '2025-01-01'),
  ('SYD', 'BNE', 'Sydney', 'Brisbane', 'Virgin Australia', 5900, NULL, 15500, NULL, true, true, 'Dynamic pricing on Virgin Australia metal. Minimum points shown — actual prices vary by availability and date.', '2025-01-01'),
  ('MEL', 'BNE', 'Melbourne', 'Brisbane', 'Virgin Australia', 8900, NULL, 23500, NULL, true, true, 'Dynamic pricing on Virgin Australia metal. Minimum points shown — actual prices vary by availability and date.', '2025-01-01'),
  ('SYD', 'PER', 'Sydney', 'Perth', 'Virgin Australia', 42000, NULL, 35500, NULL, true, true, 'Dynamic pricing on Virgin Australia metal. Minimum points shown — actual prices vary by availability and date.', '2025-01-01')
ON CONFLICT (origin_iata, destination_iata) DO UPDATE SET
  economy_pts_min = EXCLUDED.economy_pts_min,
  business_pts_min = EXCLUDED.business_pts_min,
  is_dynamic = EXCLUDED.is_dynamic,
  notes = EXCLUDED.notes,
  data_last_updated = EXCLUDED.data_last_updated;

-- International routes (partner airlines, fixed zone pricing)
INSERT INTO public.velocity_award_pricing
  (origin_iata, destination_iata, origin_city, destination_city, partner, economy_pts_min, economy_pts_max, business_pts_min, business_pts_max, is_domestic, is_dynamic, notes, data_last_updated)
VALUES
  ('SYD', 'SIN', 'Sydney', 'Singapore', 'Singapore Airlines', 36000, 57500, 60000, NULL, false, false, 'Singapore Airlines partner. Economy range 36,000–57,500 pts depending on booking class.', '2025-01-01'),
  ('SYD', 'NRT', 'Sydney', 'Tokyo Narita', 'ANA', 42000, NULL, 82000, NULL, false, false, 'ANA partner. Business class price reflects post-Jan 2025 ANA price increase (82,000 pts).', '2025-01-01'),
  ('SYD', 'LAX', 'Sydney', 'Los Angeles', 'United Airlines', 44800, NULL, 95500, NULL, false, false, 'United Airlines partner.', '2025-01-01'),
  ('BNE', 'LAX', 'Brisbane', 'Los Angeles', 'United Airlines', 44800, NULL, 95500, NULL, false, false, 'United Airlines partner.', '2025-01-01'),
  ('SYD', 'LHR', 'Sydney', 'London Heathrow', 'Virgin Atlantic / Qatar / Etihad', 95500, NULL, 139000, NULL, false, false, 'Multiple partner airlines available. Minimum pricing shown.', '2025-01-01'),
  ('MEL', 'LHR', 'Melbourne', 'London Heathrow', 'Partner airlines', 95500, NULL, 139000, NULL, false, false, 'Multiple partner airlines available. Minimum pricing shown.', '2025-01-01')
ON CONFLICT (origin_iata, destination_iata) DO UPDATE SET
  economy_pts_min = EXCLUDED.economy_pts_min,
  economy_pts_max = EXCLUDED.economy_pts_max,
  business_pts_min = EXCLUDED.business_pts_min,
  business_pts_max = EXCLUDED.business_pts_max,
  partner = EXCLUDED.partner,
  is_dynamic = EXCLUDED.is_dynamic,
  notes = EXCLUDED.notes,
  data_last_updated = EXCLUDED.data_last_updated;
