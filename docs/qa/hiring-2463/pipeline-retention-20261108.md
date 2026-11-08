# Hiring reporting, notice recovery and retention

Local synthetic verification based on `7a0620c22`. These changes complete Task 9's reporting and data controls; the full issue and release remain subject to the [acceptance matrix](acceptance-matrix-20261108.md).

## Behavior

The Admin hiring overview filters by candidate, role, stage, hiring owner, historical interviewer, experience and receipt dates. Private search uses POST. Counts and queue totals cover the filtered cohort; queue selection narrows the paginated application list. Assessment reviews, overdue assignments, upcoming interviews, missing feedback and due holds link back to the applications.

Stage conversions count each application once per recorded transition and show their recorded denominators. Repeated rounds do not inflate conversions. Missing transition timestamps, hire durations and rejection reasons stay explicit; current state does not invent historical progression. Receipt dates use the company's time zone.

Internal feedback notices reuse the tracked message/evidence workflow. Admins can review unknown acceptance without sending, or confirm stopped-worker/non-acceptance evidence and separately preview and queue one eligible retry. The original approved text, recipient and inbox must remain valid. No free-compose or automatic retry action was added. Interviewers do not receive internal delivery history. Permission/workspace denial in history or a picker clears the private parent view.

Admins can review safe deletion counts, then explicitly confirm permanent deletion against the application version. Private records, capabilities, exact graph audits and unused source files are removed; other applications, shared source mail, employee/payroll records and legal PDFs remain. Unknown or active deliveries block deletion. Real row and source-checksum locks protect concurrent work. Standard durable purge jobs remove unused files, while shared attachments remain protected.

Automatic retention is off by default. An Admin chooses a period and approves it in settings. The daily job considers only closed applications, rechecking current approval, actor authority and the latest application/child/receipt/message/audit/file activity inside the deletion locks. It reports anonymous deleted/skipped counts; cleanup enqueue failures fail visibly instead of reporting success. This does not establish backup erasure or regulatory retention compliance.

## Completed verification

- **827 related backend examples, zero failures.** Hiring and its shared invitation, authentication, employee record, employment, user deletion and generic agreement boundaries. Counts overlap earlier checkpoints.
- Focused reporting **13**, notice recovery **21**, and retention/settings/job/request/schedule **52** backend examples pass. Retention includes actual PostgreSQL lock conflicts, shared inbound source and legal PDF preservation, retry chains, durable rollback and physical private-file cleanup.
- The focused native Brave runs pass **four reporting, six notice and three retention journeys**. They exercise former interviewers, pagination/private search, mobile empty/error recovery, actual SMTP ambiguity/evidence/retry, explicit manual deletion, approved scheduled deletion, and whole-page privacy denial. Console-error and 375/390px overflow assertions pass.
- Independent Playwright CLI with disposable Brave signed in, filtered the real overview, restored its cohort, reviewed deletion counts and explicitly deleted the synthetic application. Candidate content disappeared and the console reported **zero errors and zero warnings**. The owned Falcon server/database were removed; absence was verified.
- Development/test Vite builds and frontend lint pass. Twenty-one changed Ruby files pass Rubocop. Typecheck retains **329 baseline diagnostics**, with zero normalized additions or removals against the full previous checkpoint log.

The combined browser run passes **154 examples, zero failures**, after the singular/plural polish and development/test builds. It covers all hiring pages, generic document signing, invitations and authentication. After the deletion-warning clarification, development/test builds, lint and **all three retention browser journeys pass again**, with updated captures and empty console-error checks. This checkpoint is not release approval.

Fresh read-only Claude Code review completed using configured `claude-opus-5-5`, session `f0c6eda8-6dab-4ca0-930e-9556347f274d`:

```tool-output
CLAUDE CODE SAYS (consult)
[P2] Retention deletes pending onboarding invitations for hired candidates
(and erases the invitation audit trail), even though the UI says employee
records are preserved.
```

Disposition: source deletion intentionally cancels a pending hiring invitation; retaining a live invitation after erasing its hiring source would violate the approved privacy boundary. The existing retention regression explicitly deletes the pending invitation/token/audits, while a separate regression preserves an accepted employee and original legal PDFs. Pending onboarding remains at Offer, so the scheduled closed-stage gate excludes it. The manual deletion warning now explicitly says pending onboarding invitations are cancelled. No deletion behavior changed. Claude did not fully trace delivery-time retries, queue configuration, calendar effects or filter serialization; this is not a whole-branch release review.

One combined-suite failure was reproduced in service→job order: a test-specific purge adapter remained pinned to an old test queue, so the job assertion could not observe cleanup. The rollback test now scopes its adapter stub instead of changing the subclass's inherited adapter. The real durable queue rollback and actual blob/byte assertions remain; the combined backend run passes afterward. Initial worker browser attempts failed before reaching product pages; the established CI harness subsequently passed without changing product behavior.

Logs: `/tmp/miru-hiring-task9-related-backend-20261108.log`, `/tmp/miru-hiring-task9-related-browser-20261108.log`, `/tmp/miru-feedback-recovery-native-20261108.log`. Thirty-three source fingerprints are retained in [the source manifest](task9-source-SHA256SUMS-20261108.txt). Independent Playwright artifacts: `output/playwright/task9-*.yml` and `task9-deleted-desktop.png`.

## Captures

Six reporting captures: [empty mobile](pipeline-20261108/pipeline-empty-mobile.png), [pagination](pipeline-20261108/pipeline-pagination-desktop.png), [filtered queue](pipeline-20261108/pipeline-queue-desktop.png), [invalid filter recovery](pipeline-20261108/pipeline-recovery-mobile.png), [role denial](pipeline-20261108/pipeline-permission-denied-desktop.png), [workspace denial](pipeline-20261108/pipeline-workspace-denied-mobile.png).

Eight notice captures include [unknown delivery](notice-recovery-20261108/feedback-notices-uncertain-mobile.png), [evidence without resend](notice-recovery-20261108/feedback-notices-accepted-evidence-mobile.png), [separate retry preview](notice-recovery-20261108/feedback-notices-retry-preview-desktop.png), [delivered retry](notice-recovery-20261108/feedback-notices-retry-delivered-desktop.png) and denial frames. Five retention captures include [review](retention-20261108/retention-review-desktop.png), [complete deletion](retention-20261108/retention-complete-desktop.png), [approved policy](retention-20261108/retention-policy-approved-mobile.png) and cleared private state after scheduled deletion/workspace loss.

Capture manifests: [reporting](pipeline-20261108/SHA256SUMS), [notice recovery](notice-recovery-20261108/SHA256SUMS), [retention](retention-20261108/SHA256SUMS). All captures are synthetic repository artifacts, not hosted PR attachments. No production deletion, mailbox forwarding, live provider/calendar/signing/payment, deployment, monitoring, backup restore or compliance certification was performed.
