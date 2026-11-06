# Reimbursement reservation release verification — 6 November 2026

## DEBUG REPORT

- **Symptom:** The #2458 release/retention requirement lacked connected workflow coverage across bank reconciliation, replacement revisions and split-payment siblings.
- **Root cause:** Status-level specs and rejected-revision cases did not establish the protected-reservation path of a successful unchanged revision.
- **Change:** Nine executable service scenarios exercise the existing application guards. The requirements mapping now distinguishes Mercury coverage from the still-pending India accounts-handoff lifecycle.
- **Evidence:** Final focused selection: **109 examples, 0 failures, 59 pending** (50 executable). Full non-system suite: **5,703 examples, 0 failures, 60 pending**.
- **Regression tests:** New context “when a claim has a Mercury instruction” in `consultant_revision_spec.rb`; new split-reservation context in `mercury_split_spec.rb`.
- **Related:** Sonam #2458; original receipt/currency/amount/allocation settlement and India-handoff release protection remain pending.
- **Status:** DONE_WITH_CONCERNS. Local workflow coverage is complete for the named scenarios; live bank acceptance and shipping remain incomplete.

## Scenarios

The tests execute real expense records, consultant revision creation, both payroll approvals, payment preparation/submission, reconciliation and revision replacement. Provider HTTP responses are mocked.

| Scenario | Verified outcome |
| --- | --- |
| Rejected or cancelled request before approval (2 cases) | Instruction closes without credit; claim remains reserved until a replacement revision releases it. |
| Pending transaction followed by authoritative failed or cancelled outcome (2 cases) | No credit or in-flight leg remains; a replacement revision can release the claim. |
| Submission timeout with unknown bank outcome | Claim stays reserved; changing the revision is rejected. |
| Cancellation after bank approval with no transaction proof | Hold remains; changing the revision is rejected. |
| Failure after partial INR credit | Credit remains partial, the claim remains reserved/unpaid and direct expense settlement is blocked. |
| Unchanged revision during an uncertain payment, then fresh approval | Existing reservation survives the accepted revision and is reassigned rather than duplicated. The original instruction stays on its frozen revision, with only one original provider POST. |
| Consultant/spouse split | Closing the consultant leg alone keeps the claim reserved while the spouse leg remains in flight. After both close with no-funds evidence, a replacement revision releases it. Exactly two original provider POSTs occur. |

No application source changes were required. The ledger remains explicit that India accounts-handoff protection, complete receipt/allocation settlement and real provider outcomes are not established.

## Counterfactual checks

Temporary, process-local mutations were loaded only for deliberately failing probes, never for the normal runs:

| Deliberate regression | Result |
| --- | --- |
| Disable reservation release | New safe-cancellation test fails because `released_at` stays nil. |
| Disable bank revision checking | Timeout test fails because the changed revision is incorrectly accepted. |
| Ignore a spouse-only in-flight group | Split test fails because changing the claim is incorrectly permitted. |
| Remove the protected-employment release filter | Unchanged-revision test fails because the in-flight claim is prematurely released. |

Each probe produced **1 example, 1 expected failure**, at the intended assertion. The first three preceded final assertion/fixture refinements; the protected-filter probe used the final test. The final ordinary focused run and full backend run used no mutation helper. These checks demonstrate detection of the named regressions; they do not prove every possible bank outcome.

## Checks and boundaries

- Focused specs plus pending acceptance file: **109/0/59**.
- Full backend, excluding `spec/system`: **5,703/0/60**, including the new tests and the preceding build-cache regression. Pending work was not hidden or waived.
- RuboCop: three changed Ruby files, no offenses.
- Whitespace: `git diff --check` passes.
- Tests used synthetic local PostgreSQL data. Outbound networking was restricted to localhost; all Mercury HTTP responses were fixtures. No live bank transfer or external email was sent.
- This unit changes tests and documentation only. No new UI screenshot or browser suite was needed for application changes.
- The initial report-date investigation was left unchanged: source call-site inspection found the suspect control under the legacy Time Entry Page, while the active route loads the separate index implementation. No current report crash or fix is claimed.
- A fresh personal-browser inventory shows Brave running, zero connected browsers and `The browser access host is unavailable`. No signed-in provider or production flow was verified. No alternative profile or browser was used.
- The pre-existing freeze belongs to another task and was preserved; this investigation acquired no owner token.

