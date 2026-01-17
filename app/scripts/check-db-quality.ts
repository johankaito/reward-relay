#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkDatabaseQuality() {
  console.log('🔍 Checking database quality...\n');

  // Get all cards
  const { data: allCards, error: allError } = await supabase
    .from('cards')
    .select('*')
    .order('bank', { ascending: true });

  if (allError) {
    console.error('Error fetching cards:', allError);
    process.exit(1);
  }

  console.log(`📊 Total cards in database: ${allCards?.length || 0}\n`);

  // Check for duplicates by (bank, name)
  const bankNamePairs = new Map<string, any[]>();
  allCards?.forEach(card => {
    const key = `${card.bank}|||${card.name}`;
    if (!bankNamePairs.has(key)) {
      bankNamePairs.set(key, []);
    }
    bankNamePairs.get(key)!.push(card);
  });

  const duplicates = Array.from(bankNamePairs.entries())
    .filter(([_, cards]) => cards.length > 1);

  console.log(`🔁 Duplicates by (bank, name): ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('\nDuplicate cards:');
    duplicates.forEach(([key, cards]) => {
      const [bank, name] = key.split('|||');
      console.log(`  - ${bank} ${name}: ${cards.length} copies`);
      cards.forEach(card => {
        console.log(`    ID: ${card.id}, scrape_url: ${card.scrape_url}`);
      });
    });
  }
  console.log('');

  // Check for duplicates by (scrape_source, scrape_url) - current unique constraint
  const sourceUrlPairs = new Map<string, any[]>();
  allCards?.forEach(card => {
    const key = `${card.scrape_source}|||${card.scrape_url}`;
    if (!sourceUrlPairs.has(key)) {
      sourceUrlPairs.set(key, []);
    }
    sourceUrlPairs.get(key)!.push(card);
  });

  const sourceUrlDupes = Array.from(sourceUrlPairs.entries())
    .filter(([_, cards]) => cards.length > 1);

  console.log(`🔁 Duplicates by (scrape_source, scrape_url): ${sourceUrlDupes.length}`);
  if (sourceUrlDupes.length > 0) {
    console.log('\nDuplicate cards by unique constraint:');
    sourceUrlDupes.forEach(([key, cards]) => {
      const [source, url] = key.split('|||');
      console.log(`  - ${source} ${url}: ${cards.length} copies`);
    });
  }
  console.log('');

  // Check for missing networks
  const { data: missingNetwork, error: networkError } = await supabase
    .from('cards')
    .select('id, bank, name, network, scrape_url')
    .or('network.is.null,network.eq.');

  console.log(`❌ Cards missing network: ${missingNetwork?.length || 0}`);
  if (missingNetwork && missingNetwork.length > 0) {
    console.log('\nCards without network:');
    missingNetwork.forEach(card => {
      console.log(`  - ${card.bank} ${card.name} (ID: ${card.id})`);
      console.log(`    URL: ${card.scrape_url}`);
    });
  }
  console.log('');

  // Network distribution
  const networkCounts = new Map<string, number>();
  allCards?.forEach(card => {
    const network = card.network || 'NULL';
    networkCounts.set(network, (networkCounts.get(network) || 0) + 1);
  });

  console.log('📊 Network distribution:');
  Array.from(networkCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([network, count]) => {
      console.log(`  ${network}: ${count} cards`);
    });
  console.log('');

  // Check for missing other critical fields
  const missingAnnualFee = allCards?.filter(c => c.annual_fee === null).length || 0;
  const missingBonusPoints = allCards?.filter(c => c.welcome_bonus_points === null).length || 0;
  const missingEarnRate = allCards?.filter(c => c.earn_rate_primary === null).length || 0;

  console.log('⚠️  Missing field statistics:');
  console.log(`  Annual fee: ${missingAnnualFee} cards`);
  console.log(`  Bonus points: ${missingBonusPoints} cards`);
  console.log(`  Earn rate: ${missingEarnRate} cards`);
}

checkDatabaseQuality().catch(console.error);
