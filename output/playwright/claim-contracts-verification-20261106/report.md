# Payroll claim concurrency acceptance — 2026-11-06

Branch: `feature/sonam-release-integration-20261104`; parent before this test-only unit: `b6244da18`.

## Result and scope

Two issue #2458 section 6 contracts moved from pending entries to three executable examples in `spec/services/payroll/claim_settlement_concurrency_spec.rb`. No application code, schema, UI, provider integration or financial calculation changed.

- Two actual final payroll approvals select one claim in different monthly runs. Both reach reservation after validation while the main connection holds the expense row. After release, exactly one final approval and one reservation remain, attached to the winning run/revision and frozen amount; the loser reports the competing-reservation conflict.
- A final approval and reservation are uncommitted while another connection loads the expense and confirms the direct-payment policy would allow it. After commit, the actual `mark_paid!` operation is rejected with the reservation error; the claim remains unpaid.
- Direct expense settlement wins after the payroll approval passed validation. The payroll reservation reports the no-longer-payable conflict, rolls back its final approval, and leaves no reservation; the expense retains its direct settlement.

These tests exercise real PostgreSQL transactions, rows and separate worker connections. Instrumentation wraps the real reservation method only to coordinate the selected claim; it does not replace the result or force an exception. No sleep, provider call, live transfer or physical PostgreSQL lock-wait assertion is involved.

## Verification

- Initial new file: **3 examples, 0 failures**.
- Focused selection before review refinements: **91 examples, 0 failures, 61 pending** (30 executable examples). Selection includes both claim race files, consultant revisions, direct expense-payment requests and the issue's remaining acceptance contracts.
- Final source, seeds 11, 29, 47, 83 and 101: **3 examples, 0 failures each**, exit 0 (15 executable examples total). Earlier pre-review source also passed these five seeds.
- Full backend before the final assertion/cleanup refinements: **5,693 examples, 0 failures, 62 pending**, exit 0.
- Final full backend: **5,693 examples, 0 failures, 62 pending**, exit 0, after the final assertion/cleanup refinements. The three new executable examples replace two pending entries; the remaining pending requirements are not treated as passed.
- Ruby lint: **2 files, no offenses**. Source fingerprints are recorded alongside this report.

Database: owned local `miru_sonam_integration_test_20261104_abdd`; localhost-only outbound sandbox. The test group closes the cleaner transaction, uses deletion, and asserts there is no surrounding transaction before setup. `spec/rails_helper.rb` disables transactional fixtures; `spec/support/database_cleaner.rb` resets the strategy before each example and cleans the current strategy afterward. The configured default pool is three connections, enough for the main connection and two approval workers; CI's backend job supplies no smaller override.

Logs: `/tmp/miru-claim-contracts-focused-20261106.log`, `/tmp/miru-claim-settlement-final-seed-{11,29,47,83,101}-20261106.log`, and `/tmp/miru-backend-claim-contracts-final-20261106.log`.

## Review assessment

Claude reviewed the original tests and unchanged workflow/expense/reservation source with tools disabled. It found no confirmed blocker, but raised a conditional isolation concern because the test configuration was omitted from its prompt. The actual configuration described above clears that condition. An explicit no-open-transaction assertion now fails closed if the fixture setup changes.

Accepted precision improvements: signal only the selected claim; verify the two distinct run IDs reached reservation; assert the expected conflict reasons rather than accepting any record-validation failure; verify policy permission before the uncommitted reservation becomes visible; avoid calling the loaded expense stale after `with_lock` reloads it; terminate and join owned workers if their cleanup join times out.

The optional suggestion to assert the loser's `accounts_approved` status was not adopted: `Workflow#status` first checks source approval issues, so a claim reserved by another run makes that run draft. A mock-induced uniqueness violation remains covered in the existing consultant-revision suite; the new tests prove the actual competing-row outcome instead.

Review limits: Claude did not review the final assertion/cleanup refinements; Codex inspected and natively tested them. The direct-settlement race exercises the model method; the inspected API controller calls that same method after policy authorization. These are local workflow integration checks, not browser or provider acceptance and not council approval.

## Remaining work

The issue acceptance ledger retains claim-amount/receipt preservation, late-approval carryover, reservation-release policy and complete settlement/allocation contracts as pending. Full payroll, India accounts handoff, consultant invoices, remittance documentation and live provider acceptance remain unfinished. The current broader browser run still has the separately reported month-view failure. No production deployment occurred.

Fresh browser inventory again reports the existing browser-access host unavailable, despite Brave running. No alternative personal browser or authentication bypass was used.

Fresh agent-vault metadata lookup identified login/card entries but no dedicated provider API credential. This does not establish that custom fields contain no API credentials. No secret values were accessed and no live provider setup changed.

## CLAUDE CODE SAYS (review)

