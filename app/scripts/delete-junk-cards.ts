#!/usr/bin/env tsx
/**
 * Database Cleanup Script: Delete Junk Cards
 * Removes cards with NULL network that couldn't be fixed
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

async function deleteJunkCards() {
  console.log('\n🗑️  Starting junk card deletion...\n');

  // Get all cards with NULL network
  const { data: cardsToDelete, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .or('network.is.null,network.eq.');

  if (fetchError) {
    console.error('❌ Error fetching cards:', fetchError);
    process.exit(1);
  }

  console.log(`📊 Found ${cardsToDelete?.length || 0} cards with missing network\n`);

  if (!cardsToDelete || cardsToDelete.length === 0) {
    console.log('✅ No cards to delete!');
    process.exit(0);
  }

  // Show what will be deleted
  console.log('Cards to be deleted:');
  cardsToDelete.forEach((card, index) => {
    console.log(`  ${index + 1}. ${card.bank} ${card.name}`);
    console.log(`     URL: ${card.scrape_url || card.application_link}`);
  });

  console.log(`\n⚠️  About to delete ${cardsToDelete.length} cards`);
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🗑️  Deleting cards...\n');

  let deleted = 0;
  let errors = 0;

  for (const card of cardsToDelete) {
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
  console.log(`   ✅ Deleted: ${deleted} cards`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📈 Success rate: ${((deleted / cardsToDelete.length) * 100).toFixed(1)}%\n`);
}

deleteJunkCards().catch(console.error);
