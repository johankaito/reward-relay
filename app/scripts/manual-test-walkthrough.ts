#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

async function manualTestWalkthrough() {
  console.log('🎬 Starting manual test walkthrough with screen recording...\n')

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })

  try {
    const page = await browser.newPage()

    // Set up console logging
    page.on('console', msg => {
      const text = msg.text()
      console.log(`📊 [Browser Console]: ${text}`)
    })

    // Listen for network errors
    page.on('pageerror', error => {
      console.log(`❌ [Page Error]: ${error.message}`)
    })

    // Listen for failed requests
    page.on('requestfailed', request => {
      console.log(`❌ [Failed Request]: ${request.url()}`)
    })

    // Track PostHog events
    const posthogEvents: any[] = []
    page.on('response', async response => {
      const url = response.url()
      if (url.includes('posthog') || url.includes('app.posthog.com')) {
        console.log(`📡 [PostHog]: ${response.status()} ${url}`)

        // Capture event data if it's a POST to /e/ or /batch/
        if ((url.includes('/e/') || url.includes('/batch/')) && response.request().method() === 'POST') {
          try {
            const postData = response.request().postData()
            if (postData) {
              posthogEvents.push({
                timestamp: new Date().toISOString(),
                url: url,
                data: postData
              })
            }
          } catch (e) {
            // Ignore errors reading post data
          }
        }
      }
    })

    const baseUrl = 'https://www.rewardrelay.app'

    console.log(`📍 Starting walkthrough at ${baseUrl}\n`)
    console.log('🎥 Browser window is open - perform your manual testing')
    console.log('📝 Console logs and PostHog events are being captured')
    console.log('⏸️  Press Ctrl+C when done to save results\n')

    // Navigate to home page
    await page.goto(baseUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // Wait for PostHog to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check PostHog status
    const posthogStatus = await page.evaluate(() => {
      // @ts-expect-error -- accessing internal property
      const ph = window.posthog
      if (!ph) {
        return { loaded: false, error: 'posthog object not found' }
      }
      return {
        loaded: ph.__loaded || false,
        // @ts-expect-error -- accessing internal property
        distinctId: ph.get_distinct_id ? ph.get_distinct_id() : 'no method'
      }
    })

    console.log('🔍 PostHog Status:', JSON.stringify(posthogStatus, null, 2))
    console.log('\n✅ Ready for manual testing - navigate through the app as desired\n')

    // Keep browser open indefinitely until user closes it or presses Ctrl+C
    await new Promise((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n\n📊 Saving captured PostHog events...')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `/tmp/posthog-events-${timestamp}.json`
        writeFileSync(filename, JSON.stringify(posthogEvents, null, 2))
        console.log(`✅ Saved ${posthogEvents.length} PostHog events to ${filename}`)
        resolve(true)
      })
    })

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Test complete!')
  }
}

manualTestWalkthrough()