````text
# Review: `spec/services/payroll/claim_settlement_concurrency_spec.rb`

## Verdict

The shown source has **no confirmed blocker**. One **conditional blocker** depends on `rails_helper` / DatabaseCleaner configuration, which wasn't supplied. Confirm it before treating these as real cross-connection tests.

I traced each test's interleaving against `ClaimReference`, `Workflow`, and `Expense`. Under READ COMMITTED, all three outcomes follow from the source.

---

## Conditional blocker: test isolation and cleaner state

I can't verify this without the config.

The `before` block calls `DatabaseCleaner.clean` and then reassigns the **global** strategy to `:deletion`. Whether this is safe depends on how the suite wires DatabaseCleaner.

**1. If `use_transactional_fixtures` / `use_transactional_tests` is `true`:**
- The Rails fixture transaction is not DatabaseCleaner's, so `DatabaseCleaner.clean` does not close it.
- With `lock_threads` (the default), Rails pins one connection and shares it across threads.
- In that case:
  - The threads' `FOR UPDATE` never waits, because the same session already holds the lock.
  - The threads interleave on one transaction.
- Test 1 could still produce `approved: 1, blocked: 1`. That would be a **false positive with no real concurrency**.

**2. If DatabaseCleaner is wired as `config.around { DatabaseCleaner.cleaning { ex.run } }`:**
- `cleaning` captures the *Transaction strategy instance* at start, and its `ensure` calls that instance's `clean`.
- After your mid-example rollback, that `clean` is a no-op.
- The `:deletion` strategy you assigned **never runs for this example**, so committed rows leak.
- If the strategy is only set in `before(:suite)`, every later example also runs with `:deletion`. That is slower, and it changes `after_commit` semantics for unrelated specs.
- The leaked rows are deleted only after the *next* example. That next example sees foreign companies, users, and expenses, which can cause count or uniqueness flakes.

**3. If it's `config.before { strategy = :transaction; start }` plus `config.after { clean }`:**
- Your override works: the group `before` runs after the global one, and the global `after` cleans with `:deletion`.
- Two side effects to check:
  - Any per-example reference data the global hooks create is rolled back by your `clean` before your data is created.
  - Seed data loaded in `before(:suite)` and protected only by rollback will be **deleted** by `:deletion`. Check whether later specs depend on it.

**Fix options:**
- Prefer a metadata-driven path, e.g. `RSpec.describe ..., :committed_db` handled once in `rails_helper`, or reuse the system-spec truncation branch.
- Or restore the strategy explicitly in an `after`/`ensure` and call `DatabaseCleaner.clean_with(:deletion)` there.
- Either way, add a cheap guard that turns the assumption into an assertion. For example:
  - `expect(ActiveRecord::Base.connection.open_transactions).to eq(0)` at the start, and/or
  - inside a thread, assert its connection is not `equal?` to the main thread's.

**Related: connection pool size.**
- Test 1 needs 3 simultaneous connections (main inside `with_lock`, plus two threads).
- If CI's test pool is smaller (e.g. `RAILS_MAX_THREADS` < 3), a thread hits `ConnectionTimeoutError` after about 5s.
- That surfaces confusingly as `Timeout::Error` on `ready.pop`.
- Verify the pool size in `database.yml` for the CI environment.

---

## Per-test trace

### Test 1: two concurrent final approvals

The sequence:
1. Main holds the expense row lock.
2. Each thread locks its own `payroll_runs` row, inserts its final `PayrollApproval`, signals `ready`, then blocks on `expenses.lock.find`.
3. On main's commit, Postgres serializes the threads on the row lock.
4. The winner inserts a reservation and commits.
5. The loser's subsequent `PayrollExpenseReservation.active.find_by` is a new statement under READ COMMITTED, so it sees the committed reservation.
6. The loser raises `Conflict` ("reserved by another payroll"), and `with_lock` rolls back its approval.

The assertions on the reservation's run, revision and amount, and on approval rows, pin the contract. This **covers pending contract (1)**.

On deadlocks: the threads lock different run rows. The FK `KEY SHARE` locks on users and employment are mutually compatible. I found no lock cycle in the shown code. Any deadlock would raise `ActiveRecord::Deadlocked`, which is not rescued, so it fails loudly rather than producing a false pass.

Not exercised (optional):
- The `RecordNotUnique` → `Conflict` translation in `reserve!` is unreachable here, because the row lock serializes first. If that backstop matters, it needs its own test.

### Test 2: settlement blocked by an uncommitted payroll reservation

The sequence:
1. Approval and reservation are created inside main's transaction.
2. The thread's `Expense.find` is non-blocking. It sees the committed "approved, unreserved" state.
3. `mark_paid!` → `with_lock` → `lock!` blocks.
4. After main commits, `lock!` **reloads** the row.
5. `financial_state_is_current` passes.
6. `not_reserved_by_payroll` re-queries and sees the committed reservation.
7. Result: `RecordInvalid` "This claim is reserved by a payroll run".

