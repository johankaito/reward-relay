#!/usr/bin/env tsx

/**
 * Automated Test Runner for Reward Relay Development Loop
 *
 * Continuously tests implemented features and reports results
 * to the orchestrator. Tests are mapped to todo items.
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = '/tmp/reward-relay/test-results';
const TEST_EMAIL = 'test.user@rewardrelay.test';
const TEST_PASSWORD = 'TestPass123!';

// Supabase setup for database verification
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface TestResult {
  todoId: number;
  todoName: string;
  passed: boolean;
  timestamp: string;
  errors: string[];
  screenshots: string[];
  dbVerification?: any;
}

interface TodoTest {
  id: number;
  name: string;
  description: string;
  testFunction: (page: Page, browser: Browser) => Promise<TestResult>;
}

class TestRunner {
  private browser: Browser | null = null;
  private results: TestResult[] = [];
  private supabase: any;
  private testUserId: string | null = null;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  }

  async setup(): Promise<void> {
    console.log('🚀 Setting up Test Runner...\n');

    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 1400,
        height: 900,
      },
    });

    console.log('✅ Browser launched');

    // Ensure test user exists
    await this.ensureTestUser();

    await this.waitForServer();
  }

  private async ensureTestUser(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (signInData?.user) {
        this.testUserId = signInData.user.id;
        console.log('✅ Test user exists');
        return;
      }

      // If sign in fails, create user
      const { data, error } = await this.supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (data?.user) {
        this.testUserId = data.user.id;
        console.log('✅ Test user created');
      }
    } catch (error) {
      console.warn('⚠️ Could not ensure test user:', error);
    }
  }

  private async waitForServer(retries = 20, delayMs = 1000): Promise<void> {
    console.log('⏳ Waiting for dev server...');
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
    throw new Error('Server not reachable');
  }

  private async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = Date.now();
    const screenshotName = `${timestamp}-${name}.png`;
    const screenshotPath = join(OUTPUT_DIR, screenshotName);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    return screenshotPath;
  }

  private async login(page: Page): Promise<boolean> {
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      await page.type('input[type="email"]', TEST_EMAIL);
      await page.type('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Check if we're on dashboard
      const url = page.url();
      return url.includes('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  // Test definitions for each todo item
  private getTodoTests(): TodoTest[] {
    return [
      {
        id: 1,
        name: 'Wire up AddCardForm',
        description: 'Test that AddCardForm saves user cards to database',
        testFunction: async (page: Page) => {
          const errors: string[] = [];
          const screenshots: string[] = [];
          let passed = false;

          try {
            // Login first
            const loginSuccess = await this.login(page);
            if (!loginSuccess) {
              errors.push('Failed to login');
              return this.createResult(1, 'Wire up AddCardForm', false, errors, screenshots);
            }

            // Navigate to cards page
            await page.goto(`${BASE_URL}/cards`, { waitUntil: 'networkidle2' });
            screenshots.push(await this.takeScreenshot(page, 'cards-page'));

            // Check if AddCardForm exists and is functional
            const formExists = await page.$('form') !== null;
            if (!formExists) {
              errors.push('AddCardForm not found on cards page');
              return this.createResult(1, 'Wire up AddCardForm', false, errors, screenshots);
            }

            // Try to select a card from dropdown
            const selectExists = await page.$('button[role="combobox"]') !== null;
            if (selectExists) {
              await page.click('button[role="combobox"]');
              await new Promise(resolve => setTimeout(resolve, 500));

              // Select first card option
              const firstOption = await page.$('[role="option"]');
              if (firstOption) {
                await firstOption.click();
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            // Fill in application date
            const dateInput = await page.$('input[type="date"]');
            if (dateInput) {
              await page.type('input[type="date"]', '2024-01-15');
            }

            // Add notes
            const notesInput = await page.$('textarea');
            if (notesInput) {
              await page.type('textarea', 'Test card added via automated test');
            }

            screenshots.push(await this.takeScreenshot(page, 'form-filled'));

            // Submit form
            const submitButton = await page.$('button[type="submit"]');
            if (submitButton) {
              await submitButton.click();
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Navigate to dashboard to verify card was added
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            screenshots.push(await this.takeScreenshot(page, 'dashboard-after-add'));

            // Check if card appears in dashboard
            const pageContent = await page.content();
            const cardAdded = pageContent.includes('Test card added via automated test') ||
                             pageContent.includes('2024-01-15');

            if (cardAdded) {
              passed = true;
            } else {
              errors.push('Card not found in dashboard after adding');
            }

            // Verify in database
            if (this.supabase && this.testUserId) {
              const { data, error } = await this.supabase
                .from('user_cards')
                .select('*')
                .eq('user_id', this.testUserId)
                .order('created_at', { ascending: false })
                .limit(1);

              if (data && data.length > 0) {
                console.log('✅ Card found in database:', data[0]);
              } else {
                errors.push('Card not found in database');
                passed = false;
              }
            }

          } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
          }

          return this.createResult(1, 'Wire up AddCardForm', passed, errors, screenshots);
        }
      },
      {
        id: 2,
        name: 'Edit/Delete Cards',
        description: 'Test edit and delete functionality for user cards',
        testFunction: async (page: Page) => {
          const errors: string[] = [];
          const screenshots: string[] = [];
          let passed = false;

          try {
            // Login
            const loginSuccess = await this.login(page);
            if (!loginSuccess) {
              errors.push('Failed to login');
              return this.createResult(2, 'Edit/Delete Cards', false, errors, screenshots);
            }

            // Navigate to dashboard
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
            screenshots.push(await this.takeScreenshot(page, 'dashboard-before-edit'));

            // Look for edit button
            const editButton = await page.$('button:has-text("Edit")');
            if (editButton) {
              await editButton.click();
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Modify some field
              const notesInput = await page.$('textarea');
              if (notesInput) {
                await notesInput.click({ clickCount: 3 }); // Select all
                await page.type('textarea', 'Updated via test');
              }

              // Save changes
              const saveButton = await page.$('button:has-text("Save")');
              if (saveButton) {
                await saveButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
              }

              screenshots.push(await this.takeScreenshot(page, 'after-edit'));

              // Check if update appears
              const pageContent = await page.content();
              if (pageContent.includes('Updated via test')) {
                passed = true;
              }
            } else {
              errors.push('Edit functionality not implemented yet');
            }

            // Test delete
            const deleteButton = await page.$('button:has-text("Delete")');
            if (deleteButton) {
              const cardCountBefore = (await page.$$('[data-card-item]')).length;
              await deleteButton.click();

              // Confirm deletion if dialog appears
              const confirmButton = await page.$('button:has-text("Confirm")');
              if (confirmButton) {
                await confirmButton.click();
              }

              await new Promise(resolve => setTimeout(resolve, 1000));
              const cardCountAfter = (await page.$$('[data-card-item]')).length;

              if (cardCountAfter < cardCountBefore) {
                console.log('✅ Delete functionality works');
              } else {
                errors.push('Delete did not remove card');
                passed = false;
              }

              screenshots.push(await this.takeScreenshot(page, 'after-delete'));
            } else {
              errors.push('Delete functionality not implemented yet');
            }

          } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
          }

          return this.createResult(2, 'Edit/Delete Cards', passed, errors, screenshots);
        }
      },
      {
        id: 3,
        name: 'Churn History Tracking',
        description: 'Test cancellation date tracking and history display',
        testFunction: async (page: Page) => {
          const errors: string[] = [];
          const screenshots: string[] = [];
          let passed = false;

          try {
            // Login
            const loginSuccess = await this.login(page);
            if (!loginSuccess) {
              errors.push('Failed to login');
              return this.createResult(3, 'Churn History Tracking', false, errors, screenshots);
            }

            // Navigate to dashboard
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });

            // Look for a way to mark card as cancelled
            const cancelButton = await page.$('button:has-text("Mark as Cancelled")');
            if (cancelButton) {
              await cancelButton.click();

              // Enter cancellation date
              const dateInput = await page.$('input[type="date"][name="cancellation_date"]');
              if (dateInput) {
                await page.type('input[type="date"][name="cancellation_date"]', '2024-12-20');
              }

              // Save
              const saveButton = await page.$('button:has-text("Save")');
              if (saveButton) {
                await saveButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
              }

              screenshots.push(await this.takeScreenshot(page, 'after-cancellation'));

              // Check if status changed to cancelled
              const pageContent = await page.content();
              if (pageContent.includes('cancelled') || pageContent.includes('Cancelled')) {
                passed = true;
              }
            } else {
              errors.push('Cancellation functionality not implemented yet');
            }

            // Check for history view
            const historyLink = await page.$('a:has-text("History")');
            if (historyLink) {
              await historyLink.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              screenshots.push(await this.takeScreenshot(page, 'history-view'));

              const pageContent = await page.content();
              if (pageContent.includes('Cancelled') && pageContent.includes('2024-12-20')) {
                console.log('✅ History tracking works');
              }
            }

          } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
          }

          return this.createResult(3, 'Churn History Tracking', passed, errors, screenshots);
        }
      }
    ];
  }

  private createResult(
    todoId: number,
    todoName: string,
    passed: boolean,
    errors: string[],
    screenshots: string[]
  ): TestResult {
    return {
      todoId,
      todoName,
      passed,
      timestamp: new Date().toISOString(),
      errors,
      screenshots,
    };
  }

  async runTests(): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    const tests = this.getTodoTests();
    console.log(`\n🧪 Running ${tests.length} test suites...\n`);

    for (const test of tests) {
      console.log(`\n📍 Testing Todo #${test.id}: ${test.name}`);
      console.log(`   ${test.description}`);

      const page = await this.browser.newPage();

      try {
        const result = await test.testFunction(page, this.browser);
        this.results.push(result);

        if (result.passed) {
          console.log(`   ✅ PASSED`);
        } else {
          console.log(`   ❌ FAILED`);
          result.errors.forEach(err => console.log(`      - ${err}`));
        }
      } catch (error) {
        console.error(`   ❌ Test crashed:`, error);
        this.results.push(this.createResult(
          test.id,
          test.name,
          false,
          [error instanceof Error ? error.message : String(error)],
          []
        ));
      } finally {
        await page.close();
      }
    }

    await this.saveResults();
  }

  private async saveResults(): Promise<void> {
    const resultsPath = join(OUTPUT_DIR, 'test-results.json');
    await writeFile(resultsPath, JSON.stringify(this.results, null, 2));

    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      todos: this.results.map(r => ({
        id: r.todoId,
        name: r.todoName,
        status: r.passed ? 'complete' : 'incomplete',
        errors: r.errors,
      })),
    };

    const summaryPath = join(OUTPUT_DIR, 'summary.json');
    await writeFile(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passed}`);
    console.log(`   Failed: ${summary.failed}`);
  }

  async startContinuousMode(intervalMs: number = 30000): Promise<void> {
    console.log(`\n🔁 Starting continuous test mode (interval: ${intervalMs / 1000}s)`);
    console.log(`⏸️  Press Ctrl+C to stop\n`);

    // Run tests immediately
    await this.runTests();

    // Then run on interval
    setInterval(async () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🔄 Running test cycle at ${new Date().toLocaleString()}`);
      console.log('='.repeat(60));

      try {
        // Clear previous results
        this.results = [];
        await this.runTests();
      } catch (error) {
        console.error('❌ Test cycle error:', error);
      }
    }, intervalMs);
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
  const runner = new TestRunner();
  const mode = process.argv[2] || 'continuous';

  try {
    await runner.setup();

    if (mode === 'once') {
      await runner.runTests();
      await runner.cleanup();
    } else {
      await runner.startContinuousMode();
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await runner.cleanup();
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down test runner...');
    await runner.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down test runner...');
    await runner.cleanup();
    process.exit(0);
  });
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { TestRunner };