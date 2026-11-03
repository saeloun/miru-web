# Razorpay Payment Operations

## Merchant account connection (OAuth)

An owner or admin can connect a workspace's own Razorpay account, or create one, from Settings → Payment Settings → Razorpay. Razorpay hosts sign-in, sign-up and KYC on its co-branded OAuth page, so Connect and Create are one entry point. Funds settle to the merchant's own account; Miru takes no fee and holds no funds, and route transfers are never added to these links. Existing API-key customers keep their current flow and cannot be replaced through OAuth.

It is off by default. Two independent switches apply:

| Variable | Purpose |
| --- | --- |
| `RAZORPAY_OAUTH_ENABLED`, `RAZORPAY_OAUTH_CLIENT_ID`, `RAZORPAY_OAUTH_CLIENT_SECRET`, `RAZORPAY_OAUTH_MODE` (`test` or `live`), `RAZORPAY_OAUTH_REDIRECT_URI` | Allow connecting. The callback must be `/payments/razorpay/callback`, over HTTPS in production. |
| `RAZORPAY_OAUTH_WEBHOOK_SECRET` | Verifies events on `POST /webhooks/razorpay/oauth`. Set it as the application's webhook secret in the Razorpay Partner Dashboard and subscribe to `account.app.authorization_revoked`, the `account.*` status events and the `payment_link.*` events. |
| `RAZORPAY_OAUTH_COLLECTIONS_ENABLED` | Allows connected merchants to collect invoice payments. Keep it off until provider test-mode acceptance passes. |

Keep credentials in deployment secrets; never paste them into issue descriptions, browser responses or logs.

### Status

`collections_ready` is true only when the connection is usable, both switches are on, the webhook secret is set, the current client ID and mode match the stored tokens, the application is configured, and the merchant is confirmed. Pending consent also binds the exact callback URL; existing tokens can still be used, refreshed and revoked after only that URL changes. A bad client configuration never destroys a connection: restoring it restores the connection. In live mode a merchant is confirmed only by a signed `account.activated`, `account.instantly_activated` or `account.payments_enabled` event for the connected account whose payload does not say `activated: false`. `account.funds_unhold` only restores the status from before a hold. Status from another mode does not survive a reconnect. Consent alone never confirms a merchant. `payouts_ready` is always false: merchant OAuth requests `read_write` only and never enables RazorpayX, Payroll or payouts, and `create_upi_payout` still requires API keys.

| Status | Meaning | Owner action |
| --- | --- | --- |
| `disconnected`, `reconnect_required`, `merchant_rejected`, `revoked` | No usable connection and nothing Miru can still revoke. | Connect again. |
| `pending` | Waiting for Razorpay. | Finish on Razorpay, restart, or cancel. |
| `connected` | Tokens are held. This does not mean the merchant can accept payments. | Enable invoices once ready. |
| `revocation_pending` | Payments stopped; a known token is still encrypted awaiting revocation. | Retry from settings. If the token belongs to a previous application configuration, which the current one cannot revoke, settings offers recovery instead. |
| `reconciliation_required` | An exchange or refresh that reached Razorpay ended ambiguously, or a worker died during a refresh, so a grant Miru cannot revoke may exist. | Start recovery. Known tokens can still be revoked from settings. |
| `recovery_pending` | Recovery started; reconnect and API-key changes stay blocked. | See below. |

An account with stored OAuth credentials must be disconnected before starting again, and a workspace can only reconnect the same merchant, so moving to a different merchant is not supported yet. Razorpay's revocation is per merchant and application, so if two workspaces connected the same merchant, one signed revocation stops both. The API-key endpoint returns 409 while credentials, cleanup material, a pending consent or an in-flight exchange exist.

### Token maintenance

`RefreshRazorpayOauthTokensJob` runs daily at 03:23 UTC in the default and production schedules. Restart the Solid Queue dispatcher when deploying the new entry. It maintains connected OAuth accounts even when invoice collection is disabled, rotates only stale access tokens through the existing serialized refresh, and does nothing while `RAZORPAY_OAUTH_ENABLED` is off. This keeps quiet accounts rotating before the documented 180-day refresh-token expiry without enabling invoice collection or payouts.

A failed connection is reported through `Rails.error` with company/provider IDs and recovery guidance; it does not stop the remaining accounts. Ambiguous rotation still requires recovery rather than retrying a possibly consumed token. An in-progress refresh is left to its current worker. Changed application configuration preserves the connection without creating a refresh reservation, so restoring the configuration allows maintenance to resume.

Disconnect treats any outstanding refresh reservation as uncertain, even if revoking the old token succeeds: the worker may have died after Razorpay issued a replacement. Reconnection and API-key changes stay blocked pending recovery. A signed revocation must be dated after the uncertainty began; older events cannot clear a newer unknown grant. Older records without that timestamp require starting recovery first. Confirmed revocation or completed recovery clears the old reservation, so it cannot poison a later connection.

### Failure classification

