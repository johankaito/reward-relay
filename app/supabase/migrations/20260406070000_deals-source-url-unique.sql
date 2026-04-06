-- CDP-5: Add unique constraint on deals(source_url) so ON CONFLICT (source_url)
-- in deals-sync and ozbargain-parse upserts works correctly.
-- Partial index: only enforce uniqueness when source_url is non-null.
CREATE UNIQUE INDEX IF NOT EXISTS deals_source_url_unique
  ON public.deals (source_url)
  WHERE source_url IS NOT NULL;
