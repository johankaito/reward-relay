#!/usr/bin/env node

/**
 * Verify and update application links for credit cards
 *
 * This script:
 * 1. Fetches all cards from Supabase
 * 2. Verifies application_link URLs are specific (not generic bank homepages)
 * 3. Generates SQL UPDATE statements for fixing generic links
 * 4. Tests that links return HTTP 200
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../src/types/database.types"

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required environment variables")
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

type CatalogCard = Database["public"]["Tables"]["cards"]["Row"]

// Known specific application URLs for Australian banks
const KNOWN_URLS: Record<string, Record<string, string>> = {
  "American Express": {
    "Platinum Charge": "https://www.americanexpress.com/en-au/credit-cards/the-platinum-card/",
    "Explorer": "https://www.americanexpress.com/en-au/credit-cards/explorer-credit-card/",
    "Qantas Ultimate": "https://www.americanexpress.com/en-au/credit-cards/qantas-ultimate-card/"
  },
  "ANZ": {
    "Frequent Flyer Black": "https://www.anz.com.au/personal/credit-cards/frequent-flyer-black/",
    "Rewards Black": "https://www.anz.com.au/personal/credit-cards/rewards-black/",
    "Rewards Platinum": "https://www.anz.com.au/personal/credit-cards/rewards-platinum/"
  },
  "NAB": {
    "Qantas Rewards Signature": "https://www.nab.com.au/personal/credit-cards/qantas/nab-qantas-rewards-signature-card",
    "Rewards Signature": "https://www.nab.com.au/personal/credit-cards/nab-rewards/nab-rewards-signature-card"
  },
  "Westpac": {
    "Altitude Black (Qantas)": "https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/",
    "Altitude Black (Altitude)": "https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/",
    "Altitude Platinum (Qantas)": "https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-platinum/"
  },
  "CBA": {
    "Ultimate Awards": "https://www.commbank.com.au/credit-cards/ultimate-awards.html",
    "Smart Awards": "https://www.commbank.com.au/credit-cards/smart-awards.html",
    "Qantas Premium Awards": "https://www.commbank.com.au/credit-cards/qantas-premium-awards.html"
  }
}

// Generic homepage patterns that should be replaced
const GENERIC_PATTERNS = [
  /^https?:\/\/(www\.)?americanexpress\.com\/en-au\/?$/i,
  /^https?:\/\/(www\.)?anz\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?nab\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?westpac\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?commbank\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?macquarie\.com\/?$/i,
  /^https?:\/\/(www\.)?stgeorge\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?boq\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?hsbc\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?virginmoney\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?bankwest\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?bendigobank\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?latitudefinancial\.com\.au\/?$/i,
  /^https?:\/\/(www\.)?citibank\.com\.au\/?$/i,
]

function isGenericURL(url: string | null): boolean {
  if (!url) return true
  return GENERIC_PATTERNS.some(pattern => pattern.test(url))
}

function getSpecificURL(bank: string, cardName: string): string | null {
  const bankUrls = KNOWN_URLS[bank]
  if (!bankUrls) return null
  return bankUrls[cardName] || null
}

async function testURL(url: string): Promise<{ status: number; ok: boolean; redirected: boolean }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RewardRelayBot/1.0)"
      }
    })
    return {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected
    }
  } catch (error) {
    return { status: 0, ok: false, redirected: false }
  }
}

async function main() {
  console.log("🔍 Fetching all cards from Supabase...")

  const { data: cards, error } = await supabase
    .from("cards")
    .select("*")
    .order("bank", { ascending: true })

  if (error) {
    console.error("Failed to fetch cards:", error)
    process.exit(1)
  }

  console.log(`Found ${cards?.length || 0} cards\n`)

  const issues: Array<{
    card: CatalogCard
    issue: string
    suggestedURL?: string
  }> = []

  // Check each card
  for (const card of cards || []) {
    const isGeneric = isGenericURL(card.application_link)

    if (isGeneric) {
      const specificURL = getSpecificURL(card.bank, card.name)
      issues.push({
        card,
        issue: "Generic bank homepage URL",
        suggestedURL: specificURL || undefined
      })
    } else if (card.application_link) {
      // Test if URL is accessible
      const result = await testURL(card.application_link)
      if (!result.ok) {
        issues.push({
          card,
          issue: `URL returns ${result.status} (${result.ok ? "OK" : "ERROR"})`,
        })
      }
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Print report
  console.log("=" .repeat(80))
  console.log("LINK VERIFICATION REPORT")
  console.log("=".repeat(80))
  console.log()

  if (issues.length === 0) {
    console.log("✅ All links look good!")
    return
  }

  console.log(`Found ${issues.length} issues:\n`)

  const sqlUpdates: string[] = []

  for (const { card, issue, suggestedURL } of issues) {
    console.log(`❌ ${card.bank} - ${card.name}`)
    console.log(`   Issue: ${issue}`)
    console.log(`   Current: ${card.application_link || "(null)"}`)

    if (suggestedURL) {
      console.log(`   Suggested: ${suggestedURL}`)
      sqlUpdates.push(
        `UPDATE cards SET application_link = '${suggestedURL}' WHERE id = '${card.id}';`
      )
    } else {
      console.log(`   Action: Manual research needed`)
    }
    console.log()
  }

  // Print SQL updates
  if (sqlUpdates.length > 0) {
    console.log("=" .repeat(80))
    console.log("SQL UPDATE STATEMENTS (Review before running)")
    console.log("=".repeat(80))
    console.log()
    console.log("-- Run these in Supabase SQL Editor:")
    console.log()
    for (const sql of sqlUpdates) {
      console.log(sql)
    }
    console.log()
  }

  // Summary
  console.log("=".repeat(80))
  console.log("SUMMARY")
  console.log("=".repeat(80))
  console.log(`Total cards: ${cards?.length || 0}`)
  console.log(`Issues found: ${issues.length}`)
  console.log(`Auto-fixable: ${sqlUpdates.length}`)
  console.log(`Manual research needed: ${issues.length - sqlUpdates.length}`)
  console.log()
  console.log("Next steps:")
  console.log("1. Review suggested URLs above")
  console.log("2. Test suggested URLs manually in browser")
  console.log("3. Run SQL UPDATE statements in Supabase")
  console.log("4. Research and manually update remaining cards")
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
