# Reward Relay Deployment Guide

## Overview

Reward Relay uses GitHub Actions to run CI/CD checks before deploying to Vercel. This ensures type safety, builds successfully, and databases are migrated before production deployment.

## Architecture

```
Push to master → GitHub Actions → Type check + Build → Deploy to Vercel
                                ↓
                          Apply DB Migrations
```

## GitHub Actions Workflow

Located in `.github/workflows/ci.yml`

### Jobs

1. **typecheck** - Runs TypeScript compiler to catch type errors
2. **lint** - Runs ESLint (optional, doesn't block deployment)
3. **build** - Ensures Next.js can build successfully
4. **deploy-vercel** - Deploys to Vercel (only after typecheck + build pass)

### Triggers

- **Pull Requests**: Runs typecheck, lint, build
- **Push to master**: Runs all checks + deploys to Vercel

## Vercel Configuration

Located in `vercel.json`:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

This **disables automatic Vercel deployments** from Git pushes. Deployments are controlled by GitHub Actions instead.

### Why This Approach?

- ✅ Run custom checks before deployment
- ✅ Apply database migrations automatically
- ✅ Block deployment if types/build fail
- ✅ More control over deployment process
- ✅ Can add tests, security scans, etc.

## Supabase Migrations

### Structure

```
supabase/
└── rls-policies.sql  - Row Level Security policies
```

### Migration Scripts

Located in `package.json`:

```json
{
  "migrate:execute": "psql \"$DATABASE_URL\" -f $SQL_FILE",
  "migrate:rls": "SQL_FILE=supabase/rls-policies.sql pnpm migrate:execute",
  "migrate:all": "pnpm migrate:rls"
}
```

### Running Migrations Locally

```bash
# Load environment variables
export DATABASE_URL="postgresql://..."

# Run all migrations
pnpm migrate:all

# Or run specific migrations
pnpm migrate:rls
```

### Running Migrations in GitHub Actions

Migrations run automatically when:
- Pushing to `master` branch
- Before Vercel deployment

The workflow uses GitHub Secrets for credentials:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_ACCESS_TOKEN` - Supabase API token

## RLS Policies

### Tables Protected

1. **cards** - Global catalog (publicly readable, admin-only editable)
2. **user_cards** - User's tracked cards (user-only access)
3. **spending_profiles** - User's spending data (user-only access)

### Policy Summary

**cards table**:
- Anyone can read (SELECT)
- Only admins can create/update/delete

**user_cards table**:
- Users can only see/edit their own cards
- Uses `auth.uid() = user_id` check

**spending_profiles table**:
- Users can only see/edit their own profile
- Uses `auth.uid() = user_id` check

## Required GitHub Secrets

Set these in GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Secrets
- `VERCEL_TOKEN` - Vercel API token (get from vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Reward Relay project ID from Vercel
- `DATABASE_URL` - PostgreSQL connection string from Supabase
- `SUPABASE_ACCESS_TOKEN` - Supabase access token

### Variables (non-secret)
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key

## Deployment Workflow

### For Pull Requests

1. Create PR from feature branch
2. GitHub Actions runs: typecheck, lint, build
3. If pass: PR shows green checkmark ✅
4. If fail: PR blocked ❌
5. Merge when green

### For Production Deploy

1. Merge PR to `master`
2. GitHub Actions runs: typecheck + build
3. If pass: Triggers Vercel deployment
4. Vercel deploys to production
5. Production URL updated

## Local Development

```bash
# Start dev server
pnpm dev

# Type check (same as CI)
pnpm typecheck

# Build (same as CI)
pnpm build

# Run migrations
pnpm migrate:all
```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions tab for error details
2. Run `pnpm typecheck` locally to catch type errors
3. Run `pnpm build` locally to test build
4. Fix errors and push again

### Migration Fails

1. Check DATABASE_URL secret is set correctly
2. Ensure Supabase is accessible from GitHub Actions
3. Test migration locally first: `pnpm migrate:all`

### Vercel Deploy Fails

1. Verify VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID secrets
2. Check Vercel CLI version in workflow (should be latest)
3. Ensure `.env.local` variables are set in Vercel dashboard

## Future Improvements

- [ ] Add automated tests (vitest)
- [ ] Add database schema validation
- [ ] Add performance budgets
- [ ] Add security scanning
- [ ] Add preview deployments for PRs