Only the exact documented text of a [Razorpay OAuth error](https://razorpay.com/docs/partners/technology-partners/onboard-businesses/integrate-oauth/errors) on a 4xx, read from `error.description` or `error_description`, counts as definitive. Blanket 4xx, substrings, 408, 429, 5xx, transport errors and malformed bodies stay ambiguous and fail closed. `Authorization code has been revoked` also stays ambiguous, because it could reflect an earlier exchange. A definitive exchange rejection clears the attempt. A refresh rejected as an invalid token drops that token. A refresh rejected for the application keeps the token as cleanup. `Could not validate the token provided` on revocation counts as already revoked.

Razorpay's token error response shape is shown only for the revoke endpoint; confirm the rest during provider acceptance. A different shape is safe, because it stays ambiguous and uses recovery.

### Recovering an unknown grant

Disconnect does not clear `reconciliation_required`. There is no checkbox and no console step:

1. The owner starts recovery in settings with the Razorpay account ID. A known connected account cannot be changed. This is audited.
2. The owner opens Applications in the Razorpay Dashboard and chooses Revoke beside Miru.
3. A signed `account.app.authorization_revoked` for that account, dated after recovery began, clears the state to `revoked`.
4. If Miru is not listed, there may be no event to wait for. The owner asks Razorpay support to confirm no active grant exists and submits that reference. It is audited, known tokens must already be resolved, and the status never claims revocation.

Support references cannot be verified by Miru. They are an accountable owner statement, not provider proof.

### Invoice collection

Payment Links use the merchant's Bearer token through the SDK mutex, which restores global auth and headers afterwards. Refresh happens before the invoice lock and SDK mutex. A refresh cannot start inside a caller transaction or without its own committed reservation. Each link is bound to the invoice and merchant account. The invoice lock serializes ordinary concurrent creation requests; it does not guarantee recovery from an unknown remote creation outcome.

Webhooks recheck the stored binding under the invoice lock before clearing it. Replacing a stale link requires a confirmed cancellation; a capture returned during cancellation stays in review. Paid links are reconciled rather than replaced. When an invoice becomes paid, waived or deleted, an after-commit job makes a best-effort cancellation attempt while keeping its references. An issued link remains payable until Razorpay closes it, including after a disconnect.

An open review blocks checkout through other providers as well as Razorpay. Checkout rechecks after provider IO, and payment-start failures never promise the customer was not charged. Captures on invalid, waived or deleted invoices stay in review. OAuth evidence blocks permanent invoice destruction; use soft deletion to retain the audit trail.

### Payments needing review

The amount check fails closed, so a customer can pay an old link for an invoice that has since changed. Miru never settles that payment: it records it on the invoice, audits it, logs an error and lists it in settings with its payment ID, link ID, reason, amount and invoice state. Each distinct captured payment gets its own entry in `payment_infos["razorpay_payment_reviews"]`, including on paid and deleted invoices, and settled, already listed or already reviewed payment IDs are not added again. A singular `razorpay_payment_review` from earlier code is read as one entry and migrated on the next write. An unpaid invoice cannot start a new link while any entry is pending. A signed capture for a link Miru no longer tracks is flagged the same way, only when the signing account is the invoice company's connected account.

An owner or admin clears one entry at a time by its ID after a confirmation. Other entries are never touched, and a paid invoice is never reopened. Clearing the last entry on an unpaid invoice first closes the tracked link: if Razorpay does not confirm a final status, including when the account is disconnected, the review and the link binding are both kept. If another capture arrives meanwhile, it stays listed and the binding is kept. Resolved payment IDs cannot settle an invoice on replay. The list shows the first 20 entries and identifies that limit.

Razorpay documents the Payment Link callback signature only with an API key secret, which OAuth merchants do not share. Public tokens and client secrets are never used to verify it. An OAuth callback is an untrusted hint: Miru fetches the invoice's stored link with the merchant's token and settles only if the account, invoice, company, reference, currency, full amount and captured payment all match.

Any connected merchant can sign events through the application secret, so a webhook settles only through the invoice's stored link ID and requires the signing account to match the invoice's bound account. Notes never settle an invoice. The legacy Payment Links endpoint refuses invoices of OAuth providers, even if an old webhook secret is still saved. A signed paid event still reconciles after a disconnect. A signed revocation stops only the matching application, mode and account, ignores events older than the current connection, and audits identifiers only.

### Provider gates

These cannot be proved without real Razorpay access:

- Technology Partner status and KYC, the co-branded UI capability, a registered application, callback allowlists and webhook subscriptions.
- A test-mode run of consent, hosted sign-up, token exchange, refresh, revocation, a paid Payment Link and each webhook.

Implementation hold before activation: link creation still needs durable intent and reconciliation for a worker death, database rollback or ambiguous provider response after remote creation. In particular, do not enable OAuth SMS collection while retrying could send a second payable link. Cancellation enqueue is best effort and still needs a durable repair path. Late-capture/partial-payment webhook shapes and retained raw URLs in mobile/API serializers also need provider and consumer validation.
- The token error response shape described above.
- Which event, if any, an already-active merchant receives after connecting. Until confirmed, such a live merchant shows `merchant_unconfirmed` and cannot enable invoices.
- That Payment Link and account webhooks reach the application-level endpoint with `account_id`, and whether they still arrive after a merchant revokes.
- That revoking a refresh token also ends its access token. Razorpay's sample revokes an access token, and Miru sends the refresh token because it does not keep access tokens after failing closed, so "access revoked" rests on this assumption.
- Real refresh-token rotation and expiry behavior. Daily maintenance covers quiet accounts, but provider acceptance must still verify the token and revocation contracts.
- Whether a single transient refresh failure should retry the known token before requiring manual recovery, which depends on Razorpay's rotation behaviour on a failed response.
- The ten-minute consent state window against the time hosted sign-up and KYC really take. Retrying is clean if it expires.

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
