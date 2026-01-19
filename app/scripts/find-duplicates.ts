import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findDuplicates() {
  console.log('🔍 Finding duplicate cards...\n')

  const { data: cards, error } = await supabase
    .from('cards')
    .select('*')
    .order('bank', { ascending: true })

  if (error || !cards) {
    console.error('❌ Error:', error?.message)
    return
  }

  // Group by scrape_source + scrape_url
  const groups = new Map<string, any[]>()

  for (const card of cards) {
    const key = `${card.scrape_source}:${card.scrape_url}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(card)
  }

  // Find duplicates
  const duplicates = Array.from(groups.values()).filter(group => group.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!')
    return
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate groups:\n`)

  for (const group of duplicates) {
    console.log(`Duplicate: ${group[0].bank} - ${group[0].name}`)
    console.log(`   scrape_source: ${group[0].scrape_source}`)
    console.log(`   scrape_url: ${group[0].scrape_url}`)
    console.log(`   Instances: ${group.length}`)

    for (const card of group) {
      console.log(`   - ID: ${card.id}`)
    }
    console.log()
  }

  // Find cards with same bank+name but different scrape info
  const nameGroups = new Map<string, any[]>()

  for (const card of cards) {
    const key = `${card.bank}:${card.name}`
    if (!nameGroups.has(key)) {
      nameGroups.set(key, [])
    }
    nameGroups.get(key)!.push(card)
  }

  const nameDuplicates = Array.from(nameGroups.values()).filter(group => group.length > 1)

  if (nameDuplicates.length > 0) {
    console.log(`\n⚠️  Found ${nameDuplicates.length} potential duplicates by bank+name:\n`)

    for (const group of nameDuplicates) {
      console.log(`Potential duplicate: ${group[0].bank} - ${group[0].name}`)
      console.log(`   Instances: ${group.length}`)

      for (const card of group) {
        console.log(`   - ID: ${card.id}, scrape_source: ${card.scrape_source}, scrape_url: ${card.scrape_url}`)
      }
      console.log()
    }
  }
}

findDuplicates()
