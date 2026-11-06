# Reimbursement approval version verification, 2026-11-06

Candidate: `feature/sonam-release-integration-20261104`, based on `9db17ff6d` plus the source fingerprints in `SHA256SUMS`.

## DEBUG REPORT

Symptom: Final payroll approval could commit its original reimbursement reservation when a claim was edited and reapproved after initial payroll validation but before reservation acquired the expense row lock.

Root cause: Initial approval validation checked the claim's source reference. Reservation then locked and loaded the current expense but checked only approved/unpaid/not-discarded state. An edit alone correctly resubmitted the expense and was rejected. An edit followed by expense reapproval satisfied those status checks despite changing the version and amount.

Fix: The existing post-lock payable condition now also requires the current expense reference to match the revision's reference. It reuses the existing fingerprint and conflict response. The enclosing payroll transaction rolls back the stale final approval and reservation; the API's existing conflict handler returns HTTP 409. No schema, payment API, transaction isolation, or calculation format changes.

Regression test: `spec/services/payroll/claim_reservation_concurrency_spec.rb` uses committed fixtures and two real database connections. The editing connection holds the expense lock; a Queue signal establishes that payroll has completed initial validation and entered the real reservation boundary. The claim is then edited, optionally reapproved, and committed before reservation can obtain the lock. No sleeps, fake conflicts or mocked model state are used. This establishes the validation/use ordering; it does not assert that PostgreSQL had already begun waiting on the lock when the signal fired.

## Evidence

All runs used dedicated local test databases and a localhost-only network sandbox, with synthetic people, claims and payment data. No real transfer, email, provider request, or production change was made.

| Check | Result |
| --- | --- |
| New two-case regression before repair | 2 examples, 1 failure; the reapproved case persisted an approval and reservation and reported approved instead of blocked |
| New regression plus existing consultant revision and Mercury concurrency specs | 25 examples, 0 failures |
| Complete backend, `rspec --exclude-pattern 'spec/system/**/*_spec.rb' --fail-fast` | 5,692 examples, 0 failures, 64 pending, exit 0 |
| Consultant payroll and Mercury return responsive browser specs, native Brave | 6 examples, 0 failures, exit 0 |
| RuboCop, both changed Ruby files | 2 files inspected, no offenses |
| `git diff --check` | Passed |

The regression checks denial plus absence of both a persisted final approval and an active reservation. The edit-only case preserves existing rejection behavior. The frozen-clock reapproval case changes the amount; it does not independently test an approval-timestamp-only change.

Value: protects=approval/reservation refer to the locked reimbursement version; fails_when=a newly reapproved amount is accepted under the old payroll reference; why_new=existing coverage edited claims before approval validation, not between validation and locked use; seam=none in production; no_claim=actual incorrect payout or live provider acceptance.

## Review and cleared risks

Claude's source-only review found no blocking defect in the repair. Its conditional reverse-order concern was cleared against the actual edit path: `ExpensesController#update` locks before writing, and `Expense` declares the locking `financial_state_is_current` validation before `not_reserved_by_payroll`. This is source evidence for that inspected path, not a claim about arbitrary direct SQL.

The review's pre-existing multiple-run/multiple-claim lock-ordering concern is not independently reproduced or cleared here. The two native cases exercise one claim and one payroll approval versus an edit/reapproval. Full overlapping-run, direct-settlement, late-approval and provider lifecycle acceptance remains open in the requirements ledger. The same-run existing-reservation reuse branch is unchanged.

## Limits and next checks

This establishes local approval/reservation integrity, not that an incorrect transfer was previously possible; later payment-readiness guards also recheck sources. All 64 pending examples remain pending. The broader general browser run reached 339 examples, 1 failure, 2 pending and stopped at an obsolete billing seat-explanation assertion after passing the corrected CLI page. Exact-head release reviews and live account/production verification remain outstanding.

Status: DONE_WITH_CONCERNS. The bounded defect is repaired and verified; broader payroll delivery is incomplete.

## CLAUDE CODE SAYS (review)

````tool-output
# Review: reimbursement reservation digest recheck

**Verdict:** The one-condition repair is correct for the race you reproduced. No blocking findings in the diff. There is one conditional finding on the adjacent, mirror-image race, plus two low-severity test notes.

