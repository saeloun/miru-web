# Applicant Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all ten areas of Sonam's ATS #2463, from intake through controlled onboarding.

**Architecture:** Native Rails records/services/policies with the existing React shell. Start with manual applications; add authenticated Action Mailbox intake and private candidate forms, then assessments, interviews, controlled communications and onboarding. Stack on generic signing without changing unrelated release code.

**Tech Stack:** Existing Rails 8.1/PostgreSQL/React/TypeScript/Pundit/Active Storage/Action Mailbox/Action Mailer/job queue. No new paid service or submitted-code execution.

**Spec:** [Applicant tracking design](../specs/2026-10-25-applicant-tracking-design.md).

## Global Constraints

- Tenant-scoped lookups, current active membership, workspace/version checks on mutations, explicit compensation grants and private downloads.
- Candidate/application identity, intake receipts and message-event keys have database uniqueness; retries preserve history.
- Approve company introduction/client count/overlap/PTO wording and delivery settings before automatic messages. No real candidate mail during development.
- Treat code, MIME content, URLs, filenames and form answers as untrusted. No execution/fetch/extraction or raw-model serialization.
- Preserve all ten issue areas; Task 1 is a working increment, not completion of ATS. Use apply_patch, focused tests and existing conventions.

## Review Focus

- Same email across companies or mailboxes: independent tenant profiles, complete receipt history and one acknowledgement per application (Tasks 1–2).
- Workspace/membership/assignment revocation during an edit or queued operation: fail closed with no data/mail leakage (Tasks 1–8).
- Form/template edits after submission/approval: preserve original sensitivity and issued terms; prevent stale sends (Tasks 3, 7–8).
- SMTP accepted but response/job persistence lost: surface uncertainty, do not duplicate delivery (Task 2).
- DST changes, late feedback, retries and retention: recorded deadlines/events remain accurate and deletion cannot affect another tenant or an employee record (Tasks 6–9).

## Execution discipline

For each task: write the named failing checks, run them and retain the actual failure, implement the smallest complete behavior, rerun focused checks and lint, verify UI in Brave when touched, then commit. Never mark a step checked from intention. Use a separate test DB and synthetic browser data. Native execution is chosen to keep this shared domain coherent; use fresh independent review at the end.

### Task 1: Manual intake, roles and private application history

**Files:** `app/models/hiring_{candidate,application,role}.rb`, `app/services/hiring/intake.rb`, `app/policies/hiring_policy.rb`, `app/controllers/api/v1/hiring/{applications,roles}_controller.rb`, additive migration/schema/company associations, API routes; `app/javascript/src/components/Hiring/`, SPA route/navigation; corresponding factories/model/service/request/browser specs.

**Interface:** `Hiring::Intake.new(company:, actor:, attributes:).process` returns a HiringApplication. JSON manual intake contains company_id, request_key, full_name, email, role_id, owner_employment_id and optional notes/received_at; typed/allowlisted validation precedes persistence. Same request+content returns the application; changed content with the same key conflicts. Candidate uniqueness is per company/email, and every new application preserves a name/source snapshot without overwriting existing profile details. Only active Owner/Admin may list, create or view at this stage.

- [x] RED→GREEN candidate identity/history, retry/conflict, cross-tenant role/owner and stale workspace/membership tests; `bundle exec rspec spec/models/hiring* spec/services/hiring/intake_spec.rb spec/requests/api/v1/hiring`.
- [x] Implement bounded search/pagination/filtering, role management and Admin manual-add/detail UI; sensitive cache/CSRF controls and audit metadata.
- [x] Verify actual desktop/mobile, empty/error/retry/duplicate-submit and unauthorized pages; required `rtk mise exec -- timeout 30 bin/vite build`, focused lint/specs. Local evidence: [QA record](../../qa/hiring-2463/README.md).

### Task 2: Forwarded email, receipts and acknowledged delivery

**Files:** `app/mailboxes/{application_mailbox,hiring_inbound_mailbox}.rb`, `app/models/hiring_{mailbox,receipt,message,setting}.rb`, `app/services/hiring/{email_intake,delivery}.rb`, mailer/job, ingress/storage limits and migrations; settings/review/history UI and specs.

**Interface:** authenticated relay → unique mailbox route → `Hiring::EmailIntake` → Task 1 identity/application; per-mailbox receipt history and message event key. Settings freeze approved intro/client count/employment wording and templates. Communication states distinguish queued, sending, sent, failed and uncertain.

- [x] RED→GREEN real MIME/attachments/forwarded source, duplicate/racing mailboxes/tenants, malformed/oversized/unauthenticated ingress, uncertain classification and no auto-ack before configuration approval.
- [x] Prove one acknowledgement operation, permission/template recheck, queue interruption and ambiguous SMTP no-retry behavior; actual local relay→queue→Mailpit receipt; commit. Published increment: `eb23142118aa69dc10ba9993e97bdf1beb3404fd`; [QA record](../../qa/hiring-2463/README.md).

### Task 3: Configurable secure candidate forms

**Files:** `app/models/hiring_{portal_access,submission}.rb`, `app/controllers/hiring_portal_controller.rb`, standalone private portal view/JS, `app/services/hiring/form.rb`, settings UI, migrations and request/browser tests.

**Interface:** fragment capability → CSRF-protected POSTs scoped to one application. Versioned schemas contain all fields in design area 2; sensitive answers are encrypted and excluded from reviewer projections. Public metadata/assignment/offer serializers are explicit allowlists.

