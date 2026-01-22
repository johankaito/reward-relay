#!/usr/bin/env tsx
/**
 * Notify users when a card in their projections becomes unavailable
 * Called by scraper after marking cards inactive
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.types'
import { calculateMultiCardPaths, GOALS } from '../src/lib/projections'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)

interface AffectedUser {
  userId: string
  cardId: string
  cardName: string
  cardBank: string
  goalId: string
  goalLabel: string
}

/**
 * Find all users whose goal paths include the unavailable card
 */
async function findAffectedUsers(unavailableCardId: string): Promise<AffectedUser[]> {
  console.log(`\n🔍 Finding users affected by unavailable card: ${unavailableCardId}\n`)

  const affected: AffectedUser[] = []

  // Get the card details
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', unavailableCardId)
    .single()

  if (cardError || !card) {
    console.error('❌ Could not find card:', cardError?.message)
    return []
  }

  console.log(`📇 Card: ${card.bank} ${card.name}`)
  console.log(`   Status: is_active = ${card.is_active}\n`)

  // Get all active users (those with at least one card)
  const { data: allUsers, error: usersError } = await supabase
    .from('user_cards')
    .select('user_id')
    .not('user_id', 'is', null)

  if (usersError || !allUsers) {
    console.error('❌ Could not fetch users:', usersError?.message)
    return []
  }

  const uniqueUserIds = [...new Set(allUsers.map(u => u.user_id))]
  console.log(`👥 Checking ${uniqueUserIds.length} users...\n`)

  // Get all active cards for recommendations
  const { data: catalogCards } = await supabase
    .from('cards')
    .select('*')
    .eq('is_active', true)

  if (!catalogCards) {
    console.error('❌ Could not fetch catalog cards')
    return []
  }

  // Check each user's potential goal paths
  for (const userId of uniqueUserIds) {
    // Get user's cards
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)

    if (!userCards) continue

    // Get user's points balance
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    const currentPoints = userPoints?.qantas_ff_balance || 0

    // Check each goal
    for (const [goalKey, goal] of Object.entries(GOALS)) {
      try {
        const paths = calculateMultiCardPaths(goal, userCards, catalogCards, currentPoints)

        // Check if recommended path (index 0) includes the unavailable card
        const recommendedPath = paths[0]
        if (recommendedPath) {
          const usesCard = recommendedPath.cards.some(c => c.id === unavailableCardId)

          if (usesCard) {
            affected.push({
              userId,
              cardId: unavailableCardId,
              cardName: card.name,
              cardBank: card.bank,
              goalId: goal.id,
              goalLabel: goal.label
            })

            console.log(`   ⚠️  User ${userId.substring(0, 8)}...`)
            console.log(`      Goal: ${goal.label}`)
            console.log(`      Uses: ${card.bank} ${card.name}`)
          }
        }
      } catch (error) {
        // Skip errors in path calculation
        continue
      }
    }
  }

  return affected
}

/**
 * Create daily insight alerts for affected users
 */
async function createAlerts(affectedUsers: AffectedUser[]): Promise<void> {
  if (affectedUsers.length === 0) {
    console.log('\n✅ No users affected - no alerts needed\n')
    return
  }

  console.log(`\n📢 Creating ${affectedUsers.length} alert(s)...\n`)

  for (const user of affectedUsers) {
    const title = `⚠️ Your goal requires an update`
    const description = `The ${user.cardBank} ${user.cardName} is no longer available. Your "${user.goalLabel}" goal uses this card. Please update your goal to use a different card.`

    const { error } = await supabase
      .from('daily_insights')
      .insert({
        user_id: user.userId,
        tip_type: 'card_unavailable',
        title,
        description,
        card_id: null, // Not a user_card, it's a catalog card
        insight_date: new Date().toISOString().split('T')[0],
      })

    if (error) {
      console.error(`   ❌ Failed to create alert for user ${user.userId.substring(0, 8)}:`, error.message)
    } else {
      console.log(`   ✅ Created alert for user ${user.userId.substring(0, 8)}`)
      console.log(`      Goal: ${user.goalLabel}`)
      console.log(`      Card: ${user.cardBank} ${user.cardName}`)
    }
  }

  console.log(`\n✨ Done! Created alerts for ${affectedUsers.length} user(s)\n`)
}

/**
 * Main function - check a specific card
 */
async function main() {
  const cardId = process.argv[2]

  if (!cardId) {
    console.error('❌ Usage: pnpm tsx scripts/notify-unavailable-card-users.ts <card-id>')
    console.error('   Example: pnpm tsx scripts/notify-unavailable-card-users.ts 6eda1a63-ac9b-4708-99de-24ef59798c01')
    process.exit(1)
  }

  const affectedUsers = await findAffectedUsers(cardId)

  if (affectedUsers.length === 0) {
    console.log('✅ No users affected by this card becoming unavailable')
    return
  }

  console.log(`\n📊 Summary: ${affectedUsers.length} user(s) affected\n`)

  // Group by goal for summary
  const byGoal = affectedUsers.reduce((acc, user) => {
    acc[user.goalLabel] = (acc[user.goalLabel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('Affected users by goal:')
  for (const [goal, count] of Object.entries(byGoal)) {
    console.log(`   ${goal}: ${count} user(s)`)
  }

  await createAlerts(affectedUsers)
}

main().catch(console.error)
