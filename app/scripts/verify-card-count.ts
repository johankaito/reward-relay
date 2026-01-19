import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyCardCount() {
  console.log('🔍 Verifying database card count...\n')

  // Get total count
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log(`📊 Total cards in database: ${count}`)

  if (count && count >= 100) {
    console.log('✅ SUCCESS! Database has 100+ cards')
  } else {
    console.log(`⚠️  WARNING: Only ${count} cards (target: 100+)`)
  }

  // Get breakdown by bank
  const { data: cards } = await supabase
    .from('cards')
    .select('bank')
    .order('bank')

  if (cards) {
    const bankCounts = cards.reduce((acc: Record<string, number>, card) => {
      acc[card.bank] = (acc[card.bank] || 0) + 1
      return acc
    }, {})

    console.log('\n📈 Cards by bank:')
    Object.entries(bankCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([bank, count]) => {
        console.log(`   ${bank}: ${count} cards`)
      })
  }
}

verifyCardCount()
