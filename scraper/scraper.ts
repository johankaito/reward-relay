#!/usr/bin/env tsx

/**
 * Daily Card Data Scraper for Reward Relay
 * Runs on Coolify/VPS to update card offers
 */

import { chromium, Browser, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for admin access
);

interface CardOffer {
  bank: string;
  name: string;
  annual_fee?: number;
  welcome_bonus_points?: number;
  bonus_spend_requirement?: number;
  bonus_spend_window_months?: number;
  min_income?: number;
  application_link?: string;
}

class CardScraper {
  private browser: Browser | null = null;

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('🌏 Browser initialized');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  private async delay(ms: number) {
    // Add randomization to avoid detection
    const randomDelay = ms + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, randomDelay));
  }

  async scrapePointsHacks(): Promise<CardOffer[]> {
    console.log('📰 Scraping PointsHacks...');
    const cards: CardOffer[] = [];

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent(process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      await page.goto('https://www.pointhacks.com.au/credit-cards/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.delay(3000);

      // PointsHacks structure - adjust selectors as needed
      const cardElements = await page.$$('.card-listing-item');

      for (const element of cardElements) {
        try {
          const bank = await element.$eval('.bank-name', el => el.textContent?.trim()) || '';
          const name = await element.$eval('.card-name', el => el.textContent?.trim()) || '';
          const bonusText = await element.$eval('.bonus-points', el => el.textContent?.trim()) || '';
          const feeText = await element.$eval('.annual-fee', el => el.textContent?.trim()) || '';

          // Parse numbers from text
          const bonusMatch = bonusText.match(/[\d,]+/);
          const feeMatch = feeText.match(/[\d,]+/);

          cards.push({
            bank,
            name,
            welcome_bonus_points: bonusMatch ? parseInt(bonusMatch[0].replace(/,/g, '')) : undefined,
            annual_fee: feeMatch ? parseInt(feeMatch[0].replace(/,/g, '')) : undefined
          });
        } catch (err) {
          console.warn('Failed to parse card element:', err);
        }
      }

      await page.close();
      console.log(`✅ Found ${cards.length} cards on PointsHacks`);

    } catch (error) {
      console.error('❌ PointsHacks scraping failed:', error);
      await this.logScrapingError('pointhacks', error);
    }

    return cards;
  }

  async scrapeBankWebsite(bankName: string, url: string): Promise<CardOffer[]> {
    console.log(`🏦 Scraping ${bankName}...`);
    const cards: CardOffer[] = [];

    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent(process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0');

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.delay(3000);

      // Look for JSON-LD structured data first
      const jsonLd = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map(s => s.textContent);
      });

      // Parse structured data if available
      for (const json of jsonLd) {
        try {
          const data = JSON.parse(json || '{}');
          if (data['@type'] === 'FinancialProduct' || data['@type'] === 'Product') {
            // Extract card info from structured data
            cards.push({
              bank: bankName,
              name: data.name,
              annual_fee: data.annualFee?.value,
              application_link: data.url
            });
          }
        } catch {}
      }

      // Fallback to DOM scraping based on bank
      if (cards.length === 0) {
        // Add bank-specific selectors here
        switch(bankName.toLowerCase()) {
          case 'anz':
            // ANZ-specific selectors
            break;
          case 'commbank':
            // CommBank-specific selectors
            break;
          // Add more banks
        }
      }

      await page.close();
      console.log(`✅ Found ${cards.length} cards on ${bankName}`);

    } catch (error) {
      console.error(`❌ ${bankName} scraping failed:`, error);
      await this.logScrapingError(bankName.toLowerCase(), error);
    }

    return cards;
  }

  async updateDatabase(cards: CardOffer[]) {
    console.log(`💾 Updating database with ${cards.length} cards...`);

    for (const card of cards) {
      try {
        // Check if card exists
        const { data: existing } = await supabase
          .from('cards')
          .select('id, annual_fee, welcome_bonus_points')
          .eq('bank', card.bank)
          .eq('name', card.name)
          .single();

        if (existing) {
          // Track changes
          const changes: any[] = [];

          if (existing.annual_fee !== card.annual_fee) {
            changes.push({
              card_id: existing.id,
              field_name: 'annual_fee',
              old_value: String(existing.annual_fee),
              new_value: String(card.annual_fee)
            });
          }

          if (existing.welcome_bonus_points !== card.welcome_bonus_points) {
            changes.push({
              card_id: existing.id,
              field_name: 'welcome_bonus_points',
              old_value: String(existing.welcome_bonus_points),
              new_value: String(card.welcome_bonus_points)
            });
          }

          // Update if changed
          if (changes.length > 0) {
            await supabase
              .from('cards')
              .update({
                ...card,
                last_scraped_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            // Log changes
            if (changes.length > 0) {
              await supabase
                .from('card_history')
                .insert(changes);
            }

            console.log(`📝 Updated: ${card.bank} - ${card.name}`);
          }
        } else {
          // Insert new card
          await supabase
            .from('cards')
            .insert({
              ...card,
              last_scraped_at: new Date().toISOString(),
              scrape_source: 'automated'
            });

          console.log(`➕ Added: ${card.bank} - ${card.name}`);
        }
      } catch (error) {
        console.error(`Failed to update ${card.bank} - ${card.name}:`, error);
      }
    }
  }

  async logScrapingError(source: string, error: any) {
    await supabase
      .from('scrape_logs')
      .insert({
        source,
        status: 'error',
        error_message: error?.message || String(error)
      });
  }

  async runDailyScrape() {
    console.log('\n🚀 Starting daily card scrape...');
    console.log(`📅 ${new Date().toISOString()}\n`);

    await this.initialize();

    try {
      // Scrape PointsHacks
      const pointsHacksCards = await this.scrapePointsHacks();
      await this.delay(5000);

      // Scrape bank websites
      const anzCards = await this.scrapeBankWebsite('ANZ', 'https://www.anz.com.au/personal/credit-cards/');
      await this.delay(5000);

      const commbankCards = await this.scrapeBankWebsite('CommBank', 'https://www.commbank.com.au/credit-cards');
      await this.delay(5000);

      // Combine all cards
      const allCards = [
        ...pointsHacksCards,
        ...anzCards,
        ...commbankCards
      ];

      // Update database
      await this.updateDatabase(allCards);

      // Log success
      await supabase
        .from('scrape_logs')
        .insert({
          source: 'daily_scrape',
          status: 'success',
          cards_updated: allCards.length
        });

      console.log(`\n✅ Daily scrape completed successfully!`);
      console.log(`📊 Total cards processed: ${allCards.length}`);

    } catch (error) {
      console.error('❌ Daily scrape failed:', error);
      await this.logScrapingError('daily_scrape', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  const scraper = new CardScraper();

  // Check for command line arguments
  const args = process.argv.slice(2);

  if (args.includes('--now')) {
    // Run immediately
    console.log('Running scraper immediately...');
    await scraper.runDailyScrape();
  } else if (args.includes('--cron')) {
    // Set up cron job (3 AM daily)
    console.log('📅 Setting up daily scraper cron job...');
    cron.schedule('0 3 * * *', async () => {
      await scraper.runDailyScrape();
    });
    console.log('⏰ Scraper will run daily at 3 AM');
  } else {
    // Default: run once
    await scraper.runDailyScrape();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down scraper...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down scraper...');
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { CardScraper };