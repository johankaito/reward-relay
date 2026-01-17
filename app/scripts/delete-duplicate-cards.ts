#!/usr/bin/env tsx
/**
 * Database Cleanup Script: Delete Duplicate Cards
 * Removes cards with unknown-source.com URLs when we have better versions
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

async function deleteDuplicateCards() {
  console.log('\n🗑️  Starting duplicate card deletion...\n');

  // Get all cards with unknown-source.com URLs
  const { data: duplicates, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .like('scrape_url', '%unknown-source.com%');

  if (fetchError) {
    console.error('❌ Error fetching cards:', fetchError);
    process.exit(1);
  }

  console.log(`📊 Found ${duplicates?.length || 0} cards with unknown-source.com URLs\n`);

  if (!duplicates || duplicates.length === 0) {
    console.log('✅ No duplicate cards to delete!');
    process.exit(0);
  }

  // Show what will be deleted
  console.log('Duplicate cards to be deleted:');
  duplicates.forEach((card, index) => {
    console.log(`  ${index + 1}. ${card.bank} ${card.name}`);
    console.log(`     scrape_url: ${card.scrape_url}`);
  });

  console.log(`\n⚠️  About to delete ${duplicates.length} duplicate cards`);
  console.log('Press Ctrl+C within 3 seconds to cancel...\n');

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🗑️  Deleting duplicate cards...\n');

  let deleted = 0;
  let errors = 0;

  for (const card of duplicates) {
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', card.id);

    if (deleteError) {
      console.error(`❌ Error deleting ${card.bank} ${card.name}:`, deleteError.message);
      errors++;
    } else {
      console.log(`✅ Deleted: ${card.bank} ${card.name}`);
      deleted++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Deleted: ${deleted} duplicate cards`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📈 Success rate: ${((deleted / duplicates.length) * 100).toFixed(1)}%\n`);
}

deleteDuplicateCards().catch(console.error);
