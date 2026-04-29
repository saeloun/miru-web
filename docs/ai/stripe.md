# Stripe Integration Operations

## Integration Shape

- Miru uses the official `stripe` Ruby gem (`Gemfile`) with API key setup in `config/initializers/stripe.rb`.
- Stripe is used in two flows:
- Invoice collection via Stripe Checkout (`InvoicePayment::Checkout`) and webhook fulfillment (`Webhooks::StripeController` + `HandleStripeCheckoutEventService`).
- Subscription billing via Stripe Checkout/Billing Portal (`Api::V1::SubscriptionsController`) and webhook-driven sync (`Subscriptions::StripeSyncService`).
- Stripe Connect onboarding is handled by `StripeConnectedAccount` and exposed from Payment Settings APIs.

## Required Local Secrets

Add these to your local env file (or shell profile) before starting the app:

- `STRIPE_SECRET_KEY` (required)
- `STRIPE_PUBLISHABLE_KEY` (required for frontend/public usage)
- `STRIPE_WEBHOOK_ENDPOINT_SECRET` (required to validate webhook signatures)
- `APP_BASE_URL` (required for Stripe Connect refresh/return URLs; local value: `http://127.0.0.1:3000`)
- `STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY` (recommended for subscriptions)
- `STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY` (recommended for subscriptions)
- `STRIPE_SUBSCRIPTION_PRICE_ID` (fallback if interval-specific IDs are not set)
- `STRIPE_PLAN_PAGE_URL` (optional; if present, billing checkout redirects to this hosted Stripe URL instead of creating a session server-side)

Notes:

- Use Stripe test-mode keys locally.
- Never commit keys or webhook secrets.

## Create a New Stripe Test Account

1. Sign up at Stripe Dashboard in test mode.
2. Copy test API keys from Developers > API keys.
3. Create test prices for subscriptions and copy price IDs:
4. Monthly recurring price -> `STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY`
5. Yearly recurring price -> `STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY`
6. If you use a single fallback price, set `STRIPE_SUBSCRIPTION_PRICE_ID`.

## Stripe Signup Wizard Choice (Important)

When Stripe asks how you want to accept recurring payments, choose:

- `Pre-built checkout form`

Why this is the correct choice for Miru:

- Miru already creates Stripe Checkout Sessions server-side for subscriptions:
- `Api::V1::SubscriptionsController#checkout`
- Miru also uses Stripe Checkout for invoice payment collection:
- `InvoicePayment::Checkout`
- Current architecture is hosted Stripe Checkout + webhook fulfillment, not embedded Elements.

How each wizard option maps to Miru:

- `Pre-built checkout form`:
- Matches current Miru implementation and should be used by default.
- `Shareable payment links`:
- Optional. Only relevant if you intentionally use a hosted Stripe Payment Link URL via `STRIPE_PLAN_PAGE_URL`.
- `Embedded components`:
- Not used in current Miru implementation; requires separate frontend integration work.

Miru pricing alignment:

- Free: no Stripe checkout needed.
- Pro (monthly/yearly): configure recurring Stripe Prices and set:
- `STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY`
- `STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY`
- Enterprise/Hosted Enterprise: keep contact-sales/manual flow unless product explicitly moves them to self-serve Stripe checkout.

## Stripe Dashboard Field Checklist (What To Enter)

For Miru Pro in Stripe Dashboard:

1. Product:
- Name: `Miru Pro`
- Pricing model: `Standard`

2. Monthly price:
- Type: `Recurring`
- Billing period: `Monthly`
- Usage model: `Licensed` (per seat)
- Amount: your monthly per-seat amount

3. Yearly price:
- Type: `Recurring`
- Billing period: `Yearly`
- Usage model: `Licensed` (per seat)
- Amount: your yearly per-seat amount

Do not use:

- One-time price (not compatible with Miru subscription checkout flow)
- Metered usage (Miru currently sends explicit seat quantity)

## Where To Copy Env Var Values In Stripe

- `STRIPE_SECRET_KEY`:
- Stripe Dashboard -> Developers -> API keys -> Secret key (`<stripe_secret_key>`)

- `STRIPE_PUBLISHABLE_KEY`:
- Stripe Dashboard -> Developers -> API keys -> Publishable key (`<stripe_publishable_key>`)

- `STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY`:
- Stripe Dashboard -> Product catalog -> Miru Pro -> select monthly recurring price -> copy `<monthly_price_id>` value

- `STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY`:
- Stripe Dashboard -> Product catalog -> Miru Pro -> select yearly recurring price -> copy `<yearly_price_id>` value

