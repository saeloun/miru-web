# Client agreement details implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution in the existing session, one scoped independent review after the complete branch is tested.

**Goal:** Capture client legal/finance/signatory facts in both client editors and use the billing facts in existing invoice rendering and recipient selection.

**Architecture:** Extend Client and existing scoped CRUD; share the new Formik field group between desktop/mobile. Reuse current address, invoice partials and recipient helper. No new provider or contact framework.

**Tech Stack:** Existing Rails8.1/RSpec, React/Formik/Yup/shadcn controls, Brave system specs and current PDF renderer.

**Spec:** ../specs/2026-10-24-client-agreement-details-design.md; full original requirements https://github.com/saeloun/miru-web/issues/2462 remain open.

## Global constraints

- Dedicated worktree feature/client-agreement-details-2462 from current public8c4a49b1; preserve primary/private release work.
- Five optional string fields: legal_name/signatory_name/signatory_designation max255; finance_email/signatory_email max254 with Devise email validation; trim/blank-to-nil.
- Owner/admin management only, current-company lookup and server-owned company_id; existing data and permissions retained.
- Finance joins legacy invoice recipients with case-insensitive deduplication; signatory is not implicitly an invoice recipient. No live sends/provider setup.
- Current address reused; existing API casing retained; full editor/version/signing requirements are not closed by this unit.

## Review focus

- Existing clients with nil new values still edit/save; model/request and browser cases.
- Padded, invalid and oversized emails/names normalize or fail atomically; model/request/UI error cases.
- Finance/signatory copying preserves later independent edits; actual desktop/mobile save/reopen.
- Foreign-company or non-admin contact writes/reads fail; focused request guards.
- Public/shared invoice data exposes legal name only, preserves fallback and legacy recipients, and never uses signatory implicitly; invoice/model/PDF checks.

### Task 1: Client data and existing editors

Files: new additive client migration/schema; app/models/client.rb; app/policies/client_policy.rb; app/presenters/client/show_presenter.rb; both client create Jbuilder partials; ClientForm types/schema/utils and shared AgreementDetailsFields plus both editors; client mapper and Details/Header; app/javascript/src/i18n/locales/en.ts. Focused specs: client model/policy/CRUD and one actual responsive client-agreement flow at desktop/mobile.

- [ ] Add focused failing assertions for the new facts, invalid/clear/independent fields and authorization; run to prove RED.
- [ ] Implement columns/normalization/validation and exact existing CRUD contracts; add shared fields, safe copy action, labels/errors/details. Make shared button guard honor optional-field validation errors.
- [ ] Run changed model/request cases and real Brave save/reopen/error flows; capture synthetic screenshots and console errors.

### Task 2: Billing consumption and complete verification

Files: Client#send_invoice_emails, existing API/internal invoice client/list/edit partials, actual billed-to React renderers and PDF template; focused recipient/invoice/PDF cases. Trace every helper caller and serialized field before editing; include only legal_name in shared invoice payloads.

- [ ] Add failing finance-recipient/dedup/signatory-exclusion and legal-name/fallback billing assertions; prove RED.
- [ ] Implement the minimal recipient addition and billed-to fallback through each existing snake/camel API caller.
- [ ] Run focused affected checks, actual synthetic PDF generation/text/visual verification, Ruby/JS lint and exact rtk mise exec -- timeout 30 bin/vite build. One fresh independent branch review, then authorized push/PR, CodeRabbit/all CI, private integration/deploy/live verification with existing pipeline. No broad repeated audit or real mail.