Local logs:
- `/tmp/miru-claim-release-focused-final-20261106.log`
- `/tmp/miru-backend-claim-release-final-20261106.log`
- `/tmp/miru-claim-release-noop-red-20261106.log`
- `/tmp/miru-claim-guard-noop-red-20261106.log`
- `/tmp/miru-claim-sibling-red-20261106.log`
- `/tmp/miru-claim-protected-filter-red-20261106.log`

Temporary mutation helpers are the corresponding `/tmp/miru-claim-*-mutation-20261106.rb` files. They are not repository code or part of normal test discovery.

## Independent assistance

Local Qwen emphasized distinguishing instruction closure, zero credit, reservation state and uncertain outcomes. The safe/retained assertions check these separately.

### CLAUDE CODE SAYS (consult), initial

Fresh tools-disabled source-only consultation. Runner models: claude-opus-5-5.

```tool-output
# Review: #2458 reimbursement reservation release and retention coverage

This review is based only on the supplied patch and source excerpts. I did not run anything. I found **no High-severity defects**: the scenarios exercise the intended code paths, and I saw no false-positive assertions in the core release and retention checks. There are two Medium coverage/overclaim issues and several Low/Info items.

## Medium

**M1. Retention is proven only through the revision guard. The `release_reservations` protection filter is never reached.**

- In every unsafe case (`expect_claim_still_reserved`) and the split mid-state, `build` / `revise_with_claims([])` drops the claim.
- That changes the line digest, so `MercuryRevisionGuard#check!` raises before `after_revision!` runs.
- As a result, the `where.not(employment_id: protected_employment_ids)` branch in `mercury_revision_guard.rb` is never exercised. Deleting that filter would not fail any of these eight scenarios.
- The path that actually depends on it is a guard-accepted replacement while a leg is uncertain. For example, `build(expenses: [claim.id])` with an identical line digest passes `check!`, then runs `release_reservations`.
- **Fix:** add at least one unsafe case (timeout is the cheapest) that:
  - builds a replacement keeping the same claim,
  - asserts the replacement succeeds,
  - asserts the `claim_revision` reservation stays active and the claim is still `payroll_reserved`.
- This would also show whether approving that replacement double-reserves the claim. I can't determine that from the supplied source.

**M2. The acceptance pending item is fully retired, but coverage is narrower than its wording.**

- The removed item said "releases a reservation **only** after cancellation or failure proves no outstanding payment."
- The new tests prove one trigger: a ConsultantRevision replacement on a Mercury `mercury_us` run.
- They do not show that other paths cannot release an in-flight reservation, such as:
  - expense un-approval or material edit,
  - run cancellation,
  - `Workflow#revise!` with a raw payload, if it bypasses the guard,
  - the India handoff / non-Mercury source (row 8 is still pending).
- I can't tell from the supplied source whether those paths exist. Two options:
  - Keep a narrowed pending item, e.g. "…for non-Mercury/handoff payment sources and live provider outcomes".
  - Or name the excluded paths in the comment that replaced the `it`.
- The doc row's "Mocked-provider workflows" qualifier helps, but `payroll_issue_2458_pending_spec.rb` no longer tracks the gap.

## Low

**L1. The doc wording omits the revision trigger.**

- The doc says "release claims only after no-funds evidence closes every transfer leg."
- The tests actually assert that the reservation stays active after every leg closes (`expect(reservation.released_at).to be_nil` before `build`). Release happens only on a replacement revision.
- Suggested wording: "…once no-funds evidence closes every leg, a replacement revision releases the reservation."

**L2. The "current revision unchanged" assertions may not prove anything if `run.current_revision` is cached.**

- `run` is memoized via `let`. If `current_revision` is a cached association, `expect(run.current_revision.id).to eq(claim_revision.id)` / `eq(base_revision.id)` after the raised `build` would pass even if a revision had been persisted.
- The surrounding assertions (the raise plus `reservation.reload.released_at` being nil) carry the real weight.
- **Fix:** use `run.reload.current_revision` in the negative-case assertions. This is a cheap hardening step; I couldn't check the implementation.

**L3. The split fixture diverges from its sibling spec.**

- The `claim` in `mercury_split_spec.rb` has no `approved_at`. The one in `consultant_revision_spec.rb` sets `approved_at: 1.minute.ago`.
- Requirements row 6 says an unknown historical approval requires review. So this scenario depends on a factory or callback default for `approved_at`, and could silently change meaning if that default changes.
- **Fix:** set `approved_at` explicitly.

