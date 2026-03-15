import puppeteer, { type Page, type Browser } from 'puppeteer'

const BASE  = 'https://www.rewardrelay.app'
const EMAIL = 'john.g.keto+rewardrelay-test@gmail.com'
const PASS  = 'TestPass123!'

interface Result { test: string; pass: boolean; detail: string }
const results: Result[] = []
const pass = (t: string, d = '') => { results.push({ test:t, pass:true,  detail:d }); console.log(`  ✅ PASS  ${t}${d?' — '+d:''}`) }
const fail = (t: string, d = '') => { results.push({ test:t, pass:false, detail:d }); console.log(`  ❌ FAIL  ${t}${d?' — '+d:''}`) }

async function visitAuth(page: Page, path: string): Promise<{ url: string; title: string; h1: string }> {
  await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 20000 })
  const url   = page.url()
  const title = await page.title().catch(() => '')
  const h1    = await page.$eval('h1', el => el.textContent?.trim() ?? '').catch(() => '')
  return { url, title, h1 }
}

async function main() {
  console.log(`\n🔍 Authenticated smoke test → ${BASE}\n`)

  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    })

    // ── Phase 1: public pages ──────────────────────────────────────────────────
    const pub = await browser.newPage()
    pub.setDefaultTimeout(20000)

    // 1. Homepage title
    await pub.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    const homeTitle = await pub.title()
    ;(homeTitle.toLowerCase().includes('reward') || homeTitle.toLowerCase().includes('relay'))
      ? pass('1. Homepage title', `"${homeTitle}"`)
      : fail('1. Homepage title', `got "${homeTitle}"`)

    // 2. /login submit button
    await pub.goto(BASE + '/login', { waitUntil: 'networkidle0' })
    let loginBtn = null
    try {
      await pub.waitForSelector('button[type="submit"],input[type="submit"],button:not([type])', { timeout: 10000 })
      loginBtn = await pub.$('button[type="submit"],input[type="submit"],button:not([type])')
    } catch {}
    loginBtn ? pass('2. /login has submit button') : fail('2. /login has submit button', `URL: ${pub.url()}`)

    // 3. /signup submit button
    await pub.goto(BASE + '/signup', { waitUntil: 'networkidle0' })
    let signupBtn = null
    try {
      await pub.waitForSelector('button[type="submit"],input[type="submit"]', { timeout: 10000 })
      signupBtn = await pub.$('button[type="submit"],input[type="submit"]')
    } catch {}
    signupBtn ? pass('3. /signup has submit button') : fail('3. /signup has submit button', `URL: ${pub.url()}`)
    await pub.close()

    // ── Phase 2: login ─────────────────────────────────────────────────────────
    console.log('\n🔐 Logging in…')
    const auth = await browser.newPage()
    auth.setDefaultTimeout(20000)
    await auth.goto(BASE + '/login', { waitUntil: 'networkidle0' })

    // Fill credentials
    await auth.waitForSelector('input[type="email"],input[name="email"]', { timeout: 10000 })
    await auth.type('input[type="email"],input[name="email"]', EMAIL, { delay: 40 })
    await auth.type('input[type="password"],input[name="password"]', PASS, { delay: 40 })

    // Submit + wait for nav
    await Promise.all([
      auth.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
      auth.click('button[type="submit"],input[type="submit"]'),
    ])

    const afterLogin = auth.url()
    const onLogin    = afterLogin.includes('/login')
    if (onLogin) {
      fail('4. Login succeeds', `still on ${afterLogin}`)
      console.log('\n⚠️  Cannot test authenticated routes — login failed.')
      await browser.close()
      printSummary()
      return
    }
    pass('4. Login succeeds', `→ ${afterLogin}`)
    console.log(`\n🔒 Authenticated session active (${afterLogin})\n`)

    // ── Phase 3: authenticated route checks ────────────────────────────────────
    const routes: Array<[number, string, string]> = [
      [5,  '/dashboard', ''],
      [6,  '/cards',     ''],
      [7,  '/tracker',   ''],
      [8,  '/deals',     'DA'],
      [9,  '/insights',  'NP'],
      [10, '/milestones','GM'],
      [11, '/flights',   'AF'],
      [12, '/business',  'BT'],
      [13, '/inquiries', 'CI'],
    ]

    for (const [num, path, epic] of routes) {
      const label = `${num}. ${path}${epic ? ' [' + epic + ']' : ''}`
      try {
        const { url, title, h1 } = await visitAuth(auth, path)
        const redirectedToLogin  = url.includes('/login') || url.includes('/signin')
        const is404 = title.toLowerCase().includes('404') || title.toLowerCase().includes('not found') || title === ''
        const detail = `url=${url} | title="${title}" | h1="${h1}"`

        if (redirectedToLogin) {
          fail(label, `redirected back to login — ${url}`)
        } else if (is404) {
          fail(label, `404/blank — ${detail}`)
        } else {
          pass(label, detail)
        }
      } catch (e: any) {
        fail(label, `error: ${e?.message}`)
      }
    }

    await browser.close()
    browser = null
  } catch (e: any) {
    if (browser) await browser.close()
    fail('Puppeteer fatal', String(e?.message))
  }

  printSummary()
}

function printSummary() {
  const passed = results.filter(r => r.pass).length
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`RESULT: ${passed}/${results.length} passed`)
  if (passed < results.length) {
    console.log('\nFAILURES:')
    results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.test}: ${r.detail}`))
  }
  console.log(`${'─'.repeat(60)}\n`)
  process.exit(passed === results.length ? 0 : 1)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
