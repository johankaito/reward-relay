-- Add unique constraint on (bank, name) to enable upsert operations
-- This allows scrapers to update existing cards or insert new ones based on bank+name combination

-- First, remove any duplicate cards that might exist
-- Keep only the most recent version of each (bank, name) combination
DELETE FROM public.cards
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY bank, name
             ORDER BY created_at DESC
           ) AS rn
    FROM public.cards
  ) t
  WHERE t.rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.cards
ADD CONSTRAINT cards_bank_name_key UNIQUE (bank, name);
