#!/usr/bin/env tsx
/**
 * Test the Qantas filter with your actual portfolio
 */
import { createClient } from '@supabase/supabase-js'
import { getRecommendations } from '../src/lib/recommendations'
import type { Database } from '../src/types/database.types'

type UserCard = Database['public']['Tables']['user_cards']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Your exact portfolio
const yourPortfolio: Partial<UserCard>[] = [
  {
    card_name: 'AMEX Qantas Ultimate',
    bank: 'American Express',
    status: 'active',
    application_date: '2019-06-01',
    cancellation_date: null,
  },
  {
    card_name: 'MyCard (formerly Citi)',
    bank: 'MyCard',
    status: 'active',
    application_date: '2024-08-22',
    cancellation_date: null,
  },
  {
    card_name: 'ANZ Black',
    bank: 'ANZ',
    status: 'cancelled',
    application_date: '2019-04-01',
    cancellation_date: '2020-04-01',
  },
  {
    card_name: 'NAB Card',
    bank: 'NAB',
    status: 'cancelled',
    application_date: '2024-02-01',
    cancellation_date: '2025-02-01',
  },
]

async function testQantasFilter() {
  console.log('🧪 TESTING QANTAS FILTER\n')

  const supabase = createClient<Database>(supabaseUrl, supabaseKey)

  // Get all cards
  const { data: allCards } = await supabase
    .from('cards')
    .select('*')
    .order('welcome_bonus_points', { ascending: false })

  if (!allCards) {
    console.error('❌ Could not load cards')
    return
  }

  console.log(`✅ Loaded ${allCards.length} total cards\n`)

  // Count cards by points currency
  const qantasCards = allCards.filter(c => c.points_currency === 'Qantas')
  const velocityCards = allCards.filter(c => c.points_currency === 'Velocity')
  const otherCards = allCards.filter(c => c.points_currency !== 'Qantas' && c.points_currency !== 'Velocity')

  console.log('📊 CARD BREAKDOWN BY POINTS TYPE:')
  console.log(`   Qantas: ${qantasCards.length} cards`)
  console.log(`   Velocity: ${velocityCards.length} cards`)
  console.log(`   Other: ${otherCards.length} cards\n`)

  // Test 1: All cards (no filter)
  console.log('═══════════════════════════════════════════════════════════')
  console.log('TEST 1: NO FILTER (should show all point types)')
  console.log('═══════════════════════════════════════════════════════════\n')

  const allRecommendations = getRecommendations(
    yourPortfolio as UserCard[],
    allCards,
    { limit: 10, pointsCurrency: 'all' }
  )

  console.log(`Found ${allRecommendations.length} recommendations:\n`)
  allRecommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.card.name} (${rec.card.bank})`)
    console.log(`   Points Type: ${rec.card.points_currency}`)
    console.log(`   Score: ${rec.score.toFixed(2)} | ${rec.eligibleNow ? '✅ Eligible' : '⏳ ' + rec.reason}`)
    console.log()
  })

  // Test 2: Qantas only
  console.log('═══════════════════════════════════════════════════════════')
  console.log('TEST 2: QANTAS ONLY FILTER')
  console.log('═══════════════════════════════════════════════════════════\n')

  const qantasRecommendations = getRecommendations(
    yourPortfolio as UserCard[],
    allCards,
    { limit: 10, pointsCurrency: 'Qantas' }
  )

  console.log(`Found ${qantasRecommendations.length} Qantas recommendations:\n`)
  qantasRecommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.card.name} (${rec.card.bank})`)
    console.log(`   Points Type: ${rec.card.points_currency} ${rec.card.points_currency === 'Qantas' ? '✅' : '❌ WRONG!'}`)
    console.log(`   Score: ${rec.score.toFixed(2)}`)
    console.log(`   Bonus: ${rec.card.welcome_bonus_points?.toLocaleString()} pts | Fee: $${rec.card.annual_fee}`)
    console.log(`   ${rec.eligibleNow ? '✅ Eligible Now' : '⏳ ' + rec.reason}`)
    console.log()
  })

  // Test 3: Velocity only
  console.log('═══════════════════════════════════════════════════════════')
  console.log('TEST 3: VELOCITY ONLY FILTER')
  console.log('═══════════════════════════════════════════════════════════\n')

  const velocityRecommendations = getRecommendations(
    yourPortfolio as UserCard[],
    allCards,
    { limit: 10, pointsCurrency: 'Velocity' }
  )

  console.log(`Found ${velocityRecommendations.length} Velocity recommendations:\n`)
  velocityRecommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.card.name} (${rec.card.bank})`)
    console.log(`   Points Type: ${rec.card.points_currency} ${rec.card.points_currency === 'Velocity' ? '✅' : '❌ WRONG!'}`)
    console.log(`   Score: ${rec.score.toFixed(2)}`)
    console.log()
  })

  // Validation
  console.log('═══════════════════════════════════════════════════════════')
  console.log('✅ VALIDATION RESULTS')
  console.log('═══════════════════════════════════════════════════════════\n')

  const qantasFilterWorks = qantasRecommendations.every(r => r.card.points_currency === 'Qantas')
  const velocityFilterWorks = velocityRecommendations.every(r => r.card.points_currency === 'Velocity')

  console.log(`Qantas filter: ${qantasFilterWorks ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Velocity filter: ${velocityFilterWorks ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`\nFilter is working: ${qantasFilterWorks && velocityFilterWorks ? '✅ YES' : '❌ NO'}`)
}

testQantasFilter().catch(console.error)
