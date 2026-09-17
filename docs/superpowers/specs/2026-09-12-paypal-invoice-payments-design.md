# PayPal invoice payments and provider prioritization

Date: 2026-09-12
Status: approved for implementation (autonomous run, assumptions listed at the end)

## Problem

Miru collects invoice payments through Stripe Connect, Razorpay (INR), and a free UPI QR (INR). Clients outside India who do not want to enter a card, and merchants who cannot or will not onboard to Stripe, have no online payment path. PayPal is the most requested gap. The founder also asked which other platforms to add and in what order.

## Prioritization

| Priority | Platform | Verdict | Why |
| --- | --- | --- | --- |
| P1 (this spec) | PayPal | Build now | Global reach, no Stripe onboarding, buyers already have accounts. Self-serve for merchants: paste REST app credentials, no partner approval needed. Sandbox is free and complete, so the whole flow can be verified end to end. |
| P2 | Square | Next | US/CA/UK/AU small businesses. Payment Links API plus webhooks map onto the same `PaymentsProvider` pattern used here. Merchant access token first, OAuth later. |
| P3 | GoCardless or Mollie | Later | EU direct debit and iDEAL. Lower demand in the current customer base. Add when an EU customer asks. |
| Not applicable | Paddle | Do not build for invoices | Paddle is a merchant of record for selling your own SaaS or digital goods. Its terms do not allow collecting third-party service invoices on behalf of merchants, so it cannot back an invoice Pay button. It is only relevant as an alternative rail for Miru's own subscription billing, which already runs on Stripe. This matches the earlier decision in `docs/miru-stripe-invoicing-ar-plan.md` ("Do not add Paddle now"). |
| Drop | Wise | Remove later | The `wise_accounts` table and env vars are leftovers. Wise is a payout and transfer product, not a collection rail. |

Razorpay stays the default for INR invoices. Stripe stays the default everywhere else when connected. PayPal is offered alongside whichever default applies and becomes the default when nothing else is connected.

## Approach options considered

1. **Merchant REST credentials + Orders v2 API (chosen).** Merchant creates a REST app in the PayPal developer dashboard and pastes Client ID and Secret into Miru. Miru creates orders, redirects the buyer to PayPal, captures on return, and reconciles through webhooks. Works in sandbox and live today. Same shape as the Razorpay integration, so the codebase already has the patterns (encrypted secrets, webhook fulfillment services, public payment controller).
2. **PayPal Commerce Platform partner onboarding ("Connect with PayPal").** One-click connect like Stripe Connect. Requires Miru to be an approved PayPal partner with a BN code. Approval is a manual PayPal business process and can take weeks. Rejected for now; option 1 leaves room for it later because the provider record can store a merchant ID instead of credentials.
3. **PayPal.me or Payments Standard link with IPN.** Merchant enters only an email. No API. IPN is a legacy product and reconciliation is fragile. Rejected.

## Design

### Data

`PaymentsProvider` gains a `paypal` name. Settings JSONB keys:

- `client_id`
- `client_secret_ciphertext` (encrypted, write-only, same encryptor as Razorpay secrets)
- `environment`: `sandbox` or `live` (default `live`)
- `webhook_id`: PayPal webhook registered by Miru on the merchant app
- `enabled_on_invoices` (default true)

Columns `connected` (credentials verified) and `enabled` (merchant switch) keep their existing meaning. `accepted_payment_methods` is `["paypal"]`.

The model gets a small `encrypted_setting` macro that replaces the two hand-written encrypted accessor pairs (`key_secret`, `webhook_secret`) and adds `client_secret`. Behavior of the existing accessors does not change.

`Invoice.payment_infos` gains `paypal_order_id`, `paypal_order_status`, `paypal_capture_id`.

`Payment.transaction_type` already has `paypal`. `provider_event_id` is `paypal:<capture_id>` and the existing unique index makes settlement idempotent.

### Supported currencies

The 27 PayPal REST currencies. `HUF`, `JPY`, `TWD` are sent without decimals. Invoices in other currencies do not show PayPal.

### Backend

`PaymentProviders::PaypalClient` (Faraday, no new gem):

- `access_token`: client credentials grant, cached in `Rails.cache` keyed by environment and a digest of the client ID, TTL `expires_in - 60`.
- `create_order(payload, request_id:)`, `show_order(id)`, `capture_order(id, request_id:)`
- `create_webhook(url:, event_types:)`, `delete_webhook(id)`
- `verify_webhook_signature(headers:, body:, webhook_id:)` through PayPal's verify endpoint
- Raises `PaypalClient::Error` with PayPal's `message` or first `details[].description`. Timeouts 5s open, 15s read.

`PaymentProviders::PaypalConnectionService.new(provider:, webhook_url:)`:

- Called when credentials are saved. Fetches a token to prove the credentials, sets `connected`, registers the webhook (`PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`) when `webhook_id` is blank or the environment or client ID changed, and stores the ID. On failure the provider is saved as not connected and the error is returned to the UI.
- `disconnect!`: best-effort webhook delete, then destroys the provider row.

`PaymentProviders::PaypalOrderService.new(invoice:, provider:, return_url:, cancel_url:)`:

- Creates an order with intent `CAPTURE`, one purchase unit (`reference_id` `miru-inv-<id>`, `custom_id` invoice id, `description` "Invoice <number> from <company>", amount from `invoice.amount_due`), `payment_source.paypal.experience_context` with `user_action: PAY_NOW`, `shipping_preference: NO_SHIPPING`, `brand_name`, `return_url`, `cancel_url`. `PayPal-Request-Id` is a fresh UUID per click.
- Stores the order id and status on the invoice and returns the `payer-action` link.
- A new order is created on every click. Uncaptured orders expire on PayPal's side and never charge the buyer.

