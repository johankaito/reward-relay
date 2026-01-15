#!/usr/bin/env tsx
/**
 * MyCard.com.au Credit Card Scraper
 * Scrapes Australian credit card data and inserts directly into Supabase
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

// Supabase setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ScrapedCard {
  bank: string;
  name: string;
  network: string | null;
  annual_fee: number | null;
  welcome_bonus_points: number | null;
  bonus_spend_requirement: number | null;
  bonus_spend_currency: string;
  points_currency: string | null;
  earn_rate_primary: number | null;
  application_link: string | null;
  notes: string | null;
  scrape_source: string;
  last_scraped_at: string;
  is_active: boolean;
  raw_data: any;
}

async function scrapeMyCard(): Promise<ScrapedCard[]> {
  console.log('\n🚀 Starting MyCard.com.au scraper...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const cards: ScrapedCard[] = [];

  try {
    // Navigate to MyCard credit cards page
    console.log('📱 Navigating to MyCard.com.au...');
    await page.goto('https://www.mycard.com.au/credit-cards', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully\n');
    await delay(2000);

    // Wait for card listings to load
    await page.waitForSelector('[data-testid="card-item"], .card-item, .credit-card-item', {
      timeout: 10000
    }).catch(() => {
      console.log('⚠️  No standard selectors found, attempting alternative approach...');
    });

    // Extract card data
    console.log('🔍 Extracting card data...\n');

    const cardData = await page.evaluate(() => {
      const results: any[] = [];

      // Try multiple selector strategies
      const cardContainers = document.querySelectorAll(
        '.productcard, [class*="productcard"]'
      );

      cardContainers.forEach((container, index) => {
        try {
          // Extract text content
          const text = container.textContent || '';

          // Try to find card name (in h3 tags for MyCard)
          const nameEl = container.querySelector('h3');
          const name = nameEl?.textContent?.trim() || `Card ${index + 1}`;

          // Extract bank from name - MyCard is the brand
          let bank = 'MyCard';
          // Check if it's a co-branded card (e.g., "MyCard Premier Qantas")
          if (name.toLowerCase().includes('qantas')) {
            bank = 'MyCard (Qantas)';
          } else if (name.toLowerCase().includes('velocity')) {
            bank = 'MyCard (Velocity)';
          }

          // Try to find annual fee
          let annualFee: number | null = null;
          const feeMatch = text.match(/\$(\d+)(?:\.\d{2})?\s*(?:p\.a\.|per year|annual fee)/i);
          if (feeMatch) {
            annualFee = parseInt(feeMatch[1]);
          }

          // Try to find bonus points
          let bonusPoints: number | null = null;
          const bonusMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:bonus\s*)?points/i);
          if (bonusMatch) {
            bonusPoints = parseInt(bonusMatch[1].replace(/,/g, ''));
          }

          // Try to find spend requirement
          let spendReq: number | null = null;
          const spendMatch = text.match(/\$(\d{1,3}(?:,\d{3})*)\s*(?:in|within|spend)/i);
          if (spendMatch) {
            spendReq = parseInt(spendMatch[1].replace(/,/g, ''));
          }

          // Try to find earn rate
          let earnRate: number | null = null;
          const earnMatch = text.match(/(\d+(?:\.\d+)?)\s*points?\s*(?:per|\/)\s*\$1/i);
          if (earnMatch) {
            earnRate = parseFloat(earnMatch[1]);
          }

          // Find application link
          const linkEl = container.querySelector('a[href*="apply"], a[href*="card"]');
          const link = linkEl?.getAttribute('href') || null;

          results.push({
            name,
            bank,
            annualFee,
            bonusPoints,
            spendReq,
            earnRate,
            link,
            rawText: text.substring(0, 500) // Keep first 500 chars for debugging
          });
        } catch (error) {
          console.error(`Error parsing card ${index}:`, error);
        }
      });

      return results;
    });

    console.log(`📊 Found ${cardData.length} potential cards\n`);

    // Transform to ScrapedCard format
    for (const card of cardData) {
      // Skip if missing critical data
      if (!card.name || card.name === 'Unknown' || card.name.length < 5) {
        continue;
      }

      const scrapedCard: ScrapedCard = {
        bank: card.bank,
        name: card.name,
        network: card.name.toLowerCase().includes('visa') ? 'Visa' :
                 card.name.toLowerCase().includes('mastercard') ? 'Mastercard' :
                 card.name.toLowerCase().includes('amex') ? 'Amex' : null,
        annual_fee: card.annualFee,
        welcome_bonus_points: card.bonusPoints,
        bonus_spend_requirement: card.spendReq,
        bonus_spend_currency: 'AUD',
        points_currency: null, // Will need to determine from bank/card type
        earn_rate_primary: card.earnRate,
        application_link: card.link,
        notes: null,
        scrape_source: 'mycard',
        last_scraped_at: new Date().toISOString(),
        is_active: true,
        raw_data: card
      };

      cards.push(scrapedCard);
      console.log(`✅ ${scrapedCard.bank} ${scrapedCard.name}`);
      if (scrapedCard.welcome_bonus_points) {
        console.log(`   💰 ${scrapedCard.welcome_bonus_points.toLocaleString()} bonus points`);
      }
      if (scrapedCard.annual_fee) {
        console.log(`   💳 $${scrapedCard.annual_fee} annual fee`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Scraping error:', error);
    throw error;
  } finally {
    await browser.close();
  }

  return cards;
}

async function saveToSupabase(cards: ScrapedCard[]): Promise<void> {
  console.log(`\n💾 Saving ${cards.length} cards to Supabase...\n`);

  const startTime = new Date();
  let cardsAdded = 0;
  let cardsUpdated = 0;
  let errors = 0;

  for (const card of cards) {
    try {
      // Upsert card (update if exists, insert if new)
      const { error, data } = await supabase
        .from('cards')
        .upsert(card, {
          onConflict: 'bank,name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error saving ${card.bank} ${card.name}:`, error.message);
        errors++;
      } else {
        // Check if it was an insert or update (simplified check)
        console.log(`✅ Saved: ${card.bank} ${card.name}`);
        cardsAdded++; // Note: Can't easily distinguish insert vs update without additional query
      }

      // Rate limiting
      await delay(100);
    } catch (error) {
      console.error(`❌ Exception saving ${card.bank} ${card.name}:`, error);
      errors++;
    }
  }

  // Log scraping run (scrape_logs table not yet in schema, commented out)
  // try {
  //   await supabase.from('scrape_logs').insert({
  //     source: 'mycard',
  //     status: errors === 0 ? 'success' : errors === cards.length ? 'failed' : 'partial',
  //     cards_updated: cardsAdded,
  //     cards_added: cardsAdded,
  //     started_at: startTime.toISOString(),
  //     completed_at: new Date().toISOString(),
  //     error_message: errors > 0 ? `${errors} cards failed to save` : null
  //   });
  // } catch (error) {
  //   console.error('⚠️  Failed to log scrape run:', error);
  // }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Saved: ${cardsAdded} cards`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   ⏱️  Duration: ${Math.round((new Date().getTime() - startTime.getTime()) / 1000)}s\n`);
}

async function main() {
  try {
    const cards = await scrapeMyCard();

    if (cards.length === 0) {
      console.log('⚠️  No cards scraped. Check if MyCard.com.au structure has changed.\n');
      process.exit(1);
    }

    await saveToSupabase(cards);

    console.log('🎉 Scraping complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