- `STRIPE_SUBSCRIPTION_PRICE_ID` (optional fallback):
- Set to either monthly or yearly price ID if you want a default fallback

- `STRIPE_WEBHOOK_ENDPOINT_SECRET`:
- If using Stripe CLI locally: value printed by `stripe listen` (`<webhook_signing_secret>`)
- If using Dashboard webhook endpoint: Developers -> Webhooks -> select endpoint -> Reveal signing secret (`<webhook_signing_secret>`)

- `STRIPE_PLAN_PAGE_URL` (optional):
- Use only if you want billing checkout to redirect to a hosted Payment Link page instead of server-created Checkout Sessions.
- Copy the full hosted URL from Payment Links/Checkout link setup if you intentionally adopt that path.

## Local Webhook Setup (Stripe CLI)

1. Install Stripe CLI and authenticate:

```bash
stripe login
```

2. Forward Stripe events to local Miru webhook:

```bash
stripe listen --forward-to http://127.0.0.1:3000/webhooks/stripe/checkout/fulfillment
```

3. Copy the signing secret printed by Stripe CLI and set it as `STRIPE_WEBHOOK_ENDPOINT_SECRET`.
4. Restart web/worker processes after changing env vars.

## Start Miru Locally

Run app stack using repo-preferred runtime wrapper:

```bash
rtk mise exec -- bundle exec foreman start -f Procfile.dev
```

Primary local URL:

- `http://127.0.0.1:3000`

## End-to-End Verification Checklist

### A) Stripe Connect (Payment Settings)

1. Log in as an owner/admin user.
2. Open Payment Settings and click Connect Stripe.
3. Complete Stripe onboarding in test mode.
4. Confirm provider status returns connected from:
- `GET /api/v1/payments/settings`

Expected outcome:

- `stripe.connected` is `true`.

### B) Invoice Payment Checkout + Webhook

1. Create a client + invoice with Stripe enabled.
2. Open client invoice payment URL (`/invoices/:id/payments/new` flow) and choose Stripe.
3. Complete checkout using Stripe test card `4242 4242 4242 4242`.
4. In Stripe CLI terminal, verify `checkout.session.completed` is delivered.
5. In Miru UI/API, verify invoice moved to paid and payment entry is created.

Expected webhook/event handling:

- Endpoint: `POST /webhooks/stripe/checkout/fulfillment`
- Service: `HandleStripeCheckoutEventService` -> `InvoicePayment::StripeCheckoutFulfillment`

### C) Subscription Checkout + Sync

1. Open billing settings in app.
2. Trigger upgrade checkout (monthly/yearly).
3. Complete test checkout in Stripe.
4. Verify webhook events are forwarded and processed:
- `checkout.session.completed`
- `customer.subscription.created` / `updated`
- `invoice.paid` (on invoice cycles)
5. Verify company billing fields are updated (`stripe_customer_id`, `stripe_subscription_id`) and plan status in billing UI changes.

Expected service path:

- `Api::V1::SubscriptionsController#checkout`
- `HandleStripeCheckoutEventService` -> `Subscriptions::StripeSyncService`

## API/Flow Smoke Tests

Use these as focused checks during integration work:

- `GET /api/v1/subscription`
- `POST /api/v1/subscription/checkout?interval=monthly`
- `POST /api/v1/subscription/portal`
- `POST /api/v1/payments/settings/stripe/connect`
- `DELETE /api/v1/payments/settings/stripe/disconnect`

## Common Failure Modes

- `Invalid signature!` on webhook:
- `STRIPE_WEBHOOK_ENDPOINT_SECRET` does not match the current Stripe signing secret.
- Stripe checkout session creation fails:
- Missing/invalid `STRIPE_SECRET_KEY` or missing subscription price env var.
- Stripe Connect refresh/return links are wrong:
- `APP_BASE_URL` is missing or not set to the active local host.
- Billing checkout returns pricing error:
- Missing `STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY` / `YEARLY` and no fallback `STRIPE_SUBSCRIPTION_PRICE_ID`.

## Focused Test Commands

Run focused specs first when changing Stripe flows:

```bash
rtk mise exec -- bundle exec rspec spec/requests/webhooks/stripe_controller_spec.rb
rtk mise exec -- bundle exec rspec spec/services/subscriptions/stripe_sync_service_spec.rb
rtk mise exec -- bundle exec rspec spec/requests/api/v1/subscriptions_controller_spec.rb
```

If JavaScript or TypeScript files are changed as part of Stripe work, run:

```bash
rtk mise exec -- timeout 30 bin/vite build
```
