-- Fix: the partial unique index from 20260406070000 doesn't satisfy
-- ON CONFLICT (source_url) — Postgres requires either a full unique constraint
-- or a partial index whose predicate is included in the ON CONFLICT clause.
-- Supabase client .upsert({ onConflict: "source_url" }) generates plain
-- ON CONFLICT (source_url), so we need a plain unique constraint.
-- NULL source_url values are unaffected (NULL ≠ NULL in Postgres, so multiple
-- NULLs are allowed even with a UNIQUE constraint).

DROP INDEX IF EXISTS deals_source_url_unique;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_source_url_key UNIQUE (source_url);
