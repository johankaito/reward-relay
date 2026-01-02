#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envFile
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [key, ...valueParts] = line.split('=');
      return [key, valueParts.join('=')];
    })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'john.g.keto+rewardrelay-test@gmail.com';
const TEST_PASSWORD = 'TestPass123!';

async function cleanTestData() {
  console.log('🧹 Cleaning old test data...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Login as test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (authError || !authData.user) {
    console.error('❌ Failed to login:', authError?.message);
    return;
  }

  console.log(`✅ Logged in as ${TEST_EMAIL}\n`);

  // Get all user cards
  const { data: cards, error: fetchError } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', authData.user.id);

  if (fetchError) {
    console.error('❌ Failed to fetch cards:', fetchError.message);
    return;
  }

  console.log(`Found ${cards?.length || 0} cards in database\n`);

  // Delete cards with test notes
  const testCards = cards?.filter(card =>
    card.notes?.includes('Test card added via comprehensive automated test') ||
    card.notes?.includes('test') ||
    card.notes?.includes('Test')
  ) || [];

  console.log(`Found ${testCards.length} test cards to delete:`);
  testCards.forEach(card => {
    console.log(`  - ${card.bank} ${card.name} (${card.application_date})`);
  });
  console.log();

  if (testCards.length === 0) {
    console.log('✅ No test cards to delete');
    return;
  }

  // Delete them
  const { error: deleteError } = await supabase
    .from('user_cards')
    .delete()
    .in('id', testCards.map(c => c.id));

  if (deleteError) {
    console.error('❌ Failed to delete cards:', deleteError.message);
    return;
  }

  console.log(`✅ Deleted ${testCards.length} test cards\n`);

  // Show remaining cards
  const { data: remaining } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', authData.user.id);

  console.log(`Remaining cards: ${remaining?.length || 0}`);
  if (remaining && remaining.length > 0) {
    remaining.forEach(card => {
      console.log(`  - ${card.bank} ${card.name} (${card.application_date})`);
    });
  }
}

cleanTestData().catch(console.error);
