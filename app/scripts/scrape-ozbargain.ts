/**
 * OzBargain Scraper - Finds card-linked deals
 * Run daily via cron: pnpm tsx scripts/scrape-ozbargain.ts
 */

import * as cheerio from "cheerio"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ScrapedDeal {
  title: string
  merchant: string
  deal_url: string
  card_network?: string
  specific_issuer?: string
  source_url: string
}

async function scrapeOzBargain(): Promise<ScrapedDeal[]> {
  const deals: ScrapedDeal[] = []

  try {
    // Search for credit card related deals
    const searchTerms = [
      "credit card",
      "amex",
      "mastercard",
      "visa",
      "cashback",
      "points",
    ]

    for (const term of searchTerms) {
      const url = `https://www.ozbargain.com.au/search/node/${encodeURIComponent(term)}?page=0`

      console.log(`Fetching: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      })

      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.statusText}`)
        continue
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Parse deal listings
      $(".node-ozbdeal").each((_, element) => {
        const $el = $(element)
        const $title = $el.find("h2.title a")
        const title = $title.text().trim()
        const dealUrl = "https://www.ozbargain.com.au" + $title.attr("href")

        // Extract merchant from title or description
        const merchant = extractMerchant(title)

        // Determine card network from title
        const { network, issuer } = extractCardInfo(title)

        // Only add if we found card-related info
        if (network || issuer || title.toLowerCase().includes("cashback")) {
          deals.push({
            title: title.substring(0, 200), // Limit length
            merchant: merchant || "Various",
            deal_url: dealUrl,
            card_network: network,
            specific_issuer: issuer,
            source_url: url,
          })
        }
      })

      // Rate limit: wait 2 seconds between requests
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  } catch (error) {
    console.error("Error scraping OzBargain:", error)
  }

  return deals
}

function extractMerchant(title: string): string | null {
  // Common Australian merchants
  const merchants = [
    "Woolworths",
    "Coles",
    "Myer",
    "David Jones",
    "JB Hi-Fi",
    "Harvey Norman",
    "Bunnings",
    "Kmart",
    "Target",
    "Big W",
    "Qantas",
    "Virgin",
    "Uber Eats",
    "Menulog",
    "DoorDash",
    "Amazon",
    "eBay",
  ]

  for (const merchant of merchants) {
    if (title.includes(merchant)) {
      return merchant
    }
  }

  return null
}

function extractCardInfo(title: string): { network?: string; issuer?: string } {
  const titleLower = title.toLowerCase()

  let network: string | undefined
  let issuer: string | undefined

  // Networks
  if (titleLower.includes("amex") || titleLower.includes("american express")) {
    network = "amex"
    issuer = "amex"
  } else if (titleLower.includes("mastercard")) {
    network = "mastercard"
  } else if (titleLower.includes("visa")) {
    network = "visa"
  }

  // Specific issuers
  if (titleLower.includes("anz")) {
    issuer = "anz"
  } else if (titleLower.includes("westpac")) {
    issuer = "westpac"
  } else if (titleLower.includes("cba") || titleLower.includes("commonwealth")) {
    issuer = "cba"
  } else if (titleLower.includes("nab")) {
    issuer = "nab"
  }

  return { network, issuer }
}

async function saveDealToDatabase(deal: ScrapedDeal) {
  try {
    // Check if deal already exists (by URL)
    const { data: existing } = await supabase
      .from("deals")
      .select("id")
      .eq("deal_url", deal.deal_url)
      .single()

    if (existing) {
      console.log(`Deal already exists: ${deal.title}`)
      return
    }

    // Insert new deal
    const { error } = await supabase.from("deals").insert({
      title: deal.title,
      merchant: deal.merchant,
      deal_url: deal.deal_url,
      card_network: deal.card_network,
      specific_issuer: deal.specific_issuer,
      source: "ozbargain",
      source_url: deal.source_url,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      is_active: true,
    })

    if (error) {
      console.error(`Error saving deal: ${deal.title}`, error)
    } else {
      console.log(`✅ Saved: ${deal.title}`)
    }
  } catch (error) {
    console.error(`Error saving deal: ${deal.title}`, error)
  }
}

async function cleanExpiredDeals() {
  const { error } = await supabase
    .from("deals")
    .update({ is_active: false })
    .lt("valid_until", new Date().toISOString())
    .eq("is_active", true)

  if (error) {
    console.error("Error cleaning expired deals:", error)
  } else {
    console.log("✅ Cleaned expired deals")
  }
}

async function main() {
  console.log("🔍 Scraping OzBargain for card deals...")

  // Clean expired deals first
  await cleanExpiredDeals()

  // Scrape new deals
  const deals = await scrapeOzBargain()
  console.log(`\nFound ${deals.length} potential deals`)

  // Save to database
  for (const deal of deals) {
    await saveDealToDatabase(deal)
    // Rate limit: 1 second between DB writes
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log("\n✅ Scraping complete")
}

main().catch(console.error)
