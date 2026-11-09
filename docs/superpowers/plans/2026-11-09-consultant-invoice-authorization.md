# Consultant Invoice Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let consultants explicitly grant/withdraw invoice permission with immutable evidence and authorized status/history reads.
**Architecture:** One append-only consent chain per employment, protected by the employment lock and SQL guards. A dedicated service/policy supports a small profile panel and API; no invoice or payment is issued.
**Tech Stack:** Existing Rails 8.1, PostgreSQL, React and native Brave/RSpec; no dependencies.
**Spec:** `docs/superpowers/specs/2026-11-09-consultant-invoice-authorization-design.md`.

## Global constraints and review focus

Keep PR2499 and release worktrees frozen. Explicit self consent only; fresh tenant/account checks before replay. The rollout gate blocks new grants/issuance while preserving self history and withdrawal. Preserve historical receipt text and never infer consent. Check lost-response retry after refresh, policy wording change, role/workspace changes during requests, pagination boundaries and raw-SQL bypass. No live email/payment, generic invoice reuse or statutory/compliance claim.

## 1. Immutable authorization domain — backend worker

- [ ] Write failing service/SQL/concurrency specs for the design contract, then implement `ConsultantInvoiceAuthorization`, its additive migration, policy and `Payroll::InvoiceAuthorization` service. Reuse the generic immutable-history trigger; preserve it in schema load.
- [ ] Define `summary(before_id: nil)` and `record!(action:, expected_event_id:, statement_digest:, idempotency_key:)`; IDs and command fields are exact strings. Return status, current server statement/version/digest, current_event, recorded_event on writes, history, next_before_id, can_grant and can_withdraw; include company_id/employment_id in the API envelope. Preserve self withdrawal/history after service ends while the kept account remains signed into its workspace; deny regrant after exit.
- [ ] Prove the canonical migrated/fresh-schema catalog and focused domain negatives. Own only model/service/policy/migration/schema/dumper and related specs; use a dedicated synthetic database.

## 2. Self-service and read-only workflow — root and frontend worker

- [ ] Root adds a dedicated controller/routes, strict named input, private caching, CSRF, explicit company context and request/privacy specs. Add a capability to employee-record details using the dedicated policy, never its proxy-edit permission.
- [ ] Frontend worker adds the shared profile authorization panel/API and embeds only when capability allows, plus a dedicated self settings route/link for post-exit withdrawal. Show unchecked affirmation for grant, direct withdraw action, current status, retained conflict drafts/explicit refresh, stable command identity across ambiguous retries and paginated receipts; root reviews all patches.
- [ ] Root/native worker verifies true1440/375 desktop/mobile, self grant/withdraw/regrant, stale/lost-response behavior, readonly admin and zero console errors; preserve original synthetic screenshots.

## 3. Review and delivery — root

- [ ] Correct the stale product-guide availability list and document this permission workflow/remaining invoice dependencies. Replace only executable authorization acceptance placeholders.
- [ ] Run focused specs/lint and required Vite build, review Claude/local bounded findings, then commit/push a separate stacked PR with exact-head native review gates, screenshots and accurate CI/production limits. Do not mark #2458 or the full goal complete.
