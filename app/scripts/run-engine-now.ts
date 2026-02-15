#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import { getRecommendations, calculateBankEligibility } from '../src/lib/recommendations'
import type { Database } from '../src/types/database.types'

type UserCard = Database['public']['Tables']['user_cards']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Your exact portfolio with correct dates
const yourPortfolio: Partial<UserCard>[] = [
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

async function runEngine() {
  console.log('🎯 RUNNING RECOMMENDATION ENGINE\n')
  console.log('Goal: Maximum Qantas Points\n')

  // Get catalog from database
  const supabase = createClient<Database>(supabaseUrl, supabaseKey)
  const { data: catalogCards } = await supabase
    .from('cards')
    .select('*')
    .order('welcome_bonus_points', { ascending: false })

  if (!catalogCards) {
    console.error('❌ Could not load catalog')
    return
  }

  console.log(`✅ Loaded ${catalogCards.length} cards from catalog\n`)

  // Calculate bank eligibility
  const eligibility = calculateBankEligibility(yourPortfolio as UserCard[])

  console.log('═══════════════════════════════════════════════════════════')
  console.log('🏦 BANK ELIGIBILITY')
  console.log('═══════════════════════════════════════════════════════════\n')

  eligibility.forEach(e => {
    const daysUntil = Math.ceil((e.eligibleAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const status = e.eligible ? '✅ ELIGIBLE NOW' : `⏳ ${daysUntil} days`
    console.log(`${e.bank}: ${status}`)
  })

  // Get recommendations with Qantas-only filter
  const recommendations = getRecommendations(
    yourPortfolio as UserCard[],
    catalogCards,
    {
      limit: 10,
      pointsCurrency: 'Qantas', // FILTER: Only Qantas points cards
      includeFirstCardOnly: true // Include first-time-only cards for now
    }
  )

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('🎯 ENGINE RECOMMENDATIONS (Top 10 for Qantas Points)')
  console.log('═══════════════════════════════════════════════════════════\n')

  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec.card.card_name} (${rec.card.bank})`)
    console.log(`   ${rec.eligibleNow ? '✅ ELIGIBLE NOW' : '⏳ ' + rec.reason}`)
    console.log(`   Score: ${rec.score.toFixed(2)}`)
    console.log(`   Bonus: ${rec.card.welcome_bonus_points?.toLocaleString()} points`)
    console.log(`   Spend: $${rec.card.bonus_spend_requirement?.toLocaleString()} in ${rec.card.bonus_timeframe_months} months`)
    console.log(`   Annual Fee: $${rec.card.annual_fee}`)
    console.log(`   Network: ${rec.card.network}`)
    if (rec.card.welcome_bonus_points && rec.card.bonus_spend_requirement) {
      console.log(`   Points/Dollar: ${(rec.card.welcome_bonus_points / rec.card.bonus_spend_requirement).toFixed(2)}`)
    }
    console.log(`   Link: ${rec.card.application_link}`)
    console.log()
  })
}

runEngine().catch(console.error)
