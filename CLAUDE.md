# Reward Relay — Project Instructions

## Migrations

**Supabase migrations are automatically applied by the build process.** Do NOT manually run `supabase db push` or apply migrations via the dashboard SQL editor. Simply commit the migration file and the build pipeline handles it.

## Architecture

- **Frontend**: Next.js (app router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Payments**: Stripe (subscriptions + webhooks)
- **Deployment**: Vercel

## Billing

- Preview environments use `sk_test_` / `pk_test_` Stripe keys — do not change these
- Production requires live Stripe keys and a registered production webhook endpoint
- Trial abuse prevention relies on `has_used_trial` column on `stripe_customers` table

## Agents

- All code changes must be executed on **mac-15** — never make changes locally
- mac-15 SSH target: `mac-15`
- Agent manager: `~/.claude/agents-remote/agent-manager.sh -t mac-15`
