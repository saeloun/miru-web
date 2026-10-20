# India Tax Estimates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a private, year-specific Indian annual salary/interest tax comparison with verified caps and explicit coverage limits.

**Architecture:** A calculation object reuses existing immutable decimal helpers. A preview-only Rails resource enforces active staff membership, company rollout, workspace, CSRF and private logging/response boundaries. A workspace-keyed React form compares regimes without importing or changing evidence/payroll records.

**Tech Stack:** Existing Rails, RSpec, React, shadcn primitives and native Brave/Cuprite; no dependencies or migrations.

**Spec:** `docs/superpowers/specs/2026-10-21-india-tax-estimates-design.md` (builder check: nothing important left).

## Global constraints

India only. Decimal strings, explicit periods and rule versions. No guessed eligibility, automatic admission of approved proofs, payroll deductions, payments, certificate issuance or filing. Unsupported profiles fail closed.

## Review focus

Paise/ten-rupee rounding at rebate thresholds; old-regime senior bands; marginal relief at every surcharge transition; mixed-employer pension caps without duplicate personal allocations; income-limited deductions and stale/workspace-crossing form results.

## Task 1: Calculation and private API

- [x] Add failing `spec/models/india_tax/salary_estimate_spec.rb` examples: official ₹12.75L salary zero-new-tax case, independently derived regime comparisons, shared/NPS/insurance/interest caps, income ceilings, all threshold/rounding boundaries, unsupported and malformed inputs, immutable results.
- [x] Implement `app/models/india_tax/salary_estimate.rb`, preserving the stated supported profile and returning intermediate calculations plus legal references.
- [x] Add failing `spec/requests/api/v1/india_tax_estimates_spec.rb`; implement GET/POST `IndiaTaxEstimatesController`, TaxDeclarationPolicy capability, routes, filtered parameters, CSRF/private cache, workspace mismatch and no record mutations.
- [x] Run focused model/request specs, existing tax-declaration requests and RuboCop. Review source before committing.

## Task 2: Usable estimate and delivery

- [x] Add native system specs, then `IndiaTaxEstimates` page, route, declaration capability link and English translations. Form GET metadata gates access; editing any field clears results; workspace remount clears private inputs.
- [x] Verify both periods, caps, mixed-employer fields, comparison breakdown, invalid requests, mobile/no overflow and console errors in Brave. Run required development/test Vite builds and focused JS/Ruby checks.
- [x] Add a short product guide with supported/unsupported rules and official sources. Preserve the separate certificate/ITR integration research.
- [ ] Review final diff, run focused regressions, commit/push current feature branch, inspect exact-head CI and isolated staging, and update PR evidence/screenshots. Do not merge or touch production/financial accounts.
