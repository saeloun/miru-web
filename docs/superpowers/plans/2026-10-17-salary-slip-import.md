# Salary Slip Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the previously selected approved-PDF salary-slip workflow while India calculation rules undergo verification.
**Architecture:** Employment-scoped records and private Rails attachment downloads. Existing React dashboard, API client and policy patterns. Publication and withdrawal retain history; no payroll or tax calculation is inferred from PDF contents.
**Tech Stack:** Rails 8.1, PostgreSQL, Active Storage, Pundit, Audited, React/TypeScript and existing UI primitives.
**Spec:** `docs/superpowers/specs/2026-10-17-payroll-razorpay-design.md`, Release 1. Expanded India requirements are researched separately in `docs/research/2026-10-17-india-payroll-tax-research.md`.

## Global constraints

Current company and active employment checks on every action; client-only users denied. Owner/admin management, other staff own published slips only. PDFs up to 5 MiB, actual type validation, no generic storage URLs or blob IDs exposed. No changes to existing payment flows or automatic salary/tax calculations. Work in this isolated worktree and use synthetic data in a dedicated local database.

## Tasks

- [x] Add focused request/model specs for import/draft/publication/download/withdrawal/correction; coworker, client, discarded membership and cross-company denial; invalid files and duplicate publication.
- [x] Run specs and observe missing salary-slip implementation, then add migration/model, employment association, policy and API controller/routes. `SalarySlip#publish!(actor:)` locks its employment, withdraws a previous current revision atomically, and records supersession; `#withdraw!(actor:)` retains the original.
- [x] Add the salary-slip React page, route/sidebar, existing API integration and English fallback translations. Admins assign PDFs explicitly and save drafts before publication; staff filter their own slips by pay month and download. API list is paginated, newest first, with admin-only active-employee choices.
- [x] Run focused specs, Ruby lint and `rtk mise exec -- timeout 30 bin/vite build`. Verify admin/employee UI flows, private downloads, correction and console errors in Brave on the local app; capture a synthetic-data screenshot.
- [x] Review the complete diff independently, fix actionable findings, repeat only affected checks, and commit verified changes. No push or deployment requested.

## Review focus

No automatic granting of coworker salary access to bookkeepers/managers; no metadata leakage through previews or identifiers. Mutation CSRF protection for cookie authentication. No unbounded list, misleading paid status, silent document replacement, or direct public attachment link. Database uniqueness backs publication locking.

## Execution record

Research completed separately; current tax, PF and all-state rules are not calculation-enabled by this import feature. Native execution selected under the user's "whatever you choose" direction; the original Release 1 workflow was selected before the broader research request.

- Focused request suite: **16 examples, 0 failures**, including database uniqueness when writes bypass the model lock, actual private PDF bytes, CSRF denial and 31-record pagination. Isolated `miru_payroll_test` database; `SKIP_VITE_TEST_BUILD=1` avoids the existing recursive Vite test helper/runtime failure. Frontend build checked separately.
- Required Vite build: **passed** after the final frontend change. Ruby lint: **6 files, no offenses**. No new dependencies. Existing installed node modules reused via an untracked worktree symlink.
- Brave at `http://127.0.0.1:3100` with dedicated synthetic `miru_payroll_development` data: admin import/draft/publish/correction/withdrawal; employee current-only list and download; month filter; 30 newest rows plus the remaining row on page two. No console errors/warnings in the final employee flow. Brave's download history reported the generated 606-byte PDF **Done**; the browser download-event helper timed out.
- Browser upload helper required a prohibited extension permission change, so no permission was changed. Synthetic invalid and valid files were generated in page memory and selected through the local test page's file input, followed by normal UI assignment and multipart submission. Native file-picker automation was not verified. No real payroll data or credentials were used.
- Independent review found three issues: missing company audit association, self-reference blocking deletion after a correction, and mutation errors cleared by refresh. All fixed; backend regressions and the persistent inline validation error were checked. Screenshots: `/tmp/miru-salary-slip-qa/admin.png` and `/tmp/miru-salary-slip-qa/employee.png`.
- RTK's long-running server wrapper exited early; the local QA server used direct `mise exec --` instead. No job worker, provider account action, push or deployment was performed. Full application suite and production storage/browser behavior were not checked.
