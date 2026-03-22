/**
 * Visual diff tool — screenshots Stitch HTML exports vs live dev server
 * Usage: pnpm tsx tests/visual-diff.ts [page]
 *        pnpm tsx tests/visual-diff.ts landing
 *        pnpm tsx tests/visual-diff.ts  (all pages)
 *
 * Output: tests/visual-diff-output/{page}-stitch.png + {page}-live.png
 *
 * After running, pass the screenshot pairs to claude-qa for a visual gap report.
 */

import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"

const DESIGN_DIR = path.resolve(__dirname, "../../design/stitch_profit_dashboard_v1")
const OUTPUT_DIR = path.resolve(__dirname, "visual-diff-output")
const LIVE_BASE = process.env.LIVE_URL ?? "http://localhost:3000"
const VIEWPORT = { width: 1440, height: 900 }

const PAGES = [
  {
    name: "landing",
    stitch: "reward_relay_landing_page_desktop_updated_portfolio/code.html",
    live: "/",
    waitFor: "networkidle0",
  },
  {
    name: "dashboard",
    stitch: "dashboard_desktop/code.html",
    live: "/dashboard",
    waitFor: "networkidle0",
  },
  {
    name: "cards",
    stitch: "card_portfolio_desktop/code.html",
    live: "/cards",
    waitFor: "networkidle0",
  },
  {
    name: "spending",
    stitch: "spend_tracker_interactive_arc/code.html",
    live: "/spending",
    waitFor: "networkidle0",
  },
  {
    name: "profit",
    stitch: "profit_dashboard_desktop/code.html",
    live: "/profit",
    waitFor: "networkidle0",
  },
  {
    name: "flights",
    stitch: "flights_desktop_refined/code.html",
    live: "/flights",
    waitFor: "networkidle0",
  },
] as const

async function screenshotPage(
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  url: string,
  outputPath: string
) {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })
  } catch {
    // fallback if networkidle0 times out (e.g. SSE/websocket connections)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
  }
  // Let animations/fonts settle
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

  const results: Array<{ name: string; stitch: string; live: string }> = []

  for (const target of targets) {
    console.log(`\n📸  ${target.name.toUpperCase()}`)

    const stitchOut = path.join(OUTPUT_DIR, `${target.name}-stitch.png`)
    const liveOut = path.join(OUTPUT_DIR, `${target.name}-live.png`)

    // Stitch HTML export
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

  // Write manifest for qa script to consume
  const manifest = path.join(OUTPUT_DIR, "manifest.json")
  fs.writeFileSync(manifest, JSON.stringify(results, null, 2))

  console.log(`\n✅  Done. Screenshots in: ${OUTPUT_DIR}`)
  console.log(`   Manifest: ${manifest}`)
  console.log(`\n   Next: pnpm tsx tests/visual-diff-report.ts`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
