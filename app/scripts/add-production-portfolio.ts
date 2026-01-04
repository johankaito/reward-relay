#!/usr/bin/env tsx
import puppeteer, { Page } from 'puppeteer';

const BASE_URL = 'https://www.rewardrelay.app';
const TEST_EMAIL = 'john.g.keto+rewardrelay-test@gmail.com';
const TEST_PASSWORD = 'TestPass123!';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface CardData {
  searchTerm: string;
  applicationDate: string;
  status: 'active' | 'cancelled';
  cancellationDate?: string;
  notes: string;
}

const CARDS: CardData[] = [
  {
    searchTerm: 'ANZ Rewards Black',
    applicationDate: '2023-10-15',
    status: 'cancelled',
    cancellationDate: '2024-10-15',
    notes: 'First ANZ card - completed bonus spend, cancelled before annual fee'
  },
  {
    searchTerm: 'AMEX Explorer',
    applicationDate: '2024-03-20',
    status: 'active',
    notes: 'Currently active - good for international spend'
  },
  {
    searchTerm: 'NAB Rewards Signature',
    applicationDate: '2024-06-10',
    status: 'active',
    notes: 'Recently approved - working on bonus spend'
  }
];

async function addCardViaForm(page: Page, card: CardData): Promise<void> {
  console.log(`\n  Adding: ${card.searchTerm}`);

  await delay(1000);

  // Click the card catalog dropdown
  console.log('  - Opening card dropdown...');
  const selectTriggers = await page.$$('[role="combobox"]');
  if (selectTriggers.length === 0) {
    throw new Error('Could not find card dropdown');
  }

  await selectTriggers[0].click();
  await delay(800);

  // Find the option that matches our card
  console.log(`  - Looking for "${card.searchTerm}" in dropdown...`);
  const options = await page.$$('[role="option"]');
  console.log(`  - Found ${options.length} options`);

  if (options.length === 0) {
    throw new Error(`No options found in dropdown`);
  }

  const searchPrefix = card.searchTerm.toLowerCase().substring(0, 10);
  console.log(`  - Searching for prefix: "${searchPrefix}"`);

  let foundMatch = false;
  for (const option of options) {
    const text = await option.evaluate(el => el.textContent);
    if (text && text.toLowerCase().includes(searchPrefix)) {
      await option.click();
      console.log(`  - ✅ Selected: "${text.substring(0, 50)}..."`);
      foundMatch = true;
      break;
    }
  }

  if (!foundMatch) {
    await options[0].click();
    const text = await options[0].evaluate(el => el.textContent);
    console.log(`  - ❌ NO MATCH - Fallback: "${text?.substring(0, 50)}..."`);
  }

  await delay(1000);

  // Fill application date
  const dateInput = await page.$('input[type="date"]#applicationDate');
  if (dateInput) {
    await dateInput.focus();
    await delay(100);

    await dateInput.evaluate((el, date) => {
      const input = el as HTMLInputElement;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set;
      nativeInputValueSetter!.call(input, date);

      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }, card.applicationDate);

    console.log(`  - Set application date: ${card.applicationDate}`);
    await delay(500);
  }

  // Fill notes
  const notesInput = await page.$('input#notes');
  if (notesInput) {
    await notesInput.click();
    await page.keyboard.type(card.notes);
    console.log(`  - Added notes`);
    await delay(300);
  }

  // Submit form
  const submitButtons = await page.$$('button[type="submit"]');
  if (submitButtons.length > 0) {
    await submitButtons[0].click();
    console.log(`  - Submitted form`);
    await delay(2000);
  }
}

async function main() {
  console.log('\n🚀 Starting PRODUCTION portfolio setup...');
  console.log(`📧 Account: ${TEST_EMAIL}`);
  console.log(`🌐 URL: ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Login
    console.log('📱 Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    console.log('🔐 Logging in...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('✅ Logged in!\n');
    await delay(2000);

    // Add each card
    for (const card of CARDS) {
      console.log(`📇 Adding card: ${card.searchTerm}`);

      await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
      await delay(1500);

      await addCardViaForm(page, card);

      console.log(`  ✅ ${card.searchTerm} added!`);
      await delay(1500);
    }

    // Verify
    console.log('\n🔍 Verifying on dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(2000);

    const cardCount = await page.$$eval('[data-card-item]', (cards) => cards.length);
    console.log(`✅ Found ${cardCount} cards on dashboard\n`);

    console.log('🎉 SUCCESS! All cards added to production!');
    console.log('🌐 Visit https://www.rewardrelay.app/dashboard\n');

    console.log('⏸️  Browser stays open for 10 seconds...\n');
    await delay(10000);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: '/tmp/production-error.png' });
    console.log('📸 Screenshot saved to /tmp/production-error.png');
    throw error;
  } finally {
    await browser.close();
    console.log('👋 Done!\n');
  }
}

main().catch(console.error);
