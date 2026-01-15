-- Add scrape_url field and update unique constraint to use URL instead of name
-- This prevents duplicate cards even when names can't be properly extracted

-- Step 1: Add scrape_url column
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS scrape_url TEXT;

-- Step 2: Populate scrape_url from existing application_link for seeded data
UPDATE public.cards
SET scrape_url = application_link
WHERE scrape_url IS NULL AND application_link IS NOT NULL;

-- Step 3: For cards without application_link, generate a fallback URL from bank+name
UPDATE public.cards
SET scrape_url = 'https://unknown-source.com/' ||
                 lower(replace(bank, ' ', '-')) || '/' ||
                 lower(replace(name, ' ', '-'))
WHERE scrape_url IS NULL;

-- Step 4: Drop old (bank, name) constraint
ALTER TABLE public.cards
DROP CONSTRAINT IF EXISTS cards_bank_name_key;

-- Step 5: Add new unique constraint on (scrape_source, scrape_url)
-- This ensures each URL from each source is unique
ALTER TABLE public.cards
ADD CONSTRAINT cards_source_url_key UNIQUE (scrape_source, scrape_url);

-- Step 6: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cards_scrape_url ON public.cards(scrape_url);
