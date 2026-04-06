# GitHub Actions — Required Secrets & Variables

Configure these in **Settings → Environments → Production** before the cron workflows will run.

## Secrets (`secrets.*`)

| Secret | Used by | Description |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | all | Supabase service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | card-extract, ozbargain-parse, tc-verify | Claude API key |
| `CRON_SECRET` | cron-daily.yml (curl triggers) | Bearer token that Vercel route handlers check |

## Variables (`vars.*`)

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `VERCEL_APP_URL` | cron-daily.yml (curl triggers) | Production Vercel URL (e.g. `https://reward-relay.vercel.app`) |

## Workflow overview

| Workflow | Schedule | Jobs |
|---|---|---|
| `cron-heavy.yml` | cdr-refresh every 15 min; card-extract every 30 min; tc-verify Sun 16:00 UTC | tsx scripts (no Vercel timeout) |
| `cron-daily.yml` | spending-tracker 00:00, leaderboard 01:00, ozbargain-parse 06:00, deals-sync 07:00, deal-alerts 08:00 UTC | curl to Vercel |

## Notes

- `card-extract` needs Chromium — installed via `npx puppeteer browsers install chrome` in the workflow step.
- `ozbargain-parse` and `card-extract` both need `ANTHROPIC_API_KEY`.
- `spending-tracker`, `leaderboard`, and `deal-alerts` run via curl to Vercel (within function timeout limits).
- `cdr-refresh`, `card-extract`, and `tc-verify` run as tsx scripts directly on GH Actions runners to avoid Vercel timeout.
- `workflow_dispatch` on both workflows lets you trigger any job manually from the GitHub UI.
