#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function listInactive() {
  const { data: inactive, error } = await supabase
    .from('cards')
    .select('id, bank, name, application_link')
    .eq('is_active', false)
    .order('bank', { ascending: true })
    .order('name', { ascending: true })

  if (error || !inactive) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${inactive.length} inactive cards:\n`)

  // Group by bank
  const byBank = inactive.reduce((acc, card) => {
    if (!acc[card.bank]) acc[card.bank] = []
    acc[card.bank].push(card)
    return acc
  }, {} as Record<string, typeof inactive>)

  for (const [bank, cards] of Object.entries(byBank)) {
    console.log(`${bank} (${cards.length} cards):`)
    cards.forEach(card => {
      console.log(`  - ${card.name}`)
      if (card.application_link) {
        console.log(`    ${card.application_link}`)
      }
    })
    console.log()
  }
}

listInactive()
