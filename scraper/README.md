# Reward Relay Card Data Scraper

## Overview

Daily scraper for Australian credit card offers from:
- PointsHacks
- Bank websites (ANZ, CommBank, NAB, Westpac, AMEX)
- Finder.com.au
- Canstar

## Architecture

This scraper runs on a separate server (Coolify/VPS) and updates the Supabase database directly.

## Setup

### 1. Install Dependencies

```bash
npm init -y
npm install playwright @supabase/supabase-js dotenv node-cron
npm install @types/node typescript tsx --save-dev
```

### 2. Environment Variables

Create `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key  # Not anon key!
SCRAPER_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...
```

### 3. Deploy to Coolify/VPS

```bash
# On your VPS
git clone your-repo
cd scraper
npm install
npm run build

# Add to crontab
crontab -e
# Add: 0 3 * * * cd /path/to/scraper && npm run scrape
```

## Scraping Strategy

### Rate Limiting
- 5-10 second delays between pages
- Randomize delays (3-10 seconds)
- Max 100 pages per hour

### Anti-Detection
- Rotate user agents
- Use residential proxy if needed
- Respect robots.txt
- Add referrer headers

### Data Updates
- Only update changed fields
- Keep history of changes
- Alert on significant changes (>20% fee increase)

## Legal Considerations

- Check terms of service
- Respect robots.txt
- Don't overload servers
- Consider reaching out for API access

## Monitoring

- Log all scrapes to `/var/log/scraper/`
- Alert on failures via email
- Track success rate in Supabase

## Data Sources

### PointsHacks
- URL: https://www.pointhacks.com.au/credit-cards/
- Updates: Weekly
- Data: Bonus points, fees, reviews

### Bank Sites
- Check /credit-cards pages
- Look for JSON-LD structured data
- Parse application pages

## Database Schema

```sql
-- Add to existing cards table
ALTER TABLE cards ADD COLUMN last_scraped_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN scrape_source TEXT;
ALTER TABLE cards ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE cards ADD COLUMN raw_data JSONB;

-- Track scraping history
CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  cards_updated INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track card changes
CREATE TABLE card_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```