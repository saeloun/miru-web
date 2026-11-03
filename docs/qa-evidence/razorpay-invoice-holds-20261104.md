# Invoice payment holds and checkout balances

All accounts, users, invoices and transfers in this evidence are synthetic. HTTP to payment providers is stubbed and outbound access is restricted to localhost. No real account connection, payment, SMS or email occurred.

An open invoice awaiting link creation, capture review or its original connected account exposes a safe hold flag. Public and signed-in client pages disable Pay and withhold UPI QR codes and bank instructions. Invoice UPI buttons use guarded checkout, including when a previously loaded button is clicked after a hold appears. An explicitly unavailable UPI option never falls back to another provider.

Paid, waived and zero-balance invoices withhold payment options without falsely reporting uncertainty. Confirmed cancelled/expired links allow another method only when no creation or capture review remains unresolved. The confirming page uses a neutral status and an invoice return link; archived invoices have no dead return link.

Checkout rejects closed or zero-balance invoices before provider I/O and rechecks availability, balance and currency afterward. Stripe charges the remaining balance rather than the original invoice total. A completed remaining-balance payment settles the invoice, and replay after that settlement creates no second payment.

## Verification

- Sixteen initial API/service examples reproduced six failures. Four browser examples reproduced enabled Pay buttons or the misleading confirming page before the UI correction.
- Additional regressions reproduced retained-reference false holds, payment instructions on closed invoices, checkout creation for waived/zero-balance invoices, stale amount/currency redirects and charging 12,345 instead of the remaining 2,345 EUR minor units.
- The final related backend run passed 679 examples across invoice models, payment providers, real PDF generation, settlements, callbacks, webhooks, recovery jobs, settings and mobile collections. A subsequent three-example Stripe fulfillment run passed, including remaining-balance settlement and replay after settlement; production source was unchanged afterward.
- The final combined settings, invoice payment and client invoice browser run passed 33 examples in headless Brave, including desktop/mobile layout, actual CSRF-protected requests, role changes and console-error checks.
- The required Vite build and forced test-assets build passed; the test build transformed 9,771 modules. ESLint, Prettier and RuboCop passed for affected files.
- The broad Claude review timed out without a verdict. Smaller static reviews identified the retained-reference and direct-checkout gaps; the corrections were reproduced and verified. A final focused checkout-balance review returned `NO_FINDINGS`, with explicit missing coverage. Its conditional missing-capture concern was checked against the existing review placeholder/resolution code and two executed paid/partial-response regressions. These reviews are not council approval or provider acceptance.

## Screenshots

| State | Desktop | Mobile |
| --- | --- | --- |
| Uncertain creation, original provider disabled | [Desktop](../../output/playwright/razorpay-invoice-holds-20261104/19-public-invoice-on-hold-desktop.png) | [Mobile](../../output/playwright/razorpay-invoice-holds-20261104/19-public-invoice-on-hold-mobile.png) |
| Captured payment under review | [Desktop](../../output/playwright/razorpay-invoice-holds-20261104/20-public-invoice-under-review-desktop.png) | [Mobile](../../output/playwright/razorpay-invoice-holds-20261104/20-public-invoice-under-review-mobile.png) |
| Signed-in client portal | [Desktop](../../output/playwright/razorpay-invoice-holds-20261104/21-client-invoice-on-hold-desktop.png) | [Mobile](../../output/playwright/razorpay-invoice-holds-20261104/21-client-invoice-on-hold-mobile.png) |
| Neutral confirmation page | [Desktop](../../output/playwright/razorpay-invoice-holds-20261104/22-payment-confirmation-page-desktop.png) | [Mobile](../../output/playwright/razorpay-invoice-holds-20261104/22-payment-confirmation-page-mobile.png) |
| Paid invoice with retained references | [Desktop](../../output/playwright/razorpay-invoice-holds-20261104/23-paid-invoice-closed-desktop.png) | [Mobile](../../output/playwright/razorpay-invoice-holds-20261104/23-paid-invoice-closed-mobile.png) |

Remaining: current-head council/CI and live provider acceptance; native UPI-app handoff; already copied links/QR codes/bank instructions cannot be revoked by this change. Local Qwen/Exo also identified a separate non-settling Stripe checkout replay concern; its proposed new index is unnecessary because `payments.provider_event_id` already has a unique index, but checkout fulfillment still needs to use it. Existing long-address clipping and crowded mobile line-item columns remain visible in these captures and need UI cleanup. No deployment or compliance readiness is claimed.
