#!/usr/bin/env tsx
import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'john.g.keto+rewardrelay-test@gmail.com';
const TEST_PASSWORD = 'TestPass123!';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testDateInput() {
  console.log('🧪 Testing date input fix...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   ✅ Logged in\n');

    // Navigate to Cards page
    console.log('2. Navigating to Cards page...');
    await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
    await delay(2000);
    console.log('   ✅ On Cards page\n');

    // Select a card from dropdown
    console.log('3. Selecting card from dropdown...');
    const selectTriggers = await page.$$('[role="combobox"]');
    await selectTriggers[0].click();
    await delay(800);

    const options = await page.$$('[role="option"]');
    // Select "American Express — Qantas Ultimate" (option 3)
    await options[3].click();
    console.log('   ✅ Selected Qantas Ultimate\n');
    await delay(1000);

    // Fill date using native setter method
    console.log('4. Filling application date...');
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
      }, '2020-04-01');

      console.log('   - Set: 2020-04-01');
      await delay(500);
    }
    console.log('   ✅ Date filled\n');

    // Fill notes
    console.log('5. Filling notes...');
    const notesInput = await page.$('input#notes');
    if (notesInput) {
      await notesInput.click();
      await page.keyboard.type('Test date input fix');
      await delay(300);
    }
    console.log('   ✅ Notes filled\n');

    // Submit
    console.log('6. Submitting form...');
    const submitButtons = await page.$$('button[type="submit"]');
    await submitButtons[0].click();
    await delay(2000);
    console.log('   ✅ Submitted\n');

    // Take screenshot
    await page.screenshot({ path: '/tmp/test-date-input.png' });
    console.log('📸 Screenshot saved to /tmp/test-date-input.png');

    console.log('\n✅ Test complete! Check database with: pnpm tsx check-cards.ts');
    await delay(3000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testDateInput();
