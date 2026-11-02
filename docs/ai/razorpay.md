# Razorpay Payment Operations

## Merchant OAuth connection foundation

The company-bound OAuth connection API is a separate delivery from invoice collection activation and RazorpayX/Payroll. It reuses PaymentsProvider encrypted settings; it adds no schema migration. Its connection status always reports collections/payouts unavailable until the remaining integration and provider acceptance are complete. Existing API-key invoice customers keep their current flow and cannot be replaced through OAuth.

Active workspace owners/admins can use GET/POST/DELETE `/payments/razorpay/connection`; the fixed callback is GET `/payments/razorpay/callback`. Mutations require the normal browser session and CSRF protection. The callback also requires the initiating browser, actor, workspace, application/mode and a single-use ten-minute state. Failed or superseded attempts cannot reconnect the account. Disconnect disables local operations even when upstream revocation cannot be confirmed.

An account with stored OAuth credentials must be explicitly disconnected before starting again. A rejected restart preserves the current credentials, so the owner can still revoke the original grant rather than silently orphan it. Pending attempts without credentials may be restarted safely. After a disconnect, the workspace can reconnect only the same Razorpay merchant account.

Disconnect applies only to a provider already using OAuth; a provider that never started OAuth is left untouched and gets a 409. The API-key settings endpoint returns 409 while OAuth credentials, cleanup material, a pending consent or an in-flight exchange exist, and works again once they are gone. Saving API keys permanently prevents starting OAuth on that provider.

`revocation_pending` means encrypted cleanup material is retained, reconnect is blocked, and explicit disconnect retries revocation. `reconciliation_required` means an exchange or refresh that reached the provider ended without a usable result. Miru treats every such failure as a grant that may exist, including provider 4xx responses, because the provider's failure contract has not been verified. Reconnect and API-key changes stay blocked, disconnect does not clear the marker, and there is no supported way to clear it yet. Classifying definite provider failures and adding a supported recovery path must happen before enabling this feature.

Configuration is disabled by default. The OAuth client requires `RAZORPAY_OAUTH_ENABLED=true`, `RAZORPAY_OAUTH_CLIENT_ID`, `RAZORPAY_OAUTH_CLIENT_SECRET`, `RAZORPAY_OAUTH_MODE` (`test` or `live`) and `RAZORPAY_OAUTH_REDIRECT_URI`. The callback URI must use the fixed path above and HTTPS in production. Register it with the correct development/production partner application. Keep credentials in deployment secrets; never paste them into issue descriptions, browser responses or logs.

Official Technology Partner/KYC approval, co-branded onboarding enablement, registered application and scopes must be verified separately. This backend foundation does not add the Connect/Create settings UI, change the legacy SDK invoice authentication, verify Payment Link callback signatures for OAuth, or complete merchant-status/revocation webhooks. Do not represent a successful authorization callback as merchant activation, an invoice payment, Payroll access or permission to move funds.

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
