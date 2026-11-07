# Mercury status concurrency, 7 November 2026

## DEBUG REPORT

**Symptom:** Local controlled races reproduced older status responses replacing
newer committed payment information. An approved request returned to pending
approval; stale pending transactions added a false reconciliation hold after a
sent result or a recorded INR credit. This was a local discovery, not an observed
production incident.

**Root cause:** Both provider HTTP reads happened before the instruction row lock.
The locked write checked destination and terminal-state rules, but did not check
whether the instruction changed during that read.

**Fix:** The shared reconciliation service captures the instruction attributes
before each HTTP read. Its existing `with_lock` reload compares the persisted row
before applying the response. Changed rows discard the response. HTTP remains
outside database transactions and locks; a subsequent refresh can try again. This
uses no new columns, dependencies, provider calls or payment-submission behavior.

**Evidence:** Final backend run: **5,720 examples, zero failures, 59 pending**,
6 minutes 19 seconds. Final focused race/job selection: **13 examples, zero
failures**. Three changed Ruby files pass RuboCop; the affected service passes Reek.
Whitespace checks pass. No JavaScript changed or new asset build ran.

**Regression tests:**

- `spec/services/payroll/mercury_status_concurrency_spec.rb`: eight independent
  readers pause at each real-client HTTP boundary, using WebMock only for the bank.
  Both completion orders are forced with queues; another case records an INR credit
  while old transaction reads wait. Persisted instruction fields and audit events
  remain identical after discarded responses. All eight readers must observe the
  same persisted-state hash before the competing write. Frozen wall time proves
  the check protects state changes even when timestamp values are identical.
- `spec/jobs/payroll/mercury_status_refresh_job_spec.rb`: a stale batch item discards
  its response; the next actual job sweep advances its status using reads only.

**Related:** Sonam's #2458, section 12: payment state and audit integrity. The
acceptance ledger records this local polling coverage without retiring the broader
pending lifecycle contracts.

**Status:** DONE_WITH_CONCERNS. The local fix is verified. Publication still needs
the current-HEAD council reviews; production and live Mercury acceptance are not
verified. The larger Sonam goal remains incomplete.

## Failure and recovery evidence

| Native check | Observed result |
| --- | --- |
| Valid original race run before repair | 5 examples, 3 failures; both opposite-order controls passed |
| Final race tests with frozen time and default pool | 5 examples, zero failures |
| Request guard removed in a separate process | 5 examples, 1 expected failure |
| Transaction guard removed in a separate process | 5 examples, 2 expected failures |
| New stale-batch job test with request guard removed | 1 example, 1 expected failure |
| Final race and real-job regression files | 13 examples, zero failures |
| Full non-system backend after all code/test edits | 5,720 examples, zero failures, 59 pending |

The two guard-removal probes loaded temporary modified class definitions only in
their test processes. They never edited the repository's fixed service. Monotonic
traces verified eight blocked reads and eight returns in every race, with all
older returns strictly after the newer commit or strictly before the newer write,
as selected. The initial setup attempt used a prepended cleanup hook and left
fixtures uncommitted; it was corrected before the valid red run. A later probe
summary parser needed to accept singular `failure`; its test had failed as intended.

Each blocked callback asserts zero open database transactions, releases its idle
connection and then waits. This lets eight overlapping reads use the default pool
of three without changing application or CI connection settings. There are no
arbitrary sleeps or production test hooks.

Commands used `rtk proxy mise exec -- bundle exec rspec` with the selected two
regression files, or `--exclude-pattern 'spec/system/**/*' --fail-fast` for the full
backend. The earlier broader payroll selection passed 438 examples with 59 pending
before the last test-strengthening/job case. All runtime tests used the owned
`miru_sonam_integration_test_20261104_abdd` PostgreSQL database and a localhost-only
outbound sandbox. Source, bank identifiers, recipients and records were synthetic.

Retained local logs:

