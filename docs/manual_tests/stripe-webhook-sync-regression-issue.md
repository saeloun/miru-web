### Description

Stripe subscription checkout and cancellation webhooks were intermittently failing during local testing, causing billing state in Miru to remain incorrect (for example, plan stuck on Free after successful checkout, or webhook 500s on subscription events).

Observed root causes:
- Webhook handler attempted to process `event.type` even when Stripe event construction failed, resulting in `NoMethodError: undefined method 'type' for nil`.
- Subscription sync assumed `current_period_end` was always present on the Stripe subscription object. With newer Stripe payload shapes, this field may be absent/moved, resulting in `NoMethodError` and failed sync.

### Environment

- MacOS
- Chrome
- Local development (`http://127.0.0.1:3000`)
- Stripe CLI forwarding to local webhook endpoint

### What is the expected behaviour?

- Stripe webhook endpoint should return stable success/error responses without 500 crashes.
- Successful subscription checkout should sync workspace billing state to Paid.
- Subscription cancellation events should sync workspace billing state back to Free based on business rules.

### What is the current behaviour?

- Before fix:
- Some webhook events returned 500 due to nil event handling and subscription payload assumptions.
- Billing page could show stale/incorrect state because sync failed.

- After fix in current branch:
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and `checkout.session.completed` process successfully.
- Billing state transitions now sync correctly for tested scenarios.
- Some unrelated Stripe events (for example `invoice.updated`, `credit_note.created`) still return 400 as they are not handled in current webhook event matrix.

### How to reproduce the issue?

1. Configure local Stripe checkout + webhook forwarding with Stripe CLI.
2. Complete a subscription checkout in test mode.
3. Observe webhook processing and billing state transitions in Miru.

### Screenshots or Screencast

- Billing page showing current plan state before/after checkout and cancellation.
- Stripe Billing Portal screenshot showing cancellation mode (`cancel at period end` vs immediate cancel).

### Please provide any traces or logs that could help here.

- Stripe CLI logs with event sequence and HTTP statuses.
- Rails server stack traces previously observed:
- `NoMethodError (undefined method 'type' for nil)` in `HandleStripeCheckoutEventService#handle_event`
- `NoMethodError (undefined method 'current_period_end' for #<Stripe::Subscription ...>)` in `Subscriptions::StripeSyncService#sync_company!`

### Any possible solutions?

- Guard webhook processing after event construction failure:
- Return early when signature/payload validation sets an error status.

- Make subscription sync resilient to Stripe payload variants:
- Read `current_period_end` safely from either top-level or nested period object.
- Safely access subscription fields (`customer`, `id`, `status`, interval) across object/hash-like payload structures.

- Optional follow-up:
- Decide whether to explicitly acknowledge additional Stripe event types (`invoice.updated`, `credit_note.created`) to reduce noisy 400s.

### If the bug is confirmed, would you be willing to submit a PR?

Yes.
