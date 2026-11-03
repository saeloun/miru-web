# Razorpay captured-payment review checks

All records, accounts, tokens and payments in these checks are synthetic. Provider calls use WebMock; no real payment, refund, email or account connection was made.

Verified locally on November 3, 2026:

- 425 related backend examples passed across connection, recovery, collection, callback, webhook, payout, request, job, bulk-deletion, Stripe checkout and PayPal order specs.
- A final checkout race was then reproduced: a review arriving during Stripe's response still exposed the new Stripe session. After adding the final checkout recheck, 67 affected public-payment/review examples passed.
- 16 settings/invoice system examples passed in headless Brave, including desktop/mobile overflow assertions, the confirmation dialog, references, unknown amounts, the 20-entry limit and console-error checks.
- After shortening the review copy and fixing identifier wrapping, both affected settings flows passed again and their desktop/mobile screenshots were refreshed.
- The required `rtk mise exec -- timeout 30 bin/vite build`, focused ESLint, Prettier, RuboCop and Reek checks passed.
- Five boundary regressions failed before correction: missing currency, a cancellation for a different link, invoice currency corrections, lost owner access during the request, and a replaced account binding. They now pass.
- An actual HTML gateway response reproduced the pinned SDK's `NoMethodError`; the client now reports an unconfirmed outcome without discarding the review.
- Two PostgreSQL connections force an old cancellation webhook to wait behind a replacement binding/review write. The webhook no longer erases the committed replacement or review.
- Source review with native Claude exposed additional regressions. Executed fixes cover bulk deletion losing evidence, validation failures, resolved-payment replay, deleted/waived invoice callbacks, missing capture IDs, cancellation racing payment, stale Stripe/PayPal JSON writes and cross-provider checkout bypasses.
- Refresh now refuses an enclosing caller transaction and refuses to rotate without its own reservation. Its connection/recovery/job checks use actual commits and passed 125 examples; the collection flow refreshes before locking the invoice.

Screenshots:

| State | Desktop | Mobile |
| --- | --- | --- |
| Captured payment requiring review | [Desktop](../../output/playwright/razorpay-money-20261103/12-payment-needs-review-desktop.png) | [Mobile](../../output/playwright/razorpay-money-20261103/12-payment-needs-review-mobile.png) |
| Unknown captured amount | [Desktop](../../output/playwright/razorpay-money-20261103/13-payment-unknown-amount-desktop.png) | [Mobile](../../output/playwright/razorpay-money-20261103/13-payment-unknown-amount-mobile.png) |

Follow-up: [uncertain-link recovery checks](razorpay-link-creation-20261103.md) cover committed creation intent and periodic repair of failed cancellation enqueue. These remain local checks, not current-head CI or production evidence. Live provider acceptance, event shapes and mobile-client compatibility remain unverified. Keep live activation disabled until those checks pass.
