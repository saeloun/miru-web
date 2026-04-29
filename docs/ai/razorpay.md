# Razorpay Payment Operations

## Integration Shape

- Miru uses Razorpay Standard Payment Links for INR invoice collection.
- The official `razorpay` Ruby gem is used for Payment Link create/fetch calls and signature verification helpers.
- The gem depends on `httparty`, which is already present in Miru. Keep the gem on a patched `~> 3.2` line and review release notes before widening the range.
- Payment methods such as UPI, Indian credit/debit cards, netbanking and wallets are controlled in the Razorpay Dashboard. Miru should not hard-code a narrower method list unless a product requirement asks for it.

## Secrets

- Store the Razorpay Key ID, Key Secret and Webhook Secret from Payment Settings.
- Key Secret and Webhook Secret are encrypted in `payments_providers.settings` and are never returned by API responses. API responses expose only `key_secret_configured` and `webhook_secret_configured`.
- Never commit test or live Razorpay keys to source. Local keys belong in ignored env files or local shell profile only.

## Webhook Setup

- Configure this endpoint in Razorpay Dashboard:
  - `https://app.miru.so/webhooks/razorpay/payment_links`
- Subscribe to:
  - `payment_link.paid`
  - `payment_link.partially_paid` if partial payments are enabled later.
- Set a webhook secret in Razorpay Dashboard and paste the same value into Miru Payment Settings.
- For staging/local tunnel testing, configure a separate Razorpay Test Mode webhook and a separate test webhook secret.

## Webhook Rotation

- Generate the replacement webhook secret in Razorpay Dashboard.
- Update Miru Payment Settings with the new secret.
- Watch webhook delivery for the next invoice payment before deleting old dashboard configuration.
- Razorpay may retry older events with the old secret. Miru currently stores one active webhook secret per provider, so avoid rotating during an active incident or high payment volume window.
- Treat repeated `401`/`422` webhook responses, unexpected event names and invoice-not-found errors as payment-risk alerts; investigate before retry storms hide a real reconciliation issue.

## Payouts

- UPI payouts require RazorpayX activation, API payout access and IP allowlisting in RazorpayX.
- `payout_account_number` is the RazorpayX source account/customer identifier, not the recipient bank account.
- Payout requests must use a stable idempotency key for retries. Reusing the same key prevents duplicate payouts; changing the key while the first attempt is processing can duplicate money movement.

## Rollback

- Fast product rollback: disable `Show Razorpay on INR invoices` or disable the Razorpay provider in Payment Settings.
- Webhook rollback: remove or disable the Razorpay webhook in Dashboard, then monitor invoice payments for manual reconciliation.
- Code rollback: revert the Razorpay SDK integration commit and redeploy, then confirm `/invoices/:id/payments/new` falls back to the previous provider behavior.
