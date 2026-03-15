-- award_data_freshness view — aggregates data_last_updated per award table
-- Staleness thresholds: >180 days = stale (warn), >365 days = outdated (alert)
CREATE OR REPLACE VIEW public.award_data_freshness AS
SELECT
  'bank_exclusion_periods'::text AS table_name,
  MAX(data_last_updated) AS last_updated,
  (CURRENT_DATE - MAX(data_last_updated)) AS days_since_update
FROM public.bank_exclusion_periods
UNION ALL
SELECT
  'qantas_award_zones'::text,
  MAX(data_last_updated),
  (CURRENT_DATE - MAX(data_last_updated))
FROM public.qantas_award_zones
UNION ALL
SELECT
  'award_routes'::text,
  MAX(data_last_updated),
  (CURRENT_DATE - MAX(data_last_updated))
FROM public.award_routes
UNION ALL
SELECT
  'velocity_award_pricing'::text,
  MAX(data_last_updated),
  (CURRENT_DATE - MAX(data_last_updated))
FROM public.velocity_award_pricing;
