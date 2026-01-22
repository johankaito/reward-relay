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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verify if a card still exists by checking its page
 * Returns true if page loads and contains card-related content
 */
async function verifyCardExists(url: string): Promise<boolean> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set timeout and user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Try to load the page
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    }).catch(() => null);

    // Check response status
    if (!response || response.status() === 404 || response.status() >= 500) {
      return false;
    }

    // Check if page contains card-related content
    const hasContent = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();

      // Check for common "not found" or "unavailable" phrases
      const notFoundPhrases = [
        'page not found',
        'not available',
        'no longer available',
        'has been removed',
        'discontinued',
        '404',
      ];

      for (const phrase of notFoundPhrases) {
        if (bodyText.includes(phrase)) {
          return false;
        }
      }

      // Check for positive card-related content
      const cardPhrases = [
        'credit card',
        'annual fee',
        'bonus points',
        'rewards',
        'apply now',
        'card features',
      ];

      let matches = 0;
      for (const phrase of cardPhrases) {
        if (bodyText.includes(phrase)) {
          matches++;
        }
      }

      // Require at least 2 card-related phrases
      return matches >= 2;
    });

    return hasContent;

  } catch (error) {
    console.error(`      ⚠️  Error checking URL: ${error}`);
    return false;
  } finally {
    await browser.close();
  }
}

/**
 * Helper function to mark a card as inactive
 */
async function markCardInactive(supabase: any, cardId: string): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .update({ is_active: false })
    .eq('id', cardId);

  if (error) {
    console.error(`      ❌ Error marking as inactive: ${error.message}`);
  } else {
    console.log(`      ✅ Marked as inactive`);
  }
}

/**
 * Track cards that were marked inactive for notification
 */
const inactivatedCardIds: string[] = [];

// MyCard network mapping
// Source: Citi-to-MyCard migration documentation (Nov 2025)
// MyCard is issued by NAB. Most cards are on Mastercard network.
const MYCARD_NETWORK_MAP: Record<string, string> = {
  'simplicity': 'Mastercard',
  'clear': 'Mastercard',
  'rewards': 'Mastercard',
  'premier': 'Mastercard',
  'premier qantas': 'Mastercard',
  'prestige': 'Mastercard',
  'prestige qantas': 'Mastercard',
};

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
  scrape_url: string;
  notes: string | null;
  scrape_source: string;
  last_scraped_at: string;
  is_active: boolean;
  raw_data: any;
}

/**
 * Determines card network using MyCard network mapping
 */
function determineNetwork(cardName: string, bank: string): string | null {
  // For MyCard products, use mapping table
  if (bank.toLowerCase().includes('mycard')) {
    const nameLower = cardName.toLowerCase();
    // Try exact matches and partial matches
    for (const [key, network] of Object.entries(MYCARD_NETWORK_MAP)) {
      if (nameLower.includes(key)) {
        return network;
      }
    }
  }

  // Fallback: Check for network keywords in card name (less reliable)
  const nameLower = cardName.toLowerCase();
  if (nameLower.includes('visa')) return 'Visa';
  if (nameLower.includes('mastercard')) return 'Mastercard';
  if (nameLower.includes('amex')) return 'Amex';

  // TODO: If network still not found, consider scraping issuing bank's website
  // For MyCard -> check NAB website
  // For other cards -> check corresponding bank website

  return null;
}

/**
 * Validates that card has required fields populated
 */
