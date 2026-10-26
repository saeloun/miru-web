# Profitability Planning Implementation Plan

**Goal:** An editable, saved organization planning worksheet with projected profitability and explicit cash assumptions.

**Architecture:** A separate encrypted ProfitabilityScenario stores an immutable opening baseline and editable assumptions. Reuse organization compensation-report authorization and approved-report data for seeding. One Ruby calculator powers save, preview and display; a small Vite entry refreshes previews without duplicating financial formulas in JavaScript. Actual salaries, rates and timesheets are never changed by planning edits.

**Tech Stack:** Existing Rails, Active Record encryption, ERB, Vite and RSpec; no new dependencies.

## Scope and calculation contract

- Owner/admin Pro access, tenant-scoped lookup, private/no-store responses, CSRF and metadata-only audits.
- Save/open scenarios; edit/add/remove people and overhead lines; compare with the saved opening baseline.
- Each person has monthly capacity, target utilization (0–100%), hourly billing rate and monthly compensation in one explicit scenario currency. Revenue = capacity × utilization / 100 × rate. Target utilization starts at an explicitly labelled 80%; other missing inputs remain blank/N/A. A zero assumption must be explicit.
- Constant monthly assumptions repeat for 1–24 months. Dates identify the forecast horizon; this is not a future payroll engine or automatic prediction.
- Costs = compensation + entered overhead. Margin and utilization use aggregate values. No salary/expense double counting through people-shaped overhead lines.
- Optional opening cash and monthly cash collections enable modeled cash burn/runway and reserve targets. Collections are independent of projected billings. No cash input means no runway. Nonpositive net burn means no finite depletion runway; zero/negative surplus cannot build a reserve.
- Seed from the existing selected-month report, retain seed date and missing-data flags, never import private spreadsheet values automatically. Saved baseline/currency are immutable. Validate numbers, counts, strings and payload shape; optimistic locking prevents lost edits.
- Interface links from the actual report, uses existing report visual conventions and labels all forecasts/assumptions explicitly.

## Tasks

1. Add focused calculator tests for money, incomplete inputs, explicit zero, aggregate utilization, month rollover, cash and reserve edge cases; implement Reports::ProfitabilityProjection.
2. Add encrypted scenario migration/model and seed service. Test validation, encryption, baseline preservation and authorization/tenant isolation through requests.
3. Add scoped controller/routes and ERB worksheet/index. Implement server previews, save/update conflict handling and authenticated CSV export with metadata-only audits.
4. Add small Vite entry for preview and row editing; link from actual report. Test save/reload and preview in real Brave, including failed preview/save preservation and console checks.
5. Run focused specs, lint, required Vite build and review. Deliver a tested PR; prior merge/deploy authorization applies to this report feature after checks and actionable review feedback are resolved.

## Review focus

- Blank and malformed financial values must not become zero.
- Baseline/currency tampering and cross-workspace URLs must not disclose compensation.
- Stale preview responses must not replace newer calculations; stale saves must not overwrite another edit.
- Invalid or incomplete assumptions remain editable and visibly flagged.
- CSV must use the saved scenario and the same calculator, with spreadsheet-formula injection protection.