- [x] RED→GREEN expired/revoked/cross-application capability, CSRF, private uploads, response validation/currency/period/missing values, config-required/custom fields, sensitive-field reclassification and no internal feedback/telemetry.
- [x] Browser synthetic acknowledgement→form→resume→submit; require Admin config approval; commit. Published through `7ad5abcf667bf32bbd54418996c154b42251fd15`; combined completion check 205/0, CI 4695 backend / 23 CLI / 132 browser examples with 0 failures and 80 backend pending. [Evidence](../../qa/hiring-2463/README.md).

### Task 4: Screening and assignment review

**Files:** `app/models/hiring_assignment{,_template}.rb`, `app/services/hiring/{screening,assignments}.rb`, Admin/reviewer/portal controls and tests.

**Interface:** explicit Admin action issues a versioned task; candidate submits files/links/setup/explanation, own-contribution statement and AI-use disclosure. Assigned reviewer records all six assessment dimensions and Pass/Fail/Clarification Required. Revisions and walkthrough/follow-up requests preserve history.

- [x] RED→GREEN no task on application submission, unauthorized reviewer, stale revision/deadline, missing disclosure, untrusted file/link safety and advance/reject/revise decisions; actual portal/reviewer browser flow; commit.

Assignment domain, Admin/reviewer APIs, candidate portal, Admin issuance/decision screens and designated-reviewer UI are implemented. Final local related suite:254/0; focused API/browser:15/0. Actual Brave covers clarification/revision/resubmission, stale/lost-response recovery, reviewer reassignment/revocation, explicit advance, pending rejection and cancellation. Existing-profile desktop/mobile screenshots are retained. Exact-head CI/image checks remain publication gates; whole-branch review and full release verification remain Task10. [Evidence](../../qa/hiring-2463/README.md).

### Task 5: Hiring panel and configurable rounds

**Files:** `app/models/hiring_{interview,feedback,access_grant}.rb`, `app/services/hiring/interviews.rb`, panel/round UI, migration and policy/request/browser specs.

**Interface:** Admin selects active members, expertise, availability, safe booking URL, round type/duration/panel/criteria/form. Add/skip/repeat/reassign preserves completed records; assigned users see only the required application handover, with explicit compensation access.

- [ ] RED→GREEN screening call/arbitrary rounds, reassignment/membership revocation, cross-company IDs, URL validation, compensation exclusion/grants and no completed-history rewrite; browser panel/round checks; commit.

### Task 6: Scheduling and feedback deadlines

**Files:** `app/services/hiring/{scheduling,calendar_events}.rb`, scheduling/feedback jobs and controls, adapter to existing available calendar authorization, tests.

**Interface:** manual fallback stores UTC start/end and candidate IANA zone, external booking/meeting details and round status. Calendar import uses the authorized connection and verifies assignment/attendee; candidate email excludes internal feedback. Feedback records attendance/date/topics/evidence/assessment/recommendation.

- [ ] RED→GREEN DST/invalid zone, reschedule/cancel/no-show, stale booking/unauthorized calendar event, private handover vs candidate template, due/missing feedback and deduplicated prompts/reminders; actual available-calendar or explicitly unconfigured fallback evidence; commit.

### Task 7: Decisions, holds and controlled rejection

**Files:** `app/services/hiring/decisions.rb`, Admin decision/template controls, communication/reminder extensions and tests.

**Interface:** Pass notifies Admin; Fail creates Rejection Pending; only confirmed finalized decision or explicitly enabled automation queues rejection. Hold requires reason/owner/follow-up date and due notification. Every transition is audited and stale updates conflict.

- [ ] RED→GREEN finalized vs draft decisions, approval/template changes, internal feedback never mailed, permission loss while queued, hold reminders and duplicate/failure/uncertain sends; actual local-mail browser journey; commit.

### Task 8: Offers and existing onboarding handoff

**Files:** `app/models/hiring_offer.rb`, `app/services/hiring/{offers,onboarding}.rb`, offer/portal/onboarding controls, migrations and tests.

**Interface:** immutable issued compensation/date terms with Preparing/Sent/Accepted/Declined/Expired. Accepted offer plus Admin confirmation creates/links the correct existing employee/consultant workflow and generic agreement upload; retries return the same handoff. Do not send contracts or change payroll implicitly.

- [ ] RED→GREEN unaccepted/expired/stale offers, currency/period validation, employee vs consultant, pre-existing user/profile, retry/race, cross-tenant handoff and source-PII boundaries; actual accepted-offer→profile→agreement flow; commit.

### Task 9: Dashboard, communication history and retention

**Files:** `app/services/hiring/{pipeline,retention}.rb`, dashboard/history/report controls, retention job/settings and tests.

**Interface:** filters and operational queues cover every issue stage/dimension. Metrics derive from transition timestamps and reasons. Retention removes private content/blobs/links safely and keeps only non-identifying deletion evidence.

- [ ] RED→GREEN empty/missing/withdrawn/repeated-round metrics, all filters, overdue/upcoming queues and pagination; retention with concurrent work, shared inbound mail/other tenant and already-onboarded employee; actual browser report/deletion proof; commit.

### Task 10: Full issue and release audit

- [ ] Build an evidence row for every design/issue requirement, including mailbox/source/dedup, configurable form/company policy, all assessment/round/decision outcomes, candidate vs interviewer privacy, message uncertainty, analytics and retention. Missing/indirect evidence stays incomplete.
- [ ] Execute the full synthetic relay→portal→assignment/interview→offer→employee/consultant→agreement journey with actual queue, local mail, authorized private downloads and screenshots. Run focused/related suites, required Vite build and desktop/mobile/keyboard/console QA.
- [ ] Fresh whole-branch Rails/security/design review, actionable CodeRabbit resolution, exact-head CI, screenshots in a reviewable PR; preserve private production differences and verify its immutable image before any authorized release. Close no issue or claim no external integration/production success without live proof.