`InvoicePayment::PaypalCaptureFulfillment.new(invoice:, order_id:)`:

- Under `invoice.with_lock`: return true if already paid; capture; require status `COMPLETED`, `custom_id` equal to the invoice id, and capture currency equal to the invoice currency; settle through `InvoicePayment::Settle` with `transaction_type: "paypal"`, `provider_event_id: "paypal:<capture_id>"`, payer name from `payer.name`; store capture id and status.
- `ORDER_ALREADY_CAPTURED` from PayPal is handled by reading the order and settling from its existing capture.
- Sends the same payment confirmation emails the Razorpay path sends.

`InvoicePayment::PaypalWebhookFulfillment.new(payload:, headers:)`:

- Supports `PAYMENT.CAPTURE.COMPLETED` (settle from resource) and `CHECKOUT.ORDER.APPROVED` (capture through the fulfillment above). Other events return success without action.
- Finds the invoice by `custom_id`, then by `paypal_order_id`. Finds the merchant provider through the invoice company. Verifies the signature through PayPal using the provider's `webhook_id`; invalid signatures answer 401, missing invoice or provider answer 422.

`Webhooks::PaypalController#events` at `POST /webhooks/paypal/events`: same shape as the Razorpay webhook controller (1 MB cap, no session, no CSRF, Sentry on unexpected errors).

`Invoices::PaymentsController` (public, keyed by `external_view_key`):

- `new` gains `provider=paypal`. Without the param the existing priority applies: Razorpay for INR when enabled, else Stripe, else PayPal when enabled, else cancel page.
- `paypal_return` (GET, params `token`): runs the capture fulfillment and redirects to `/invoices/<key>/payments/success?provider=paypal`, with an alert when capture fails.
- `cancel` already exists and serves as the PayPal cancel URL.

`Api::V1::Invoices::PaymentsController#success` treats `provider=paypal` like `razorpay`: success only when the invoice is paid.

`Api::V1::PaymentSettingsController`:

- `update_paypal` (PATCH `payments/settings/paypal`): permits `enabled`, `enabled_on_invoices`, `client_id`, `client_secret`, `environment`. Blank secret keeps the stored one. Runs the connection service when credentials are present. Responds with the full settings payload or 422 with PayPal's error.
- `disconnect_paypal` (DELETE `payments/settings/paypal`).
- `PaymentSettingsPolicy#update_paypal?` and `#disconnect_paypal?` mirror the Razorpay rules (owner or admin).

Jbuilder `payment_settings/index` adds `providers.paypal`: `connected`, `enabled`, `enabled_on_invoices`, `client_id`, `client_secret_configured`, `environment`, `webhook_id`, `webhook_url`.

Jbuilder `invoices/view/show` adds `paypal_payment`: `enabled` (provider enabled, enabled on invoices, credentials present, currency supported) and `url` (`/invoices/<key>/payments/new?provider=paypal`).

### Frontend

- `paymentSettingsApi.updatePaypal(provider)` and `disconnectPaypal()`.
- Settings page: a PayPal card between Stripe and UPI, following the Razorpay card layout. Fields: Client ID, Client secret (password, "Secret already saved" placeholder), Sandbox mode switch, Show PayPal on invoices switch, Connected switch, Save PayPal. When connected: Connected badge, environment badge, webhook status line, Disconnect button with confirm dialog. Link to the PayPal developer dashboard. `?provider=paypal` scrolls to the card like `?provider=razorpay` does.
- Public invoice page (desktop header and mobile view): when PayPal is enabled and another provider is the default, a second "Pay with PayPal" button appears next to PAY. When PayPal is the only provider, PAY goes to the PayPal URL.
- Invoice list: PayPal counts toward `isPaymentEnabled` so the setup prompt hides once PayPal is on.
- i18n keys in `en.ts` only; other locales fall back to English through `i18n.defaultLocale`.

### Errors

- PayPal API failures surface as the PayPal message in a toast on the settings page and as a redirect to the cancel page with an alert on the public flow.
- Capture with mismatched `custom_id` or currency does not settle and is logged with the order id.
- Webhook replay is safe: `provider_event_id` uniqueness plus the paid check under lock.

### Testing

- Model: paypal validations, encrypted `client_secret`, the macro keeps `key_secret` behavior.
- `PaypalClient`: WebMock specs for token caching, order create, capture, webhook create, verify signature, error mapping.
- Services: order service payload and invoice updates; capture fulfillment happy path, already captured, mismatched custom_id, already paid; webhook fulfillment for both events, bad signature, unknown invoice.
- Requests: payment settings update and disconnect (connection service stubbed), public `new?provider=paypal` and `paypal_return`, webhook controller, invoice view payload.
- Frontend: `bin/vite build`, then a real browser pass on the running app: connect sandbox credentials on the settings page, open a public invoice, pay with a sandbox buyer, land on the success page, confirm the payment row and console cleanliness.

### Docs and release

- `docs/product-guide/payments/04-paypal.md` with dashboard steps.
- CHANGELOG entry under Unreleased.
- No new env vars. Merchants own their PayPal credentials.

## Assumptions made in this autonomous run

1. "PayPal connect" means a merchant-managed connection in Payment Settings, not PayPal partner onboarding. Partner onboarding can replace the credential form later without changing the invoice flow.
2. Paddle is out of scope for invoice collection for the reason above. If the intent was Paddle for Miru's own subscriptions, that is a separate billing project.
3. A new order per Pay click is acceptable; PayPal never charges an uncaptured order.
4. Square is the recommended next platform and is not part of this change.
