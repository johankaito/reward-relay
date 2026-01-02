# Testing Guide for Reward Relay

## Overview
Comprehensive testing strategy using Puppeteer for end-to-end tests of all MVP features.

## Test Strategy: Login-Only Approach

**Philosophy**: We test our application features, not Supabase's authentication.

### Why Login-Only?

1. **Supabase handles signup** - Their service is already thoroughly tested
2. **No email confirmation toggle needed** - Tests work with production auth settings
3. **Repeatable tests** - Same test user every time, no cleanup required
4. **Faster execution** - Login is quicker than signup
5. **More realistic** - Users login far more frequently than they signup

### Test User Setup

**One-Time Setup** (do this manually):

1. **Create test user in your app**:
   - Go to your deployment or local dev: `http://localhost:3000/signup`
   - Sign up with: `john.g.keto+rewardrelay-test@gmail.com`
   - Password: `TestPass123!`
   - Confirm email if required

2. **Configure environment variables** (optional):
   ```bash
   # .env.local
   TEST_EMAIL=john.g.keto+rewardrelay-test@gmail.com
   TEST_PASSWORD=TestPass123!
   ```

3. **Done!** All tests will use this pre-created user

### Gmail Plus Addressing

The test email uses Gmail's plus addressing:
- `john.g.keto+rewardrelay-test@gmail.com` → delivered to `john.g.keto@gmail.com`
- Unique address for Supabase
- No bounce backs
- Easy to filter in Gmail

**Benefits**:
- ✅ One stable test account
- ✅ No test pollution (same account = predictable state)
- ✅ Works with email confirmation enabled
- ✅ No need to toggle Supabase settings

## Test Types

### 1. Comprehensive Tests
**Command**: `pnpm test`
**Duration**: ~30 seconds
**Coverage**: All 7 MVP features
**When to run**: Before commits, after feature changes

Tests all features end-to-end:
1. Authentication (signup/login)
2. Add Card to Portfolio
3. Spending Tracker (manual entry)
4. CSV Statement Upload
5. Visual Churning Calendar
6. Card Comparison
7. History Tracking

### 2. Smoke Tests
**Command**: `pnpm test:smoke`
**Duration**: ~10 seconds
**Coverage**: Critical paths only
**When to run**: Quick validation, pre-commit hooks

Fast validation of:
- Homepage loads
- Login page accessible
- Signup page accessible

### 3. Regression Tests
**Command**: `pnpm test:regression`
**Duration**: ~30 seconds
**Coverage**: All features + database validation
**When to run**: Before releases, major changes

Same as comprehensive tests but with additional:
- Database record verification
- Session state validation
- Error detection and logging

### 4. Watch Mode
**Command**: `pnpm test:watch`
**Duration**: Continuous
**Coverage**: Smoke tests every 30s
**When to run**: During active development

Automatically runs smoke tests on schedule while developing.

## Setup for Testing

### Prerequisites

1. **Development server running**:
   ```bash
   pnpm dev
   ```
   Server must be accessible at `http://localhost:3000`

2. **Environment variables configured**:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # Optional: Override default test credentials
   TEST_EMAIL=john.g.keto+rewardrelay-test@gmail.com
   TEST_PASSWORD=TestPass123!
   ```

3. **Test user created** (see "Test User Setup" section above)

## Running Tests

### Quick Start

```bash
# Run full comprehensive test suite
pnpm test

# Run fast smoke tests
pnpm test:smoke

# Run regression tests with extra validation
pnpm test:regression

# Start watch mode for continuous testing
pnpm test:watch
```

### Test Output

Tests generate:
- **Console output**: Real-time progress and results
- **Screenshots**: Saved to `/tmp/reward-relay/comprehensive-tests/`
- **JSON report**: Detailed results in `comprehensive-test-results.json`

Example output:
```
🚀 COMPREHENSIVE MVP FEATURE TEST SUITE
============================================================

🔐 Test 1: Authentication Flow
   Email: john.g.keto+test1735909876543@gmail.com
   ✅ Authenticated as: john.g.keto+test1735909876543@gmail.com
   📝 User ID: abc123...

💳 Test 2: Add Card to Portfolio
   ✅ Found and clicked "Add to Portfolio"
   ✅ Card appears on dashboard

... (7 tests total)

============================================================
📊 TEST RESULTS SUMMARY
============================================================