The message assertion correctly distinguishes this from `mark_paid!`'s own approved/unpaid guard. This **covers pending contract (2)** at the model level.

Notes:
- **The `stale` name is misleading.** `lock!` reloads the row, so the test does not exercise a stale in-memory object.
- **Regression sensitivity is probabilistic.** `ready` fires *before* `mark_paid!`. If someone removed both `mark_paid!`'s `with_lock` and the `.lock.pick` in `financial_state_is_current`, whether this test turns red depends on timing between main's COMMIT and the thread's validation query.
  - This is consistent with your stated "ordering, not lock state" intent.
  - A deterministic alternative needs no lock inspection:
    1. Have the thread read and assert `payroll_reserved? == false` *before* main commits.
    2. Have it wait on a second queue that main signals after leaving `with_lock`.
    3. Only then call `mark_paid!`.
  - This proves the pre-commit observation window.
- **Coverage gap (verify only):** this calls `Expense#mark_paid!` directly. I can't see whether the controller or service for direct settlement uses `mark_paid!` or some other write path such as `update!(status: :paid)`.
  - The validation would still guard an `update!` path.
  - Whether "direct settlement" in the contract means only this method is something to confirm against the real entry points.

### Test 3: settlement wins after payroll validation

The sequence:
1. The thread holds its run lock and its approval insert, then blocks in `reserve_entry!`.
2. Main's `mark_paid!` runs nested inside its own transaction (same connection).
3. That finds no reservation (none exists yet), so it pays and commits.
4. The thread's `FOR UPDATE` returns the updated row version, now `paid`.
5. The thread hits the "no longer payable" `Conflict`, and its approval rolls back.

This one does robustly detect removal of `.lock` in `reserve_entry!`: either the approval returns `:approved`, or main's `mark_paid!` raises.

---

## Medium (non-blocking) issues

**1. The rescue is broader than the contract (tests 1 and 3).**
- `rescue Payroll::Workflow::Conflict, ActiveRecord::RecordInvalid` collapses every cause into `:blocked`.
- The barrier guarantees both threads reached `reserve_entry!`, which rules out approval-validation failures.
- But "blocked" still doesn't prove *which* branch fired.
- Return `[:blocked, error.class, error.message]` and assert:
  - Test 1: "reserved by another payroll".
  - Test 3: "no longer payable".

**2. The stub signal fires on every `reserve_entry!` call.**
- That includes entries whose `expense_id` is `nil` (early return).
- If the shared context's payroll line carries other reimbursement entries:
  - Test 1's two pops could both come from one thread.
  - Test 3 could release main before the thread reaches the claim entry.
- Outcomes probably still hold, but the intended ordering weakens.
- Fix: guard the signal with `Payroll::ClaimReference.expense_id(arguments.last["source_reference"]) == claim.id`.
- I can't see the shared context, so this may already be moot.

**3. Failure-path cleanup.**
- `join(5)` re-raises a thread's exception from `ensure`. That is mostly helpful, since it surfaces the root cause, but it can replace the primary failure.
- If a thread is still alive after the 5s, it holds a connection, possibly with an open transaction holding a run lock. The following deletion clean then blocks on `DELETE FROM payroll_runs`, which can stall the suite.
- Consider `thread.kill` after a failed join, and rescuing join errors only when an earlier exception is already propagating.

---

## Optional style

- Use `ready.pop(timeout: 10)` (Ruby ≥ 3.2) and assert it is non-nil, instead of `Timeout.timeout`. This avoids async-exception injection.
- Assert `Payroll::Workflow.new(loser_run.reload).status == "accounts_approved"` in tests 1 and 3 to tie the rollback to user-visible workflow state.
- The file lives in `spec/services/` while being described as acceptance coverage. Fine if that's intentional; consider tagging it (e.g. `:concurrency`) so CI can isolate or serialize it.

---

## Not verifiable from what was supplied

- `rails_helper` / DatabaseCleaner wiring and the `use_transactional_tests` setting (see the conditional blocker).
- The test DB pool size.
- The contents of `approved mercury consultant payroll`.
- `PayrollApproval` and `PayrollExpenseReservation` validations, callbacks and indexes (e.g. `touch:`, partial unique index on active `expense_id`).
- `Entitlement.require!`, `Searchable` callbacks, and the definitions of `active` vs `unsettled`.
- The diff to `spec/acceptance/payroll_issue_2458_pending_spec.rb`. Confirm the two pending entries are removed or pointed at these examples rather than duplicated.

I am not drawing any conclusion about provider acceptance or reimbursement-requirement completeness.
````
