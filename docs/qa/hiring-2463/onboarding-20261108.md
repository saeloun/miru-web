# Accepted-offer onboarding verification

Synthetic local verification based on `3925d75d`. This completes the Task 8 handoff from an accepted offer to an employee or India consultant profile and the existing generic PDF signing workflow. It does not set compensation, send an agreement or initiate payment.

An active Admin reviews the exact accepted source, recipient, names and existing profile or invitation before confirming. Existing staff profiles retain their account, workspace, employment, salary and bank details. New recipients receive a normal account invitation; no placeholder account is created. The recipient's explicit acceptance creates the approved salaried/contractor employment and empty employee record. Active invitations are reused without another email; expired or missing invitations require explicit renewal. The review freezes whether an email will be sent.

Start and completion evidence are encrypted and immutable. Replays recover the same result; stale or changed intent is rejected. Tenant foreign keys, source validation and database locks protect the handoff. Accepted business terms remain usable after their private response link expires or is revoked. Source deletion invalidates its invitation while preserving the resulting staff record and legal documents.

## Verified behavior

- **782 backend examples, zero failures.** Hiring, invitations, authentication, employee records, employment editing, retained user history and generic agreement lookup. This run includes 16 service checks for the separate, still-uncommitted Task 9 internal-notice work; the Task 8 checkpoint contains the other 766 checks' relevant changes.
- **144 native Brave examples, zero failures**, after the review fixes. All hiring pages, generic document signing, invitation confirmation and authentication were exercised. Console errors/exceptions are asserted empty in onboarding. Desktop and 390px mobile captures check horizontal overflow.
- The full onboarding journey uses actual candidate offer acceptance, Admin keyboard confirmation, a real TCP SMTP transaction with exactly one `DATA`, the exact emailed invitation link, account acceptance and password setup. The Admin then opens the future consultant's HR record, uploads two actual PDFs, places a signature field and saves a draft. Both original PDFs retain their SHA256 hashes; no provider envelope exists.
- A separate Playwright CLI run using disposable Brave and an isolated database signed in, linked an existing consultant and reached the generic upload form with the exact profile selected. The owned server and database were removed afterward. Its initial standalone Puma process returned empty full-file bodies; the existing installed Falcon server delivered byte-identical built assets and completed the UI check. No application or server configuration was changed for this harness issue.
- Actual PostgreSQL races cover duplicate Admin confirmation, cached concurrent invitation acceptance and source purge during acceptance. The purge/acceptance test first reproduced a deadlock; acceptance now locks the hiring parents before its invitation. A held recipient row fails promptly instead of reversing the account-authentication lock order.
- Both migrations pass **up/down/up** in a new synthetic database. Catalog and raw SQL checks verify validated tenant foreign keys, lifecycle checks and uniqueness. Recorded-history rollback refuses before DDL. Deletion tests preserve staff/legal PDF bytes while removing the source invitation. The temporary database was removed and its absence verified.

## Review fixes reproduced before correction

Claude's configured `claude-opus-5-5` review completed. Runtime regressions reproduced five failures: changing bound invitation names stranded acceptance; completion deleted replacement Admin and employee invitations; future joining dates blocked ordinary employment detail updates; and retained hiring history raised an unhandled user-deletion exception. All pass after model-boundary name validation, checking the actual invitation and cancelling only the offer's own invitation, validating joining dates only when changed, and returning the existing retained-history 422 guidance. Recipient-unavailability wording no longer describes global deactivation.

Earlier RED checks also reproduced a workspace mismatch retaining sibling private application content and a reviewed invitation reuse changing silently into an email send after expiry. The shared denial handler clears private panels, while the server requires a fresh review if the send/reuse choice changes.

Kimi's independent five-minute review timed out without a final response; it supplies no review coverage. Local-model suggestions were checked against repository code rather than accepted as evidence.

## Checks and artifacts

Twenty-five changed handwritten Ruby files pass Rubocop; the generated schema retains its existing header. The four changed frontend files pass ESLint. Required development/test Vite builds pass. TypeScript retains the baseline **329 diagnostics**, with zero normalized additions/removals. The later generic run is `NOT_READY`: typecheck fails, and concurrent Task 9 edits prevent it certifying its other results. It also does not run the selected Ruby acceptance specs. The explicit suites above supply the behavioral proof; this is not a clean release gate.

Logs: `/tmp/miru-onboarding-release-backend-20261108.log`, `/tmp/miru-onboarding-release-browser-20261108.log`, `/tmp/miru-onboarding-review-red-20261108.log`, `/tmp/miru-onboarding-review-green-20261108.log`, `/tmp/miru-onboarding-roundtrip-final-20261108.log`. Thirty source/config/test/schema hashes are recorded in `/tmp/miru-onboarding-source-fingerprints-20261108.json`.

Nine synthetic captures have a [SHA256 manifest](onboarding-20261108/SHA256SUMS):

- [Candidate accepts](onboarding-20261108/candidate-offer-accepted.png), [Admin invitation confirmation](onboarding-20261108/account-invitation-desktop.png), [explicit renewal](onboarding-20261108/invitation-renewed-mobile.png).
- [Completed consultant](onboarding-20261108/completed-consultant-mobile.png), [future staff record](onboarding-20261108/future-staff-record-mobile.png), [existing employee preserved](onboarding-20261108/existing-employee-linked-desktop.png).
- [Exact generic upload profile](onboarding-20261108/generic-upload-prefill.png), [saved PDF draft desktop](onboarding-20261108/generic-pdf-fields-desktop.png), [settled PDF preview mobile](onboarding-20261108/generic-pdf-fields-mobile.png).

Captures remain local repository artifacts until publication. Tasks 9–10, whole-branch release reviews, exact-head CI and production verification remain open. No real email, signing provider, payment, production data, migration, monitoring, backup recovery or compliance certification is established by these synthetic tests.
