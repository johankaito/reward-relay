CREATE TABLE IF NOT EXISTS public.award_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_iata char(3) NOT NULL,
  destination_iata char(3) NOT NULL,
  origin_city text,
  destination_city text,
  distance_miles int NOT NULL,
  program text NOT NULL,
  zone int,
  economy_pts int,
  premium_economy_pts int,
  business_pts int,
  first_pts int,
  is_domestic boolean NOT NULL DEFAULT false,
  is_dynamic boolean NOT NULL DEFAULT false,
  notes text,
  data_last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(origin_iata, destination_iata, program)
);

ALTER TABLE public.award_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.award_routes FOR SELECT USING (true);

-- Qantas domestic routes
INSERT INTO public.award_routes
  (origin_iata, destination_iata, origin_city, destination_city, distance_miles, program, zone, economy_pts, premium_economy_pts, business_pts, first_pts, is_domestic, data_last_updated)
VALUES
  ('SYD', 'MEL', 'Sydney', 'Melbourne', 439, 'qantas', 1, 9200, 14500, 19300, NULL, true, '2025-08-05'),
  ('SYD', 'BNE', 'Sydney', 'Brisbane', 460, 'qantas', 1, 9200, 14500, 19300, NULL, true, '2025-08-05'),
  ('SYD', 'CBR', 'Sydney', 'Canberra', 147, 'qantas', 1, 9200, 14500, 19300, NULL, true, '2025-08-05'),
  ('SYD', 'ADL', 'Sydney', 'Adelaide', 725, 'qantas', 2, 13800, 21600, 29000, NULL, true, '2025-08-05'),
  ('MEL', 'BNE', 'Melbourne', 'Brisbane', 857, 'qantas', 2, 13800, 21600, 29000, NULL, true, '2025-08-05'),
  ('SYD', 'CNS', 'Sydney', 'Cairns', 1222, 'qantas', 3, 20700, 32600, 43600, NULL, true, '2025-08-05'),
  ('MEL', 'PER', 'Melbourne', 'Perth', 1682, 'qantas', 3, 20700, 32600, 43600, NULL, true, '2025-08-05'),
  ('SYD', 'DRW', 'Sydney', 'Darwin', 1957, 'qantas', 3, 20700, 32600, 43600, NULL, true, '2025-08-05'),
  ('SYD', 'PER', 'Sydney', 'Perth', 2041, 'qantas', 3, 20700, 32600, 43600, NULL, true, '2025-08-05'),
  ('BNE', 'PER', 'Brisbane', 'Perth', 2246, 'qantas', 3, 20700, 32600, 43600, NULL, true, '2025-08-05')
ON CONFLICT (origin_iata, destination_iata, program) DO UPDATE SET
  distance_miles = EXCLUDED.distance_miles,
  zone = EXCLUDED.zone,
  economy_pts = EXCLUDED.economy_pts,
  premium_economy_pts = EXCLUDED.premium_economy_pts,
  business_pts = EXCLUDED.business_pts,
  first_pts = EXCLUDED.first_pts,
  data_last_updated = EXCLUDED.data_last_updated;

-- Qantas international routes
INSERT INTO public.award_routes
  (origin_iata, destination_iata, origin_city, destination_city, distance_miles, program, zone, economy_pts, premium_economy_pts, business_pts, first_pts, is_domestic, notes, data_last_updated)
VALUES
  ('SYD', 'HKG', 'Sydney', 'Hong Kong', 4580, 'qantas', 4, 23300, 50600, 68400, 102600, false, NULL, '2025-08-05'),
  ('SYD', 'SIN', 'Sydney', 'Singapore', 3907, 'qantas', 5, 29000, 61600, 82100, 123100, false, NULL, '2025-08-05'),
  ('SYD', 'NRT', 'Sydney', 'Tokyo Narita', 4863, 'qantas', 5, 29000, 61600, 82100, 123100, false, 'Borderline Zone 5/6 — distance sits near the 4,800mi boundary. Verify current zone assignment on qantas.com before booking.', '2025-08-05'),
  ('SYD', 'LAX', 'Sydney', 'Los Angeles', 7497, 'qantas', 8, 48200, 97600, 130100, 195400, false, NULL, '2025-08-05'),
  ('SYD', 'LHR', 'Sydney', 'London Heathrow', 10573, 'qantas', 10, 63500, 124700, 166300, 249400, false, NULL, '2025-08-05'),
  ('MEL', 'LHR', 'Melbourne', 'London Heathrow', 10499, 'qantas', 10, 63500, 124700, 166300, 249400, false, NULL, '2025-08-05'),
  ('BNE', 'LAX', 'Brisbane', 'Los Angeles', 6960, 'qantas', 7, 43200, 85300, 113900, 170800, false, NULL, '2025-08-05')
