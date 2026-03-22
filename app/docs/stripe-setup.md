# Stripe Test Mode Setup

All objects are in **test mode** (livemode: false). Switch to live keys before production launch.

## Product

| Field    | Value                  |
|----------|------------------------|
| Name     | Reward Relay Pro       |
| ID       | prod_UC3Vyw6qzMnsZ1   |
| Mode     | Test                   |

## Prices (AUD)

| Env var                | Interval | Amount    | Price ID                            |
|------------------------|----------|-----------|-------------------------------------|
| `STRIPE_PRICE_MONTHLY` | Monthly  | AUD $9.99 | `price_1TDfOcLclFbBFd96udVWizf3`   |
| `STRIPE_PRICE_ANNUAL`  | Annual   | AUD $99   | `price_1TDfOdLclFbBFd96Vp7JOZ4a`  |

## Webhook Endpoint (Staging)

| Field              | Value                                                        |
|--------------------|--------------------------------------------------------------|
| Endpoint ID        | `we_1TDfOiLclFbBFd96uZLbWgIN`                              |
| URL                | `https://staging.rewardrelay.app/api/webhooks/stripe`       |
| Subscribed events  | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` |
| Secret env var     | `STRIPE_WEBHOOK_SECRET` (sensitive, preview target only)    |

## Vercel Environment Variables

All three variables are set in Vercel project `prj_Nu6Ksqiu5WwpG0AcFIVdZpWGgNvJ`:

| Variable               | Type      | Targets            |
|------------------------|-----------|--------------------|
| `STRIPE_PRICE_MONTHLY` | plain     | preview, production |
| `STRIPE_PRICE_ANNUAL`  | plain     | preview, production |
| `STRIPE_WEBHOOK_SECRET`| sensitive | preview             |

## Local Development

Copy `.env.example` to `.env.local` and fill in:
- `STRIPE_SECRET_KEY` — test key from Stripe dashboard
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` — price IDs above
- `STRIPE_WEBHOOK_SECRET` — run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to get a local webhook secret

### Test Cards
- `4242 4242 4242 4242` — success
- `4000 0025 0000 3155` — requires 3D Secure
- `4000 0000 0000 9995` — payment fails

## Notes

- Production webhook endpoint and live-mode keys are not yet configured (issue #16).
- Annual price represents ~17% discount vs monthly ($9.99 × 12 = $119.88 vs $99/yr).
