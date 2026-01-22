#!/usr/bin/env tsx
import puppeteer from 'puppeteer'

const urlsToTest = [
  { name: 'NAB Qantas Rewards Premium', url: 'https://www.nab.com.au/personal/credit-cards/qantas-rewards-credit-cards/qantas-rewards-premium' },
  { name: 'NAB Rewards Premium', url: 'https://www.nab.com.au/personal/credit-cards/rewards-credit-cards/nab-rewards-premium-card' },
  { name: 'St.George Amplify Platinum', url: 'https://www.stgeorge.com.au/personal/credit-cards/amplify-platinum' }
]

async function testURL(name: string, url: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔍 Testing: ${name}`)
  console.log(`📍 URL: ${url}`)
  console.log('='.repeat(80))

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    console.log('\n⏳ Loading page...')
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    }).catch((error) => {
      console.log(`❌ Navigation failed: ${error.message}`)
      return null
    })

    if (!response) {
      console.log('\n❌ RESULT: Failed to load (timeout/network error)')
      return
    }

    const status = response.status()
    const finalUrl = response.url()

    console.log(`\n📊 HTTP Status: ${status}`)
    console.log(`📍 Final URL: ${finalUrl}`)

    if (finalUrl !== url) {
      console.log(`⚠️  REDIRECT DETECTED: Original URL redirected to different page`)
    }

    if (status === 404) {
      console.log('\n❌ RESULT: 404 Not Found')
      return
    }

    if (status >= 500) {
      console.log('\n❌ RESULT: Server Error')
      return
    }

    // Get page content
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase())

    // Check for error phrases
    const errorPhrases = [
      'page not found',
      'not available',
      'no longer available',
      '404',
      'discontinued',
      'has been removed',
      'does not exist'
    ]

    console.log('\n🔍 Checking for error phrases:')
    const foundErrors: string[] = []
    for (const phrase of errorPhrases) {
      if (bodyText.includes(phrase)) {
        foundErrors.push(phrase)
        console.log(`   ❌ Found: "${phrase}"`)
      }
    }

    if (foundErrors.length === 0) {
      console.log('   ✅ No error phrases found')
    }

    // Check for positive card content
    const cardPhrases = [
      'credit card',
      'annual fee',
      'bonus points',
      'rewards',
      'apply now',
      'card features',
      'interest rate',
      'purchase rate'
    ]

    console.log('\n🔍 Checking for card-related content:')
    const foundPhrases: string[] = []
    for (const phrase of cardPhrases) {
      if (bodyText.includes(phrase)) {
        foundPhrases.push(phrase)
        console.log(`   ✅ Found: "${phrase}"`)
      }
    }

    console.log(`\n   Total card phrases: ${foundPhrases.length}/${cardPhrases.length}`)

    // Show page snippet
    console.log('\n📝 First 500 characters of page text:')
    console.log('─'.repeat(80))
    console.log(bodyText.substring(0, 500))
    console.log('─'.repeat(80))

    // Final determination
    console.log('\n🎯 FINAL VERDICT:')
    if (foundErrors.length > 0) {
      console.log('   ❌ UNAVAILABLE - Error phrases detected')
      console.log(`   Reasons: ${foundErrors.join(', ')}`)
    } else if (foundPhrases.length < 2) {
      console.log('   ⚠️  QUESTIONABLE - Insufficient card content')
      console.log('   This might be a redirect to a generic page')
    } else {
      console.log('   ✅ AVAILABLE - Card content detected')
    }

  } finally {
    await browser.close()
  }
}

async function main() {
  for (const test of urlsToTest) {
    await testURL(test.name, test.url)
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

main()
