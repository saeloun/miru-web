# Consultant service-period fee implementation

Design: `docs/superpowers/specs/2026-11-09-consultant-service-period-fee-design.md`. User authorized manual consultant edits and delegated execution; native implementation with bounded delegated backend work and independent review. Preserve frozen release candidates.

## 1. Shared period facts and immutable fee review

Backend owner: new model/migration and payroll period-fee service; `ConsultantSources` date-effective schedule/context support. Reuse existing tenant, idempotency, history-trigger and run-before-employment locking patterns. Do not create a generic review framework.

Start with focused failing examples for a midmonth join, exit and fee/schedule change. Add positive exact minor-unit/decimal boundaries and negative missing coverage, mixed routing, stale context/predecessor, conflicting replay, unauthorized actor and concurrent append. Migration tests must exercise actual insert/update/delete and tenant guards, including protected payment activity. Keep rollback data-safe.

## 2. Consistent payroll and PTO valuation

Backend owner: `ConsultantReview`, `ConsultantRevision`, `PtoFacts`, `PtoLedger`, `PtoReport`, `Snapshot`, `MercuryReadiness`, `IndiaHandoff` and `IndiaReport` where required by actual callers. Use the same current reviewed period base/scheduled minutes; preserve old full-month behavior and accepted reconciliation.

Prove INR50,000 agreed for80scheduled hours with8approved unpaid hours yields INR45,000 once, and new PTO recovery origins use INR50,000/80 rather than the contractual INR100,000. Changing the reviewed amount without a context change must invalidate old PTO decisions/approvals. Re-decide explicitly; historical origins remain unchanged. Freeze the review identity/reason/basis in a normal revision and require both existing approvals for India and Mercury readiness.

## 3. API and owner interface

Root owner: authorized read/save endpoints in existing consultant-payroll controller/routes, shared small fee-review form, types/labels, run preparation and frozen review display. Coordinate the backend response contract before edits. Use exact decimal strings; clients never submit derived scheduled quantities, actor IDs or routing as authority. Preserve failed drafts and normal conflict handling. Add focused request authorization/source-conflict examples and native desktop/mobile examples for save, stale rejection and resulting frozen basis.

## 4. Finish and ship

Run focused backend/migration tests first, then affected payroll/PTO/payment compatibility suites. Run required development/test Vite builds and focused lint. Real Brave verification includes no console errors and synthetic screenshots. Review the entire branch for money, authorization, locking and source freshness using independent Claude/Kimi assistance as useful; root reviews patches and owns claims.

Commit and push the dedicated branch after verified changes and exact-head council gates. Open a separate PR with screenshots and source-bound proof. Do not mutate the current release candidates, deploy this unreviewed migration, or claim #2458 complete while other acceptance requirements remain pending.
