# Consultant Bank Confirmation Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans for the bounded tasks.

**Goal:** Enforce independent confirmation for changed nonblank primary consultant bank numbers across the shared profile/API.
**Architecture:** One trust-boundary check under the existing EmployeeRecordsController employment lock; one transient self/admin form field. Reuse encrypted storage, authorization and bank fingerprints without a schema change.
**Tech Stack:** Existing Rails/React/RSpec/Brave; no dependencies.
**Spec:** `docs/superpowers/specs/2026-11-09-consultant-bank-confirmation-design.md`.

## Constraints / review focus

Keep312/PR2500 and other release candidates frozen. Exact strings preserve leading zeros. No persisted confirmation, new bank verification claim, model-wide import restriction, provider/email or production action. Check stale-workspace/proxy permissions, unchanged/clear edits, lost failed drafts and all writable primary-bank paths.

## Backend — root

- [ ] Prove the current missing/mismatch request RED, then add named transient parameter and exact check under the existing employment lock before save/audit.
- [ ] Verify missing/malformed/mismatch/match/leading-zero and session/token paths; preserve unchanged/contact-only/clear behavior, privacy and existing profile/payroll bank-change compatibility on a dedicated request database.

## UI/native — frontend worker

- [ ] Add blank independent confirmation to the shared editor and API transport. Require it only for changed nonblank numbers, preserve rejected drafts, clear on number changes/success/cancel, never prefill/return/persist it.
- [ ] Adjust existing successful native bank edits and add desktop/mobile missing/mismatch/correction cases. Run only after root announces built assets and separate native database readiness; capture original synthetic screenshots.

## Delivery — root

- [ ] Run focused tests/lint and required Vite builds, review all changed callers/privacy/reconciliation, document API compatibility, then commit/push a separate stacked PR with screenshots and exact-head review gates. Leave unrelated #2458 acceptance cases and production gates explicit.
