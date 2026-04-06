-- CDP-8: Add card_id and bonus_points to deals table for two-source validation
-- card_id links a deal to the matched card so card-extract can verify against feed data.
-- bonus_points stores the extracted bonus from the feed for direct comparison.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bonus_points integer;

CREATE INDEX IF NOT EXISTS deals_card_id_created_at_idx ON public.deals (card_id, created_at DESC)
  WHERE card_id IS NOT NULL;
