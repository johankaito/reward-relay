#!/usr/bin/env tsx
/**
 * Database Cleanup Script: Fix Missing Application Links
 * Sets application_link to scrape_url for cards missing application links
 */

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

async function fixMissingApplicationLinks() {
  console.log('\n🔧 Starting application link cleanup...\n');

  // Get all cards with NULL or empty application_link
  const { data: cardsToFix, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .or('application_link.is.null,application_link.eq.');

  if (fetchError) {
    console.error('❌ Error fetching cards:', fetchError);
    process.exit(1);
  }

  console.log(`📊 Found ${cardsToFix?.length || 0} cards with missing application_link\n`);

  if (!cardsToFix || cardsToFix.length === 0) {
    console.log('✅ No cards need fixing!');
    process.exit(0);
  }

  let fixed = 0;
  let couldNotFix = 0;

  for (const card of cardsToFix) {
    // Use scrape_url if it's valid (not from unknown-source.com)
    if (card.scrape_url && !card.scrape_url.includes('unknown-source.com')) {
      console.log(`🔧 Fixing: ${card.bank} ${card.name}`);
      console.log(`   Setting application_link to: ${card.scrape_url}`);

      const { error: updateError } = await supabase
        .from('cards')
        .update({ application_link: card.scrape_url })
        .eq('id', card.id);

      if (updateError) {
        console.error(`❌ Error updating ${card.bank} ${card.name}:`, updateError.message);
        couldNotFix++;
      } else {
        fixed++;
      }
    } else {
      console.log(`⚠️  Could not fix: ${card.bank} ${card.name}`);
      console.log(`   scrape_url: ${card.scrape_url || 'NULL'}`);
      console.log(`   Note: No valid URL available\n`);
      couldNotFix++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixed} cards`);
  console.log(`   ⚠️  Could not fix: ${couldNotFix} cards`);
  console.log(`   📈 Success rate: ${((fixed / cardsToFix.length) * 100).toFixed(1)}%\n`);

  if (couldNotFix > 0) {
    console.log('⚠️  Some cards still need manual research.');
    console.log('   These cards have unknown-source.com URLs and need proper links.\n');
  }
}

fixMissingApplicationLinks().catch(console.error);
