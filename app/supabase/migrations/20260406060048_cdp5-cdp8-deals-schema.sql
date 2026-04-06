-- CDP-8: Add card_id FK and bonus_points to deals table for two-source validation
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS card_id uuid REFERENCES public.cards(id),
  ADD COLUMN IF NOT EXISTS bonus_points integer;

CREATE INDEX IF NOT EXISTS deals_card_id_idx ON public.deals (card_id) WHERE card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS deals_created_at_idx ON public.deals (created_at DESC);

-- CDP-3/CDP-7: Add missing columns to unmatched_deals (status, spend_requirement, linked_card_id)
ALTER TABLE public.unmatched_deals
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'linked', 'dismissed')),
  ADD COLUMN IF NOT EXISTS spend_requirement numeric,
  ADD COLUMN IF NOT EXISTS linked_card_id uuid REFERENCES public.cards(id);

CREATE INDEX IF NOT EXISTS unmatched_deals_status_idx ON public.unmatched_deals (status) WHERE status = 'pending';
