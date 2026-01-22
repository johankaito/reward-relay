#!/usr/bin/env tsx
/**
 * Test PostHog Event Tracking
 * Automates interactions with the app to trigger PostHog events
 */

import puppeteer from 'puppeteer'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

async function testPostHogEvents() {
  console.log('🚀 Starting PostHog event testing...\n')

  const browser = await puppeteer.launch({
    headless: false, // Show the browser so we can see what's happening
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()

    // Enable console logging from the page
    page.on('console', (msg) => {
      if (msg.text().includes('PostHog')) {
        console.log('📊 Browser:', msg.text())
      }
    })

    // Listen for network requests to PostHog
    let eventsSent = 0
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('posthog.com') || url.includes('/capture')) {
        eventsSent++
        console.log(`✅ Event ${eventsSent} sent:`, url.split('/').pop())
      }
    })

    console.log('📱 Opening landing page...')
    await page.goto(APP_URL, { waitUntil: 'networkidle0' })
    await page.waitForTimeout(2000)

    console.log('🖱️  Clicking "Log in" button...')
    const loginButton = await page.$('a[href="/login"]')
    if (loginButton) {
      await loginButton.click()
      await page.waitForTimeout(2000)
    }

    console.log('🔙 Going back to home...')
    await page.goBack()
    await page.waitForTimeout(2000)

    console.log('📜 Scrolling page...')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    console.log('🖱️  Clicking buttons on the page...')
    const buttons = await page.$$('button, a[class*="button"], a[class*="rounded-full"]')
    for (let i = 0; i < Math.min(3, buttons.length); i++) {
      try {
        await buttons[i].click()
        await page.waitForTimeout(1000)
      } catch (e) {
        // Button might navigate away or be disabled
      }
    }

    console.log('\n📊 Testing complete!')
    console.log(`✅ Total events captured: ${eventsSent}`)
    console.log('\n💡 Check your PostHog dashboard - events should appear within 30 seconds')
    console.log('   Dashboard: https://app.posthog.com')

    // Keep browser open for a bit so you can see the results
    console.log('\n⏳ Keeping browser open for 5 seconds...')
    await page.waitForTimeout(5000)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Browser closed')
  }
}

// Run the test
testPostHogEvents().catch(console.error)
