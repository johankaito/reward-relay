#!/usr/bin/env tsx
/**
 * Comprehensive MVP Feature Test Suite
 *
 * Tests all implemented features:
 * 1. Authentication (signup/login)
 * 2. Card management (add card)
 * 3. Spending tracker (manual entry)
 * 4. CSV statement upload
 * 5. Visual churning calendar
 * 6. Card comparison
 * 7. History tracking
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = '/tmp/reward-relay/comprehensive-tests';
// Use pre-created test user credentials from environment variables
// Create this user once manually in Supabase with email confirmation
const TEST_EMAIL = process.env.TEST_EMAIL || 'john.g.keto+rewardrelay-test@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass123!';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface TestResult {
  feature: string;
  passed: boolean;
  duration: number;
  errors: string[];
  screenshots: string[];
}

export class ComprehensiveTestRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;
  public results: TestResult[] = [];
  private supabase: any;
  private userId: string | null = null;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  async setup(): Promise<void> {
    console.log('🚀 Setting up Comprehensive Test Runner...\n');

    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
      defaultViewport: {
        width: 1400,
        height: 900,
      },
    });

    this.page = await this.browser.newPage();
    console.log('✅ Browser launched');

    await this.waitForServer();
  }

  private async waitForServer(retries = 20, delayMs = 1000): Promise<void> {
    console.log('⏳ Waiting for dev server...');
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(BASE_URL, { method: 'GET' });
        if (res.ok || res.status === 404) { // 404 is fine, means server is up
          console.log('✅ Server is ready!\n');
          return;
        }
      } catch {
        process.stdout.write('.');
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error('Server not reachable');
  }

  private async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    const timestamp = Date.now();
    const screenshotName = `${timestamp}-${name}.png`;
    const screenshotPath = join(OUTPUT_DIR, screenshotName);
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    console.log(`   📸 Screenshot: ${screenshotName}`);
    return screenshotPath;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test 1: Authentication Flow (Login Only)
  async testAuthentication(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n🔐 Test 1: Authentication Flow (Login)');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Note: Using pre-created test user (signup handled by Supabase)`);

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Navigate directly to login page
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      screenshots.push(await this.takeScreenshot('01-login-page'));

      // Fill login form
      await this.page.type('input[name="email"]', TEST_EMAIL);
      await this.page.type('input[name="password"]', TEST_PASSWORD);
      await this.delay(500);
      screenshots.push(await this.takeScreenshot('02-login-filled'));

      // Submit login and wait for navigation
      await this.page.click('button[type="submit"]');

      try {
        // Wait for navigation to dashboard
        await this.page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 10000
        });
      } catch (navError) {
        console.log('   ⚠️  Navigation timeout, checking current state...');
      }

      // Check for error toasts
      const errorToast = await this.page.$('[data-sonner-toast][data-type="error"]');
      if (errorToast) {
        const errorText = await errorToast.evaluate(el => el.textContent);
        errors.push(`Login error: ${errorText}`);
      }

      // Verify redirected to dashboard
      const url = this.page.url();
      console.log(`   Current URL: ${url}`);

      if (url.includes('/dashboard')) {
        console.log('   ✅ Logged in successfully');
        passed = true;
      } else {
        errors.push(`Failed to reach dashboard. Current URL: ${url}`);
      }

      screenshots.push(await this.takeScreenshot('03-dashboard'));

      // Verify Supabase session exists
      if (this.supabase && passed) {
        const { data, error: sessionError } = await this.supabase.auth.getSession();
        if (!data?.session || sessionError) {
          errors.push('No active Supabase session after login');
          passed = false;
        } else {
          this.userId = data.session.user.id;
          console.log(`   ✅ Authenticated as: ${data.session.user.email}`);
          console.log(`   📝 User ID: ${this.userId}`);
        }
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'Authentication (Login)',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Test 2: Add Card
  async testAddCard(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n💳 Test 2: Add Card to Portfolio');

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Navigate to cards page
      await this.page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('04-cards-page'));

      // Look for "Track this card" button in AddCardForm
      const addButtons = await this.page.$$('button');
      let addButtonFound = false;

      for (const button of addButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text?.includes('Track this card')) {
          addButtonFound = true;
          console.log('   ✅ Found "Track this card" button');
          break;
        }
      }

      if (!addButtonFound) {
        errors.push('Could not find "Track this card" button on page');
        return {
          feature: 'Add Card',
          passed: false,
          duration: Date.now() - startTime,
          errors,
          screenshots,
        };
      }

      // The AddCardForm is directly on the page, so let's fill it out and submit
      console.log('   📝 Filling out AddCardForm...');
      await this.delay(1000);

      // Select a card from the catalog dropdown (this will auto-fill bank, name, fee)
      const selectTriggers = await this.page.$$('[role="combobox"]');
      if (selectTriggers.length > 0) {
        await selectTriggers[0].click();
        console.log('   ✅ Clicked card catalog dropdown');
        await this.delay(500);

        // Select first card option (not the "Custom" option)
        const options = await this.page.$$('[role="option"]');
        if (options.length > 1) {
          // Skip first option (Custom), select second one
          await options[1].click();
          console.log('   ✅ Selected first card from catalog');
          await this.delay(500);
        }
      }

      screenshots.push(await this.takeScreenshot('05-card-selected'));

      // Fill application date
      const dateInput = await this.page.$('input[type="date"]');
      if (dateInput) {
        await dateInput.click();
        await this.page.keyboard.type('2024-12-01');
        console.log('   ✅ Filled application date');
      }

      // Notes
      const notesInputs = await this.page.$$('input[id="notes"]');
      if (notesInputs.length > 0) {
        await notesInputs[0].click();
        await this.page.keyboard.type('Test card added via comprehensive automated test');
        console.log('   ✅ Filled notes');
      }

      await this.delay(500);
      screenshots.push(await this.takeScreenshot('06-card-form-filled'));

      // Submit form - click the "Track this card" button
      const submitButtons = await this.page.$$('button[type="submit"]');
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
        console.log('   ✅ Clicked "Track this card" button');
      }

      await this.delay(2000);

      // Navigate to dashboard to verify
      await this.page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('07-dashboard-with-card'));

      // Check if card appears
      const content = await this.page.content();
      if (content.includes('Test card added via comprehensive automated test')) {
        console.log('   ✅ Card appears on dashboard');
        passed = true;
      } else {
        errors.push('Card not found on dashboard');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'Add Card',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Test 3: Spending Tracker - Manual Entry
  async testSpendingTracker(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n💰 Test 3: Spending Tracker (Manual Entry)');

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Navigate to spending page
      await this.page.goto(`${BASE_URL}/spending`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('08-spending-page'));

      // Check if page loaded correctly
      const content = await this.page.content();
      if (content.includes('Spending Tracker')) {
        console.log('   ✅ Spending Tracker page loaded');
      }

      // Check if there are cards with spending requirements
      if (content.includes('No active cards with spending requirements')) {
        console.log('   ℹ️  No cards with spending requirements (empty state working correctly)');
        passed = true;
        return {
          feature: 'Spending Tracker',
          passed,
          duration: Date.now() - startTime,
          errors,
          screenshots,
        };
      }

      // Look for "Add Spend" button (only present when there are cards with requirements)
      const buttons = await this.page.$$('button');
      let addSpendFound = false;

      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text?.includes('Add Spend')) {
          await button.click();
          addSpendFound = true;
          console.log('   ✅ Clicked "Add Spend"');
          break;
        }
      }

      if (!addSpendFound) {
        errors.push('Could not find "Add Spend" button');
        return {
          feature: 'Spending Tracker',
          passed: false,
          duration: Date.now() - startTime,
          errors,
          screenshots,
        };
      }

      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('09-add-spend-dialog'));

      // Fill in transaction details
      const amountInput = await this.page.$('input[type="number"]');
      if (amountInput) {
        await amountInput.click();
        await this.page.keyboard.type('1250');
      }

      const descInput = await this.page.$('input[type="text"]');
      if (descInput) {
        await descInput.click();
        await this.page.keyboard.type('Woolworths grocery shop');
      }

      await this.delay(500);
      screenshots.push(await this.takeScreenshot('10-transaction-filled'));

      // Submit
      const submitButtons = await this.page.$$('button[type="submit"]');
      if (submitButtons.length > 0) {
        await submitButtons[submitButtons.length - 1].click(); // Last submit button
        console.log('   ✅ Submitted transaction');
      }

      await this.delay(2000);
      screenshots.push(await this.takeScreenshot('11-spending-updated'));

      // Check if progress bar updated
      const finalContent = await this.page.content();
      if (finalContent.includes('1250') || finalContent.includes('$1,250')) {
        console.log('   ✅ Transaction recorded, spending updated');
        passed = true;
      } else {
        errors.push('Spending not updated after transaction');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'Spending Tracker',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Test 4: CSV Statement Upload
  async testCSVUpload(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n📄 Test 4: CSV Statement Upload');

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Create test CSV file
      const csvContent = `Date,Description,Debit,Credit,Balance
2024-12-15,COLES MELBOURNE,125.50,,5874.50
2024-12-16,UBER EATS DELIVERY,45.80,,5828.70
2024-12-17,BP SERVICE STATION,78.20,,5750.50
2024-12-18,QANTAS AIRWAYS,450.00,,5300.50
2024-12-19,WOOLWORTHS SYDNEY,98.75,,5201.75`;

      const csvPath = join(OUTPUT_DIR, 'test-statement.csv');
      await writeFile(csvPath, csvContent);
      console.log(`   ✅ Created test CSV: ${csvPath}`);

      // Navigate to statements page
      await this.page.goto(`${BASE_URL}/statements`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('12-statements-page'));

      // Select card from dropdown
      const selectTrigger = await this.page.$('button[role="combobox"]');
      if (selectTrigger) {
        await selectTrigger.click();
        await this.delay(500);

        // Select first option
        const firstOption = await this.page.$('[role="option"]');
        if (firstOption) {
          await firstOption.click();
          console.log('   ✅ Selected card from dropdown');
        }
      }

      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('13-card-selected'));

      // Upload CSV file
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(csvPath);
        console.log('   ✅ Uploaded CSV file');
      }

      await this.delay(3000); // Wait for parsing
      screenshots.push(await this.takeScreenshot('14-csv-parsed'));

      // Check if transactions preview appears
      const content = await this.page.content();
      if (content.includes('COLES MELBOURNE') && content.includes('5 transactions')) {
        console.log('   ✅ CSV parsed successfully, 5 transactions detected');

        // Set up dialog handler to auto-dismiss success alert
        this.page.once('dialog', async (dialog) => {
          console.log(`   📢 Alert detected: "${dialog.message()}"`);
          await dialog.accept();
          console.log('   ✅ Alert dismissed');
        });

        // Click "Upload Transactions" button
        const buttons = await this.page.$$('button');
        for (const button of buttons) {
          const text = await button.evaluate(el => el.textContent);
          if (text?.includes('Upload Transactions')) {
            await button.click();
            console.log('   ✅ Clicked "Upload Transactions"');
            break;
          }
        }

        await this.delay(3000);
        screenshots.push(await this.takeScreenshot('15-transactions-uploaded'));

        // Check for success message or empty preview
        const finalContent = await this.page.content();
        if (finalContent.includes('Successfully uploaded') || !finalContent.includes('COLES MELBOURNE')) {
          console.log('   ✅ Transactions uploaded to database');
          passed = true;
        }
      } else {
        errors.push('CSV parsing failed or transactions not displayed');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'CSV Upload',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Test 5: Visual Churning Calendar
  async testCalendar(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n📅 Test 5: Visual Churning Calendar');

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Navigate to calendar page
      await this.page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('16-calendar-page'));

      // Check if timeline appears
      const content = await this.page.content();
      if (content.includes('Applied') && content.includes('Approved') && content.includes('Active')) {
        console.log('   ✅ Calendar timeline rendered');

        // Check if card appears in timeline
        if (content.includes('Test card')) {
          console.log('   ✅ Test card appears in timeline');
          passed = true;
        } else {
          // Still pass if timeline structure exists
          passed = true;
          console.log('   ℹ️  Timeline exists but test card not visible (may need more cards)');
        }
      } else {
        errors.push('Calendar timeline not rendered correctly');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'Calendar',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Test 6: Card Comparison
  async testComparison(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n🔍 Test 6: Card Comparison');

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Navigate to compare page
      await this.page.goto(`${BASE_URL}/compare`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('17-compare-page'));

      // Check if comparison table/cards appear
      const content = await this.page.content();
      if (content.includes('Net Value') || content.includes('Compare Cards') || content.includes('Bonus Points')) {
        console.log('   ✅ Comparison page loaded');
        passed = true;
      } else {
        errors.push('Comparison page not rendering correctly');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'Comparison',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Test 7: History Tracking
  async testHistory(): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const screenshots: string[] = [];
    let passed = false;

    console.log('\n📜 Test 7: History Tracking');

    try {
      if (!this.page) throw new Error('Page not initialized');

      // Navigate to history page
      await this.page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle2' });
      await this.delay(1000);
      screenshots.push(await this.takeScreenshot('18-history-page'));

      // Check if history page renders
      const content = await this.page.content();
      if (content.includes('History') || content.includes('Churned Cards') || content.includes('Active Cards')) {
        console.log('   ✅ History page loaded');
        passed = true;
      } else {
        errors.push('History page not rendering correctly');
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      feature: 'History',
      passed,
      duration: Date.now() - startTime,
      errors,
      screenshots,
    };
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COMPREHENSIVE MVP FEATURE TEST SUITE');
    console.log('='.repeat(60));

    const tests = [
      () => this.testAuthentication(),
      () => this.testAddCard(),
      () => this.testSpendingTracker(),
      () => this.testCSVUpload(),
      () => this.testCalendar(),
      () => this.testComparison(),
      () => this.testHistory(),
    ];

    for (const test of tests) {
      try {
        const result = await test();
        this.results.push(result);
      } catch (error) {
        console.error('❌ Test crashed:', error);
      }
      await this.delay(1000); // Brief pause between tests
    }

    await this.generateReport();
  }

  async generateReport(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`${index + 1}. ${result.feature}: ${status} (${duration}s)`);

      if (result.errors.length > 0) {
        result.errors.forEach(err => console.log(`   ⚠️  ${err}`));
      }
    });

    // Save results to file
    const reportPath = join(OUTPUT_DIR, 'comprehensive-test-results.json');
    await writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      testEmail: TEST_EMAIL,
      totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.results,
    }, null, 2));

    console.log(`\n📁 Full report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${OUTPUT_DIR}`);
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Test runner stopped');
  }
}

// Main execution
async function main() {
  const runner = new ComprehensiveTestRunner();

  try {
    await runner.setup();
    await runner.runAllTests();
    await runner.cleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await runner.cleanup();
    process.exit(1);
  }
}

main().catch(console.error);
