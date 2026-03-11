#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Diagnose why only 1 of 11 Qantas cards is showing in recommendations
 */
import { createClient } from '@supabase/supabase-js'
import { getRecommendations, calculateBankEligibility } from '../src/lib/recommendations'
import type { Database } from '../src/types/database.types'

type UserCard = Database['public']['Tables']['user_cards']['Row']
type Card = Database['public']['Tables']['cards']['Row']

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// User's portfolio
const yourPortfolio: Partial<UserCard>[] = [
  {
    id: '1' as any,
    card_id: null,
    user_id: 'test' as any,
    card_name: 'Qantas American Express Ultimate Card',
    bank: 'American Express',
    status: 'active',
    application_date: '2019-06-01',
    cancellation_date: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2' as any,
    card_id: null,
    user_id: 'test' as any,
    card_name: 'MyCard',
    bank: 'MyCard',
    status: 'active',
    application_date: '2024-08-22',
    cancellation_date: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3' as any,
    card_id: null,
    user_id: 'test' as any,
    card_name: 'ANZ Black',
    bank: 'ANZ',
    status: 'cancelled',
    application_date: '2019-04-01',
    cancellation_date: '2020-04-01',
    created_at: new Date().toISOString(),
  },
  {
    id: '4' as any,
    card_id: null,
    user_id: 'test' as any,
    card_name: 'NAB',
    bank: 'NAB',
    status: 'cancelled',
    application_date: '2024-02-01',
    cancellation_date: '2025-02-01',
    created_at: new Date().toISOString(),
  },
]

async function diagnose() {
  console.log('🔍 DIAGNOSING QANTAS CARD AVAILABILITY\n')

  const supabase = createClient<Database>(supabaseUrl, supabaseKey)

  // Get all Qantas cards
  const { data: qantasCards } = await supabase
    .from('cards')
    .select('*')
    .eq('points_currency', 'Qantas')
    .order('welcome_bonus_points', { ascending: false })

  if (!qantasCards) {
    console.error('❌ Could not load Qantas cards')
    return
  }

  console.log(`Found ${qantasCards.length} Qantas cards in database\n`)

  // Calculate eligibility
  const eligibility = calculateBankEligibility(yourPortfolio as UserCard[])
  const eligibilityMap = new Map(eligibility.map((e) => [e.bank.toLowerCase(), e]))

  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 DETAILED CARD ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════\n')

  const activeCardNames = yourPortfolio
    .filter(c => c.status === 'active')
    .map(c => c.card_name?.toLowerCase())

  let includedCount = 0
  let excludedCount = 0

  for (const card of qantasCards) {
    console.log(`\n${card.name} (${card.bank})`)
    console.log('─'.repeat(60))

    let excluded = false
    const reasons: string[] = []

    // Check 1: Is it active in catalog?
    if (card.is_active === false) {
      excluded = true
      reasons.push('❌ is_active = false (card not available)')
    } else {
      reasons.push('✅ is_active = true (or null)')
    }

    // Check 2: Does user already have it?
    const userHasCard = activeCardNames.includes(card.name.toLowerCase())
    if (userHasCard) {
      excluded = true
      reasons.push('❌ User already has this card (active)')
    } else {
      reasons.push('✅ User does not have this card')
    }

    // Check 3: Has welcome bonus?
    if (!card.welcome_bonus_points || card.welcome_bonus_points === 0) {
      excluded = true
      reasons.push('❌ No welcome bonus points')
    } else {
      reasons.push(`✅ Welcome bonus: ${card.welcome_bonus_points?.toLocaleString()} points`)
    }

    // Check 4: Bank eligibility
    const bankElig = eligibilityMap.get(card.bank.toLowerCase())
    if (bankElig) {
      if (bankElig.eligible) {
        reasons.push(`✅ Bank eligible: Yes`)
      } else {
        const daysUntil = Math.ceil((bankElig.eligibleAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        reasons.push(`⏳ Bank eligible in ${daysUntil} days`)
      }
    } else {
      reasons.push('✅ Bank eligible: Yes (never had card from this bank)')
    }

    // Check 5: Basic data quality
    if (!card.annual_fee && card.annual_fee !== 0) {
      reasons.push('⚠️  Missing annual fee data')
    } else {
      reasons.push(`   Annual fee: $${card.annual_fee}`)
    }

    if (!card.bonus_spend_requirement) {
      reasons.push('⚠️  Missing spend requirement data')
    } else {
      reasons.push(`   Spend req: $${card.bonus_spend_requirement}`)
    }

    // Summary
    console.log(reasons.join('\n'))

    if (excluded) {
      console.log('\n🚫 EXCLUDED FROM RECOMMENDATIONS')
      excludedCount++
    } else {
      console.log('\n✅ SHOULD BE INCLUDED IN RECOMMENDATIONS')
      includedCount++
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log('📈 SUMMARY')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log(`Total Qantas cards: ${qantasCards.length}`)
  console.log(`Should be included: ${includedCount}`)
  console.log(`Legitimately excluded: ${excludedCount}\n`)

  if (includedCount !== 1) {
    console.log('⚠️  DISCREPANCY DETECTED!')
    console.log(`Expected 1 card in recommendations, but ${includedCount} should qualify`)
    console.log('\nPossible issues:')
    console.log('- Card name matching might be case-sensitive')
    console.log('- Bank name matching might have issues')
    console.log('- Check recommendation engine filter logic\n')
  }

  // Test actual recommendations
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🧪 ACTUAL RECOMMENDATION ENGINE TEST')
  console.log('═══════════════════════════════════════════════════════════\n')

  const { data: allCards } = await supabase
    .from('cards')
    .select('*')
    .order('welcome_bonus_points', { ascending: false })

  if (allCards) {
    const recs = getRecommendations(
      yourPortfolio as UserCard[],
      allCards,
      { limit: 20, pointsCurrency: 'Qantas' }
    )

    console.log(`Engine returned ${recs.length} Qantas recommendations:\n`)
    recs.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.card.name} (${rec.card.bank})`)
      console.log(`   Bonus: ${rec.card.welcome_bonus_points?.toLocaleString()} | Fee: $${rec.card.annual_fee}`)
      console.log(`   ${rec.eligibleNow ? '✅ Eligible' : '⏳ ' + rec.reason}`)
    })
  }

  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log('💡 RECOMMENDATIONS')
  console.log('═══════════════════════════════════════════════════════════\n')

  const inactiveCards = qantasCards.filter(c => c.is_active === false)
  const missingBonus = qantasCards.filter(c => !c.welcome_bonus_points || c.welcome_bonus_points === 0)
  const missingFee = qantasCards.filter(c => !card.annual_fee && card.annual_fee !== 0)

  if (inactiveCards.length > 0) {
    console.log(`1. Fix ${inactiveCards.length} cards with is_active = false:`)
    inactiveCards.forEach(c => console.log(`   - ${c.name} (${c.bank})`))
    console.log()
  }

  if (missingBonus.length > 0) {
    console.log(`2. Add welcome bonus data for ${missingBonus.length} cards:`)
    missingBonus.forEach(c => console.log(`   - ${c.name} (${c.bank})`))
    console.log()
  }

  if (missingFee.length > 0) {
    console.log(`3. Add annual fee data for ${missingFee.length} cards:`)
    missingFee.forEach(c => console.log(`   - ${c.name} (${c.bank})`))
    console.log()
  }

  console.log('4. Check our manual research at /tmp/bank-sweep-results-jan-2026.md')
  console.log('   for cards that should be in database but are missing\n')
}

diagnose().catch(console.error)
