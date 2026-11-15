# Consultant Settlement Invoices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Root reviewed and approved implementation under standing Sonam scope, including the design's fixed destination/nonself review/actual India date corrections. No push/PR/production/external mail/transfers yet.

**Goal:** Complete §10's paid consultant invoice/link-existing, private history and durable accounts-PDF flow after confirmed settlement.
**Architecture:** Three records separate reviewed preparation, immutable invoice and mail attempts. Reuse payroll's frozen source/consent locks, private storage, PDF renderer and India delivery semantics.
**Tech Stack:** Existing Rails/PostgreSQL/ActiveJob/SolidQueue/ActiveStorage/React/Ferrum; no new dependency, provider or account.
**Spec:** `docs/superpowers/specs/2026-11-11-consultant-settlement-invoices-design.md`.

## Global constraints

Implement only §10; keep real credit independent of rendering/queue availability. No production, bank or external-mail calls. Use the dedicated WT; preserve others' work. Internal review precedes implementation; mandatory preparation facts default unreviewed. Do not reuse company-sales `Invoice` or invent statutory completeness.

## Review focus

- Historical billing/terms drift and old credited records must resolve frozen evidence or explicit supplemental review (task 2).
- Withdrawal, reopened/refunded credit and competing preparations must serialize through final insert (task 2).
- Existing original PDFs and duplicate issuer numbers must survive races unchanged (tasks 1–2).
- Lost enqueue, interrupted renderer and SMTP uncertainty need durable bounded recovery without blind resend (task 3).
- Exit, switched workspace/role and direct blob routes must not leak retained documents (task 4).

### Task 1: Persist preparation and immutable invoice boundaries

**Create:** `db/migrate/<timestamp>_create_payroll_consultant_invoices.rb`, `app/models/{payroll_invoice_preparation,payroll_consultant_invoice,payroll_consultant_invoice_delivery}.rb`, `app/services/payroll/consultant_invoice_preparation.rb`; matching `spec/models/{payroll_invoice_preparation,payroll_consultant_invoice,payroll_consultant_invoice_delivery}_spec.rb` and `spec/services/payroll/consultant_invoice_preparation_spec.rb`, three factories under `spec/factories/`.
**Interface:** `Payroll::ConsultantInvoicePreparation.new(run, actor:).record!(employment_id:, facts:, expected_revision_digest:, expected_preparation_id:, idempotency_key:, original_pdf: nil, reviewed: true) → preparation`; strict named facts, canonical digest, explicit unreviewed/complete review. Consultant originals are unreviewed only; owner/admin can configure unreviewed facts, never bypass fresh nonself review.
- [ ] Write focused failures for no implicit mode/review; missing entity/date/treatment; payroll reconciliation; replay/stale receipt; cross-company source; original PDF signature/size/private-storage/hash validation; immutable DB updates/deletes; exact uniqueness/check/FK constraints. Use existing `Signatures::PdfInfo` limits for uploaded PDFs.
- [ ] Run `rtk mise exec -- bundle exec rspec spec/models/payroll_{invoice_preparation,consultant_invoice,consultant_invoice_delivery}_spec.rb spec/services/payroll/consultant_invoice_preparation_spec.rb`; preserve real RED, then implement only records, migration and reviewed preparation service.
- [ ] Re-run to PASS; inspect actual migration constraints and ciphertext/no-facts serialization. Commit this independently testable boundary after root's implementation GO.

### Task 2: Issue one source-bound PDF after real full credit

**Create:** `app/services/payroll/{consultant_invoice_issue,consultant_invoice_pdf}.rb`, `app/views/payroll_consultant_invoices/{invoice,paid_settlement}.html.erb`; `spec/services/payroll/{consultant_invoice_issue,consultant_invoice_concurrency,consultant_invoice_pdf}_spec.rb`.
**Modify:** `app/services/payroll/billing_identity.rb`; add `frozen_binding!(binding) → historical facts/receipt`, validating exact IDs/digests/company/subject without replacing them with current head; supplement old missing bindings only through reviewed preparation.
**Interface:** `Payroll::ConsultantInvoiceIssue.new(run, employment_id:).issue! → existing/new invoice or blocked preparation`; `Payroll::ConsultantInvoicePdf.new(snapshot:, kind:).render → PDF bytes` delegates to `PdfGeneration::HtmlTemplateService` with escaped local-only content. No live invoice/public URL input.
- [ ] Write failing cases: India full credit; Mercury first split leg none/second one; reversed/repeated workers; reviewed PTO prior-credit completion; old-credit supplemental review; reopened/refunded before issue blocked and after issue original retained; source-leg/revision/role/preparation changes during rendering; withdrawal wins/loses using real committed DB concurrency like authorization concurrency spec.
- [ ] Add existing-invoice-first/idempotent-return assertions, one invoice under number/run races, stale claim loses, reused existing blob never purged and losing staged blob cleaned. Generated requires current consent; linked original needs reviewed provenance, not a fabricated grant; kept exited consultant succeeds with valid grant, discarded subject fails.
- [ ] Run three new service specs to actual RED; implement staged rendering and canonical final locks/rechecks from design, then PASS. Use independent DB connections for lock tests.
- [ ] Render real PDFs without the PDF stub; parse with existing `pdfinfo`/`pdftotext` tools under bounded subprocess execution, asserting both identities, exact number/date/period, itemized amounts/withholding/net, INR/USD credits/references/Paid and no OUR in invoice income. Parse separate paid statement; original PDF SHA must remain exact. No new parser gem.
- [ ] Re-run focused issue/concurrency/PDF specs plus `spec/services/payroll/billing_identity_spec.rb`; commit after meaningful PASS.

