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

- **ALL tasks must be sent to mac-15 unless explicitly told otherwise** — this includes code changes, file edits, migrations, and any other modifications
- mac-15 SSH target: `mac-15`
- Agent manager: `~/.claude/agents-remote/agent-manager.sh -t mac-15`
- Never make changes locally — always delegate to mac-15

## Route Map

### Active routes

| Route | Tier | Description |
|---|---|---|
| `/dashboard` | Free | Home — hero metric, alert strip, wallet card tiles |
| `/cards` | Free | Card portfolio — Apple Wallet layout (≤3 free, unlimited Pro) |
| `/spending` / `/tracker` | Free/Pro | Spend tracker — progress bars, pace calc, transactions |
| `/profit` | Pro | Net Profit dashboard — P&L, bonuses vs fees |
| `/insights` | Pro | Alias for `/profit` (canonical discovery-hub route) |
| `/flights` | Pro | Award flight sweet spot finder + "Top Cards to Close the Gap" |
| `/compare` | Free | Card comparison tool |
| `/recommendations` | Free | Card recommendations |
| `/statements` | Pro | Statement uploads |
| `/settings` | Free | Account settings |
| `/admin` | Internal | Admin panel |

### Archived routes → redirect targets

| Route | Redirects to | Reason |
|---|---|---|
| `/business` | `/dashboard` | Business Tier epic (BT) — backlog, not MVP |
| `/calendar` | `/dashboard` | Experimental calendar view — not formally scoped |
| `/inquiries` | `/dashboard` | Credit Inquiry Tracker epic (CI) — backlog, not MVP |
| `/milestones` | `/dashboard` | Gamification epic (GM) — backlog, not MVP |

### Merged routes → canonical destination

| Old route | Canonical | What was merged |
|---|---|---|
| `/projections` | `/flights` | Gap analysis, cabin selector, card recommendations ("Top Cards to Close the Gap") |
| `/deals` | `/insights` | Personalised deal alerts (DA epic); TODO: add as tab in future sprint |
| `/history` | `/cards` | Churn history with eligibility countdown; TODO: add as filter in future sprint |
