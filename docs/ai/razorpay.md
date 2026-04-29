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

- Configure this Payment Gateway endpoint in Razorpay Dashboard:
  - `https://app.miru.so/webhooks/razorpay/payment_links`
- Subscribe to:
  - `payment_link.paid`
  - `payment_link.partially_paid`
  - `payment_link.cancelled`
  - `payment_link.expired`
- Configure this RazorpayX endpoint in RazorpayX Dashboard:
  - `https://app.miru.so/webhooks/razorpay/payouts`
- Subscribe to:
  - `payout.pending`
  - `payout.queued`
  - `payout.initiated`
  - `payout.processed`
  - `payout.updated`
  - `payout.failed`
  - `payout.rejected`
  - `payout.reversed`
  - `payout.cancelled`
- Set a webhook secret in Razorpay Dashboard and paste the same value into Miru Payment Settings. The secret does not need to be the API key secret.
- For staging/local tunnel testing, configure a separate Razorpay Test Mode webhook and a separate test webhook secret.
- Razorpay signs the raw request body in the `X-Razorpay-Signature` header with HMAC-SHA256. Do not parse or re-serialize the body before signature verification.
- Razorpay may deliver duplicate events and may not always deliver events in order. Miru handles duplicate Payment Link payments by Razorpay payment id, clears cancelled/expired links so the next invoice payment attempt creates a fresh link, and updates payout state from signed payout events.

## Dashboard Onboarding

1. In Miru, open Settings → Payment Settings → Razorpay.
2. Click **Open Razorpay** and copy the live Key ID and Key Secret from Razorpay Dashboard.
3. Save the Key ID and Key Secret in Miru.
4. Copy the webhook setup block from Miru. It includes both production URLs and the event names to select.
5. In Razorpay Dashboard → Accounts & Settings → Webhooks, add the Payment Links webhook URL and select the Payment Link events above.
6. In RazorpayX Dashboard → My Account & Settings → Developer Controls, add the payouts webhook URL and select the payout events above.
7. Use the same webhook secret value in both Razorpay dashboards and in Miru unless there is an operational reason to rotate them separately.
8. Enable **Show Razorpay on INR invoices** after keys and webhook secret are saved.
9. Enable **UPI payouts** only after RazorpayX is activated, the RazorpayX account number is present, and the payout UPI ID is verified.

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
