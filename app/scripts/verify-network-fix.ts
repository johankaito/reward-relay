#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function verify() {
  console.log('🔍 Verifying network field updates...\n');

  // Check specific cards that should have been fixed
  const cardsToCheck = [
    'MyCard Simplicity',
    'MyCard Clear',
    'MyCard Rewards',
    'MyCard Premier',
    'MyCard Prestige',
    'MyCard Premier Qantas',
    'MyCard Prestige Qantas'
  ];

  for (const name of cardsToCheck) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, bank, name, network')
      .ilike('name', `%${name}%`)
      .limit(3);

    if (error) {
      console.error(`Error fetching ${name}:`, error);
      continue;
    }

    console.log(`\n${name}:`);
    data?.forEach(card => {
      const status = card.network ? '✅' : '❌';
      console.log(`  ${status} ${card.bank} ${card.name} → ${card.network || 'NULL'}`);
    });
  }

  // Overall stats
  const { data: allCards } = await supabase
    .from('cards')
    .select('network');

  const withNetwork = allCards?.filter(c => c.network).length || 0;
  const total = allCards?.length || 0;

  console.log(`\n📊 Overall:`);
  console.log(`   Total cards: ${total}`);
  console.log(`   With network: ${withNetwork}`);
  console.log(`   Missing network: ${total - withNetwork}`);
}

verify().catch(console.error);
