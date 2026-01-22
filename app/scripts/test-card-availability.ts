#!/usr/bin/env tsx
/**
 * Test specific card URLs to verify availability detection accuracy
 */

import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testCard(url: string, cardName: string): Promise<void> {
  console.log(`\n🔍 Testing: ${cardName}`)
  console.log(`   URL: ${url}`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    }).catch((error) => {
      console.log(`   ⚠️  Navigation error: ${error.message}`)
      return null
    })

    if (!response) {
      console.log(`   ❌ Result: UNAVAILABLE (timeout or navigation error)`)
      return
    }

    const status = response.status()
    const finalUrl = response.url()

    console.log(`   📊 HTTP Status: ${status}`)
    console.log(`   📍 Final URL: ${finalUrl}`)

    if (status === 404 || status >= 500) {
      console.log(`   ❌ Result: UNAVAILABLE (bad HTTP status)`)
      return
    }

    // Get page text
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase())

    // Check for error phrases
    const notFoundPhrases = ['page not found', 'not available', 'no longer available', '404', 'discontinued']
    const foundErrors = notFoundPhrases.filter(phrase => bodyText.includes(phrase))

    if (foundErrors.length > 0) {
      console.log(`   ⚠️  Found error phrases: ${foundErrors.join(', ')}`)
    }

    // Check for positive card content
    const cardPhrases = ['credit card', 'annual fee', 'bonus points', 'rewards', 'apply now', 'card features']
    const foundPhrases = cardPhrases.filter(phrase => bodyText.includes(phrase))

    console.log(`   ✅ Card phrases found (${foundPhrases.length}/6): ${foundPhrases.join(', ')}`)

    // Show page snippet
    console.log(`   📝 Page snippet:`)
    console.log(`      ${bodyText.substring(0, 200)}...`)

    // Final verdict
    if (foundErrors.length > 0) {
      console.log(`   ❌ Result: UNAVAILABLE (error messages found)`)
    } else if (foundPhrases.length < 2) {
      console.log(`   ⚠️  Result: QUESTIONABLE (insufficient card content - might be a false positive!)`)
    } else {
      console.log(`   ✅ Result: AVAILABLE (card content detected)`)
    }

  } finally {
    await browser.close()
  }
}

async function main() {
  // Get a sample of ANZ cards that were marked inactive
  const { data: cards } = await supabase
    .from('cards')
    .select('bank, name, application_link')
    .eq('bank', 'ANZ')
    .eq('is_active', false)
    .limit(3)

  if (!cards || cards.length === 0) {
    console.log('No ANZ inactive cards found to test')
    return
  }

  console.log('🧪 Testing sample of recently marked inactive cards...')

  for (const card of cards) {
    if (card.application_link) {
      await testCard(card.application_link, `${card.bank} ${card.name}`)
    }
  }
}

main()
