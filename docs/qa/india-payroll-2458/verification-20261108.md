# India accounts handoff verification

Synthetic local verification for the next #2458 payroll unit. This is not bank acceptance or a production deployment.

## Behavior

An owner explicitly confirms the confidential accounts mailbox and Indian beneficiary, then queues the immutable approved report. Duplicate clicks return the same handoff. Delivery attempts are durable, claimed once and recovered without resending unknown outcomes. Only assigned active accounts can record actual INR credits. Partial credits retain claims; full credit settles only that consultant's exact reservations once. Claim discrepancies preserve the actual credit and expose settlement blocked. Full-credit replay can retry settlement safely.

The report includes hours/days, fees, adjustments/withholding, itemized claims, legal entity and full beneficiary details in readable text/HTML. The application masks the account. Paid-leave classification is explicitly unavailable where the source does not supply it; it is never invented. India funding no longer shows Mercury onboarding controls.

## Evidence

- Domain/payroll regression checkpoint: 186 examples, zero failures. After small service extraction and session-key-independent reference hashing, domain + API: 29 examples, zero failures. These overlap; do not add the counts.
- Delivery/mail/privacy + existing hiring transport regressions: 57 examples, zero failures. Includes actual Solid Queue persisted ID-only job/claim/perform and real local SMTP, duplicate/concurrent workers, no SMTP inside a transaction, and SMTP QUIT failure after DATA acceptance held uncertain.
- Native Brave: two examples, zero failures. Real owner send, assigned-accounts partial/full credit, receipt settlement, no console errors, and actual rendered email at 1400/390px. Six screenshots below contain synthetic data only.
- Required `rtk mise exec -- timeout 30 bin/vite build` and test-mode asset build passed. Project TypeScript still reports its existing 329 errors; no new Payroll error was reported. Compare normalized paths against the existing baseline before calling the whole type check clean.
- Whole-project Reek passed. Focused Ruby lint passed. Brakeman has the same two weak warnings as the unchanged develop tree (`pg_searchable.rb` and `signature_request_reviews_controller.rb`), no new warning/error.
- Schema dump/load preserves financial-history triggers. Direct SQL mutation, real concurrent credit/revision/compensation and reference replay are exercised.

## Review sources

Claude Opus 5.5 completed the read-only design review (session `d93321f5-75a0-4edf-9c4b-afaf8d5173ff`). Its full-report digest, company-wide normalized credit reference, exact reservation scope, split readiness and lock-order corrections were addressed. The later broader source-review attempt timed out after 240 seconds; it is not a clean review.

Kimi completed the read-only design/source map (`f6407264-8dfa-4262-90dc-cdde4508f0fb`): Mercury-only guards and financial serialization were addressed; the possible duplicate-period concern is constrained by the existing unique company/period/currency run and India INR-only readiness. An uncommitted branch-only review had no diff, so it provided no additional coverage. Local Qwen supplied bounded test/credit proposals; invalid and unrelated suggestions were rejected rather than accepted as proof.

## Screenshots

- [Owner report confirmation](screenshots/owner-ready-desktop.png)
- [Delivered, awaiting manual payment](screenshots/owner-awaiting-payment-desktop.png)
- [Partial credit on mobile](screenshots/accounts-partial-mobile.png)
- [Fully credited on mobile](screenshots/accounts-credited-mobile.png)
- [Actual email on desktop](screenshots/confidential-email-1400.png)
- [Actual email on mobile](screenshots/confidential-email-390.png)

## Required remaining work

This unit does not enable Razorpay Payroll or prove Mercury payment scope/bank credit. Live email/provider account setup, production deployment, PTO accrual/paid-leave classification, consultant legal/tax consent and invoices, remittance documents and returned-payment replacement remain separate work. No live money, credentials, DNS or infrastructure changed during these checks. Existing pending acceptance contracts are retained unless corresponding executable proof exists; the full #2458 issue is not complete.
