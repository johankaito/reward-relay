#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkMissingLinks() {
  console.log('🔍 Checking for cards with missing application links...\n');

  // Get all cards
  const { data: allCards, error } = await supabase
    .from('cards')
    .select('*')
    .order('bank', { ascending: true });

  if (error) {
    console.error('Error fetching cards:', error);
    process.exit(1);
  }

  console.log(`📊 Total cards: ${allCards?.length || 0}\n`);

  // Check for missing application_link
  const missingLinks = allCards?.filter(c => !c.application_link || c.application_link.trim() === '') || [];

  console.log(`❌ Cards missing application_link: ${missingLinks.length}\n`);

  if (missingLinks.length > 0) {
    console.log('Cards without application links:');
    missingLinks.forEach(card => {
      console.log(`\n  ${card.bank} - ${card.name}`);
      console.log(`    ID: ${card.id}`);
      console.log(`    Network: ${card.network}`);
      console.log(`    scrape_url: ${card.scrape_url}`);
      console.log(`    application_link: ${card.application_link || 'NULL'}`);
    });
  }

  // Group by bank
  const byBank = new Map<string, number>();
  missingLinks.forEach(card => {
    const count = byBank.get(card.bank) || 0;
    byBank.set(card.bank, count + 1);
  });

  console.log('\n📊 Missing links by bank:');
  Array.from(byBank.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([bank, count]) => {
      console.log(`  ${bank}: ${count} cards`);
    });

  // Check if scrape_url could be used as fallback
  const couldUseScrapeUrl = missingLinks.filter(c =>
    c.scrape_url &&
    !c.scrape_url.includes('unknown-source.com')
  );

  console.log(`\n💡 Cards that could use scrape_url as fallback: ${couldUseScrapeUrl.length}`);
}

checkMissingLinks().catch(console.error);
