#!/usr/bin/env tsx
/**
 * Mark specific card(s) as inactive
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... pnpm tsx scripts/mark-card-inactive.ts "CommBank" "Platinum Awards"
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

async function markCardInactive() {
  const bankPattern = process.argv[2] || 'CommBank'
  const namePattern = process.argv[3] || 'Platinum Awards'

  console.log(`\n🔍 Searching for cards matching:`)
  console.log(`   Bank: *${bankPattern}*`)
  console.log(`   Name: *${namePattern}*\n`)

  // Find matching cards
  const { data: cards, error: searchError } = await supabase
    .from('cards')
    .select('*')
    .ilike('bank', `%${bankPattern}%`)
    .ilike('name', `%${namePattern}%`)

  if (searchError) {
    console.error('❌ Error searching for cards:', searchError.message)
    process.exit(1)
  }

  if (!cards || cards.length === 0) {
    console.log('❌ No cards found matching criteria')
    process.exit(1)
  }

  console.log(`✅ Found ${cards.length} card(s):\n`)
  cards.forEach((card, index) => {
    console.log(`   ${index + 1}. ${card.bank} ${card.name}`)
    console.log(`      - ID: ${card.id}`)
    console.log(`      - Current status: is_active = ${card.is_active}`)
    console.log(`      - Application link: ${card.application_link || 'N/A'}`)
    console.log(`      - Last scraped: ${card.last_scraped_at || 'Never'}`)
    console.log()
  })

  // Mark as inactive
  console.log(`🔄 Marking ${cards.length} card(s) as inactive...\n`)

  const cardIds = cards.map(c => c.id)
  const { data: updated, error: updateError } = await supabase
    .from('cards')
    .update({ is_active: false })
    .in('id', cardIds)
    .select()

  if (updateError) {
    console.error('❌ Error updating cards:', updateError.message)
    process.exit(1)
  }

  console.log(`✅ Successfully marked ${updated?.length || 0} card(s) as inactive\n`)

  updated?.forEach((card, index) => {
    console.log(`   ${index + 1}. ${card.bank} ${card.name} → is_active = false`)
  })

  console.log('\n✨ Done! These cards will no longer appear in recommendations.\n')
}

markCardInactive().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
