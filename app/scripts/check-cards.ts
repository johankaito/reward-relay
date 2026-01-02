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

async function checkCards() {
  console.log('🔍 Checking what cards are in database...\n');

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

  console.log(`✅ Logged in as ${TEST_EMAIL}`);
  console.log(`User ID: ${authData.user.id}\n`);

  // Get all user cards WITHOUT JOIN to see raw data
  const { data: rawCards, error: fetchError } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', authData.user.id);

  if (fetchError) {
    console.error('❌ Failed to fetch cards:', fetchError.message);
    return;
  }

  console.log(`Found ${rawCards?.length || 0} cards in user_cards table:\n`);

  if (rawCards && rawCards.length > 0) {
    rawCards.forEach((card, i) => {
      console.log(`Card ${i + 1}:`);
      console.log(`  ID: ${card.id}`);
      console.log(`  card_id: ${card.card_id}`);
      console.log(`  bank: ${card.bank}`);
      console.log(`  name: ${card.name}`);
      console.log(`  status: ${card.status}`);
      console.log(`  application_date: ${card.application_date}`);
      console.log(`  cancellation_date: ${card.cancellation_date}`);
      console.log(`  notes: ${card.notes}`);
      console.log('');
    });
  }

  // Now try the same query the Calendar page uses
  console.log('Testing Calendar page query with JOIN...\n');
  const { data: joinedCards, error: joinError } = await supabase
    .from('user_cards')
    .select(`
      *,
      card:cards(*)
    `)
    .eq('user_id', authData.user.id)
    .order('application_date', { ascending: false });

  if (joinError) {
    console.error('❌ JOIN query failed:', joinError.message);
    return;
  }

  console.log(`JOIN query returned ${joinedCards?.length || 0} cards\n`);

  if (joinedCards && joinedCards.length > 0) {
    joinedCards.forEach((card, i) => {
      console.log(`Joined Card ${i + 1}:`);
      console.log(`  user_cards.bank: ${card.bank}`);
      console.log(`  user_cards.name: ${card.name}`);
      console.log(`  cards table data: ${card.card ? JSON.stringify(card.card) : 'NULL (card_id was null or invalid)'}`);
      console.log('');
    });
  }
}

checkCards().catch(console.error);
