# Internal interview feedback notices

Local implementation for [Sonam's #2463](https://github.com/saeloun/miru-web/issues/2463), following the existing scheduling, immutable feedback and candidate-message increments. This report does not establish CI or production delivery.

Implementation commit: `8eb98f6e7bff84bbb7121e68a9b56195f56a0635`. Post-commit notification checks pass **23 backend + 3 native browser cases**, overlapping the broader scopes below. The working files and committed blobs match all 21 tested source fingerprints.

## Behavior

- Internal notices default off. An Admin chooses an active company reply inbox, supplies six subject/body fields, saves and explicitly approves the configuration.
- Activation applies only to feedback requests **and bookings created strictly after activation**. Repairing missing requests for older bookings cannot mail the backlog. Reapproving edits preserves the activation cutoff; disabling clears it, and re-enabling starts a new cohort.
- An original, currently active reviewer receives one prompt after the interview ends and one overdue reminder if feedback is missing. Late discovery queues only the overdue reminder. Submission, cancellation, a closed application, changed recipient or lost reviewer eligibility blocks unsent reminders. A queued prompt is obsolete at the overdue deadline.
- Submission creates one notice to the **approving Admin**, whose current membership is checked again at delivery. Its generated footer says to review the recommendation inside Miru; assessments, recommendations, private criteria, notes and candidate email are not copied into it. Nothing advances or rejects the application.
- Existing encrypted `HiringMessage` snapshots, root uniqueness, committed claims, approval/source/recipient checks and SMTP uncertainty handling are reused. Checks run before claiming and again after mail construction. Jobs never retry failed or unknown notices automatically.
- Admin feedback history shows frozen content and delivery state, including an explicit unknown-delivery warning. Reviewer responses omit that Admin-only notification projection. Internal notices cannot use receipt acknowledgement history or its recovery endpoints. Candidate message routes retain their existing kinds and public projection.

Internal history is read-only in this increment. Manual review/resend controls for these internal notices remain part of the communication-history follow-up; an unknown delivery must never be retried without acceptance evidence and a stopped original worker. Due hold notices and finalized decisions remain Task 7.

## Verification

- New notification service and history API: **23 examples**; all hiring services and request files: **316 examples, 0 failures**. The related acknowledgement/configuration/receipt/delivery/feedback selection also passed **139/0**. Counts overlap.
- Six affected hiring browser files: **36 examples, 0 failures**, using native headless Brave against the local app with CSRF enabled and no console errors. This includes three new journeys: actual save/approval, desktop frozen mail history, and mobile unknown-delivery handling with no horizontal overflow.
- A two-thread PostgreSQL scheduler check creates one durable root operation. It tests concurrent queue creation, not two concurrent SMTP deliveries. Test transport verifies frozen recipients/body and verifies delivery suppression after permissions change during mail construction. An ambiguous transport exception stays uncertain through repeated job recovery.
- Initial RED: 14 of 15 service checks failed before implementation. An additional receipt regression returned the internal notice in acknowledgement history before the scope fix. The first native run used two incorrect existing labels; correcting test selectors produced GREEN without changing product behavior for those failures.
- Both migrations passed up/down/up in a newly created disposable database. Both check constraints are validated, the unique operation index remains intact, and a recorded internal notice makes rollback refuse **before DDL**. The owned database was removed. The first rollback-fixture attempt used empty serialized hashes that became SQL NULL; the fixture was corrected before the passing run.
- Required development/test Vite builds and changed frontend lint pass. Sixteen changed Ruby files pass RuboCop. TypeScript remains at the same **329 diagnostics**, with zero added/removed normalized diagnostics versus the prior baseline. No checker or test was weakened.
- **21 source/test/schema fingerprints** match the files used by these checks. Three real browser captures were visually inspected; checksums are alongside them. Screenshots are local committed artifacts, not hosted PR image uploads.

The generic checker remains **NOT_READY**: lint/build pass, typecheck reports the same 329 diagnostics, and its Ruby selection has no supported runner for 116 selected files. It does not replace the manually executed RSpec evidence above. No exact-head council review log exists; the review-target answer is still pending. There was no push, merge or deployment.

The source uses no new dependency or separate sender. Local Qwen gave bounded read-only advice; its concurrency/permission claims did not account for the existing company lock, unique root constraint and Delivery rechecks, so those claims were not adopted as verified findings.

## Captures

- [Explicit approval and inbox](feedback-notifications-20261107/feedback-notices-approved-desktop.png)
- [Frozen queued notice](feedback-notifications-20261107/feedback-notices-queued-desktop.png)
- [Unknown delivery on mobile](feedback-notifications-20261107/feedback-notices-uncertain-mobile.png)
- [SHA256SUMS](feedback-notifications-20261107/SHA256SUMS)

No real email, provider account, payment, production database or production configuration was changed. Exact-head council reviews, the pending review-target answer and release checks still apply before publishing.
