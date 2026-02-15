#!/usr/bin/env tsx
/**
 * Test recommendation engine with John's actual card portfolio
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'
import { getRecommendations, calculateBankEligibility } from '../src/lib/recommendations'

type UserCard = Database['public']['Tables']['user_cards']['Row']
type Card = Database['public']['Tables']['cards']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// John's actual portfolio
const yourCards: Partial<UserCard>[] = [
  {
    card_name: 'AMEX Platinum',
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
    application_date: '2023-01-01',
    cancellation_date: '2024-01-01',
  },
  {
    card_name: 'NAB Card',
    bank: 'NAB',
    status: 'cancelled',
    application_date: '2022-06-01',
    cancellation_date: '2023-06-01',
  },
]

async function testRecommendations() {
  console.log('🎯 Testing Recommendation Engine with Your Portfolio\n')
  console.log('═══════════════════════════════════════════════════════')
  console.log('📊 YOUR CURRENT PORTFOLIO')
  console.log('═══════════════════════════════════════════════════════\n')

  yourCards.forEach((card, i) => {
    console.log(`${i + 1}. ${card.card_name} (${card.bank})`)
    console.log(`   Status: ${card.status}`)
    console.log(`   Applied: ${card.application_date}`)
    if (card.cancellation_date) {
      console.log(`   Cancelled: ${card.cancellation_date}`)
    }
    console.log()
  })

  // Calculate bank eligibility
  console.log('═══════════════════════════════════════════════════════')
  console.log('🏦 BANK ELIGIBILITY (Churning Rules)')
  console.log('═══════════════════════════════════════════════════════\n')

  const eligibility = calculateBankEligibility(yourCards as UserCard[])

  eligibility.forEach(e => {
    const now = new Date()
    const daysUntil = Math.ceil((e.eligibleAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const status = e.eligible
      ? '✅ ELIGIBLE NOW'
      : `⏳ ${daysUntil} days (${e.eligibleAt.toLocaleDateString()})`

    console.log(`${e.bank}: ${status}`)
  })

  console.log('\nNote: AMEX has 18-month rule, others have 12-month rule\n')

  // Get catalog cards from Supabase
  const supabase = createClient<Database>(supabaseUrl, supabaseKey)

  const { data: catalogCards, error } = await supabase
    .from('cards')
    .select('*')
    .order('welcome_bonus_points', { ascending: false })

  if (error || !catalogCards) {
    console.error('❌ Could not load card catalog')
    console.error(error)
    return
  }

  console.log(`✅ Loaded ${catalogCards.length} cards from catalog\n`)

  // Get recommendations
  const recommendations = getRecommendations(
    yourCards as UserCard[],
    catalogCards,
    { limit: 10 }
  )

  console.log('═══════════════════════════════════════════════════════')
  console.log('🎯 ENGINE RECOMMENDATIONS (Top 10)')
  console.log('═══════════════════════════════════════════════════════')
  console.log('Goal: Maximum Qantas Points\n')

  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.card.card_name} (${rec.card.bank})`)
    console.log(`   ${rec.eligibleNow ? '✅ ELIGIBLE NOW' : '⏳ ' + rec.reason}`)
    console.log(`   Engine Score: ${rec.score.toFixed(2)}`)
    console.log(`   Network: ${rec.card.network}`)
    console.log(`   Welcome Bonus: ${rec.card.welcome_bonus_points?.toLocaleString()} points`)
    console.log(`   Spend Required: $${rec.card.bonus_spend_requirement?.toLocaleString()} in ${rec.card.bonus_timeframe_months} months`)
    console.log(`   Annual Fee: $${rec.card.annual_fee}`)

    if (rec.card.welcome_bonus_points && rec.card.bonus_spend_requirement) {
      const ppd = (rec.card.welcome_bonus_points / rec.card.bonus_spend_requirement).toFixed(2)
      console.log(`   Points per Dollar: ${ppd}`)
    }

    if (rec.card.welcome_bonus_points && rec.card.annual_fee !== null) {
      const netValue = (rec.card.welcome_bonus_points * 0.01 - rec.card.annual_fee).toFixed(2)
      console.log(`   Net Value: $${netValue}`)
    }

    console.log(`   Apply: ${rec.card.application_link}`)
  })

  console.log('\n\n═══════════════════════════════════════════════════════')
  console.log('📝 NEXT STEPS FOR VALIDATION')
  console.log('═══════════════════════════════════════════════════════\n')
  console.log('1. Review the engine recommendations above')
  console.log('2. Do your own manual research:')
  console.log('   - Check bank websites for current Qantas promotions')
  console.log('   - Review OzBargain/PointsHacks for elevated offers')
  console.log('   - Check Qantas transfer partner bonuses')
  console.log('   - Consider your actual spending patterns')
  console.log('3. Document YOUR top 3-5 picks with reasoning')
  console.log('4. Compare with engine top 5')
  console.log('5. Score the engine accuracy:\n')
  console.log('   - How many of your picks are in engine top 5?')
  console.log('   - Did engine miss any obvious opportunities?')
  console.log('   - What factors did you consider that engine ignores?')
  console.log('   - Overall: Accurate / Somewhat Accurate / Inaccurate\n')
}

testRecommendations().catch(console.error)