**L4. The inner `let!(:base_revision)` override is fragile.**

- It has side effects (`company.update!`, `employment.update!`), and it runs from the outer `let!` hook slot, not from the inner group.
- It works because `around` wraps all `before` hooks. A plain `before` block plus a separately named `let!` would be clearer.

**L5. Some realistic outcomes are not covered.** This isn't required by the stated goal, but worth noting:

- a `pending → failed` transition (both safe cases jump from `nil`),
- a `reversed` transaction,
- the `transaction_list_incomplete` hold.

## Fixture and time leaks

None found:

- Both blocks run inside `travel_to(2026-12-05 12:00 UTC)`. Time is frozen, so the `TRANSACTION_WAIT` comparison in the cancelled-after-approval case is deterministic and never hits `transaction_not_found`.
- `quote`, `mercury_request.createdAt`, the cutoff and `credited_on` are all evaluated lazily inside the travel window.
- WebMock stubs are per-example, and re-stubbing correctly relies on last-declared-wins.
- The `have_been_made.twice` assertion counts per example, so it correctly bounds total writes, including none from the revisions.

## Necessary vs redundant assertions

**Necessary:**

- `reservation.released_at` nil before replacement and present after.
- `in_flight_legs` empty / non-empty, which is the guard's actual input.
- `credited_minor == 0` in the safe cases.
- `held_reason` and `credit_state` in the unsafe cases.
- The split `pluck(:id) == [spouse_leg.id]`.
- Exactly two POSTs.
- The `display_state` checks: they overlap the sibling parser specs, but they anchor each scenario to the intended branch.

**Redundant (harmless):**

- `run.current_revision.id == replacement.id`: `build` already returns it.
- `instruction.released_at` alongside `in_flight_legs`: these overlap.
- `mark_paid!` raising `/reserved/` in only the partial-credit case: this is likely already covered by `claim_settlement_concurrency_spec.rb`. Either drop it, or move it into `expect_claim_still_reserved` so it applies consistently.

## Conclusion

**Findings: 2 Medium, 5 Low/Info. Nothing blocking.**

The "eight scenarios, provider HTTP only mocked" description matches the patch (4 safe + 3 unsafe + 1 split). Accepting the "release only after no-funds evidence / retain for uncertain outcomes" contract as executable coverage needs two things: M1's guard-accepted retention case, and narrowing the pending item per M2. Independent execution and release gates remain with the host.
```

### Host assessment and changes

Addressed M1 with an accepted unchanged revision and fresh approval, asserting the same sole reservation ID/amount and frozen original bank instruction. A protected-filter mutation fails that test. Addressed M2 by retaining explicit India-handoff coverage as pending and narrowing the ledger to mocked Mercury workflows. The pending contract was not simply dropped.

Also reloaded the run in negative assertions, made split approval time explicit and exercised pending-to-terminal transaction transitions. Existing reserved-expense edit guards and the raw Workflow revision guard remain unchanged.

### CLAUDE CODE SAYS (consult), follow-up

Fresh tools-disabled consultation on the final patch. Runner models: claude-opus-5-5.

```tool-output
# Follow-up consultation: final reimbursement coverage patch

**Verdict: M1 and M2 are addressed. NO_FINDINGS for new blocking defects.**

This is a source-only reading of the supplied patch and source excerpts. I did not run anything. The run counts and mutant results are as you reported them. Provider HTTP is mocked, so nothing here establishes live-bank acceptance or release approval.

## M1: protected-employment filter coverage. Addressed.

The new example `retains one reservation when an unchanged revision is reapproved during an uncertain payment` exercises the path that was previously unreachable:

1. **Submission becomes uncertain.** `submit_claim(timeout: true)` leaves a non-`prepared` open leg. That makes the group in flight.
2. **The guard lets the revision through.** `build(expenses: [claim.id])` yields an identical `line_digest`, so `MercuryRevisionGuard#check!` passes and `create_revision!` reaches `after_revision!`.
3. **The leg is not voided.** `void_prepared_legs` skips it because its state is `uncertain`, not `prepared`.
4. **The filter is the only protection.** `release_reservations` computes `protected_employment_ids` from the in-flight group. Removing `.where.not(employment_id: ...)` would set `released_at`, and the assertion `reservation.reload … released_at: nil` would fail. That matches your counterfactual.
5. **Approval reassigns rather than duplicates.** `approve(replacement)` hits `ClaimReference.reserve_entry!`, which finds the active same-run reservation and calls `update!(payroll_revision: revision)`. The `.sole.id == reservation.id` and `amount_minor: 500_000` assertions pin that down.
6. **No duplicate submission.** The instruction stays on `claim_revision`, and the single provider POST is asserted with `have_been_made.once`.

