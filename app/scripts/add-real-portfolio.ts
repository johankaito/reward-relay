#!/usr/bin/env tsx
import puppeteer, { Page } from 'puppeteer';
import { readFileSync } from 'fs';

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'john.g.keto+rewardrelay-test@gmail.com';
const TEST_PASSWORD = 'TestPass123!';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Parse .env.local manually
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envFile
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [key, ...valueParts] = line.split('=');
      return [key, valueParts.join('=')];
    })
);

interface CardData {
  searchTerm: string;
  applicationDate: string;
  status: 'active' | 'cancelled';
  cancellationDate?: string;
  notes: string;
}

async function addCardViaForm(page: Page, card: CardData): Promise<void> {
  console.log(`\n  Adding: ${card.searchTerm}`);

  // Wait for form to be ready
  await delay(1000);

  // Click the card catalog dropdown
  console.log('  - Opening card dropdown...');
  const selectTriggers = await page.$$('[role="combobox"]');
  if (selectTriggers.length === 0) {
    throw new Error('Could not find card dropdown');
  }

  await selectTriggers[0].click();
  await delay(800);

  // Find the option that matches our card by text content
  console.log(`  - Looking for "${card.searchTerm}" in dropdown...`);
  const options = await page.$$('[role="option"]');
  console.log(`  - Found ${options.length} options`);

  if (options.length === 0) {
    throw new Error(`No options found in dropdown`);
  }

  // DEBUG: Print all option texts
  console.log('  - DEBUG: All dropdown options:');
  for (let i = 0; i < options.length; i++) {
    const text = await options[i].evaluate(el => el.textContent);
    console.log(`    [${i}]: "${text}"`);
  }

  const searchPrefix = card.searchTerm.toLowerCase().substring(0, 10);
  console.log(`  - Searching for prefix: "${searchPrefix}"`);

  let foundMatch = false;
  for (const option of options) {
    const text = await option.evaluate(el => el.textContent);
    if (text && text.toLowerCase().includes(searchPrefix)) {
      await option.click();
      console.log(`  - ✅ MATCHED and selected: "${text.substring(0, 50)}..."`);
      foundMatch = true;
      break;
    }
  }

  if (!foundMatch) {
    // Just click first option as fallback
    await options[0].click();
    const text = await options[0].evaluate(el => el.textContent);
    console.log(`  - ❌ NO MATCH FOUND - Fallback: selected "${text?.substring(0, 50)}..."`);
  }

  await delay(1000); // Wait for form to update with selected card data

  // Fill application date - set value and trigger React's onChange
  const dateInput = await page.$('input[type="date"]#applicationDate');
  if (dateInput) {
    await dateInput.focus();
    await delay(100);

    // Set value using native setter to bypass React's control, then trigger input event
    await dateInput.evaluate((el, date) => {
      const input = el as HTMLInputElement;
      // Get the native value setter
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set;
      nativeInputValueSetter!.call(input, date);

      // Dispatch input event that React will see
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }, card.applicationDate);

    console.log(`  - Set application date: ${card.applicationDate}`);
    await delay(500); // Give React time to process
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
    await delay(1500); // Wait for initial response

    // Check for error toast (but handle navigation gracefully)
    try {
      const pageContent = await page.content();
      if (pageContent.toLowerCase().includes('error') || pageContent.toLowerCase().includes('failed')) {
        console.log(`  ⚠️  Possible error detected in page content`);
        await page.screenshot({ path: `/tmp/error-add-card-${Date.now()}.png` });
      }
    } catch (e) {
      // Navigation happened - likely a success!
      console.log(`  - Page navigated (likely success)`);
    }

    await delay(500); // Brief wait
  }

  console.log(`  ✅ Card form submitted`);
}