## Why the repair holds

- `reserve_entry!` reads the expense with `lock.find` under the run lock. Under PostgreSQL READ COMMITTED, `SELECT … FOR UPDATE` returns the latest committed row once the competing lock is released. So `self.for(expense)` is computed from post-edit data.
- The fresh reference uses the same `digest` as `current?` (line 35). Precision handling is therefore identical to the pre-approval `approval_issues` check, and no new false-conflict source is introduced.
- `Conflict` raised inside `@run.with_lock` rolls back the `PayrollApproval` created at `workflow.rb:42`. The approval and any earlier reservations in the same `reserve!` loop are discarded together.
- The reuse branch (lines 58–62) is unchanged, as you stated, and is out of scope here.

## Findings

### MEDIUM (conditional, needs confirmation): reverse-order race may still commit a stale reservation

**Where:** `Expense#not_reserved_by_payroll`, with the order of `validate` declarations and the real edit path.

The fix covers the case where the edit commits first and payroll locks second. Consider the opposite order:

1. The final approval holds the expense lock and has inserted the reservation, but has not committed.
2. A plain `expense.update!` arrives. It is not wrapped in `with_lock`.

If `not_reserved_by_payroll` runs before `financial_state_is_current`:

- Its `payroll_reserved?` query sees no committed reservation and passes.
- `financial_state_is_current` then blocks on `.lock.pick` until payroll commits.
- After that, it sees `previous_status == "approved"` with an unchanged `approved_at`, so it raises no error.
- The edit commits on top of a freshly committed reservation.

The result is an active reservation whose expense no longer matches its `source_reference`. The expense is also stuck: reapproval would now trip `not_reserved_by_payroll`.

The spec does not cover this. It always edits inside `claim.with_lock`, so the editor holds the lock before any validation runs.

I can't confirm the problem from the supplied material, because the `validate` declaration order and the controller/API edit path aren't shown. It is benign if either of these is true:
- financial edits always go through `with_lock`, or
- `financial_state_is_current` is declared before `not_reserved_by_payroll`.

Otherwise, a cheap fix is to re-run `payroll_reserved?` after the lock in `financial_state_is_current`.

### LOW: the spec doesn't prove the lock-contention interleaving it describes

**Where:** `spec/services/payroll/claim_reservation_concurrency_spec.rb:28-30, 43-46`

`ready << true` fires before `original.call`. The approval thread may not issue its `SELECT … FOR UPDATE` until after the main thread has committed and released the lock. Either ordering yields `:blocked`, so the assertions are still meaningful for stale-reference rejection. But "reaches `reserve_entry!` while another connection holds the row lock" is likely, not guaranteed.

If you want that path asserted, you could check `pg_locks`, or check that the thread is in a lock wait (`approval.status == "sleep"` plus a wait-event query) before editing. Optional.

### LOW: under `travel_to`, reapproval doesn't change `approved_at`

**Where:** spec line 16, `Expense#approve!` line 123

Time is frozen, so the original `approved_at` and the post-reapproval `approved_at` are both `2026-12-05T12:00:00.000000Z`. In the "reapproved" case, the digest mismatch therefore comes entirely from `amount`.

This doesn't matter for current coverage. It would matter for a future variant that edits a field in `APPROVAL_FIELDS` but not in the digest (e.g. description or category, if present), relying on the new `approved_at` to invalidate the reference. That variant would falsely pass in test even though it works in production. Consider calling `travel` between the original approval and the reapproval, or adding a comment-free assertion that `approved_at` changed.

### INFO (pre-existing, not introduced)

`reserve!` locks expenses in payload order. Two different runs final-approving overlapping claims in opposite orders could deadlock. That would raise `ActiveRecord::Deadlocked`, which is not mapped to `Conflict`/409. This is unrelated to this diff; noted for awareness only.

## Not verified

- Results of the running full-backend and payroll browser rechecks.
- The `"approved mercury consultant payroll"` shared context.
- Expense `validate`/callback declaration order and `SETTLEMENT_FIELDS`/`APPROVAL_FIELDS` contents.
- The controller edit path.
````
