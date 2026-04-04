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

const OUTPUT_DIR = path.resolve(__dirname, "visual-diff-output")
const LIVE_BASE =
  process.env.LIVE_URL ??
  (process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? "https://www.rewardrelay.app"
    : "https://reward-relay-staging.vercel.app")
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

const DESKTOP_DESIGN_DIR = path.resolve(__dirname, "../../design/stitch_profit_dashboard_v1")
const GAP_DESIGN_DIR = path.resolve(__dirname, "../../design/gap")

const PAGES = [
  // ── Core desktop pages ──────────────────────────────────────────────────
  {
    name: "landing",
    stitch: path.join(DESKTOP_DESIGN_DIR, "reward_relay_landing_page_desktop_updated_portfolio/code.html"),
    live: "/",
    auth: false,
    viewport: "desktop",
  },
  {
    name: "dashboard",
    stitch: path.join(DESKTOP_DESIGN_DIR, "dashboard_desktop/code.html"),
    live: "/dashboard",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "cards",
    stitch: path.join(DESKTOP_DESIGN_DIR, "card_portfolio_desktop/code.html"),
    live: "/cards",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "spending",
    stitch: path.join(DESKTOP_DESIGN_DIR, "spend_tracker_interactive_arc/code.html"),
    live: "/spending",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "profit",
    stitch: path.join(DESKTOP_DESIGN_DIR, "profit_dashboard_desktop/code.html"),
    live: "/profit",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "flights",
    stitch: path.join(DESKTOP_DESIGN_DIR, "flights_desktop_refined/code.html"),
    live: "/flights",
    auth: true,
    viewport: "desktop",
  },
  // ── Gap screens — desktop ────────────────────────────────────────────────
  {
    name: "login",
    stitch: path.join(GAP_DESIGN_DIR, "login_desktop/code.html"),
    live: "/login",
    auth: false,
    viewport: "desktop",
  },
  {
    name: "signup",
    stitch: path.join(GAP_DESIGN_DIR, "sign_up_desktop/code.html"),
    live: "/signup",
    auth: false,
    viewport: "desktop",
  },
  {
    name: "tracker",
    stitch: path.join(GAP_DESIGN_DIR, "tracker_desktop/code.html"),
    live: "/tracker",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "card-detail",
    stitch: path.join(GAP_DESIGN_DIR, "card_detail_desktop/code.html"),
    live: "/cards/detail",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "recommendations",
    stitch: path.join(GAP_DESIGN_DIR, "recommendations_desktop/code.html"),
    live: "/recommendations",
    auth: true,
    viewport: "desktop",
  },
  {
    name: "settings",
    stitch: path.join(GAP_DESIGN_DIR, "settings_desktop/code.html"),
    live: "/settings",
    auth: true,
    viewport: "desktop",
  },
  // ── Gap screens — mobile ─────────────────────────────────────────────────
  {
    name: "login-mobile",
    stitch: path.join(GAP_DESIGN_DIR, "login_mobile/code.html"),
    live: "/login",
    auth: false,
    viewport: "mobile",
  },
  {
    name: "signup-mobile",
    stitch: path.join(GAP_DESIGN_DIR, "sign_up_mobile/code.html"),
    live: "/signup",
    auth: false,
    viewport: "mobile",
  },
  {
    name: "tracker-mobile",
    stitch: path.join(GAP_DESIGN_DIR, "tracker_mobile/code.html"),
    live: "/tracker",
    auth: true,
    viewport: "mobile",
  },
  {
    name: "card-detail-mobile",
    stitch: path.join(GAP_DESIGN_DIR, "card_detail_mobile/code.html"),
    live: "/cards/detail",
    auth: true,
    viewport: "mobile",
  },
  {
    name: "recommendations-mobile",
    stitch: path.join(GAP_DESIGN_DIR, "recommendations_mobile/code.html"),
    live: "/recommendations",
    auth: true,
    viewport: "mobile",
  },
  {
    name: "settings-mobile",
    stitch: path.join(GAP_DESIGN_DIR, "settings_mobile/code.html"),
    live: "/settings",
    auth: true,
    viewport: "mobile",
  },
  // ── Core pages — mobile ──────────────────────────────────────────────────
  {
    name: "dashboard-mobile",
    stitch: "",
    live: "/dashboard",
    auth: true,
    viewport: "mobile",
  },
  {
    name: "cards-mobile",
    stitch: "",
    live: "/cards",
    auth: true,
    viewport: "mobile",
  },
  {
    name: "spending-mobile",
    stitch: "",
    live: "/spending",
    auth: true,
    viewport: "mobile",
  },
] as const

