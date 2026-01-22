#!/usr/bin/env tsx
/**
 * Revert cards that were recently marked as inactive
 * Use this if the scraper had false positives
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function revertRecent() {
  // Find cards marked inactive in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: recentlyInactive, error } = await supabase
    .from('cards')
    .select('id, bank, name, updated_at')
    .eq('is_active', false)
    .gte('updated_at', oneHourAgo)
    .order('updated_at', { ascending: false })

  if (error || !recentlyInactive) {
    console.error('Error fetching cards:', error)
    return
  }

  console.log(`Found ${recentlyInactive.length} cards marked inactive in last hour:`)
  recentlyInactive.forEach(card => {
    console.log(`  - ${card.bank} ${card.name}`)
  })

  console.log(`\n⚠️  This will revert them back to active.`)
  console.log(`Run this script with REVERT=true to proceed`)

  if (process.env.REVERT !== 'true') {
    return
  }

  // Revert
  const cardIds = recentlyInactive.map(c => c.id)

  const { error: updateError } = await supabase
    .from('cards')
    .update({ is_active: true })
    .in('id', cardIds)

  if (updateError) {
    console.error('Error reverting:', updateError)
  } else {
    console.log(`\n✅ Reverted ${cardIds.length} cards back to active`)
  }
}

revertRecent()
