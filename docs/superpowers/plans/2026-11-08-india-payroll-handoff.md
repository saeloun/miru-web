# India payroll handoff implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans task by task. Preserve other workers' changes.

**Goal:** Deliver the approved India consultant report and safely record manual credit and reimbursement settlement.

**Architecture:** Immutable encrypted handoff beside the existing payroll revision, durable delivery attempts and append-only credit evidence. Keep all financial mutations under the payroll run lock and SMTP outside transactions.

**Tech stack:** Existing Rails/PostgreSQL, Active Job/Solid Queue, Action Mailer and React; no new dependencies.

**Global constraints:** No live payment/provider operations; no raw bank/reference/recipient in logs; no automatic SMTP ambiguity retry; partial credit retains claims.

**Review focus:** A new revision while queued; a bank change before dispatch; old worker finishing after timeout; duplicate credit with changed values; role/workspace changes between preview and action. Each belongs in the service or delivery tests below.

Design: [India payroll handoff](../specs/2026-11-08-india-payroll-handoff-design.md).

- [x] Domain: `app/models/payroll_india_{handoff,delivery,credit}.rb`, one new migration; `app/services/payroll/india_handoff.rb`, `india_report.rb`; modify MercuryRevisionGuard, ConsultantRevision and ConsultantCompensation. First add/run failing service specs for approval, duplicate queue/reference, partial/full credit and protected claims; implement, then run focused payroll regressions.
- [x] Delivery: `app/services/payroll/india_delivery.rb`, `app/mailers/payroll_india_mailer.rb`, `app/jobs/payroll_india_{delivery,recovery}_job.rb`, schedule; shared private mail instrumentation. First test duplicate jobs, stale sending, errors after acceptance and revoked authorization; implement and verify real local SMTP.
- [x] UI/API: `app/controllers/api/v1/payroll_india_handoffs_controller.rb`, routes/policy; `app/javascript/src/components/Payroll/IndiaHandoffs.tsx`, existing Review/api modules. Write request/browser assertions for owner send, assigned accounts credit, rejected stale workspace and denied roles; implement and verify mobile/desktop with no console errors and screenshots.
- [ ] Review/delivery: required Vite build, focused service/request/browser/payroll regressions. Review actual source with Claude/local Qwen and Kimi if available. Fix findings, commit/push PR with evidence, inspect CodeRabbit and exact-head CI before merge. Production/bank acceptance stays separate.

## Shared interfaces

`Payroll::IndiaHandoff.new(run)` provides `create!(actor:, employment_id:, expected_digest:, accounts_email:, bank_confirmed:, expected_bank_digest:)`, `retry!(actor:, handoff_id:)`, `void!(actor:, handoff_id:)`, `reconcile_delivery!(actor:, handoff_id:, outcome:, evidence_reference:, worker_stopped:)`, `record_credit!(actor:, handoff_id:, amount:, credited_on:, reference:)`. All return the handoff. Failures reuse Workflow::Conflict/NotAuthorized and MercuryPayment::Blocked safe codes. The masked preview exposes the keyed fingerprint as `bank_version`; POST binds it as `expected_bank_digest`. Missing/stale versions conflict before any handoff write, and a changed preview version resets the owner's confirmation and mailbox fields.

`dispatch_blocker(handoff)` returns nil or a safe code using freshly checked current approvals/line/terms/bank/creator permissions. Caller holds run lock before handoff/delivery lock, following that order everywhere. It performs no SMTP or state mutation.

Handoff exposes `report` (encrypted hash, never API raw), `active` scope, `credited_minor`, `status`, `payroll_india_deliveries`, `payroll_india_credits`. Report includes `accounts_email`, `consultant_name`, `period`, `legal_entity`, `recorded_hours`, `working_days`, `leave_entries`, `monthly_fee`, `confirmed_unpaid_hours`, `line` (approved payroll line), `reimbursements` (itemized label/date/currency/amount/claim ID), `bank_details` (holder/name/number/IFSC). Frozen fields/entitlement cannot change; credit uses snapshot even if live bank later changes.

Delivery fields: `payroll_india_handoff_id`, `attempt_number`, `state`, `started_at`, `sent_at`, `error_code`, encrypted `review_evidence`, `reviewed_by_id`, `reviewed_at`. `after_create_commit` enqueues `PayrollIndiaDeliveryJob` with ID only. Delivery worker claims under run→handoff→delivery lock; SMTP outside transaction; a late response cannot overwrite a reconciled attempt or permit an old worker to send again.

Coordinator serializes masked review responses. UI fetches separately from existing run details so old clients remain compatible. Full email content is constructed only from encrypted report. No production mailbox is auto-selected.

Ownership: backend worker owns new domain models/migration, India workflow/report and shared financial guards plus their focused specs. Delivery worker owns new India mailer/jobs/delivery service and mail/privacy specs. Coordinator owns API/UI/integration/review and delivery. Workers share the codebase and must preserve one another's changes.
