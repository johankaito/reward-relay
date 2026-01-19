import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate cards...\n')

  // Get all cards
  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !cards) {
    console.error('❌ Error:', error?.message)
    return
  }

  // Group by scrape_source + scrape_url (exact duplicates)
  const exactGroups = new Map<string, any[]>()

  for (const card of cards) {
    const key = `${card.scrape_source}:${card.scrape_url}`
    if (!exactGroups.has(key)) {
      exactGroups.set(key, [])
    }
    exactGroups.get(key)!.push(card)
  }

  // Find exact duplicates to delete (keep first/oldest, delete rest)
  const toDelete: string[] = []

  for (const [key, group] of exactGroups.entries()) {
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicates for: ${key}`)
      console.log(`   Keeping: ${group[0].id} (${group[0].bank} - ${group[0].name})`)

      for (let i = 1; i < group.length; i++) {
        console.log(`   Deleting: ${group[i].id}`)
        toDelete.push(group[i].id)
      }
      console.log()
    }
  }

  if (toDelete.length === 0) {
    console.log('✅ No exact duplicates to delete!')
  } else {
    console.log(`\n🗑️  Deleting ${toDelete.length} exact duplicate cards...\n`)

    for (const id of toDelete) {
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error(`❌ Error deleting ${id}:`, deleteError.message)
      } else {
        console.log(`✅ Deleted: ${id}`)
      }
    }
  }

  // Now handle potential duplicates (same bank+name, different URLs)
  // Keep the one from bulk-add if it exists, otherwise keep the oldest
  const nameGroups = new Map<string, any[]>()

  const { data: remainingCards } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: true })

  if (!remainingCards) return

  for (const card of remainingCards) {
    const key = `${card.bank}:${card.name}`
    if (!nameGroups.has(key)) {
      nameGroups.set(key, [])
    }
    nameGroups.get(key)!.push(card)
  }

  const nameDuplicates = Array.from(nameGroups.values()).filter(group => group.length > 1)

  if (nameDuplicates.length > 0) {
    console.log(`\n📝 Found ${nameDuplicates.length} potential duplicates (same bank+name, different URLs):\n`)

    for (const group of nameDuplicates) {
      console.log(`Potential duplicate: ${group[0].bank} - ${group[0].name}`)

      // Prefer bulk-add version, then newest
      const bulkAddCard = group.find(c => c.scrape_source === 'bulk-add')
      const keepCard = bulkAddCard || group[group.length - 1]

      console.log(`   Keeping: ${keepCard.id} (scrape_source: ${keepCard.scrape_source}, url: ${keepCard.scrape_url})`)

      for (const card of group) {
        if (card.id !== keepCard.id) {
          console.log(`   Deleting: ${card.id} (scrape_source: ${card.scrape_source}, url: ${card.scrape_url})`)

          const { error: deleteError } = await supabase
            .from('cards')
            .delete()
            .eq('id', card.id)

          if (deleteError) {
            console.error(`      ❌ Error:`, deleteError.message)
          } else {
            console.log(`      ✅ Deleted`)
          }
        }
      }
      console.log()
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Cleanup complete! Final card count: ${finalCount}`)
  console.log('='.repeat(80))
}

cleanDuplicates()
