import { load } from 'cheerio'

export interface FetchedPage {
  markdown: string
  tier: 1 | 2
  url: string
}

// Card URL catalogue — maps card slugs to their product page URLs and fetch tier
export const CARD_PAGE_URLS: Record<string, { url: string; tier: 1 | 2 }> = {
  // Tier 1 — server-side rendered (direct HTTP)
  'anz-frequent-flyer-black': {
    url: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer-black/',
    tier: 1,
  },
  'anz-frequent-flyer': {
    url: 'https://www.anz.com.au/personal/credit-cards/frequent-flyer/',
    tier: 1,
  },
  'anz-rewards-black': {
    url: 'https://www.anz.com.au/personal/credit-cards/rewards-black/',
    tier: 1,
  },
  'nab-qantas-rewards-signature': {
    url: 'https://www.nab.com.au/personal-banking/credit-cards/qantas-rewards-signature-card',
    tier: 1,
  },
  'nab-rewards-signature': {
    url: 'https://www.nab.com.au/personal-banking/credit-cards/nab-rewards-signature-card',
    tier: 1,
  },
  'westpac-altitude-black': {
    url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-black/',
    tier: 1,
  },
  'westpac-altitude-platinum': {
    url: 'https://www.westpac.com.au/personal-banking/credit-cards/rewards/altitude-platinum/',
    tier: 1,
  },
  'hsbc-star-alliance': {
    url: 'https://www.hsbc.com.au/credit-cards/products/star-alliance/',
    tier: 1,
  },
  'stgeorge-amplify-signature': {
    url: 'https://www.stgeorge.com.au/personal/credit-cards/rewards/amplify-signature',
    tier: 1,
  },
  'bankwest-qantas-world-mastercard': {
    url: 'https://www.bankwest.com.au/personal/credit-cards/rewards/qantas-world',
    tier: 1,
  },
  // Tier 2 — JS-rendered (Firecrawl)
  'cba-awards': {
    url: 'https://www.commbank.com.au/personal/credit-cards/commbank-awards-credit-card.html',
    tier: 2,
  },
  'cba-diamond-awards': {
    url: 'https://www.commbank.com.au/personal/credit-cards/commbank-awards-credit-card-diamond.html',
    tier: 2,
  },
  'amex-platinum': {
    url: 'https://www.americanexpress.com/en-au/credit-cards/platinum-card/',
    tier: 2,
  },
  'amex-explorer': {
    url: 'https://www.americanexpress.com/en-au/credit-cards/explorer-credit-card/',
    tier: 2,
  },
  'amex-frequent-flyer-ascent-premium': {
    url: 'https://www.americanexpress.com/en-au/credit-cards/qantas-frequent-flyer-premium/',
    tier: 2,
  },
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; RewardRelay/1.0)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-AU,en;q=0.9',
}

function htmlToMarkdown(html: string): string {
  const $ = load(html)

  // Remove non-content elements
  $(
    'nav, header, footer, script, style, noscript, iframe, .nav, .header, .footer, .navigation, .menu, .sidebar, .breadcrumb, .cookie, .advertisement, .ad, [class*="nav"], [class*="footer"], [class*="header"]',
  ).remove()

  // Focus on main content
  const mainContent = $(
    'main, [role="main"], .main-content, #main-content, article, .product-content, .card-details, .credit-card-details',
  ).first()

  const contentEl = mainContent.length ? mainContent : $('body')

  let markdown = ''
  contentEl
    .find(
      'h1, h2, h3, h4, h5, h6, p, li, td, th, [class*="fee"], [class*="rate"], [class*="earn"], [class*="bonus"], [class*="reward"], [class*="annual"]',
    )
    .each((_, el) => {
      const tag = el.type === 'tag' ? el.name.toLowerCase() : ''
      const text = $(el).text().trim().replace(/\s+/g, ' ')
      if (!text || !tag) return

      if (tag === 'h1') markdown += `# ${text}\n\n`
      else if (tag === 'h2') markdown += `## ${text}\n\n`
      else if (tag === 'h3') markdown += `### ${text}\n\n`
      else if (tag === 'h4' || tag === 'h5' || tag === 'h6') markdown += `#### ${text}\n\n`
      else if (tag === 'li') markdown += `- ${text}\n`
      else if (tag === 'td' || tag === 'th') markdown += `| ${text} `
      else markdown += `${text}\n\n`
    })

  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 15000)
}

async function fetchTier1(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`)
  }

  const html = await response.text()
  return htmlToMarkdown(html)
}

async function fetchTier2(url: string): Promise<string> {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY

  if (!firecrawlApiKey) {
    console.warn(`FIRECRAWL_API_KEY not set, falling back to Tier 1 for ${url}`)
    return fetchTier1(url)
  }

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firecrawlApiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    console.warn(`Firecrawl returned ${response.status} for ${url}, falling back to Tier 1`)
    return fetchTier1(url)
  }

  const data = (await response.json()) as { data?: { markdown?: string }; markdown?: string }
  const markdown = data.data?.markdown ?? data.markdown ?? ''

  if (!markdown) {
    console.warn(`Firecrawl returned empty markdown for ${url}, falling back to Tier 1`)
    return fetchTier1(url)
  }

  return markdown.slice(0, 15000)
}

export async function fetchCardPage(cardSlug: string): Promise<FetchedPage> {
  const config = CARD_PAGE_URLS[cardSlug]
  if (!config) {
    throw new Error(`No URL configured for card slug: ${cardSlug}`)
  }

  const { url, tier } = config
  const markdown = tier === 2 ? await fetchTier2(url) : await fetchTier1(url)

  return { markdown, tier, url }
}

export async function fetchCardPageByUrl(url: string, tier: 1 | 2 = 1): Promise<FetchedPage> {
  const markdown = tier === 2 ? await fetchTier2(url) : await fetchTier1(url)
  return { markdown, tier, url }
}
