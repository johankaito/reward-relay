#!/usr/bin/env tsx
/**
 * Cleanup script: fix data quality issues introduced by bulk scraper runs
 *
 * Issues addressed:
 * 1. 7 MyCard records with NULL annual_fee + NULL application_link (junk dupes)
 * 2. CBA bank name dupes (CBA → CommBank, same bank)
 * 3. Amex Essential dupe (keep 40k pts version)
 * 4. NAB Qantas Rewards Premium dupe (keep $395/150k pts version)
 * 5. St.George Low Rate dupe (keep fee=55/pts=0 version)
 * 6. MyCard Prestige dupe (keep 200k pts version)
 * 7. Amex Qantas Ultimate with wrong network (Visa → Amex)
 * 8. Latitude 28 Degrees dupe (keep one)
 */

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

let deleted = 0
let updated = 0

async function del(ids: string[], reason: string) {
  const { error, count } = await sb.from('cards').delete().in('id', ids)
  if (error) {
    console.error(`  ❌ Delete failed (${reason}):`, error.message)
    return
  }
  deleted += ids.length
  console.log(`  ✅ Deleted ${ids.length} — ${reason}`)
}

async function upd(id: string, patch: Record<string, unknown>, reason: string) {
  const { error } = await sb.from('cards').update(patch).eq('id', id)
  if (error) {
    console.error(`  ❌ Update failed (${reason}):`, error.message)
    return
  }
  updated++
  console.log(`  ✅ Updated [${id.slice(0, 8)}] — ${reason}`)
}

async function main() {
  console.log('🧹 Card data quality cleanup\n')

  // ── 1. MyCard records with NULL annual_fee + NULL application_link ──────────
  console.log('1. Deleting junk MyCard records (NULL fee + NULL link)…')
  await del([
    '364c1348-c542-452b-b2e9-ee38f0421901', // MyCard Clear
    'b8b22bbd-c5b9-4984-8343-573969ef1aaf', // MyCard Premier
    '094d16b9-5deb-418f-8916-b2f5402a2d77', // MyCard Prestige
    'ec6c10d0-68ed-4340-b1f8-4b4858b6a057', // MyCard Rewards
    'd417b090-eea5-4bd5-bb9b-b757de52dd0d', // MyCard Simplicity
    'e8c79c6c-eb0a-48f5-9685-30fb687ae022', // MyCard (Qantas) Premier Qantas
    '10001290-95dc-4884-90c5-21f9090a7416', // MyCard (Qantas) Prestige Qantas
  ], 'MyCard NULL fee+link junk records')

  // ── 2. CBA duplicates — CBA = CommBank, delete CBA rows ────────────────────
  console.log('\n2. Removing CBA duplicates (same bank as CommBank)…')
  // Delete CBA Smart Awards (CommBank has fee=99 which is correct current price)
  await del(
    ['4454d1b2-b4a6-44dc-9070-acc080fe745a'],
    'CBA Smart Awards (dupe of CommBank Smart Awards)'
  )
  // Delete CBA Ultimate Awards (CommBank has fee=425 pts=100k which is more complete)
  await del(
    ['130062b5-6cbf-447a-98c2-f347b3568c39'],
    'CBA Ultimate Awards (dupe of CommBank Ultimate Awards)'
  )
  // Rename remaining CBA card to CommBank
  await upd(
    '7b2c7bdc-2884-4c2b-88d4-46c04e719c02', // CBA Qantas Premium Awards
    { bank: 'CommBank' },
    'CBA → CommBank bank name fix (Qantas Premium Awards)'
  )

  // ── 3. Amex Essential duplicate — keep 40k pts, delete 15k ─────────────────
  console.log('\n3. Amex Essential duplicate…')
  await del(
    ['93792aff-f4a4-4716-9140-a55f7d0eab85'],
    'Amex Essential 15k pts (weaker dupe, keeping 40k version)'
  )

  // ── 4. NAB Qantas Rewards Premium duplicate ─────────────────────────────────
  console.log('\n4. NAB Qantas Rewards Premium duplicate…')
  await del(
    ['24b08fca-ff64-4450-b28c-68aef2b448e6'],
    'NAB QR Premium fee=295/60k (outdated dupe, keeping fee=395/150k version)'
  )

  // ── 5. St.George Low Rate duplicate ─────────────────────────────────────────
  console.log('\n5. St.George Low Rate duplicate…')
  await del(
    ['e88ec1e9-98cc-4faf-b5b9-a93ae90fca2d'],
    'St.George Low Rate fee=59/NULL (keeping fee=55/pts=0 version)'
  )

  // ── 6. MyCard Prestige duplicate ─────────────────────────────────────────────
  console.log('\n6. MyCard Prestige duplicate…')
  await del(
    ['fc44bcc1-514d-49ec-b564-c88422044647'],
    'MyCard Prestige NULL pts (keeping 200k pts version)'
  )

  // ── 7. Fix Amex Qantas Ultimate listed as Visa ───────────────────────────────
  console.log('\n7. Fix Amex Qantas Ultimate wrong network (Visa → Amex)…')
  // The Qantas Ultimate is an Amex card, not Visa
  // ID of the one with network=Visa
  const { data: visaAmex } = await sb
    .from('cards')
    .select('id, name, network')
    .eq('bank', 'American Express')
    .eq('name', 'Qantas Ultimate')
    .eq('network', 'Visa')
  if (visaAmex && visaAmex.length > 0) {
    await upd(visaAmex[0].id, { network: 'Amex' }, 'Amex Qantas Ultimate network Visa→Amex')
  } else {
    console.log('  ℹ️  No Amex Qantas Ultimate Visa found (may already be fixed)')
  }

  // ── 8. Latitude 28 Degrees duplicate ─────────────────────────────────────────
  console.log('\n8. Check Latitude 28 Degrees duplicates…')
  const { data: lat28 } = await sb
    .from('cards')
    .select('id, name, bank, network, annual_fee')
    .eq('bank', 'Latitude')
    .ilike('name', '%28%')
  if (lat28 && lat28.length > 1) {
    lat28.forEach(c => console.log('  Found:', c.id, c.name, c.network, 'fee='+c.annual_fee))
    // Keep the one named "28 Degrees Platinum Mastercard" (more descriptive), delete the other
    const toDelete = lat28.filter(c => c.name === '28° Global Platinum')
    if (toDelete.length > 0) {
      await del(toDelete.map(c => c.id), 'Latitude 28° Global Platinum (dupe of 28 Degrees Platinum MC)')
    }
  } else {
    console.log('  ℹ️  No Latitude 28 Degrees duplicates found')
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Cleanup complete: ${deleted} deleted, ${updated} updated`)

  // Final count
  const { count } = await sb.from('cards').select('*', { count: 'exact', head: true })
  console.log(`📊 Cards remaining: ${count}`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
