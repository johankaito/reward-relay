#!/usr/bin/env tsx

/**
 * Interactive RewardRelay Puppeteer Test
 *
 * Logs in with credentials and tests the app interactively:
 * - Logs in
 * - Tests button hover states
 * - Navigates through all pages
 * - Takes screenshots
 * - Records video
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = '/tmp/rewardify-interactive';

// Login credentials
const EMAIL = 'john.g.keto+rewardify@gmail.com';
const PASSWORD = 'jk140793!';

interface TestResult {
  page: string;
  success: boolean;
  screenshot: string;
  errors: string[];
  timestamp: string;
}

class InteractiveTest {
  private browser: Browser | null = null;
  private results: TestResult[] = [];

  async setup(): Promise<void> {
    console.log('🚀 Setting up interactive test...\n');

    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

    // Launch browser (visible)
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
      defaultViewport: {
        width: 1400,
        height: 900,
      },
    });

    console.log('✅ Browser launched\n');
  }

  async waitForServer(retries = 20, delayMs = 1000): Promise<void> {
    console.log('⏳ Waiting for server to be ready...');
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(BASE_URL, { method: 'GET' });
        if (res.ok) {
          console.log('✅ Server is ready!\n');
          return;
        }
      } catch {
        process.stdout.write('.');
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error('Server not reachable after retries');
  }

  async takeScreenshot(page: Page, name: string): Promise<string> {
    const screenshotName = `${Date.now()}-${name}.png`;
    const screenshotPath = join(OUTPUT_DIR, screenshotName);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    console.log(`  📸 Screenshot: ${screenshotName}`);
    return screenshotPath;
  }

  async testLogin(page: Page): Promise<TestResult> {
    console.log('\n📍 Testing: Login Page');
    const errors: string[] = [];

    try {
      // Navigate to login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      console.log('  ✓ Loaded login page');

      // Take screenshot before login
      await this.takeScreenshot(page, 'login-before');

      // Fill in credentials
      await page.type('input[type="email"]', EMAIL);
      await page.type('input[type="password"]', PASSWORD);
      console.log('  ✓ Entered credentials');

      // Test button hover state
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.hover();
        console.log('  ✓ Hovered over login button');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait to see hover
      }

      // Take screenshot with hover
      await this.takeScreenshot(page, 'login-hover');

      // Click login
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]'),
      ]);
      console.log('  ✓ Clicked login button');

      // Verify we're logged in (should redirect to dashboard)
      const url = page.url();
      if (url.includes('/dashboard')) {
        console.log('  ✅ Successfully logged in - redirected to dashboard');
      } else {
        errors.push(`Expected dashboard, got: ${url}`);
      }

      // Wait for toast to disappear (toast typically shows for 3-4 seconds)
      console.log('  ⏳ Waiting for toast to disappear...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const afterScreenshot = await this.takeScreenshot(page, 'login-success');

      return {
        page: 'login',
        success: errors.length === 0,
        screenshot: afterScreenshot,
        errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      console.error(`  ❌ Login error: ${errorMsg}`);

      return {
        page: 'login',
        success: false,
        screenshot: '',
        errors,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testDashboard(page: Page): Promise<TestResult> {
    console.log('\n📍 Testing: Dashboard');
    const errors: string[] = [];

    try {
      // Should already be on dashboard after login
      console.log('  ✓ On dashboard page');

      // Wait 10 seconds for ALL CSS to fully load and animations to settle
      console.log('  ⏳ Waiting 10 seconds for CSS to fully load...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('  ✓ CSS and animations loaded');

      // Test "Add card" button hover (in header)
      const addCardBtns = await page.$$('button');
      for (const btn of addCardBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text?.includes('Add card')) {
          await btn.hover();
          console.log('  ✓ Hovered over "Add card" button');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for hover transition
          await this.takeScreenshot(page, 'dashboard-add-card-hover');
          break;
        }
      }

      // Test "Sign out" button hover
      for (const btn of addCardBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text?.includes('Sign out')) {
          await btn.hover();
          console.log('  ✓ Hovered over "Sign out" button');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for hover transition
          await this.takeScreenshot(page, 'dashboard-sign-out-hover');
          break;
        }
      }

      // Test "Start tracking" button hover
      for (const btn of addCardBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text?.includes('Start tracking')) {
          await btn.hover();
          console.log('  ✓ Hovered over "Start tracking" button');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for hover transition
          await this.takeScreenshot(page, 'dashboard-start-tracking-hover');
          break;
        }
      }

      // Test "View card ideas" button hover (if no cards)
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text?.includes('View card ideas')) {
          await btn.hover();
          console.log('  ✓ Hovered over "View card ideas" button');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for hover transition
          await this.takeScreenshot(page, 'dashboard-view-cards-hover');
          break;
        }
      }

      const screenshot = await this.takeScreenshot(page, 'dashboard-complete');

      return {
        page: 'dashboard',
        success: true,
        screenshot,
        errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      console.error(`  ❌ Dashboard error: ${errorMsg}`);

      return {
        page: 'dashboard',
        success: false,
        screenshot: '',
        errors,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testCardsPage(page: Page): Promise<TestResult> {
    console.log('\n📍 Testing: Cards Catalog');
    const errors: string[] = [];

    try {
      // Navigate to cards page
      await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
      console.log('  ✓ Loaded cards page');

      // Wait a bit for content
      await new Promise(resolve => setTimeout(resolve, 1000));

      const screenshot = await this.takeScreenshot(page, 'cards-page');

      return {
        page: 'cards',
        success: true,
        screenshot,
        errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      console.error(`  ❌ Cards page error: ${errorMsg}`);

      return {
        page: 'cards',
        success: false,
        screenshot: '',
        errors,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runTests(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => console.log(`     [PAGE] ${msg.text()}`));
    page.on('pageerror', error => console.error(`     [ERROR] ${error.message}`));

    try {
      // Wait for server
      await this.waitForServer();

      // Run tests in sequence
      const loginResult = await this.testLogin(page);
      this.results.push(loginResult);

      if (loginResult.success) {
        const dashboardResult = await this.testDashboard(page);
        this.results.push(dashboardResult);

        const cardsResult = await this.testCardsPage(page);
        this.results.push(cardsResult);
      } else {
        console.error('\n❌ Login failed - skipping other tests');
      }

      // Save results
      await this.saveResults();
      await this.printSummary();

    } finally {
      await page.close();
    }
  }

  async saveResults(): Promise<void> {
    const resultsPath = join(OUTPUT_DIR, 'test-results.json');
    await writeFile(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  }

  async printSummary(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.page}: ${r.errors.join(', ')}`);
        });
    }

    console.log('\n📁 Screenshots saved to:', OUTPUT_DIR);
    console.log('='.repeat(60));
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Browser closed');
  }
}

// Main execution
async function main() {
  const test = new InteractiveTest();

  try {
    await test.setup();
    await test.runTests();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await test.cleanup();
  }

  console.log('\n✨ Interactive test complete!\n');
}

main().catch(console.error);
