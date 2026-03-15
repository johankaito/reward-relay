CREATE TABLE IF NOT EXISTS public.qantas_award_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone int NOT NULL,
  distance_min_miles int NOT NULL,
  distance_max_miles int NOT NULL,
  economy_pts int NOT NULL,
  premium_economy_pts int NOT NULL,
  business_pts int NOT NULL,
  first_pts int,
  applies_to text NOT NULL,
  effective_date date NOT NULL,
  data_last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(zone, applies_to, effective_date)
);

ALTER TABLE public.qantas_award_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.qantas_award_zones FOR SELECT USING (true);

-- Qantas Preferred Partners zone chart — effective 5 Aug 2025
-- Zones 1–3 have NULL first_pts (First not available on domestic)
INSERT INTO public.qantas_award_zones
  (zone, distance_min_miles, distance_max_miles, economy_pts, premium_economy_pts, business_pts, first_pts, applies_to, effective_date, data_last_updated)
VALUES
  (1,  0,     600,   9200,  14500,  19300, NULL,   'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (2,  601,   1200,  13800, 21600,  29000, NULL,   'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (3,  1201,  2400,  20700, 32600,  43600, NULL,   'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (4,  2401,  3600,  23300, 50600,  68400, 102600, 'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (5,  3601,  4800,  29000, 61600,  82100, 123100, 'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (6,  4801,  5800,  36200, 73800,  98400, 147700, 'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (7,  5801,  7000,  43200, 85300,  113900, 170800, 'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (8,  7001,  8400,  48200, 97600,  130100, 195400, 'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (9,  8401,  9600,  58900, 113900, 151800, 227800, 'qantas_preferred_partners', '2025-08-05', '2025-08-05'),
  (10, 9601,  15000, 63500, 124700, 166300, 249400, 'qantas_preferred_partners', '2025-08-05', '2025-08-05')
ON CONFLICT (zone, applies_to, effective_date) DO UPDATE SET
  distance_min_miles = EXCLUDED.distance_min_miles,
  distance_max_miles = EXCLUDED.distance_max_miles,
  economy_pts = EXCLUDED.economy_pts,
  premium_economy_pts = EXCLUDED.premium_economy_pts,
  business_pts = EXCLUDED.business_pts,
  first_pts = EXCLUDED.first_pts,
  data_last_updated = EXCLUDED.data_last_updated;

-- Jetstar domestic supplement (Zone 1 only)
INSERT INTO public.qantas_award_zones
  (zone, distance_min_miles, distance_max_miles, economy_pts, premium_economy_pts, business_pts, first_pts, applies_to, effective_date, data_last_updated)
VALUES
  (1, 0, 600, 5700, 5700, 5700, NULL, 'jetstar_domestic', '2025-08-05', '2025-08-05')
ON CONFLICT (zone, applies_to, effective_date) DO UPDATE SET
  economy_pts = EXCLUDED.economy_pts,
  data_last_updated = EXCLUDED.data_last_updated;
