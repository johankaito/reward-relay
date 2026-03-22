/**
 * Visual diff tool — screenshots Stitch HTML exports vs live dev server
 * Usage: pnpm visual-diff [page]
 *        pnpm visual-diff landing
 *        pnpm visual-diff          (all pages)
 *
 * Output: tests/visual-diff-output/{page}-stitch.png + {page}-live.png
 * Authenticated pages are handled automatically using TEST_EMAIL / TEST_PASSWORD from .env.local
 */

import puppeteer, { type Browser, type Page } from "puppeteer"
import path from "path"
import fs from "fs"

// Load .env.local so TEST_EMAIL / TEST_PASSWORD are available without extra setup
const envLocal = path.resolve(__dirname, "../.env.local")
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] ??= match[2].trim()
  }
}

const DESIGN_DIR = path.resolve(__dirname, "../../design/stitch_profit_dashboard_v1")
const OUTPUT_DIR = path.resolve(__dirname, "visual-diff-output")
const LIVE_BASE = process.env.LIVE_URL ?? "http://localhost:3000"
const VIEWPORT = { width: 1440, height: 900 }

const PAGES = [
  {
    name: "landing",
    stitch: "reward_relay_landing_page_desktop_updated_portfolio/code.html",
    live: "/",
    auth: false,
  },
  {
    name: "dashboard",
    stitch: "dashboard_desktop/code.html",
    live: "/dashboard",
    auth: true,
  },
  {
    name: "cards",
    stitch: "card_portfolio_desktop/code.html",
    live: "/cards",
    auth: true,
  },
  {
    name: "spending",
    stitch: "spend_tracker_interactive_arc/code.html",
    live: "/spending",
    auth: true,
  },
  {
    name: "profit",
    stitch: "profit_dashboard_desktop/code.html",
    live: "/profit",
    auth: true,
  },
  {
    name: "flights",
    stitch: "flights_desktop_refined/code.html",
    live: "/flights",
    auth: true,
  },
] as const

async function login(browser: Browser): Promise<void> {
  const email = process.env.TEST_EMAIL
  const password = process.env.TEST_PASSWORD

  if (!email || !password) {
    throw new Error("TEST_EMAIL / TEST_PASSWORD not set — check .env.local")
  }

  console.log(`  🔐 Logging in as ${email}...`)
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  await page.goto(`${LIVE_BASE}/login`, { waitUntil: "networkidle0", timeout: 30000 })

  // Fill email + password and submit
  await page.locator('input[type="email"], input[name="email"]').fill(email)
  await page.locator('input[type="password"], input[name="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to dashboard
  await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 })

  const url = page.url()
  if (url.includes("/login") || url.includes("/auth")) {
    throw new Error(`Login failed — still on ${url}. Check credentials in .env.local`)
  }

  console.log(`  ✓ Logged in — session established`)
  await page.close()
}

async function screenshotPage(browser: Browser, url: string, outputPath: string): Promise<void> {
  const page: Page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })
  } catch {
    // fallback for pages with persistent connections (SSE, websockets)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
  }

  // Let fonts, animations, and data settle
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: outputPath as `${string}.png`, fullPage: true })
  await page.close()
  console.log(`  ✓ ${path.basename(outputPath)}`)
}

async function main() {
  const filter = process.argv[2]
  const targets = filter ? PAGES.filter((p) => p.name === filter) : [...PAGES]

  if (filter && targets.length === 0) {
    console.error(`Unknown page: "${filter}". Valid: ${PAGES.map((p) => p.name).join(", ")}`)
    process.exit(1)
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  })

  // Log in once if any target page requires auth — Puppeteer shares cookies across pages in same browser
  const needsAuth = targets.some((t) => t.auth)
  if (needsAuth) {
    await login(browser)
  }

  const results: Array<{ name: string; stitch: string; live: string }> = []

  for (const target of targets) {
    console.log(`\n📸  ${target.name.toUpperCase()}`)

    const stitchOut = path.join(OUTPUT_DIR, `${target.name}-stitch.png`)
    const liveOut = path.join(OUTPUT_DIR, `${target.name}-live.png`)

    // Stitch HTML export (file://)
    const stitchFile = path.join(DESIGN_DIR, target.stitch)
    if (fs.existsSync(stitchFile)) {
      await screenshotPage(browser, `file://${stitchFile}`, stitchOut)
    } else {
      console.warn(`  ⚠  Stitch export not found: ${stitchFile}`)
    }

    // Live dev server
    await screenshotPage(browser, `${LIVE_BASE}${target.live}`, liveOut)

    results.push({ name: target.name, stitch: stitchOut, live: liveOut })
  }

  await browser.close()

  // Write manifest for visual-diff-report.ts to consume
  const manifest = path.join(OUTPUT_DIR, "manifest.json")
  fs.writeFileSync(manifest, JSON.stringify(results, null, 2))

  console.log(`\n✅  Done. Screenshots in: ${OUTPUT_DIR}`)
  console.log(`   Manifest: ${manifest}`)
  console.log(`\n   Next: pnpm visual-diff:report`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