ON CONFLICT (origin_iata, destination_iata, program) DO UPDATE SET
  distance_miles = EXCLUDED.distance_miles,
  zone = EXCLUDED.zone,
  economy_pts = EXCLUDED.economy_pts,
  premium_economy_pts = EXCLUDED.premium_economy_pts,
  business_pts = EXCLUDED.business_pts,
  first_pts = EXCLUDED.first_pts,
  notes = EXCLUDED.notes,
  data_last_updated = EXCLUDED.data_last_updated;

-- Velocity domestic routes (dynamic minimum pricing, is_dynamic = true)
INSERT INTO public.award_routes
  (origin_iata, destination_iata, origin_city, destination_city, distance_miles, program, economy_pts, business_pts, is_domestic, is_dynamic, notes, data_last_updated)
VALUES
  ('SYD', 'MEL', 'Sydney', 'Melbourne', 439, 'velocity', 5900, 15500, true, true, 'Dynamic pricing — these are minimum point values. Actual prices vary by availability.', '2025-01-01'),
  ('SYD', 'BNE', 'Sydney', 'Brisbane', 460, 'velocity', 5900, 15500, true, true, 'Dynamic pricing — these are minimum point values. Actual prices vary by availability.', '2025-01-01'),
  ('MEL', 'BNE', 'Melbourne', 'Brisbane', 857, 'velocity', 8900, 23500, true, true, 'Dynamic pricing — these are minimum point values. Actual prices vary by availability.', '2025-01-01'),
  ('SYD', 'PER', 'Sydney', 'Perth', 2041, 'velocity', 42000, 35500, true, true, 'Dynamic pricing — these are minimum point values. Actual prices vary by availability.', '2025-01-01')
ON CONFLICT (origin_iata, destination_iata, program) DO UPDATE SET
  economy_pts = EXCLUDED.economy_pts,
  business_pts = EXCLUDED.business_pts,
  is_dynamic = EXCLUDED.is_dynamic,
  notes = EXCLUDED.notes,
  data_last_updated = EXCLUDED.data_last_updated;

-- Velocity international routes (fixed zone pricing)
INSERT INTO public.award_routes
  (origin_iata, destination_iata, origin_city, destination_city, distance_miles, program, economy_pts, business_pts, is_domestic, is_dynamic, notes, data_last_updated)
VALUES
  ('SYD', 'SIN', 'Sydney', 'Singapore', 3907, 'velocity', 36000, 60000, false, false, 'Singapore Airlines partner — economy range 36,000–57,500 pts. Stored as minimum economy / minimum business.', '2025-01-01'),
  ('SYD', 'NRT', 'Sydney', 'Tokyo Narita', 4863, 'velocity', 42000, 82000, false, false, 'ANA partner — reflects post-Jan 2025 price increase (82,000 pts business).', '2025-01-01'),
  ('SYD', 'LAX', 'Sydney', 'Los Angeles', 7497, 'velocity', 44800, 95500, false, false, 'United Airlines partner.', '2025-01-01'),
  ('BNE', 'LAX', 'Brisbane', 'Los Angeles', 6960, 'velocity', 44800, 95500, false, false, 'United Airlines partner.', '2025-01-01'),
  ('SYD', 'LHR', 'Sydney', 'London Heathrow', 10573, 'velocity', 95500, 139000, false, false, 'Virgin Atlantic / Qatar / Etihad partner — minimum pricing shown.', '2025-01-01'),
  ('MEL', 'LHR', 'Melbourne', 'London Heathrow', 10499, 'velocity', 95500, 139000, false, false, 'Partner airlines — minimum pricing shown.', '2025-01-01')
ON CONFLICT (origin_iata, destination_iata, program) DO UPDATE SET
  economy_pts = EXCLUDED.economy_pts,
  business_pts = EXCLUDED.business_pts,
  is_dynamic = EXCLUDED.is_dynamic,
  notes = EXCLUDED.notes,
  data_last_updated = EXCLUDED.data_last_updated;
