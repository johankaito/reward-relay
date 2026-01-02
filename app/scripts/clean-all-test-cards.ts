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

async function cleanAllTestCards() {
  console.log('🧹 Cleaning ALL test cards...\n');

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

  // Get ALL user cards
  const { data: cards, error: fetchError } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', authData.user.id);

  if (fetchError) {
    console.error('❌ Failed to fetch cards:', fetchError.message);
    return;
  }

  console.log(`Found ${cards?.length || 0} cards total\n`);

  if (!cards || cards.length === 0) {
    console.log('✅ No cards to delete');
    return;
  }

  // Delete ALL cards for clean slate
  console.log(`Deleting ALL ${cards.length} cards:`);
  cards.forEach(card => {
    console.log(`  - ${card.bank} ${card.name} (${card.application_date || 'no date'})`);
  });
  console.log();

  const { error: deleteError } = await supabase
    .from('user_cards')
    .delete()
    .in('id', cards.map(c => c.id));

  if (deleteError) {
    console.error('❌ Failed to delete cards:', deleteError.message);
    return;
  }

  console.log(`✅ Deleted ${cards.length} cards\n`);
  console.log('Database is now clean and ready for final test!');
}

cleanAllTestCards().catch(console.error);
