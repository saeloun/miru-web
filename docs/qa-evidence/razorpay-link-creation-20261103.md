# Razorpay uncertain-link recovery

All accounts, invoices, credentials and payments used here are synthetic. Provider HTTP is stubbed; the running app uses an isolated PostgreSQL database and headless Brave. No external account connection, payment, refund, SMS or email occurred.

The connected-account flow commits a unique invoice reference before creating a Payment Link. An uncertain response retains that intent. Retrying queries the original reference instead of repeating creation. A manually supplied link ID must match the original reference, account/mode, invoice/company, amount and currency. Empty or ambiguous lookup results remain blocked; neither an expiry change nor automatic proof of absence is assumed.

Verified locally on November 3, 2026:

- The final related backend run passed 586 examples across payment providers, invoice payments (including real PDF generation), checkout, callbacks, webhooks, settings, recovery jobs and mobile collections. The test profile allows local browser ports while blocking external network access.
- The new settings flow passed in the running Brave browser, including real CSRF-protected requests, an empty lookup, a manually verified link, one creation request total, no SMS resend, console checks, and desktop/mobile overflow checks.
- The required Vite build passed for development and test assets; ESLint, Prettier and RuboCop passed. Reek passed for the changed payment services and jobs. The mobile collections controller retains its existing 24-statement `create` warning, reproduced on the unchanged HEAD version.
- Regression checks cover an independent database connection observing the committed intent before HTTP, worker interruption, concurrent requests, documented rejection versus uncertain errors, malformed/multiple lookup results, foreign or mismatched link IDs, account changes, disconnect/archive during HTTP, changed invoice amounts, permanent-deletion protection, cross-provider checkout blocking, tenant isolation, authorization lost during provider I/O, stale webhook JSON writes, recovery with collections disabled, and failed cancellation enqueue repair.
- Independent source review led to five additional reproduced regressions: capture reconciliation interrupted after a paid binding commits, an amount change after the service returns, repeated creation when a provider immediately returns an expired link, captures reported on closed links, and cancellation through the wrong test/live mode. Each failed before correction and passed in the final run. A creation marker now remains until capture reconciliation finishes; one checkout request attempts at most one creation POST.

| State | Desktop | Mobile |
| --- | --- | --- |
| Uncertain link requiring confirmation | [Desktop](../../output/playwright/razorpay-creation-20261103/14-link-needs-confirmation-desktop.png) | [Mobile](../../output/playwright/razorpay-creation-20261103/14-link-needs-confirmation-mobile.png) |

Release limits: this is local evidence, not current-head CI or production verification. An unlocatable attempt deliberately stays blocked. Live provider acceptance, partner activation, webhook payloads and mobile-client compatibility still need verification. The committed-intent guarantee applies to connected accounts.

Mobile follow-up: five regression cases reproduced missing/invalid retry keys creating an invoice, an uncertain response omitting its saved invoice, and a replay resending SMS. Connected-account collection creation now requires a stable key before saving, returns the saved invoice ID for recovery, and reuses an existing invoice under a company lock. The wider run passed 592 examples. Six focused mobile examples passed afterward, including two PostgreSQL connections proving one invoice, one link and one SMS request when the replay reaches Razorpay first. Intentional resend remains a separate action. The mobile controller now passes Reek without the earlier `create` warning.

Build receipt correction: the first required Vite commands reused cached assets. A subsequent forced build (`rtk mise exec -- timeout 30 bin/vite build --force`) ran Vite, transformed 9,770 modules and exited 0. The earlier browser receipts apply to the test assets; native mobile acceptance remains open.
