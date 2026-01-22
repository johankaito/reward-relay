#!/usr/bin/env tsx
import puppeteer from 'puppeteer'

async function debugPostHog() {
  console.log('🔍 Debugging PostHog loading on production...\n')

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  })

  try {
    const page = await browser.newPage()

    // Enable all console logs
    page.on('console', msg => {
      console.log(`[Browser ${msg.type()}]:`, msg.text())
    })

    // Listen for errors
    page.on('pageerror', (error: Error) => {
      console.error(`❌ [Page Error]:`, error.message)
    })

    // Listen for script loads
    page.on('response', async response => {
      const url = response.url()
      if (url.includes('posthog') || url.includes('.js')) {
        console.log(`📦 [Script ${response.status()}]: ${url.substring(0, 100)}`)
      }
    })

    console.log('📍 Navigating to https://www.rewardrelay.app/')
    await page.goto('https://www.rewardrelay.app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('\n✅ Page loaded\n')

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check what's on the window object
    const windowCheck = await page.evaluate(() => {
      return {
        // @ts-ignore
        hasPostHog: typeof window.posthog !== 'undefined',
        // @ts-ignore
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('post') || k.toLowerCase().includes('analytics')),
        // @ts-ignore
        hasAnalyticsProvider: typeof window.__ANALYTICS_PROVIDER !== 'undefined'
      }
    })

    console.log('\n🔍 Window object check:')
    console.log(JSON.stringify(windowCheck, null, 2))

    // Check if the AnalyticsProvider component is in the DOM
    const domCheck = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'))
      return {
        scriptCount: scripts.length,
        hasPostHogScript: scripts.some(s => s.src && s.src.includes('posthog')),
        bodyClasses: document.body.className,
        hasProviders: document.querySelector('[data-provider]') !== null
      }
    })

    console.log('\n🔍 DOM check:')
    console.log(JSON.stringify(domCheck, null, 2))

    // Check environment variables in the page
    const envCheck = await page.evaluate(() => {
      // In Next.js, NEXT_PUBLIC_ vars are replaced at build time
      // They won't be in process.env on the client, but will be inlined as string literals

      // Try to find them in the bundled JS
      return {
        note: 'NEXT_PUBLIC vars are inlined at build time, not available in process.env on client',
        // @ts-ignore
        hasWindow: typeof window !== 'undefined',
        // @ts-ignore
        location: window.location.href
      }
    })

    console.log('\n🔍 Environment check:')
    console.log(JSON.stringify(envCheck, null, 2))

    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...')
    await new Promise(resolve => setTimeout(resolve, 10000))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }
}

debugPostHog()
