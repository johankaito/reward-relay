#!/usr/bin/env tsx
/**
 * Database Cleanup Script: Fix Missing Networks
 * Applies network mapping to cards with NULL network field
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

// MyCard network mapping (same as in scraper)
const MYCARD_NETWORK_MAP: Record<string, string> = {
  'simplicity': 'Mastercard',
  'clear': 'Mastercard',
  'rewards': 'Mastercard',
  'premier': 'Mastercard',
  'premier qantas': 'Mastercard',
  'prestige': 'Mastercard',
  'prestige qantas': 'Mastercard',
};

/**
 * Determines card network using MyCard network mapping
 */
function determineNetwork(cardName: string, bank: string): string | null {
  // For MyCard products, use mapping table
  if (bank.toLowerCase().includes('mycard')) {
    const nameLower = cardName.toLowerCase();
    for (const [key, network] of Object.entries(MYCARD_NETWORK_MAP)) {
      if (nameLower.includes(key)) {
        return network;
      }
    }
  }

  // Fallback: Check for network keywords in card name
  const nameLower = cardName.toLowerCase();
  if (nameLower.includes('visa')) return 'Visa';
  if (nameLower.includes('mastercard')) return 'Mastercard';
  if (nameLower.includes('amex')) return 'Amex';

  return null;
}

async function fixMissingNetworks() {
  console.log('\n🔧 Starting network field cleanup...\n');

  // Get all cards with NULL network
  const { data: cardsWithoutNetwork, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .or('network.is.null,network.eq.');

  if (fetchError) {
    console.error('❌ Error fetching cards:', fetchError);
    process.exit(1);
  }

  console.log(`📊 Found ${cardsWithoutNetwork?.length || 0} cards with missing network\n`);

  if (!cardsWithoutNetwork || cardsWithoutNetwork.length === 0) {
    console.log('✅ No cards need fixing!');
    process.exit(0);
  }

  let fixed = 0;
  let couldNotFix = 0;

  for (const card of cardsWithoutNetwork) {
    const network = determineNetwork(card.name, card.bank);

    if (network) {
      console.log(`🔧 Fixing: ${card.bank} ${card.name} → ${network}`);

      const { error: updateError } = await supabase
        .from('cards')
        .update({ network })
        .eq('id', card.id);

      if (updateError) {
        console.error(`❌ Error updating ${card.bank} ${card.name}:`, updateError.message);
        couldNotFix++;
      } else {
        fixed++;
      }
    } else {
      console.log(`⚠️  Could not determine network for: ${card.bank} ${card.name}`);
      console.log(`   URL: ${card.scrape_url || card.application_link}`);
      console.log(`   Note: Manual research required for this card\n`);
      couldNotFix++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Fixed: ${fixed} cards`);
  console.log(`   ⚠️  Could not fix: ${couldNotFix} cards`);
  console.log(`   📈 Success rate: ${((fixed / cardsWithoutNetwork.length) * 100).toFixed(1)}%\n`);

  if (couldNotFix > 0) {
    console.log('⚠️  Some cards still need manual research.');
    console.log('   Check the issuing bank websites or product documentation.\n');
  }
}

fixMissingNetworks().catch(console.error);
