#!/usr/bin/env tsx

/**
 * RewardRelay Puppeteer Monitoring Script
 *
 * Continuously monitors the Next.js app by:
 * - Navigating through key pages every 30 seconds
 * - Taking screenshots of each page
 * - Recording video sessions
 * - Logging console errors and warnings
 * - Saving artifacts to /tmp/rewardify-monitor/
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = '/tmp/rewardify-monitor';
const LOOP_INTERVAL = 30000; // 30 seconds

// Pages to monitor
const PAGES = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/cards', name: 'cards' },
];

interface MonitoringLog {
  timestamp: string;
  page: string;
  url: string;
  status: 'success' | 'error';
  consoleMessages: string[];
  errors: string[];
  screenshot: string;
}

class RewardRelayMonitor {
  private browser: Browser | null = null;
  private logs: MonitoringLog[] = [];
  private iterationCount = 0;

  async setup(): Promise<void> {
    console.log('🚀 Setting up RewardRelay Monitor...');

    // Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 1280,
        height: 800,
      },
    });

    console.log('✅ Browser launched');

    await this.waitForServer();
  }

  private async waitForServer(retries = 10, delayMs = 1000): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(BASE_URL, { method: 'GET' });
        if (res.ok) return;
      } catch {
        // ignore and retry
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    console.warn('⚠️ Server not reachable after retries; proceeding anyway.');
  }

  async monitorPage(page: Page, pageInfo: { path: string; name: string }): Promise<MonitoringLog> {
    const timestamp = new Date().toISOString();
    const url = `${BASE_URL}${pageInfo.path}`;
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    console.log(`\n📍 Navigating to: ${pageInfo.name} (${url})`);

    // Capture console messages
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(`  ${text}`);
    });

    // Capture errors
    page.on('pageerror', (error) => {
      const errorMsg = `Page Error: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`  ❌ ${errorMsg}`);
    });

    page.on('requestfailed', (request) => {
      const errorMsg = `Request Failed: ${request.url()} - ${request.failure()?.errorText}`;
      errors.push(errorMsg);
      console.error(`  ❌ ${errorMsg}`);
    });

    let status: 'success' | 'error' = 'success';

    const attemptNav = async () => {
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      if (!response || !response.ok()) {
        status = 'error';
        errors.push(`HTTP ${response?.status()} - ${response?.statusText()}`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      const screenshotName = `${this.iterationCount}-${pageInfo.name}-${Date.now()}.png`;
      const screenshotPath = join(OUTPUT_DIR, screenshotName);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      console.log(`  📸 Screenshot saved: ${screenshotName}`);
      const title = await page.title();
      console.log(`  📄 Page title: ${title}`);
      return screenshotPath;
    };

    try {
      const screenshot = await attemptNav();
      return {
        timestamp,
        page: pageInfo.name,
        url,
        status,
        consoleMessages,
        errors,
        screenshot,
      };
    } catch (error) {
      status = 'error';
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      console.error(`  ❌ Error: ${errorMsg}`);

      return {
        timestamp,
        page: pageInfo.name,
        url,
        status,
        consoleMessages,
        errors,
        screenshot: '',
      };
    }
  }

  async runIteration(): Promise<void> {
    this.iterationCount++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Starting Iteration #${this.iterationCount} - ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    try {
      // Monitor each page
      for (const pageInfo of PAGES) {
        if (!this.browser) throw new Error('Browser not initialized');
        const page = await this.browser.newPage();
        const log = await this.monitorPage(page, pageInfo);
        this.logs.push(log);
        await page.close();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Save logs after each iteration
      await this.saveLogs();

    } finally {
      // keep page open to avoid spawning new tabs
    }

    console.log(`\n✅ Iteration #${this.iterationCount} completed`);
    console.log(`📊 Total logs collected: ${this.logs.length}`);
  }

  async saveLogs(): Promise<void> {
    const logsPath = join(OUTPUT_DIR, 'monitoring-logs.json');
    await writeFile(logsPath, JSON.stringify(this.logs, null, 2));

    // Also save a summary
    const summary = {
      totalIterations: this.iterationCount,
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(l => l.status === 'error').length,
      lastUpdate: new Date().toISOString(),
      pages: PAGES.map(p => ({
        name: p.name,
        path: p.path,
        totalChecks: this.logs.filter(l => l.page === p.name).length,
        errors: this.logs.filter(l => l.page === p.name && l.status === 'error').length,
      })),
    };

    const summaryPath = join(OUTPUT_DIR, 'summary.json');
    await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  async startLoop(): Promise<void> {
    console.log(`\n🔁 Starting monitoring loop (interval: ${LOOP_INTERVAL / 1000}s)`);
    console.log(`⏸️  Press Ctrl+C to stop\n`);

    // Run first iteration immediately
    await this.runIteration();

    // Then run on interval
    setInterval(async () => {
      try {
        await this.runIteration();
      } catch (error) {
        console.error('❌ Error in iteration:', error);
      }
    }, LOOP_INTERVAL);
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
  const monitor = new RewardRelayMonitor();

  try {
    await monitor.setup();
    await monitor.startLoop();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await monitor.cleanup();
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
    await monitor.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
    await monitor.cleanup();
    process.exit(0);
  });
}

main().catch(console.error);