- `/tmp/miru-mercury-status-overlap-red-valid-20261107.log`
- `/tmp/miru-mercury-status-final-verified-20261107.log`
- `/tmp/miru-mercury-status-request-verified-20261107.log`
- `/tmp/miru-mercury-status-transactions-verified-20261107.log`
- `/tmp/miru-mercury-status-job-red-20261107.log`
- `/tmp/miru-mercury-status-focused-final-20261107.log`
- `/tmp/miru-backend-mercury-status-final-20261107.log`
- `/tmp/miru-mercury-status-final-inputs-20261107.json`

## Safety and limits

The safety fact is that comparison and application share the same row lock.
Rails 8.1.4's `locking/pessimistic.rb` calls `reload(lock:)` before yielding from
`with_lock`; the native races verify the effect against committed PostgreSQL rows.
No network request moves inside that lock, and group locking remains afterward.
Current column types round-trip through these native client, job and backend tests.

This is conservative compare-and-apply, not a provider sequence number. An older
read that commits first can cause an in-flight newer read to be discarded. The next
poll converges; it can take an additional sweep. Sequential stale provider data,
general bank-event ordering, sustained production load and provider timestamps
were not verified. Future non-round-tripping attribute types need matching tests.
Discarded reads do not gain a dedicated metric in this change.

Existing unique company/provider request and transaction indexes were checked in
`db/schema.rb`; the refresh job has no enclosing transaction. The current tests
reset DatabaseCleaner's strategy per example. Existing settled-claim return review
behavior was not changed. No new browser screenshots were taken for this backend
change, and no live transfer, production deployment or statutory calculation was
performed. The 59 pending acceptance contracts still include substantial unfinished
work; passing executable tests do not establish feature completion.

The pre-existing gstack freeze boundary was preserved because this investigation
did not own it. Changes remain in the dedicated integration worktree. Local Qwen
was consulted, but its guessed schema claims and assertion that request status is
outside `attributes` were rejected against the actual model and tests.

## Claude source consultation

A fresh tools-disabled source consultation used the configured Claude CLI;
reported model `claude-opus-5-5`, session `ab1e923e-4165-473d-bb53-90b67406c346`.
It reviewed the unchanged final service code and an earlier test revision. The
response below is retained verbatim. Its test-fidelity concern was addressed by
freezing time and asserting identical state hashes for all eight readers; its
job-progress concern gained the red/green next-sweep test. Schema indexes and the
cleaner reset were verified directly. This is advisory source review, not council
approval, exact-HEAD CI or production proof.

CLAUDE CODE SAYS (consult)

