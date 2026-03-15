CREATE TABLE IF NOT EXISTS public.award_flight_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program text NOT NULL CHECK (program IN ('qff', 'velocity')),
  origin text NOT NULL,
  destination text NOT NULL,
  origin_city text NOT NULL,
  destination_city text NOT NULL,
  cabin_class text NOT NULL CHECK (cabin_class IN ('economy', 'business', 'first')),
  points_required integer NOT NULL,
  taxes_aud numeric(10,2) NOT NULL DEFAULT 0,
  booking_url text,
  valid_from date,
  valid_until date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.award_flight_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.award_flight_routes FOR SELECT USING (true);

-- QFF routes
INSERT INTO public.award_flight_routes (program, origin, destination, origin_city, destination_city, cabin_class, points_required, taxes_aud) VALUES
  ('qff', 'SYD', 'MEL', 'Sydney', 'Melbourne', 'economy', 8000, 38.00),
  ('qff', 'SYD', 'MEL', 'Sydney', 'Melbourne', 'business', 18000, 38.00),
  ('qff', 'SYD', 'BNE', 'Sydney', 'Brisbane', 'economy', 8000, 38.00),
  ('qff', 'SYD', 'BNE', 'Sydney', 'Brisbane', 'business', 18000, 38.00),
  ('qff', 'SYD', 'PER', 'Sydney', 'Perth', 'economy', 18000, 38.00),
  ('qff', 'SYD', 'PER', 'Sydney', 'Perth', 'business', 36000, 38.00),
  ('qff', 'SYD', 'ADL', 'Sydney', 'Adelaide', 'economy', 8000, 38.00),
  ('qff', 'SYD', 'SIN', 'Sydney', 'Singapore', 'economy', 35000, 70.00),
  ('qff', 'SYD', 'SIN', 'Sydney', 'Singapore', 'business', 70000, 70.00),
  ('qff', 'SYD', 'LHR', 'Sydney', 'London', 'economy', 60000, 550.00),
  ('qff', 'SYD', 'LHR', 'Sydney', 'London', 'business', 90000, 550.00),
  ('qff', 'SYD', 'LHR', 'Sydney', 'London', 'first', 110000, 550.00),
  ('qff', 'MEL', 'SYD', 'Melbourne', 'Sydney', 'economy', 8000, 38.00),
  ('qff', 'MEL', 'BNE', 'Melbourne', 'Brisbane', 'economy', 8000, 38.00),
  ('qff', 'MEL', 'PER', 'Melbourne', 'Perth', 'economy', 18000, 38.00),
  ('qff', 'MEL', 'PER', 'Melbourne', 'Perth', 'business', 36000, 38.00),
  ('qff', 'MEL', 'SIN', 'Melbourne', 'Singapore', 'economy', 35000, 70.00),
  ('qff', 'MEL', 'SIN', 'Melbourne', 'Singapore', 'business', 70000, 70.00),
  ('qff', 'MEL', 'LHR', 'Melbourne', 'London', 'economy', 60000, 550.00),
  ('qff', 'MEL', 'LHR', 'Melbourne', 'London', 'business', 90000, 550.00),
  ('qff', 'BNE', 'SYD', 'Brisbane', 'Sydney', 'economy', 8000, 38.00),
  ('qff', 'BNE', 'MEL', 'Brisbane', 'Melbourne', 'economy', 8000, 38.00);

-- Velocity routes
INSERT INTO public.award_flight_routes (program, origin, destination, origin_city, destination_city, cabin_class, points_required, taxes_aud) VALUES
  ('velocity', 'SYD', 'MEL', 'Sydney', 'Melbourne', 'economy', 7900, 38.00),
  ('velocity', 'SYD', 'MEL', 'Sydney', 'Melbourne', 'business', 17000, 38.00),
  ('velocity', 'SYD', 'BNE', 'Sydney', 'Brisbane', 'economy', 7900, 38.00),
  ('velocity', 'SYD', 'BNE', 'Sydney', 'Brisbane', 'business', 17000, 38.00),
  ('velocity', 'SYD', 'PER', 'Sydney', 'Perth', 'economy', 16000, 38.00),
  ('velocity', 'SYD', 'PER', 'Sydney', 'Perth', 'business', 32000, 38.00),
  ('velocity', 'SYD', 'SIN', 'Sydney', 'Singapore', 'economy', 31000, 70.00),
  ('velocity', 'SYD', 'SIN', 'Sydney', 'Singapore', 'business', 62000, 70.00),
  ('velocity', 'SYD', 'LAX', 'Sydney', 'Los Angeles', 'economy', 55000, 500.00),
  ('velocity', 'SYD', 'LAX', 'Sydney', 'Los Angeles', 'business', 83000, 500.00);