Total Tests: 7
✅ Passed: 7
❌ Failed: 0
Success Rate: 100.0%
```

## Troubleshooting

### Tests Fail at Authentication

**Problem**: Login fails or doesn't redirect to dashboard

**Solutions**:
1. **Verify test user exists** - Create the test user manually if you haven't already
2. **Check credentials match** - Ensure TEST_EMAIL and TEST_PASSWORD in .env.local match the created user
3. **Verify Supabase config** - Check `.env.local` has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
4. **Check screenshots** - Login errors are captured in screenshots at `/tmp/reward-relay/comprehensive-tests/`

### Screenshots Show Empty Pages

**Problem**: Pages load but show no content

**Solutions**:
1. Restart dev server: `pnpm dev` (picks up new routes)
2. Check authentication passed (no session = no data)
3. Verify database has seed data (cards, spending profiles)
4. Check browser console for API errors

### Tests Time Out

**Problem**: Tests fail with "Navigation timeout of 10000ms exceeded"

**Solutions**:
1. Check dev server is running: `curl http://localhost:3000`
2. Increase timeout in test file if server is slow
3. Check network/firewall not blocking localhost
4. Verify database connection is working

### Port 3000 Already in Use

**Problem**: Can't start dev server or tests fail to connect

**Solutions**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart dev server
pnpm dev
```

### Database Records Not Created

**Problem**: Tests pass but no data in Supabase

**Solutions**:
1. Check Row Level Security (RLS) policies allow inserts
2. Verify user_id matches authenticated user
3. Check database logs in Supabase dashboard
4. Ensure migrations have been applied

## Pre-Commit Testing

Tests automatically run before commits via git hook (configured in husky).

### How It Works

1. You run `git commit`
2. Pre-commit hook runs `pnpm test:smoke` (10 seconds)
3. If tests pass → commit proceeds
4. If tests fail → commit blocked, fix issues first

### Skip Pre-Commit Tests (Not Recommended)

```bash
git commit --no-verify -m "Your message"
```

Only use when:
- Tests are broken due to external factors (Supabase down)
- Emergency hotfix needed
- You'll run tests manually after commit

## CI/CD Integration (Future)

GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:regression
```

## Writing New Tests

### Adding to Comprehensive Test Suite

Edit `comprehensive-test.ts`:

```typescript
// Add new test method
async testNewFeature(): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const screenshots: string[] = [];
  let passed = false;

  try {
    if (!this.page) throw new Error('Page not initialized');

    // Navigate to feature
    await this.page.goto(`${BASE_URL}/new-feature`);
    screenshots.push(await this.takeScreenshot('new-feature'));

    // Test feature functionality
    const button = await this.page.$('button.feature-action');
    if (button) {
      await button.click();
      passed = true;
    }

  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    feature: 'New Feature',
    passed,
    duration: Date.now() - startTime,
    errors,
    screenshots,
  };
}

// Add to test suite
async runAllTests(): Promise<void> {
  const tests = [
    () => this.testAuthentication(),
    () => this.testAddCard(),
    // ... existing tests
    () => this.testNewFeature(), // Add here
  ];

  for (const test of tests) {
    const result = await test();
    this.results.push(result);
  }
}
```

### Adding to Smoke Tests

Edit `testing-agent.ts`:

```typescript
async runSmokeTests(): Promise<boolean> {
  // ... existing tests

  // Add new critical path check
  console.log('4. Testing new feature...');
  await page.goto('http://localhost:3000/new-feature');
  const element = await page.$('.new-feature-indicator');
  if (element) {
    console.log('   ✅ New feature accessible');
  } else {
    console.log('   ❌ New feature missing');
    allPassed = false;
  }

  return allPassed;
}
```

## Best Practices

### DO:
✅ Use `john.g.keto+XXXXX@gmail.com` for all test emails
✅ Disable email confirmation in test environment
✅ Run smoke tests before committing
✅ Check screenshots when tests fail
✅ Use `waitForNavigation()` instead of arbitrary delays
✅ Verify Supabase session exists after authentication

### DON'T:
❌ Use random Gmail addresses (causes bounces)
❌ Skip tests with `--no-verify` regularly
❌ Leave email confirmation enabled for tests
❌ Commit without running tests
❌ Use `setTimeout()` for waiting (use proper Puppeteer waits)
❌ Test in production environment

## Support

For testing issues:
1. Check troubleshooting section above
2. Review test screenshots in `/tmp/reward-relay/comprehensive-tests/`
3. Check test output JSON for detailed error messages
4. Verify Supabase dashboard for auth/database errors

## Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Gmail Plus Addressing](https://support.google.com/mail/answer/12096?hl=en)
- [Reward Relay README](./README.md)
