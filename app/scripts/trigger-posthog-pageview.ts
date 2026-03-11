#!/usr/bin/env tsx
/**
 * Trigger PostHog Pageview Event
 * Manually triggers a pageview event that PostHog installation verification expects
 */

import puppeteer from 'puppeteer'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

async function triggerPageview() {
  console.log('🚀 Triggering PostHog pageview event...\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  })

  try {
    const page = await browser.newPage()

    // Listen for PostHog events
    const capturedEvents: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('PostHog')) {
        console.log('📊', text)
      }
    })

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('posthog.com/capture') || url.includes('/decide')) {
        try {
          const contentType = response.headers()['content-type']
          if (contentType?.includes('application/json')) {
            const data = await response.json()
            console.log('📤 PostHog Request:', JSON.stringify(data, null, 2))
          }
        } catch (e) {
          // Ignore parsing errors
        }
        capturedEvents.push(url)
        console.log(`✅ Event sent to PostHog: ${url.includes('capture') ? 'capture' : 'decide'}`)
      }
    })

    console.log('📱 Opening page...')
    await page.goto(APP_URL, { waitUntil: 'networkidle2' })

    // Wait for PostHog to initialize
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Manually trigger pageview event
    console.log('\n🎯 Manually triggering pageview event...')
    await page.evaluate(() => {
      // @ts-expect-error -- accessing internal property
      if (window.posthog) {
        // @ts-expect-error -- accessing internal property
        window.posthog.capture('$pageview', {
          $current_url: window.location.href,
          $pathname: window.location.pathname,
        })
        console.log('[PostHog] Manual pageview sent')
      } else {
        console.error('[PostHog] PostHog not initialized!')
      }
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Trigger another event - button click
    console.log('🖱️  Triggering click event...')
    await page.evaluate(() => {
      // @ts-expect-error -- accessing internal property
      if (window.posthog) {
        // @ts-expect-error -- accessing internal property
        window.posthog.capture('button_click', {
          button: 'test_button',
          location: 'landing_page',
        })
        console.log('[PostHog] Click event sent')
      }
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('\n📊 Events Summary:')
    console.log(`✅ Total requests to PostHog: ${capturedEvents.length}`)
    console.log('\n💡 Events should now appear in PostHog dashboard')
    console.log('   Go to: https://app.posthog.com/events')
    console.log('   Or check: https://app.posthog.com/project/default/activity')

    // Keep browser open
    console.log('\n⏳ Keeping browser open for 10 seconds so you can inspect...')
    await new Promise(resolve => setTimeout(resolve, 10000))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
    console.log('\n✅ Done!')
  }
}

triggerPageview().catch(console.error)
