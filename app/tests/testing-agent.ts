#!/usr/bin/env tsx
/**
 * Dedicated Testing Agent for Reward Relay
 *
 * Prevents regressions by running automated tests before commits.
 * Provides smoke tests (fast) and full regression tests.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { ComprehensiveTestRunner, TestResult } from './comprehensive-test';

export class TestingAgent {
  private browser: Browser | null = null;

  /**
   * Quick smoke tests - validates critical user paths only
   * Runs in < 30 seconds
   */
  async runSmokeTests(): Promise<boolean> {
    console.log('\n🔥 Running Smoke Tests (Critical Paths Only)');
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    let allPassed = true;

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await this.browser.newPage();

      // Test 1: Homepage loads
      console.log('1. Testing homepage...');
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 5000 });
      const homeTitle = await page.title();
      if (homeTitle.includes('Reward Relay')) {
        console.log('   ✅ Homepage loads correctly');
      } else {
        console.log('   ❌ Homepage title incorrect');
        allPassed = false;
      }

      // Test 2: Login page accessible
      console.log('2. Testing login page...');
      await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 5000 });
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        console.log('   ✅ Login page accessible');
      } else {
        console.log('   ❌ Login page missing form');
        allPassed = false;
      }

      // Test 3: Signup page accessible
      console.log('3. Testing signup page...');
      await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle2', timeout: 5000 });
      const signupButton = await page.$('button[type="submit"]');
      if (signupButton) {
        console.log('   ✅ Signup page accessible');
      } else {
        console.log('   ❌ Signup page missing form');
        allPassed = false;
      }

      await page.close();

    } catch (error) {
      console.error('   ❌ Smoke test failed:', error);
      allPassed = false;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Smoke Tests ${allPassed ? '✅ PASSED' : '❌ FAILED'} in ${duration}s`);
    console.log(`${'='.repeat(60)}\n`);

    return allPassed;
  }

  /**
   * Full regression test suite
   * Validates all 7 MVP features
   * Runs in ~30-60 seconds
   */
  async runRegressionTests(): Promise<boolean> {
    console.log('\n🧪 Running Full Regression Test Suite');
    console.log('='.repeat(60) + '\n');

    const runner = new ComprehensiveTestRunner();

    try {
      await runner.setup();
      await runner.runAllTests();
      await runner.cleanup();

      const passed = runner.results.every((r: TestResult) => r.passed);
      return passed;
    } catch (error) {
      console.error('❌ Regression tests failed:', error);
      return false;
    }
  }

  /**
   * Watch mode - continuously run tests on file changes
   * Useful during development
   */
  async watchMode(): Promise<void> {
    console.log('\n👀 Starting Watch Mode');
    console.log('Tests will run automatically on file changes');
    console.log('Press Ctrl+C to stop\n');

    // Initial test run
    await this.runSmokeTests();

    // In a real implementation, would use chokidar to watch files
    // For now, just run tests every 30 seconds
    setInterval(async () => {
      console.log('\n🔄 Running scheduled test check...');
      await this.runSmokeTests();
    }, 30000);
  }
}

// CLI Interface
async function main() {
  const mode = process.argv[2] || 'regression';
  const agent = new TestingAgent();

  let passed = false;

  switch (mode) {
    case 'smoke':
      passed = await agent.runSmokeTests();
      break;
    case 'regression':
      passed = await agent.runRegressionTests();
      break;
    case 'watch':
      await agent.watchMode();
      return; // Don't exit in watch mode
    default:
      console.error(`Unknown mode: ${mode}`);
      console.log('Usage: tsx testing-agent.ts [smoke|regression|watch]');
      process.exit(1);
  }

  process.exit(passed ? 0 : 1);
}

// Only run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { TestingAgent as default };
