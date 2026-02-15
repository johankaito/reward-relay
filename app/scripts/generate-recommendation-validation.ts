#!/usr/bin/env tsx
/**
 * Generate Recommendation Validation Report
 *
 * This script extracts your current card portfolio from production,
 * runs the recommendation engine, and generates a report for you to
 * compare against your own manual research.
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import type { Database } from '../src/types/database.types'
import { getRecommendations, calculateBankEligibility } from '../src/lib/recommendations'

type UserCard = Database['public']['Tables']['user_cards']['Row']
type Card = Database['public']['Tables']['cards']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function generateValidationReport() {
  console.log('🎯 Generating Recommendation Engine Validation Report\n')

  // Get your user ID from auth.users (using email)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError || !authData) {
    console.error('❌ Could not list users')
    console.error(authError)
    process.exit(1)
  }

  const user = authData.users.find(u => u.email === 'john.g.keto@gmail.com')

  if (!user) {
    console.error('❌ Could not find user with email john.g.keto@gmail.com')
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.email}`)
  const userId = user.id

  // Get your current card portfolio
  const { data: userCards, error: cardsError } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', userId)
    .order('application_date', { ascending: false })

  if (cardsError) {
    console.error('❌ Could not load user cards')
    console.error(cardsError)
    process.exit(1)
  }

  console.log(`✅ Loaded ${userCards?.length || 0} cards from portfolio\n`)

  // Get catalog cards
  const { data: catalogCards, error: catalogError } = await supabase
    .from('cards')
    .select('*')
    .order('welcome_bonus_points', { ascending: false })

  if (catalogError) {
    console.error('❌ Could not load card catalog')
    console.error(catalogError)
    process.exit(1)
  }

  console.log(`✅ Loaded ${catalogCards?.length || 0} cards from catalog\n`)

  // Calculate bank eligibility
  const eligibility = calculateBankEligibility(userCards || [])

  // Get recommendations from engine
  const recommendations = getRecommendations(userCards || [], catalogCards || [], { limit: 10 })

  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    userProfile: {
      email: user.email,
      totalCards: userCards?.length || 0,
      activeCards: userCards?.filter(c => c.status === 'active').length || 0,
      cancelledCards: userCards?.filter(c => c.status === 'cancelled').length || 0,
    },
    currentPortfolio: userCards?.map(card => ({
      cardName: card.card_name,
      bank: card.bank,
      status: card.status,
      applicationDate: card.application_date,
      cancellationDate: card.cancellation_date,
    })),
    bankEligibility: eligibility.map(e => ({
      bank: e.bank,
      eligible: e.eligible,
      eligibleAt: e.eligibleAt.toISOString(),
      daysUntilEligible: e.eligible ? 0 : Math.ceil((e.eligibleAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    })),
    engineRecommendations: recommendations.map((rec, index) => ({
      rank: index + 1,
      cardName: rec.card.card_name,
      bank: rec.card.bank,
      network: rec.card.network,
      score: rec.score.toFixed(2),
      eligibleNow: rec.eligibleNow,
      eligibleAt: rec.eligibleAt?.toISOString() || null,
      reason: rec.reason,
      details: {
        welcomeBonusPoints: rec.card.welcome_bonus_points,
        bonusSpendRequirement: rec.card.bonus_spend_requirement,
        bonusTimeframe: rec.card.bonus_timeframe_months,
        annualFee: rec.card.annual_fee,
        pointsPerDollar: rec.card.welcome_bonus_points && rec.card.bonus_spend_requirement
          ? (rec.card.welcome_bonus_points / rec.card.bonus_spend_requirement).toFixed(2)
          : 'N/A',
        netValue: rec.card.welcome_bonus_points && rec.card.annual_fee
          ? (rec.card.welcome_bonus_points * 0.01 - rec.card.annual_fee).toFixed(2)
          : 'N/A',
        applicationLink: rec.card.application_link,
      }
    })),
    metadata: {
      engineLogic: {
        scoringFactors: [
          'Points per dollar on welcome bonus (10x weight)',
          'Net value (bonus value - annual fee, normalized)',
          'Bank eligibility (18mo AMEX, 12mo others)',
        ],
        filterCriteria: [
          'Excludes cards user already has active',
          'Excludes inactive/expired cards',
          'Must have welcome bonus',
        ],
        sortingLogic: 'Eligible cards first, then by score descending',
      },
      catalogSize: catalogCards?.length || 0,
      recommendationsGenerated: recommendations.length,
    }
  }

  // Write to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const filename = `/tmp/recommendation-validation-${timestamp}.json`
  writeFileSync(filename, JSON.stringify(report, null, 2))
  console.log(`✅ Report saved to: ${filename}\n`)

  // Print summary to console
  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 YOUR CURRENT PORTFOLIO')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`Total Cards: ${report.userProfile.totalCards}`)
  console.log(`Active: ${report.userProfile.activeCards}`)
  console.log(`Cancelled: ${report.userProfile.cancelledCards}\n`)

  if (userCards && userCards.length > 0) {
    console.log('Your Cards:')
    userCards.forEach(card => {
      console.log(`  • ${card.card_name} (${card.bank}) - ${card.status}`)
      if (card.application_date) {
        console.log(`    Applied: ${card.application_date}`)
      }
      if (card.cancellation_date) {
        console.log(`    Cancelled: ${card.cancellation_date}`)
      }
    })
    console.log()
  }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('🏦 BANK ELIGIBILITY')
  console.log('═══════════════════════════════════════════════════════════')
  eligibility.forEach(e => {
    const status = e.eligible ? '✅ Eligible Now' : `⏳ ${Math.ceil((e.eligibleAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
    console.log(`${e.bank}: ${status}`)
  })
  console.log()

  console.log('═══════════════════════════════════════════════════════════')
  console.log('🎯 ENGINE RECOMMENDATIONS (Top 10)')
  console.log('═══════════════════════════════════════════════════════════')
  recommendations.slice(0, 10).forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.card.card_name} (${rec.card.bank})`)
    console.log(`   Score: ${rec.score.toFixed(2)} | ${rec.eligibleNow ? '✅ Eligible Now' : '⏳ ' + rec.reason}`)
    console.log(`   Network: ${rec.card.network}`)
    console.log(`   Welcome Bonus: ${rec.card.welcome_bonus_points?.toLocaleString()} points`)
    console.log(`   Spend Requirement: $${rec.card.bonus_spend_requirement?.toLocaleString()} in ${rec.card.bonus_timeframe_months} months`)
    console.log(`   Annual Fee: $${rec.card.annual_fee}`)
    if (rec.card.welcome_bonus_points && rec.card.bonus_spend_requirement) {
      const ppd = (rec.card.welcome_bonus_points / rec.card.bonus_spend_requirement).toFixed(2)
      console.log(`   Points/Dollar: ${ppd}`)
    }
    if (rec.card.welcome_bonus_points && rec.card.annual_fee !== null) {
      const netValue = (rec.card.welcome_bonus_points * 0.01 - rec.card.annual_fee).toFixed(2)
      console.log(`   Net Value: $${netValue}`)
    }
    console.log(`   Apply: ${rec.card.application_link}`)
  })

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('📝 NEXT STEPS')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('1. Review the engine recommendations above')
  console.log('2. Conduct your own manual research:')
  console.log('   - Check bank websites for current promotions')
  console.log('   - Review Reddit/OzBargain for bonus offers')
  console.log('   - Consider transfer partner values')
  console.log('   - Factor in your personal preferences')
  console.log('3. Compare your top picks with engine recommendations')
  console.log('4. Document differences and reasoning')
  console.log('5. Score the engine accuracy\n')

  console.log(`Full report saved to: ${filename}`)
}

generateValidationReport().catch(console.error)
