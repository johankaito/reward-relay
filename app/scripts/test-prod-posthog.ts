#!/usr/bin/env tsx
import puppeteer from 'puppeteer'

async function testProdPostHog() {
  console.log('🚀 Starting production PostHog test...\n')

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })

  try {
    const page = await browser.newPage()

    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('PostHog') || text.includes('posthog')) {
        console.log(`📊 [Browser Console]: ${text}`)
      }
    })

    // Listen for network requests to PostHog
    page.on('request', request => {
      const url = request.url()
      if (url.includes('posthog') || url.includes('app.posthog.com')) {
        console.log(`📡 [Network Request]: ${request.method()} ${url}`)
      }
    })

    page.on('response', response => {
      const url = response.url()
      if (url.includes('posthog') || url.includes('app.posthog.com')) {
        console.log(`📥 [Network Response]: ${response.status()} ${url}`)
      }
    })

    console.log('📍 Navigating to https://www.rewardrelay.app/history')
    await page.goto('https://www.rewardrelay.app/history', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('✅ Page loaded\n')

    // Wait a bit for PostHog to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if PostHog is loaded
    const posthogStatus = await page.evaluate(() => {
      // @ts-expect-error -- accessing internal property
      const ph = window.posthog
      if (!ph) {
        return { loaded: false, error: 'posthog object not found on window' }
      }

      return {
        loaded: ph.__loaded || false,
        // @ts-expect-error -- accessing internal property
        config: ph.config ? {
          api_host: ph.config.api_host,
          // @ts-expect-error -- accessing internal property
          token: ph.config.token ? ph.config.token.substring(0, 10) + '...' : 'missing'
        } : 'no config',
        // @ts-expect-error -- accessing internal property
        distinctId: ph.get_distinct_id ? ph.get_distinct_id() : 'no distinct_id method'
      }
    })

    console.log('🔍 PostHog Status:')
    console.log(JSON.stringify(posthogStatus, null, 2))
    console.log()

    if (!posthogStatus.loaded) {
      console.log('❌ PostHog NOT loaded!')

      // Check if environment variables are present
      const envCheck = await page.evaluate(() => {
        return {
          // @ts-expect-error -- accessing internal property
          hasPostHogKey: typeof window !== 'undefined' && Boolean(process?.env?.NEXT_PUBLIC_POSTHOG_KEY),
          // @ts-expect-error -- accessing internal property
          hasPostHogHost: typeof window !== 'undefined' && Boolean(process?.env?.NEXT_PUBLIC_POSTHOG_HOST)
        }
      })
      console.log('Environment check:', envCheck)
    } else {
      console.log('✅ PostHog IS loaded!')

      // Try to capture a test event
      console.log('\n📊 Capturing test event...')
      await page.evaluate(() => {
        // @ts-expect-error -- accessing internal property
        if (window.posthog) {
          // @ts-expect-error -- accessing internal property
          window.posthog.capture('test_click_through', {
            source: 'automated_test',
            page: 'history'
          })
        }
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('✅ Test event captured')
    }

    console.log('\n⏳ Waiting 5 seconds to observe behavior...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    console.log('\n✅ Test complete!')

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await browser.close()
  }
}

testProdPostHog()