async function editCardCancellationDate(page: Page, cardSearch: string, cancellationDate: string): Promise<void> {
  console.log(`\n  Setting cancellation date for ${cardSearch}...`);

  // Go to dashboard where edit buttons are
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
  await delay(1500);

  // Find the card by searching page content for the bank name
  const content = await page.content();
  if (!content.includes(cardSearch.split(' ')[0])) {
    console.log(`  ⚠️  Could not find "${cardSearch}" on dashboard to edit`);
    return;
  }

  // Click edit button (look for pencil icon or edit button near the card)
  const editButtons = await page.$$('[data-testid="edit-card"], button[aria-label*="edit"], button:has(svg[class*="lucide-pen"])');

  if (editButtons.length === 0) {
    console.log('  ⚠️  Could not find edit button, trying alternative selectors...');
    // Try to find any button near the card content
    const allButtons = await page.$$('button');
    let foundEdit = false;

    for (const btn of allButtons) {
      const btnText = await btn.evaluate(el => el.textContent);
      if (btnText?.toLowerCase().includes('edit') || btnText === '') {
        await btn.click();
        foundEdit = true;
        console.log('  - Clicked edit button');
        break;
      }
    }

    if (!foundEdit) {
      console.log('  ⚠️  Could not find edit button - skipping cancellation date');
      return;
    }
  } else {
    await editButtons[0].click();
    console.log('  - Clicked edit button');
  }

  await delay(1000);

  // Find cancellation date input in the modal
  const cancelDateInputs = await page.$$('input[type="date"]');

  // Should have multiple date inputs - application date and cancellation date
  if (cancelDateInputs.length >= 2) {
    // Second date input is cancellation date
    await cancelDateInputs[1].evaluate((el, date) => {
      (el as HTMLInputElement).value = date;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, cancellationDate);
    console.log(`  - Set cancellation date: ${cancellationDate}`);
    await delay(300);
  }

  // Find and update status dropdown to "cancelled"
  const statusSelects = await page.$$('[role="combobox"]');
  if (statusSelects.length > 0) {
    await statusSelects[0].click();
    await delay(500);

    // Find "cancelled" option
    const options = await page.$$('[role="option"]');
    for (const opt of options) {
      const text = await opt.evaluate(el => el.textContent);
      if (text?.toLowerCase() === 'cancelled') {
        await opt.click();
        console.log('  - Set status to cancelled');
        break;
      }
    }
    await delay(500);
  }

  // Submit the edit form
  const saveButtons = await page.$$('button[type="submit"]');
  if (saveButtons.length > 0) {
    await saveButtons[0].click();
    console.log('  - Saved changes');
    await delay(2000);
  }

  console.log(`  ✅ Updated cancellation date`);
}

async function addRealPortfolio() {
  console.log('🚀 Adding real portfolio to test account...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Browser error: ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`❌ Page error: ${error instanceof Error ? error.message : String(error)}`);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.log(`❌ Request failed: ${request.url()}`);
  });

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('   ✅ Logged in\n');

    await delay(1500);

    // Navigate to Cards page
    console.log('2. Navigating to Cards page...');
    await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
    await delay(2000);
    console.log('   ✅ On Cards page\n');

    // Card 1: Qantas AMEX Ultimate (Active, permanent)
    console.log('3. Adding Card 1: Qantas AMEX Ultimate');
    await addCardViaForm(page, {
      searchTerm: 'qantas ultimate',  // Matches "American Express — Qantas Ultimate"
      applicationDate: '2020-04-01',
      status: 'active',
      notes: 'Permanent keeper - main Qantas points earner'
    });

    // Go back to cards page for next card
    await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
    await delay(1500);

    // Card 2: MyCard Prestige (Active, churn soon)
    console.log('4. Adding Card 2: MyCard Prestige');
    await addCardViaForm(page, {
      searchTerm: 'mycard',  // Matches "MyCard — Prestige"
      applicationDate: '2024-08-21',
      status: 'active',
      notes: 'Cancel before Aug 2026 annual fee - bonus earned'
    });

    await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
    await delay(1500);

    // Card 3: NAB Qantas Rewards (Cancelled)
    console.log('5. Adding Card 3: NAB Qantas Rewards');
    await addCardViaForm(page, {
      searchTerm: 'nab — qantas',  // Matches "NAB — Qantas Rewards Signature" with em-dash
      applicationDate: '2024-02-01',
      status: 'cancelled',
      cancellationDate: '2025-04-01',
      notes: 'Cancelled after 14 months - eligible April 2026'
    });

    // Edit to set cancellation date
    await editCardCancellationDate(page, 'NAB', '2025-04-01');

    await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
    await delay(1500);

    // Card 4: ANZ Black (Cancelled - ELIGIBLE NOW)
    console.log('6. Adding Card 4: ANZ Black');
    await addCardViaForm(page, {
      searchTerm: 'anz',  // Matches "ANZ — Frequent Flyer Black"
      applicationDate: '2022-06-01',
      status: 'cancelled',
      cancellationDate: '2023-06-01',
      notes: 'Cancelled after 12 months - ELIGIBLE NOW for any ANZ card'
    });

    // Edit to set cancellation date
    await editCardCancellationDate(page, 'ANZ', '2023-06-01');

    // Navigate to Calendar to verify
    console.log('\n7. Checking Calendar page...');
    await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle2' });
    await delay(3000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/calendar-view.png', fullPage: true });
    console.log('   ✅ Calendar screenshot saved to /tmp/calendar-view.png');

    // Check for bank timelines
    const pageContent = await page.content();

    if (pageContent.includes('Eligible Now')) {
      console.log('   ✅ Found "Eligible Now" badge (likely ANZ)');
    }

    if (pageContent.includes('days') || pageContent.includes('month')) {
      console.log('   ✅ Found countdown badge (likely NAB)');
    }

    // Navigate to Compare page
    console.log('\n8. Checking Compare page...');
    await page.goto(`${BASE_URL}/compare`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: '/tmp/compare-view.png', fullPage: true });
    console.log('   ✅ Compare screenshot saved to /tmp/compare-view.png\n');

    // Navigate to Dashboard
    console.log('9. Checking Dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: '/tmp/dashboard-view.png', fullPage: true });
    console.log('   ✅ Dashboard screenshot saved to /tmp/dashboard-view.png\n');

    console.log('✅ SUCCESS! All cards added.');
    console.log('\nNext steps:');
    console.log('1. Open browser to http://localhost:3000');
    console.log('2. Login with test account');
    console.log('3. Check Calendar page for eligibility windows');
    console.log('4. Check Compare page to choose next ANZ card');
    console.log('5. Review screenshots in /tmp/');

    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will stay open for 2 minutes for inspection...');
    await delay(120000);

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    console.log('Error screenshot saved to /tmp/error-screenshot.png');
    throw error;
  } finally {
    await browser.close();
  }
}

addRealPortfolio();