```tool-output
# Review: Mercury status compare-and-apply fix

**Verdict: NO_FINDINGS for correctness, security or deadlock in the diff itself.** The findings below are test-fidelity and latent-fragility issues, plus notes on existing code. This is a source-only consultation. It is not council approval and not provider or production verification.

## What the diff actually does

- **Snapshot timing.** `read_status!` (`mercury_reconciliation.rb:168`) and `apply_transactions` (`:247`) snapshot the in-memory attributes right before each HTTP read.
- **Comparison under lock.** `with_lock` reloads the row via `SELECT … FOR UPDATE`, then compares the full attribute hash (`:229`, `:253`). Any committed change to the row causes a silent discard.
- **No HTTP under lock.** HTTP stays outside the transaction on the paths shown.
- **No new lock nesting.** Instruction locks are released before `sync_group` takes the group lock, so no lock-order inversion is introduced.
- **The invariant holds within `read_status!`.**
  - A matched `apply_request` always writes `last_checked_at`, which also bumps `updated_at`.
  - So any poll that reaches the transactions phase has changed the row.
  - `record_credit!`, `resolve_shortfall!`, `accept!` and `attest_absence!` all write too.
  - A newer committed state therefore always invalidates older snapshots. A no-op write would not, but it is harmless by definition.
- **Discards are inert.**
  - A discarded request read returns `false`, so the transaction read is skipped.
  - No events are created and `last_checked_at` is not touched.
- **`sync_group` stays safe after a discard.** It still runs, but it reads fresh `open_legs` under the group lock, so a discarded response cannot affect group completion.
- **`next false` inside `with_lock` is correct.** `transaction` returns the block value, so `matched` behaves as intended.

## Findings

**Medium (test fidelity, not a code defect): in the transactions phase, only one of the eight readers actually competes with the newer write.** See `spec/services/payroll/mercury_status_concurrency_spec.rb:49-58`.
- The threads start one after another. In `phase: :transactions`, each thread's request read is not blocked, so thread *k* commits `apply_request` (S_{k-1}→S_k) before taking its transaction snapshot.
- Threads 1–7 therefore hold snapshots that thread *k+1* has already invalidated. They would be discarded even without the newer write.
- Only thread 8 is a genuine contender. The "eight overlapping transaction reads" claim overstates what this phase tests.
- In the request phase, all eight do share S0, because they block before any write. That phase is a true eight-way overlap.
- Fix option: gate the request read with a separate barrier, so all eight take an identical transaction snapshot.

**Low: the `refresh_from_job!` path is unverified.** See `:46-49`.
- Here the snapshot comes from a caller-supplied instance, not a just-loaded row.
- If the job loads instructions early, or wraps the call in an outer transaction, behavior changes:
  - A stale instance means a guaranteed discard. That is safe, but the job could make no progress.
  - An outer transaction would hold row locks across the second HTTP read.
- The job source was not provided, and no spec covers this path.

**Low: comparing the full `attributes` hash is fragile for future columns.**
- The `apply_transactions` snapshot (`:247`) is taken from the in-memory values after `apply_request`'s `update!`. These are not reloaded.
- If a column does not round-trip identically (for example a jsonb column assigned symbol keys, or a float), the comparison would never match. Transactions would then silently never apply.
- The current schema evidently round-trips correctly:
  - The credit test's first `refresh_status` must reach `transaction_status == "sent"`, or `credit_recordable?` would fail.
  - The newer refreshes assert `sent`.
- Neither assertion targets this case directly, and the instruction schema was not provided.

**Low: the spec changes DatabaseCleaner's global strategy.** See `:6-10`.
- `DatabaseCleaner.strategy = :deletion` is process-global.
- Whether later specs fall back to the transaction strategy depends on `rails_helper` resetting it per example. `rails_helper` was not provided.

**Low: possible CI flakiness from connection-pool contention.**
- Once released, the eight threads plus the main thread contend for a pool of 3 connections.
- Each resumed thread keeps its connection until `with_connection` exits, which is after `sync_group`.
- They rely on the default `checkout_timeout` and the 10s/12s timeouts. Passing locally does not rule out flakes on slow CI.

**Info: a newer response can be discarded when an older one commits first.**
- If an older read commits first, a still-in-flight newer read gets discarded. Convergence is then delayed until the next poll.
- This is not a regression of committed state, and it matches the stated design.
- Discards leave no trace (no log or metric), so sustained starvation, such as a job overlapping with user refreshes, would be invisible.
- Neither `newer_first: false` case asserts which reads applied or were discarded. The final newer refresh alone guarantees the end-state assertions, so these cases are controls only, as described.

## Existing code, unchanged by the diff (not regressions)

- **`request_claimed?` / `transaction_claimed?` are check-then-act** (`:407-413`). The lock is per instruction, so two instructions could claim the same id at once unless a unique index exists. The schema was not provided, so I cannot confirm either way.
- **`sync_group` reopen does not reverse `mark_paid!` on expenses.** It only records `settled_expense_ids`, and `fully_credited?` reads leg rows without locking them. This is eventually consistent, but expenses can stay paid after a later hold.

## Context not provided

These would be needed to close out the Low items:
- the instruction schema (column types, unique indexes)
- the refresh job
- the `approved mercury consultant payroll` shared context
- `rails_helper` (DatabaseCleaner setup)
- `MercuryContract` parsing
```
