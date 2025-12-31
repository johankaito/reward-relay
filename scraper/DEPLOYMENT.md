# Reward Relay Scraper Deployment Guide

## Overview

The Reward Relay scraper is designed to run as a standalone service on a VPS or Coolify instance, separate from the main Next.js application. This separation allows for:
- Unlimited runtime (no Vercel timeout limits)
- Better anti-detection with residential IPs
- Lower costs ($5-20/month VPS vs expensive serverless functions)
- More control over browser automation

## Prerequisites

1. **Supabase Project**: Must be unpaused and accessible
2. **Service Role Key**: Required for admin database access (not the anon key!)
3. **VPS or Coolify Instance**: With Docker support

## Deployment Options

### Option 1: Deploy to Coolify (Recommended)

1. **Connect Repository to Coolify**
   ```bash
   # In Coolify dashboard:
   1. Add New Resource → Docker Compose
   2. Connect your GitHub repository
   3. Set build path to: /scraper
   4. Choose docker-compose.yml
   ```

2. **Configure Environment Variables in Coolify**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   SCRAPER_USER_AGENT=Mozilla/5.0...
   ```

3. **Deploy**
   - Coolify will automatically build and deploy the Docker container
   - The scraper will run in cron mode (3 AM daily by default)

### Option 2: Deploy to VPS (Manual)

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/reward-relay.git
   cd reward-relay/scraper
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   nano .env
   ```

3. **Build and Run with Docker**
   ```bash
   # Build the image
   docker build -t reward-relay-scraper .

   # Run with docker-compose
   docker-compose up -d

   # Or run directly
   docker run -d \
     --name reward-relay-scraper \
     --env-file .env \
     --restart unless-stopped \
     reward-relay-scraper
   ```

4. **Verify It's Running**
   ```bash
   docker logs reward-relay-scraper
   # Should see: "⏰ Scraper will run daily at 3 AM"
   ```

### Option 3: Deploy with PM2 (No Docker)

1. **Install Dependencies**
   ```bash
   npm install
   npm install -g pm2
   npx playwright install chromium
   ```

2. **Configure PM2**
   ```bash
   # Create ecosystem file
   cat > ecosystem.config.js << 'EOF'
   module.exports = {
     apps: [{
       name: 'reward-relay-scraper',
       script: './scraper.js',
       args: '--cron',
       env: {
         NODE_ENV: 'production'
       },
       error_file: './logs/error.log',
       out_file: './logs/output.log',
       time: true
     }]
   }
   EOF
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup  # Follow instructions to enable on boot
   ```

## Database Migration

Before first run, apply the database migration:

```bash
# From the app directory (not scraper)
cd ../app
npx supabase db push

# Or apply manually via Supabase dashboard:
# SQL Editor → New Query → Paste contents of:
# app/supabase/migrations/0002_scraping.sql
```

## Monitoring

### Check Scraper Logs

**Docker:**
```bash
docker logs -f reward-relay-scraper
```

**PM2:**
```bash
pm2 logs reward-relay-scraper
```

**Coolify:**
- View logs in Coolify dashboard

### Monitor in Database

```sql
-- Check recent scrape runs
SELECT * FROM scrape_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check card update history
SELECT * FROM card_history
ORDER BY changed_at DESC
LIMIT 20;

-- Check last scrape time per card
SELECT bank, name, last_scraped_at
FROM cards
ORDER BY last_scraped_at DESC;
```

## Manual Testing

Test the scraper immediately without waiting for cron:

```bash
# Docker
docker exec reward-relay-scraper node scraper.js --now

# Local
npm run scrape

# Or with tsx in development
npm run dev
```

## Troubleshooting

### Common Issues

1. **"SUPABASE_SERVICE_KEY is not defined"**
   - You need the service role key, not the anon key
   - Find it in Supabase Dashboard → Settings → API → Service Role Key

2. **"TimeoutError: Navigation timeout"**
   - Increase timeout in scraper.ts
   - Check if target websites are accessible from VPS
   - Consider using a proxy

3. **"Browser launch failed"**
   - Ensure Playwright dependencies are installed
   - Check Docker has enough memory (512MB minimum)
   - Try headless: false for debugging

4. **Rate Limiting/Blocking**
   - Increase delays between requests
   - Rotate user agents
   - Consider residential proxy
   - Reduce scraping frequency

### Debug Mode

For development/debugging:

```typescript
// In scraper.ts, change:
this.browser = await chromium.launch({
  headless: false,  // See browser window
  slowMo: 100,      // Slow down actions
  devtools: true    // Open devtools
});
```

## Performance Tuning

### Resource Limits

Adjust in docker-compose.yml:
```yaml
mem_limit: 1g      # Increase memory
cpus: '1.0'        # Increase CPU
```

### Scraping Schedule

Modify cron schedule in scraper.ts:
```javascript
// Default: 3 AM daily
cron.schedule('0 3 * * *', ...)

// Every 6 hours
cron.schedule('0 */6 * * *', ...)

// Weekdays only at 2 AM
cron.schedule('0 2 * * 1-5', ...)
```

### Concurrency

Adjust parallel scraping:
```javascript
// In scraper.ts
const MAX_PARALLEL_PAGES = 3;  // Increase for faster scraping
```

## Security Considerations

1. **Never commit .env files** - Use .gitignore
2. **Rotate service keys periodically** via Supabase dashboard
3. **Use read-only database user** if only reading (not updating)
4. **Monitor for unusual activity** in scrape_logs table
5. **Set up alerts** for failed scrapes

## Proxy Configuration (Optional)

If you need to use a proxy:

1. **Install proxy package**
   ```bash
   npm install proxy-chain
   ```

2. **Configure in scraper.ts**
   ```typescript
   import { proxyChain } from 'proxy-chain';

   const proxyUrl = process.env.PROXY_URL;
   if (proxyUrl) {
     const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);
     this.browser = await chromium.launch({
       proxy: { server: newProxyUrl }
     });
   }
   ```

## Cost Analysis

| Option | Monthly Cost | Pros | Cons |
|--------|-------------|------|------|
| Coolify on VPS | $5-20 | Full control, easy deployment | Need VPS |
| Direct VPS | $5-20 | Maximum control | Manual setup |
| Vercel Functions | $20+ | Integrated with app | Timeout limits |
| AWS Lambda | Variable | Scalable | Complex setup |

## Next Steps

1. **Get Service Role Key** from Supabase dashboard
2. **Choose deployment method** (Coolify recommended)
3. **Deploy and test** with --now flag
4. **Monitor first runs** to ensure data quality
5. **Adjust scraping patterns** based on results

## Support

- Check logs for detailed error messages
- Verify Supabase project is unpaused
- Ensure service role key has proper permissions
- Test selectors manually if scraping fails