### Task 3: Wake issuance and deliver/reconcile the same PDF durably

**Modify:** `app/models/{payroll_payment_group,payroll_india_handoff,payroll_invoice_preparation,payroll_consultant_invoice_delivery}.rb`, `config/solid_queue.yml` (both existing environments), `spec/config/solid_queue_schedule_spec.rb`.
**Create:** `app/jobs/payroll_consultant_invoice_{issue,delivery,recovery}_job.rb`, `app/services/payroll/consultant_invoice_delivery.rb`, `app/mailers/payroll_consultant_invoice_mailer.rb`, `app/views/payroll_consultant_invoice_mailer/{invoice.html.erb,invoice.text.erb}`; matching job, service and mailer specs.
**Interfaces:** issue job `perform(run_id, employment_id)`; delivery job `perform(delivery_id)`; recovery `perform` uses 100-row rotating due batches; delivery `deliver`, `reconcile!(actor:, outcome:, evidence:)`, `retry!(actor:, expected_attempt_id:)`. Recovery never retries uncertain mail. Enqueue failure keeps durable due work.
- [ ] Extend `spec/services/payroll/{mercury_reconciliation,india_handoff,pto_recovery_replacement}_spec.rb`: actual three setters enqueue only after commit, rollback enqueues none, renderer/enqueue failure cannot erase committed credit, reviewed late preparation and historical credited recovery converge to one invoice/attempt.
- [ ] Write RED for duplicate/stale claims, build failure, queue loss, bounded recovery fairness, same attachment SHA, changed recipient/role, interrupted send→uncertain, explicit reconciled retry only. Use TestAdapter/stubbed transport; never contact SMTP/banks. Avoid persistent subclass adapter overrides.
- [ ] Implement after-commit model wakeups and IndiaDelivery-style claims/outcomes; run new jobs/mailer/delivery specs, three setter specs and schedule spec to PASS, then commit.

### Task 4: Scoped preparation, retained downloads and responsive UI

**Create:** `app/policies/payroll_consultant_invoice_policy.rb`, `app/controllers/api/v1/{payroll_consultant_invoices,consultant_invoices}_controller.rb`, `app/javascript/src/components/Payroll/Invoices.tsx`, `app/javascript/src/components/Profile/ConsultantInvoices/{index.tsx,api.ts}`; `spec/policies/payroll_consultant_invoice_policy_spec.rb`, `spec/requests/api/v1/{payroll_consultant_invoices,consultant_invoices}_spec.rb`, `spec/system/responsive/consultant_invoices_spec.rb`.
**Modify:** `config/routes/api.rb`, `app/javascript/src/components/Payroll/{api.ts,Review.tsx}`, `app/javascript/src/components/Profile/Layout/routes.tsx`, `app/javascript/src/constants/routes.ts`, `docs/product-guide/payroll/03-consultant-payroll.md`.
**Routes:** run-scoped `consultant_invoices` index, `preparations` POST, member `retry_generation`, `reconcile_delivery`, `retry_delivery`; authenticated own `consultant_invoices` index/original-or-paid download and existing-original submission. Writes carry company/expected receipt or attempt; no arbitrary amount/recipient/credit/consent parameters. Own original submission creates unreviewed preparation only; manager reviews through task 1. Controllers reuse PayrollBase and BillingIdentity workspace/CSRF/no-store checks as appropriate; own history does not inherit active payroll-only gate.
- [ ] Write RED requests/policy cases for self vs another consultant, assigned accounts/owner/admin configuration, wrong tenant/run, role/workspace change during download, departed kept identity, withdrawal/history, entitlement-disabled history, CSRF and real private/no-store/nosniff bytes. Public blob routes must not grant document access.
- [ ] Implement UI with existing controls: unselected generate/link choice, required review fields, blocked reasons and waiting/full-credit states, separate Paid/credit-review/mail state, uncertainty reconciliation, original and paid PDF downloads. Run focused new request/policy specs to PASS.
- [ ] On a new isolated synthetic DB, explicit blank dotenv and sanitized `env -i`, loopback-only requests and TestAdapter, use normal Brave at an owned port/profile. Exercise real generate and existing flows, split/India completion, rejected role, retained history and unknown mail at 1440/375; assert console/uncaught zero and native downloaded byte hashes. Save fictional provenance and settled screenshots for PR; no production data or external mail.
- [ ] Run `rtk mise exec -- timeout 30 bin/vite build`, focused responsive spec, and affected payroll specs; record actual terminal receipts/counts, then independent ENG/DESIGN/DX review and root-selected release bookkeeping before normal commit/push workflow. No fabricated gate or legal/PDF/browser success.

Self-review: every §10 requirement maps to tasks 1–4; §11 remittance collection and new correction documents are explicitly outside this unit. This plan is documentation only; root reviews design/implementation scope before any product edits.
