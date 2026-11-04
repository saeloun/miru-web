# Razorpay recovery feedback

This follow-up builds on `ff938d117`. All users, invoices, credentials and payments are synthetic. Provider HTTP is stubbed and outbound network access is restricted to localhost. No real account was connected and no payment, SMS or email was sent.

Recovery now reports the target invoice's outcome explicitly. A missing intent does not imply a confirmed link, and the first-20 settings limit cannot change the target's result. A recent check and a rate-limited request have separate neutral messages. Invalid IDs are rejected before provider I/O. Final feedback survives a failed status refresh; a later creation reference cannot inherit an old link ID or confirmation message.

Status loading stays visible and offers retry. Transient failures preserve the last loaded account with disabled actions; 401/403 removes the displayed details. API-key fields stay hidden until the connection status is known. Invalid-input feedback is associated with its field, clears when edited and receives focus. Other completed checks return focus to the action or section heading.

## Local verification

- The related backend run passed 596 examples after the explicit recovery outcomes were added. The final focused run passed 143 examples, including the added rate-limit route. The production Ruby source did not change between those runs.
- Eight focused Brave examples passed after the review follow-ups, covering stale rows, pending and confirmed results, refresh failure, changed references, HTTP 429, HTTP 403, invalid input and keyboard focus. Light-mode error contrast is asserted at least 4.5:1, and desktop/mobile overflow is checked.
- The final combined Razorpay settings and public-invoice browser run passed all 24 examples, including console-error checks and screenshot captures.
- Two older capture cases passed after fixing screenshot readiness. The harness waits for loaded content, uses absolute output paths and correct document coordinates, and checks that the entire component fits the capture. Public-invoice evidence uses the driver's full-page capture.
- The required `rtk mise exec -- timeout 30 bin/vite build` passed. An earlier invocation timed out; it was not counted as successful. A subsequent forced `RAILS_ENV=test` build transformed 9,770 modules and passed before the browser runs. ESLint, Prettier, RuboCop and Reek passed for the affected files.
- A fresh native Claude static review identified six actionable feedback/accessibility cases across two reviews. The cases were corrected and covered locally. This is not a council approval, CI result or production acceptance.

## Screenshots

Captured from the running app at desktop and mobile widths on November 4, 2026. The directory retains the original investigation date.

| State | Desktop | Mobile |
| --- | --- | --- |
| Pending/recent check | [Desktop](../../output/playwright/razorpay-recovery-feedback-20261103/14-link-needs-confirmation-desktop.png) | [Mobile](../../output/playwright/razorpay-recovery-feedback-20261103/14-link-needs-confirmation-mobile.png) |
| Initial status failure | [Desktop](../../output/playwright/razorpay-recovery-feedback-20261103/15-status-unavailable-desktop.png) | [Mobile](../../output/playwright/razorpay-recovery-feedback-20261103/15-status-unavailable-mobile.png) |
| Last loaded account | [Desktop](../../output/playwright/razorpay-recovery-feedback-20261103/16-last-known-status-desktop.png) | [Mobile](../../output/playwright/razorpay-recovery-feedback-20261103/16-last-known-status-mobile.png) |
| Invalid ID | [Desktop](../../output/playwright/razorpay-recovery-feedback-20261103/17-invalid-link-id-desktop.png) | [Mobile](../../output/playwright/razorpay-recovery-feedback-20261103/17-invalid-link-id-mobile.png) |
| Invalid ID, light mode | [Desktop](../../output/playwright/razorpay-recovery-feedback-20261103/18-invalid-link-id-light-desktop.png) | [Mobile](../../output/playwright/razorpay-recovery-feedback-20261103/18-invalid-link-id-light-mobile.png) |

Release limits: the required engineering, design and developer-experience council reviews remain open. These fixes are local until published. Live Razorpay acceptance, Mercury credentials and payment testing, mobile-client acceptance and production deployment remain unverified.
