# Invitation acceptance prerequisite for hiring onboarding

Synthetic local verification on the Sonam integration branch, based on `3de9840d`. Task 8 remains open for the accepted-offer/profile/document handoff. This checkpoint fixes the shared invitation boundary before reusing it there.

Existing email links now open a private confirmation. GET and HEAD create no accounts or membership and do not switch an existing account's workspace. A standard CSRF-protected POST accepts the invitation; new members set a password, existing members use their normal sign-in. The confirmation loads no JavaScript or external assets and sends no-store, no-referrer and noindex headers. Wrong-account and unavailable-link pages expose no invitation details or submit control.

The first native sign-in test exposed an existing Devise Invitable problem: a nonempty invitation token blocks password authentication even after the acceptance timestamp is set. Sending a new workspace invitation no longer mutates the recipient's global account metadata. Acceptance clears this token for existing users while preserving their password and confirmation; newly created users retain the normal password-setup token. Invited members skip the public-signup HubSpot job; ordinary signups still enqueue it.

## Verification

- **RED:** GET and HEAD each created an account; cached accepted, expired and rotated invitation records still provisioned users. Invitation creation changed an existing recipient's account; after acceptance `valid_password?` returned nil and actual sign-in failed.
- **GREEN: 241 backend examples, zero failures.** Invitation request/model/mailer/policy tests, creation/update/resend/deletion, User model, related client creation and native Google invitation/authentication checks. Separate PostgreSQL connections race acceptance: exactly one succeeds and creates one membership/password setup; no invited-user signup marketing job is enqueued. An OAuth-style verified signup followed by acceptance in the same actual commit also skips signup marketing. A real held recipient row fails immediately with a retryable message and rolls acceptance back; retry after release succeeds. This prevents company→recipient waits from deadlocking against native authentication's recipient→company lock order.
- **GREEN: nine native Brave examples, zero failures.** Actual GET → keyboard POST → password setup → authenticated page; existing member → confirmation → sign-in using the preserved password; wrong-account, expiry between review and submit, removed authenticity token, signup/password reset/privacy flows. Console errors/exceptions are asserted empty. Desktop and 390px mobile captures have no horizontal overflow.
- Lint and Vite build pass. The generic typecheck still has the same **329 diagnostics** as the saved baseline (zero added/removed). Its generic test selector does not run the selected Ruby specs; the explicit RSpec commands above supply that proof. Whole-branch release checks are still incomplete.

Backend log: `/tmp/miru-invitation-backend-final-20261108.log`. Browser log: `/tmp/miru-invitation-browser-complete-20261108.log`. Both used owned synthetic databases and a process sandbox permitting only loopback network traffic. No production or provider credentials were used.

## Screenshots

[Desktop confirmation](invitation-20261108/confirmation-desktop.png) · [Mobile confirmation](invitation-20261108/confirmation-mobile.png) · [Existing-member sign-in](invitation-20261108/existing-member-sign-in.png) · [Wrong account](invitation-20261108/wrong-account.png) · [Expired after review](invitation-20261108/expired-after-review-mobile.png) · [CSRF rejected](invitation-20261108/csrf-rejected.png).

All accounts and company names are synthetic. Captures are local repository artifacts until the branch is published; do not present them as uploaded PR attachments.

No new hiring handoff, real email delivery, provider payment, production deployment, migration, backup restore or compliance certification is established by these tests. Existing invitations retain their URLs but now require an explicit confirmation click.