The example also asserts `replacement.id != claim_revision.id`. This rules out a false pass through the idempotency short-circuit.

## M2: pending scope. Addressed.

- **Pending spec.** It now explicitly keeps India accounts-handoff protection, full settlement/receipt/allocation, and live provider acceptance.
- **Requirements row.** It is scoped to "mocked Mercury workflows". Each claim in it maps to an executable example:

  | Claim in the row | Covering example |
  |---|---|
  | No-funds release across every leg | Split spec: consultant-cancelled, spouse in flight, then both cancelled |
  | Timeout retains reservation | `retains the claim when submission times out…` |
  | Cancellation after approval retains reservation | `cancelled_after_approval` example |
  | Failure after partial credit retains reservation | `failed_after_sent` + partial credit example |
  | Unchanged reapproval without duplicate reservation | The new M1 example |

- **Wording.** "A replacement revision releases claims once…" is accurate. Release is triggered by revision creation, not by the reconciliation evidence alone, and the tests reflect that order: evidence first, then `build`/`revise_with_claims`.
- **India handoff.** `release_reservations` only considers Mercury `PayrollPaymentGroup` in-flight legs. A future India handoff would therefore not be protected, but row 8 is pending and not implemented, so this is not a live defect. The retained pending example is the correct tracker.

## Notes (not requirements)

1. **Settlement contract to pin down later (informational).** After an unchanged reapproval, the reservation points at `replacement` while the group and instruction stay on `claim_revision`. Release is safe because it is scoped by `payroll_run_id`, not by revision. When the pending settlement/allocation work lands, settlement must find the reservation by run, employment, or expense, not by the instruction's `payroll_revision`. Otherwise a credited uncertain transfer could fail to settle the reassigned reservation. It may be worth naming this in the pending settlement example when it is written.
2. **Optional cleanup.** `expect_claim_release_after_revision` and the split spec's success path compare `run.current_revision.id` without a reload. This cannot produce a false pass, because a stale value would fail the assertion. Reloading would be consistent with the negative-path change you made.
3. **Optional cleanup.** In the split spec, the first-phase `revise_with_claims([])` conflict is caused by the `line_digest` mismatch, not by the release filter. That is fine for asserting split-sibling retention; M1's filter coverage correctly comes from the consultant spec. A one-line comment is unnecessary.

## Not established

- The full non-system suite result. You said it is still running; I make no claim about it.
- Independent confirmation of the 109/0/59 run or the four mutant failures.
- Behaviour of `open_slot`, `unsettled`, `active`, or the spec helpers (`build`, `approve`, `prepared_instruction`, `prepared_legs`), which were not supplied. My reading assumes they behave as their names and the passing assertions imply.
- Any live Mercury behaviour, including timeout and retry semantics of the real client.
```

### Final host assessment

Both medium findings were addressed and independently exercised. The full backend result above completed after this follow-up. The note about settlement after reassignment remains relevant to the separate pending receipt/allocation contract; it is not claimed complete here.

Neither source-only consultation is a combined-branch council review, provider acceptance or deployment approval. Full project typechecking remains failing under the preceding verified configuration (329 diagnostics); it was not rerun for this test/doc-only unit. The review-scope selector is still unanswered. No code push, merge, deployment, production migration or monitoring-health claim is made.

## Final source fingerprints

```text
efbe1319cb81d7cc5d65d18dc88f4fd7933b4694ce439fca0c328a3383613e5f  spec/services/payroll/consultant_revision_spec.rb
3d64771f1c0225e5960aa12abdc322740f5f351b20ba46ea3e748f388d3c40ae  spec/services/payroll/mercury_split_spec.rb
fcb71899f819098eb853a6479ac048ebfb69b9944590657d3ab110c2ff264d3b  spec/acceptance/payroll_issue_2458_pending_spec.rb
5a9f875eddae81239a8dee444b6cf256edbb24253ac2ccd0f50c338e1b55984d  docs/superpowers/specs/2026-10-19-consultant-payroll-requirements.md
```