function validateCard(card: ScrapedCard): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // CRITICAL: Network must be present
  if (!card.network) {
    warnings.push(`❌ CRITICAL: Missing network for ${card.bank} ${card.name}`);
    return { valid: false, warnings };
  }

  // IMPORTANT: These fields should be present
  if (!card.annual_fee && card.annual_fee !== 0) {
    warnings.push(`⚠️  Missing annual_fee for ${card.bank} ${card.name}`);
  }
  if (!card.welcome_bonus_points) {
    warnings.push(`⚠️  Missing welcome_bonus_points for ${card.bank} ${card.name}`);
  }
  if (!card.earn_rate_primary) {
    warnings.push(`⚠️  Missing earn_rate_primary for ${card.bank} ${card.name}`);
  }

  return { valid: true, warnings };
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

          // Strategy 1: Try to find card name from h3 tag
          let name = '';
          const nameEl = container.querySelector('h3');
          if (nameEl?.textContent?.trim()) {
            name = nameEl.textContent.trim();
          }

          // Strategy 2: Extract from "Explore [Card Name]" link
          if (!name) {
            const exploreLink = container.querySelector('a[href*="/credit-cards/"]');
            if (exploreLink?.textContent) {
              const exploreLinkText = exploreLink.textContent.trim();
              const exploreMatch = exploreLinkText.match(/Explore\s+(.+)/i);
              if (exploreMatch) {
                name = exploreMatch[1].trim();
              }
            }
          }

          // Strategy 3: Extract from URL path (e.g., /credit-cards/simplicity-card → Simplicity Card)
          let cardUrl = '';
          const linkEl = container.querySelector('a[href*="/credit-cards/"]');
          if (linkEl) {
            const href = linkEl.getAttribute('href') || '';
            cardUrl = href;

            // Extract name from URL if we don't have one
            if (!name) {
              const urlMatch = href.match(/\/credit-cards\/([^/?]+)/);
              if (urlMatch) {
                // Convert slug to title case: "simplicity-card" → "Simplicity Card"
                name = urlMatch[1]
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
              }
            }
          }

          // Strategy 4: Extract from image alt text or filename
          if (!name) {
            const imgEl = container.querySelector('img');
            if (imgEl) {
              const alt = imgEl.getAttribute('alt');
              const src = imgEl.getAttribute('src') || '';

              if (alt && alt.trim()) {
                name = alt.trim();
              } else {
                // Extract from image filename: "simplicity_card_art.png" → "Simplicity Card Art"
                const imgMatch = src.match(/\/([^/]+)_card_art\./i);
                if (imgMatch) {
                  name = imgMatch[1]
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                }
              }
            }
          }

          // Fallback if all strategies failed
          if (!name || name.length < 3) {
            name = `MyCard ${index + 1}`;
          }

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

          // Normalize URL to full URL
          if (cardUrl && !cardUrl.startsWith('http')) {
            cardUrl = cardUrl.startsWith('/')
              ? `https://www.mycard.com.au${cardUrl}`
              : `https://www.mycard.com.au/${cardUrl}`;
          }

          results.push({
            name,
            bank,
            annualFee,
            bonusPoints,
            spendReq,
            earnRate,
            link: cardUrl || null,
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

      // Generate a unique scrape_url - use the card URL or generate one from bank+name
      const scrapeUrl = card.link ||
        `https://www.mycard.com.au/credit-cards/${card.bank.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      const scrapedCard: ScrapedCard = {
        bank: card.bank,
        name: card.name,
        network: determineNetwork(card.name, card.bank),
        annual_fee: card.annualFee,
        welcome_bonus_points: card.bonusPoints,
        bonus_spend_requirement: card.spendReq,
        bonus_spend_currency: 'AUD',
        points_currency: null, // Will need to determine from bank/card type
        earn_rate_primary: card.earnRate,
        application_link: card.link,
        scrape_url: scrapeUrl,
        notes: null,
        scrape_source: 'mycard',
        last_scraped_at: new Date().toISOString(),
        is_active: true,
        raw_data: card
      };

      // Validate card before adding
      const validation = validateCard(scrapedCard);
      if (!validation.valid) {
        // Skip cards without network - this is CRITICAL
        validation.warnings.forEach(w => console.log(w));
        console.log(`⏭️  Skipping card due to missing network\n`);
        continue;
      }

      // Log warnings but still add card
      validation.warnings.forEach(w => console.log(w));

      cards.push(scrapedCard);
      console.log(`✅ ${scrapedCard.bank} ${scrapedCard.name}`);
      console.log(`   🌐 Network: ${scrapedCard.network}`);
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

  // Get all scrape URLs we found in this scrape
  const scrapedUrls = new Set(cards.map(c => c.scrape_url));

  // Mark cards as inactive if they weren't found in this scrape
  // Only affects cards from the same scrape source (mycard)
  console.log('🔍 Checking for cards that are no longer available...\n');

  const { data: existingCards, error: fetchError } = await supabase
    .from('cards')
    .select('id, bank, name, scrape_url, is_active')
    .eq('scrape_source', 'mycard')
    .eq('is_active', true);

  if (fetchError) {
    console.error('⚠️  Error fetching existing cards:', fetchError.message);
  } else if (existingCards) {
    const cardsNotFound = existingCards.filter(
      card => card.scrape_url && !scrapedUrls.has(card.scrape_url)
    );

    if (cardsNotFound.length > 0) {
      console.log(`⚠️  Found ${cardsNotFound.length} card(s) not in main listing - verifying...\n`);

      // Verify each card by visiting its page
      for (const card of cardsNotFound) {
        console.log(`   🔍 Checking: ${card.bank} ${card.name}`);
        console.log(`      URL: ${card.scrape_url}`);

        // Get full card details with application_link
        const { data: fullCard } = await supabase
          .from('cards')
          .select('id, bank, name, scrape_url, application_link')
          .eq('id', card.id)
          .single();

        const urlToCheck = fullCard?.application_link || card.scrape_url;

        if (!urlToCheck) {
          console.log(`      ⚠️  No URL to check, marking as inactive`);
          await markCardInactive(supabase, card.id);
          continue;
        }

        const stillExists = await verifyCardExists(urlToCheck);

        if (!stillExists) {
          console.log(`      ❌ Card page not found or unavailable`);
          await markCardInactive(supabase, card.id);
          inactivatedCardIds.push(card.id); // Track for notifications
        } else {
          console.log(`      ✅ Card still exists (not in main listing but page accessible)`);
          // Keep as active - might be a featured/special card not in main list
        }

        console.log();
        await delay(1000); // Rate limiting between page checks
      }
    } else {
      console.log('✅ All existing MyCard cards still in main listing\n');
    }
  }

  console.log('💾 Upserting scraped cards...\n');

  for (const card of cards) {
    try {
      // Upsert card (update if exists, insert if new)
      // Using scrape_source + scrape_url as unique identifier
      const { error, data } = await supabase
        .from('cards')
        .upsert(card, {
          onConflict: 'scrape_source,scrape_url',
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

    // Notify users if any cards became unavailable
    if (inactivatedCardIds.length > 0) {
      console.log(`\n📢 ${inactivatedCardIds.length} card(s) became unavailable - notifying affected users...\n`);

      // Import and run notification script for each card
      const { execSync } = await import('child_process');

      for (const cardId of inactivatedCardIds) {
        try {
          console.log(`   Checking for affected users of card ${cardId}...`);
          execSync(
            `pnpm tsx scripts/notify-unavailable-card-users.ts ${cardId}`,
            { stdio: 'inherit', cwd: process.cwd() }
          );
        } catch (error) {
          console.error(`   ⚠️  Error notifying users for card ${cardId}:`, error);
          // Continue with other cards even if one fails
        }
      }
    }

    console.log('🎉 Scraping complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
