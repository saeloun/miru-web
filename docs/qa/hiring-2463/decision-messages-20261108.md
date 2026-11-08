# Rejection messages and hold follow-up — Task 7

This completes the local decision communication increment for [Sonam's ATS issue #2463](https://github.com/saeloun/miru-web/issues/2463), following the [decision-record checkpoint](decisions-20261107.md). Publication, CI, production delivery and the final whole-branch review remain separate requirements.

## Behavior

- An Admin can prepare approved rejection wording against the current saved rejection draft. This preview is read-only: queueing stays disabled and the server refuses delivery until explicit finalization. A fresh preview is required after finalization changes the decision/application versions.
- Finalized rejections reuse the existing encrypted outbox, exact-intent recovery, delivery history, evidence review and separate explicit retry. Only a current finalized rejection permits candidate mail on a Rejected application; unrelated closed-application messages stay blocked.
- Automatic rejection and internal hold notices are independent, default-off options. Each requires approved wording and an enabled company inbox. Activation begins a new cohort; existing finalized decisions are excluded. Ordinary reapproval retains the cutoff; disabling/re-enabling starts a fresh cohort for only that option.
- Candidate mail contains approved wording and the submitted candidate name. Internal decision reasons, notes, feedback and assessments are excluded. Inbox, approval, recipient, role, application and decision changes invalidate unsent work. Automatic rejection remains tied to the finalizing Admin's current authority, independently of their currently selected workspace.
- A hold notice uses the saved owner/date/time zone and the last finalized decision. A newer draft does not suppress it; a finalized replacement or stage change does. The scheduled sweep runs every five minutes and never automatically retries failed or unknown attempts. The current approving Admin receives the notice; it is not candidate mail.
- An interviewer's Pass notice now explicitly tells the Admin that the candidate is ready for next-stage review. It still makes no final decision, issues no offer and creates no next round.
- Internal feedback/hold history shares its renderer. Candidate interview/decision communications share their existing queue/reconciliation behavior; the former interview URLs are preserved. A permission denial clears the entire private candidate view.

## Verification

- All hiring services, hiring requests and schedule checks: **371 examples, 0 failures**. Coverage includes readonly draft preparation, explicit finalization, lost-response recovery, current-authority/recipient checks, source changes before and after mail construction, independent opt-ins/cutoffs, local-date boundaries, last-finalized holds and unknown delivery without automatic resend.
- All 17 hiring native Brave files pass: **99 examples, 0 failures**, including eight new journeys with CSRF enabled and console-error assertions. The new journeys cover draft preparation/finalization, explicit SMTP delivery, stale wording, pending-rejection defaults, unknown hold delivery, evidence plus stopped-worker confirmation before a separate retry, actual settings approval/automatic queueing, and full-page denial. Desktop/mobile captures assert no horizontal overflow.
- The SMTP journey uses a real loopback TCP server and parses the captured RFC message. It observes one DATA command, the intended synthetic recipient and no private decision content. The UI reports **Accepted by mail server**, which does not establish inbox delivery. No external email provider or real recipient was used.
- An actual PostgreSQL User-row lock probe first timed out while automatic internal messages inserted a human `queued_by` foreign key. Removing that false human association lets the same probe pass; encrypted `approval_actor_id` retains approval identity. Feedback notices use the same correction. This proves removal of that FK wait, not a reproduced production deadlock.
- The initial complete browser run found one mobile draft click that never triggered the history request while sibling panels were loading. The case now waits for the same settled sibling controls as the existing helper, preserving every assertion. Its isolated check and the complete 99-case rerun pass.
- Migration up/down/up passes in an owned disposable database. Both message constraints are validated and the finalized-decision index is built concurrently. Recorded messages and activated cohorts each make rollback refuse before DDL. Only the disposable database created by the check was removed.
- Required development/test Vite builds, changed-file frontend lint and 28-file Ruby lint pass. TypeScript remains at **329 diagnostics**, with zero normalized additions/removals against the existing baseline. Generic release-checker results are recorded separately; no checker or test was weakened.
- Forty present source/test/config/schema fingerprints and two removed paths match the tested worktree. Ten full-page screenshots were visually reviewed and checksummed. The release checker remains NOT_READY for the existing typecheck failures and its unsupported Ruby test lane; the explicit RSpec runs above supply the local backend/browser evidence.

## Captures

All captures use synthetic local records. They are repository files, not uploaded GitHub attachments.

- [Approved rejection preview](decision-messages-20261108/rejection-approved-preview-desktop.png)
- [Readonly draft preparation](decision-messages-20261108/rejection-draft-prepared-mobile.png)
- [Explicit finalization and queued message](decision-messages-20261108/rejection-finalization-confirmed-mobile.png)
- [Local SMTP acceptance](decision-messages-20261108/rejection-smtp-sent-desktop.png)
- [Approved automatic delivery](decision-messages-20261108/rejection-automation-approved-desktop.png)
- [Preserved stale preview](decision-messages-20261108/rejection-stale-preview-mobile.png)
- [Reviewed unknown rejection](decision-messages-20261108/rejection-uncertain-reviewed-mobile.png)
- [Separate explicit retry](decision-messages-20261108/rejection-explicit-retry-mobile.png)
- [Unknown hold notice](decision-messages-20261108/hold-unknown-delivery-mobile.png)
- [Private view cleared on denial](decision-messages-20261108/rejection-permission-denied-desktop.png)
- [SHA256SUMS](decision-messages-20261108/SHA256SUMS)

No real mail, payment, production data or server configuration changed. Offers/onboarding, internal-notice recovery controls, reporting/retention and the final issue/release audit remain Tasks 8–10. These local checks do not establish production readiness.
