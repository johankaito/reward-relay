# Database Migrations with Supabase CLI

Official Supabase CLI migration system for the Reward Relay application.

## Why Supabase CLI?

✅ **Battle-tested** - Used by thousands of production Supabase apps
✅ **Official tool** - Maintained by Supabase, not custom code
✅ **Automatic tracking** - Built-in migration history table
✅ **Zero maintenance** - No custom tracking code to maintain
✅ **Duplicate prevention** - Won't run same migration twice
✅ **Local dev environment** - Full local Supabase stack
✅ **CI/CD ready** - Integrates with GitHub Actions

## Quick Start

```bash
# Create a new migration
pnpm migrate:new add_new_feature

# List all migrations and their status
pnpm migrate:list

# Apply migrations to production
pnpm migrate:push
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm migrate:new <name>` | Create a new timestamped migration file |
| `pnpm migrate:up` | Apply pending migrations locally |
| `pnpm migrate:push` | Deploy migrations to remote database |
| `pnpm migrate:list` | List all migrations with status |
| `pnpm db:reset` | Reset local DB (reapply all migrations + seed) |

## Migration Workflow

### 1. Creating a Migration

```bash
# Create new migration
pnpm migrate:new add_subscription_table

# This creates: supabase/migrations/20250102012345_add_subscription_table.sql
```

Edit the generated SQL file:

```sql
-- Add subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan text not null,
  status text not null,
  created_at timestamptz not null default now()
);

-- RLS policies
alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);
```

### 2. Testing Locally (Optional)

If you have local Supabase running:

```bash
# Start local Supabase (first time setup)
supabase start

# Apply pending migrations
pnpm migrate:up

# Check it worked
pnpm migrate:list
```

### 3. Deploying to Production

**Prerequisites**:
- Supabase CLI installed (via brew)
- Authenticated (`supabase login`)
- Linked to project (`supabase link --project-ref YOUR_REF`)

```bash
# Deploy migrations
pnpm migrate:push

# Verify
pnpm migrate:list
```

## Migration Best Practices

### ✅ DO

**1. Make migrations idempotent**
```sql
-- Good: Safe to run multiple times
create table if not exists public.cards (...);
alter table public.cards add column if not exists status text;
```

**2. Use transactions for multi-statement migrations**
```sql
begin;
  create table public.cards (...);
  create index idx_cards_status on public.cards(status);
commit;
```

**3. Add descriptive names**
```bash
# Good
pnpm migrate:new add_email_reminders_table

# Bad
pnpm migrate:new update
```

**4. One logical change per migration**
- Don't bundle unrelated changes
- Easier to understand and rollback

### ❌ DON'T

**1. Never edit applied migrations**
- Create a new migration instead
- Supabase tracks which migrations have run

**2. Don't use destructive operations without backups**
```sql
-- ❌ Dangerous without backup
drop table public.important_data;

-- ✅ Better: Add deprecation first, drop later
alter table public.important_data rename to important_data_deprecated;
-- Then after confirming nothing breaks, create new migration to drop
```

**3. Don't skip timestamps**
- Always use `pnpm migrate:new`
- Never manually create migration files

## File Structure

```
supabase/
├── config.toml                                  # Supabase project config
├── README.md                                    # This file
└── migrations/
    ├── 20250101120100_spending_tracker.sql     # Applied
    ├── 20250101120200_scraping.sql             # Applied
    ├── 20250101120300_email_reminders.sql      # Applied
    ├── 20250101120400_add_mycard_prestige.sql  # Applied
    └── 20260102123456_your_new_migration.sql   # Pending (future)
```

## Migration Tracking

Supabase automatically creates a `supabase_migrations.schema_migrations` table that tracks:
- Which migrations have been applied
- When they were applied
- Migration version/timestamp

**View applied migrations**:
```sql
select * from supabase_migrations.schema_migrations
order by version;
```

## Rollback Strategy

Migrations are **forward-only**. To undo a change:

1. Create a new migration with reverse operations
2. Example sequence:
   ```
   20250101120000_add_status_column.sql
   20250102150000_remove_status_column.sql  ← Rollback
   ```

## Existing Migrations

| Timestamp | Name | Description |
|-----------|------|-------------|
| 20250101120100 | spending_tracker | Spending tracking features |
| 20250101120200 | scraping | Card data scraping setup |
| 20250101120300 | email_reminders | Email reminder system |
| 20250101120400 | add_mycard_prestige | Add MyCard Prestige to catalog |

**Note**: New migrations will use the actual current date. The `supabase migration new` command automatically generates the timestamp for you.

## Troubleshooting

### "Error: Project not linked"

You need to link the CLI to your Supabase project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Get your project ref from Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### "Migration already applied"

Supabase prevents duplicate runs automatically. If you need to re-run:

1. Check if it's truly necessary
2. If yes, manually update the tracking table (⚠️ advanced)
3. Or create a new migration with the changes

### "Database connection failed"

Check your `.env.local` has correct credentials:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Production Deployment

### Manual Deployment

```bash
# 1. Test locally first (if possible)
pnpm migrate:up

# 2. Review pending migrations
pnpm migrate:list

# 3. Deploy to production
pnpm migrate:push

# 4. Verify
pnpm migrate:list
```

### CI/CD (GitHub Actions)

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Deploy migrations
  run: |
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    pnpm migrate:push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Resources

- [Official Supabase CLI Docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [Migration Best Practices](https://supabase.com/docs/guides/local-development/overview)
- [CLI Reference](https://supabase.com/docs/reference/cli/start)

## Need Help?

1. Check [Supabase Docs](https://supabase.com/docs)
2. Search [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Ask in [Supabase Discord](https://discord.supabase.com)
