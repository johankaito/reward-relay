# GitHub Actions — Required Secrets & Variables

Configure these in **Settings → Environments → Production** before the cron workflows will run.

## Secrets (`secrets.*`)

| Secret | Used by | Description |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | all | Supabase service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | card-extract, ozbargain-parse, tc-verify | Claude API key |
| `CRON_SECRET` | notifications job (curl) | Bearer token that Vercel route handlers check |

## Variables (`vars.*`)

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `VERCEL_APP_URL` | notifications job | Production Vercel URL (e.g. `https://reward-relay.vercel.app`) |

## Workflow overview

| Workflow | Schedule | Jobs |
|---|---|---|
| `cron-heavy.yml` | Sun 4pm UTC + Mon 2am UTC | cdr-refresh → card-extract (sequential); tc-verify (separate trigger) |
| `cron-daily.yml` | 4am / 6am / 10pm UTC daily | ozbargain-parse; deals-sync; notifications (curl to Vercel) |

## Notes

- `card-extract` needs Chromium — installed via `npx puppeteer browsers install chrome` in the workflow step.
- `ozbargain-parse` and `card-extract` both need `ANTHROPIC_API_KEY`.
- Notification crons (`spending-alerts`, `loyalty-expiry`, `deal-alerts`, `leaderboard`, `reminders/check`) run in Vercel within the 10s limit — only the heavy crons moved here.
- `workflow_dispatch` on both workflows lets you trigger any job manually from the GitHub UI.