type PageEntry = (typeof PAGES)[number]

async function login(browser: Browser): Promise<void> {
  const email = process.env.TEST_EMAIL
  const password = process.env.TEST_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!email || !password || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("TEST_EMAIL / TEST_PASSWORD / NEXT_PUBLIC_SUPABASE_* not set — check .env.local")
  }

  console.log(`  🔐 Logging in as ${email}...`)

  // Get session tokens directly from Supabase API (bypasses UI login form issues)
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Supabase auth failed: ${res.status} ${await res.text()}`)
  const session = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    user: Record<string, unknown>
  }

  // Inject session as @supabase/ssr cookie (cookie name: sb-<projectRef>-auth-token)
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const cookieValue = JSON.stringify({
    access_token: session.access_token,
    token_type: "bearer",
    expires_in: session.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    refresh_token: session.refresh_token,
    user: session.user,
  })

  const liveHostname = new URL(LIVE_BASE).hostname

  // Chunk if needed (cookies max ~4096 bytes; split at 3000 chars)
  const CHUNK = 3000
  if (cookieValue.length <= CHUNK) {
    await browser.defaultBrowserContext().setCookie({
      name: cookieName,
      value: cookieValue,
      domain: liveHostname,
      path: "/",
    })
  } else {
    const chunks: string[] = []
    for (let i = 0; i < cookieValue.length; i += CHUNK) chunks.push(cookieValue.slice(i, i + CHUNK))
    for (let i = 0; i < chunks.length; i++) {
      await browser.defaultBrowserContext().setCookie({
        name: `${cookieName}.${i}`,
        value: chunks[i],
        domain: liveHostname,
        path: "/",
      })
    }
  }

  console.log(`  ✓ Logged in — session injected via cookie`)
}

async function screenshotPage(
  browser: Browser,
  url: string,
  outputPath: string,
  viewport: { width: number; height: number }
): Promise<void> {
  const page: Page = await browser.newPage()
  await page.setViewport(viewport)

  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })
  } catch {
    // fallback for pages with persistent connections (SSE, websockets)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
  }

  // Let fonts, animations, and data settle
  await new Promise((r) => setTimeout(r, 1500))

  // Hide PostHog debug overlays (exception badge, toolbar) that pollute screenshots
  await page.evaluate(() => {
    // Check for shadow DOM hosts (PostHog mounts toolbar in shadow DOM)
    document.querySelectorAll('*').forEach((el) => {
      if ((el as Element & { shadowRoot?: ShadowRoot }).shadowRoot) {
        ;(el as HTMLElement).style.display = 'none'
      }
    })
    // Also hide any iframes injected by analytics tools
    document.querySelectorAll('iframe[src*="posthog"], iframe[src*="ph-"]').forEach((el) => {
      ;(el as HTMLElement).style.display = 'none'
    })
  }).catch(() => {/* ignore */})

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

  const results: Array<{ name: string; stitch: string; live: string; viewport: string }> = []

  for (const target of targets) {
    console.log(`\n📸  ${target.name.toUpperCase()}`)

    const vp = VIEWPORTS[target.viewport as keyof typeof VIEWPORTS] ?? VIEWPORTS.desktop
    const stitchOut = path.join(OUTPUT_DIR, `${target.name}-stitch.png`)
    const liveOut = path.join(OUTPUT_DIR, `${target.name}-live.png`)

    // Stitch HTML export (file://) — skip if no stitch path defined
    if (target.stitch && fs.existsSync(target.stitch)) {
      await screenshotPage(browser, `file://${target.stitch}`, stitchOut, vp)
    } else if (target.stitch) {
      console.warn(`  ⚠  Stitch export not found: ${target.stitch}`)
    } else {
      console.warn(`  ⚠  No Stitch export configured for ${target.name} — live only`)
    }

    // Live dev server
    await screenshotPage(browser, `${LIVE_BASE}${target.live}`, liveOut, vp)

    results.push({ name: target.name, stitch: stitchOut, live: liveOut, viewport: target.viewport })
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
