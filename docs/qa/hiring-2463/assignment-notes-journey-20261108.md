# Assignment email, interviewer notes and continuous hiring journey

Local synthetic verification on the assembled branch after `99e63304b`. This closes the three functional evidence gaps in the [acceptance matrix](acceptance-matrix-20261108.md); release and live provider checks remain separate.

## Behavior and focused proof

Assignment emails reuse the approved settings, tracked outbox and delivery worker. Issuing an assignment does not send mail. An Admin separately previews and confirms the current approved subject/body and private candidate link. Recipient, assignment, application, inbox and approval versions are rechecked before transport. Submitted, ended, expired or otherwise ineligible assignments cannot be sent. Unknown delivery requires recorded evidence and a separately confirmed retry; history remains available after submission. No new mail provider or automatic send was introduced.

Assignment coverage passes **26 backend and four native Brave examples**. Actual local SMTP delivery opens the exact emailed private link, removes its fragment, and permits the intended candidate submission. Browser cases also cover stale approval, submitted-assignment blocking, unknown delivery/retry and role-denial clearing. Both kind/event migrations pass actual PostgreSQL constraints, empty up/down/up and recorded-history refusal checks. Source rollback must preserve recorded messages.

An optional encrypted round field holds notes explicitly intended for assigned interviewers. It is separate from generic Admin notes and excluded from candidate messages. Old booking snapshots remain valid; editing only these notes preserves an existing meeting. Public scheduling changes still require cancellation. **Seven focused request examples**, **109 related backend examples** and **one native Brave journey** pass, including assigned-only access and immediate revocation clearing. These counts overlap the combined suites below.

## One continuous journey

`spec/system/responsive/hiring_full_journey_spec.rb` follows the same candidate/application through authenticated duplicate relay delivery, real persisted queue workers, acknowledgement, private form/resume, assignment email/submission, assigned review, interview/feedback, offer email/acceptance, consultant invitation/password setup and a linked generic two-PDF agreement with saved fields. It passes as one native Brave example, also included in the combined run.

The retained [proof](full-journey-20261108/journey-proof.json) records **six finished persisted queue jobs**, **four local SMTP deliveries** and **five authenticated private downloads** with HTTP 200, `private, no-store` and byte hashes. The test uses the real Solid Queue worker/claim/finish path rather than calling jobs directly. Actors authenticate through the synthetic test harness at explicit role boundaries. This proves the local journey; it does not prove live OAuth, actual mailbox forwarding, external signatures or production delivery.

## Combined verification before final review remedies

- **860 related backend examples, zero failures.**
- **160 combined native Brave examples, zero failures**, covering hiring, generic signing, invitations and authentication.
- **6,115 whole non-system backend examples, zero failures, 59 pending.** Pending contracts include unfinished payroll acceptance requirements; they are not passing coverage or shipped features.
- Development/test Vite builds, focused Rubocop and frontend lint pass. Typecheck retains **329 baseline diagnostics**, with zero normalized additions/removals.

These results preceded the final engineering/design/devex remedies. Their reports and focused follow-up checks bind those later changes separately. Logs: `/tmp/miru-hiring-gaps-related-backend-20261108.log`, `/tmp/miru-hiring-gaps-related-browser-20261108.log`, `/tmp/miru-final-whole-backend-20261108.log`. No production payment, email, data deletion or migration was performed by these tests.

## Final review remedies

The final whole non-system backend repeat passes **6,127 examples, zero failures, 59 pending** after the Mercury rollback guard and private-storage diagnostic changes (`/tmp/miru-final-reviewed-whole-backend-green-20261108.log`). The guard has nine independently passing database checks, including a real held writer. An intervening combined run exposed one test-only CHECK-expression deparser mismatch between schema-loaded and migration-created tables; it was reproduced on a fresh schema and corrected by taking the empty round-trip baseline from the migration's own `up`. Exact populated-data refusal comparisons remain unchanged. The failed run remains retained rather than counted as a pass.

The two candidate cutoffs now show the browser's IANA time zone and a machine-readable original instant. Authoritative Hiring access/workspace denial removes the management shell and private child content, including the first request after mount. Ordinary record 404 retains navigation; transient 503 retains Retry. Seven focused native Brave cases pass with no console errors or mobile overflow. Initial-load denial was reproduced RED before moving the watcher registration ahead of child passive requests; a wrong-company successful response now rejects before downstream success handlers. Development and forced test Vite builds, Prettier, frontend lint and 24 inspected Ruby files pass. See the final review reports for discovery history and fresh review limits.

Actual configured Claude Code generated the bounded assignment-email proposal; its patch was reviewed and tested before use. Independent local Qwen and peer static reviews reported no findings in the assignment/notes changes, within their static scope. A separate Kimi attempt timed out and supplies no review coverage. Whole-branch review findings and dispositions are retained in the final engineering, design and devex reports rather than represented as a blanket clean result.

A final local Qwen review of the frozen watcher excerpt also returned `NO_FINDINGS` in 7.25 seconds. It had no file, shell or browser access and did not independently run the supplied seven browser checks. A fresh 180-second Kimi review retry accepted the prompt but timed out without a final answer; it adds no review coverage.

## Synthetic captures

Assignment email: [preview](assignment-email-20261108/assignment-mail-preview-desktop.png), [delivery](assignment-email-20261108/assignment-mail-delivered-desktop.png), [candidate portal](assignment-email-20261108/assignment-mail-private-portal-mobile.png), [retry](assignment-email-20261108/assignment-mail-retry-preview-mobile.png), [submission block](assignment-email-20261108/assignment-mail-submitted-block-mobile.png), [approved preview](assignment-email-20261108/assignment-mail-approved-preview-mobile.png), [access denial](assignment-email-20261108/assignment-mail-access-denied-mobile.png).

Notes: [Admin editor](notes-20261108/notes-editor-desktop.png), [assigned interviewer](notes-20261108/notes-assigned-reviewer-mobile.png), [revoked access](notes-20261108/notes-revoked-mobile.png).

Continuous journey: [relay](full-journey-20261108/01-authenticated-relay-and-acknowledgement.png), [form](full-journey-20261108/02-candidate-form-and-private-resume.png), [assignment](full-journey-20261108/03-emailed-assignment-and-submission.png), [review](full-journey-20261108/04-designated-reviewer-private-download-and-review.png), [feedback](full-journey-20261108/05-interview-feedback.png), [offer](full-journey-20261108/06-emailed-offer-acceptance.png), [consultant account](full-journey-20261108/07-consultant-account-created.png), [two-PDF agreement](full-journey-20261108/08-linked-generic-two-pdf-fields.png).

Capture manifests: [assignment email](assignment-email-20261108/SHA256SUMS), [notes](notes-20261108/SHA256SUMS), [continuous journey](full-journey-20261108/SHA256SUMS). The source checkpoint is retained in [the source manifest](task10-source-SHA256SUMS-20261108.txt).

Images are synthetic repository artifacts, not hosted GitHub attachments. Production origin identity, private production parity, exact-head CI, provider accounts, monitoring, backup recovery and compliance remain unverified by this report.
