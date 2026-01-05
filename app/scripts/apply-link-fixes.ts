#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../src/types/database.types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const updates = [
  { id: '32a0fbee-184d-44d2-8997-3f9c77a21088', url: 'https://www.americanexpress.com/en-au/credit-cards/the-platinum-card/', name: 'AMEX Platinum Charge' },
  { id: '548403c3-326c-4e89-9d35-7922fff9e043', url: 'https://www.americanexpress.com/en-au/credit-cards/qantas-ultimate-card/', name: 'AMEX Qantas Ultimate' },
  { id: '6165ac45-1ff9-4d50-9a58-7bf7a5e94e26', url: 'https://www.americanexpress.com/en-au/credit-cards/explorer-credit-card/', name: 'AMEX Explorer' },
  { id: '129804a8-bf64-4765-b66c-8a34564dd322', url: 'https://www.anz.com.au/personal/credit-cards/rewards-black/', name: 'ANZ Rewards Black' },
  { id: '086232ac-4700-489b-84f7-3dea655cd99a', url: 'https://www.anz.com.au/personal/credit-cards/rewards-platinum/', name: 'ANZ Rewards Platinum' },
  { id: '746081b9-6474-4cb4-a1e8-b8fcc7a36778', url: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer-black/', name: 'ANZ Frequent Flyer Black' },
  { id: '130062b5-6cbf-447a-98c2-f347b3568c39', url: 'https://www.commbank.com.au/credit-cards/ultimate-awards.html', name: 'CBA Ultimate Awards' },
  { id: '4454d1b2-b4a6-44dc-9070-acc080fe745a', url: 'https://www.commbank.com.au/credit-cards/smart-awards.html', name: 'CBA Smart Awards' },
  { id: '7b2c7bdc-2884-4c2b-88d4-46c04e719c02', url: 'https://www.commbank.com.au/credit-cards/qantas-premium-awards.html', name: 'CBA Qantas Premium Awards' },
  { id: '0fc740e0-6956-4f95-bc16-6a4f58ee4c92', url: 'https://www.nab.com.au/personal/credit-cards/qantas/nab-qantas-rewards-signature-card', name: 'NAB Qantas Rewards Signature' },
  { id: '768a6b1f-fe5e-4c89-9af5-38cc2326bd8f', url: 'https://www.nab.com.au/personal/credit-cards/nab-rewards/nab-rewards-signature-card', name: 'NAB Rewards Signature' },
  { id: '67890706-d962-4328-9dfc-0c4706480e99', url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/', name: 'Westpac Altitude Black (Altitude)' },
  { id: '449ed879-ce33-45d6-93e7-c951623e8d35', url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/', name: 'Westpac Altitude Black (Qantas)' },
  { id: 'd71f07c9-c465-451f-8eca-bc81cd461ec6', url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-platinum/', name: 'Westpac Altitude Platinum (Qantas)' },
]

async function main() {
  console.log("🔧 Applying link fixes to database...\n")

  let successCount = 0
  let failCount = 0

  for (const update of updates) {
    const { error } = await supabase
      .from("cards")
      .update({ application_link: update.url })
      .eq("id", update.id)

    if (error) {
      console.error(`❌ Failed to update ${update.name}: ${error.message}`)
      failCount++
    } else {
      console.log(`✅ Updated ${update.name}`)
      successCount++
    }
  }

  console.log(`\n================================================================================`)
  console.log(`SUMMARY`)
  console.log(`================================================================================`)
  console.log(`Total updates: ${updates.length}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${failCount}`)

  if (failCount === 0) {
    console.log(`\n✅ All link fixes applied successfully!`)
    console.log(`\nRemaining manual research needed for 16 cards:`)
    console.log(`- Bankwest (2 cards)`)
    console.log(`- Bendigo Bank (1 card)`)
    console.log(`- BOQ (1 card)`)
    console.log(`- Citi (2 cards)`)
    console.log(`- HSBC (2 cards)`)
    console.log(`- Latitude (1 card)`)
    console.log(`- Macquarie (2 cards)`)
    console.log(`- St.George (3 cards)`)
    console.log(`- Virgin Money (2 cards)`)
  } else {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})
