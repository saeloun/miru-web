# Reimbursement settlement verification — 6 November 2026

## DEBUG REPORT

- **Symptom:** Sonam's reimbursement contract lacked an end-to-end assertion for settlement after an uncertain request survives unchanged reapproval, and for receipt-preserving settlement across both split legs.
- **Root cause:** Coverage stopped at reservation reassignment or used direct instruction updates without an actual expense. No application defect was demonstrated in this unit.
- **Fix:** Extend the uncertain/reapproved example through owner confirmation, provider status reads and actual credit recording; add a split workflow with real preparation/submission/reconciliation services and synthetic HTTP responses. Keep the pending contract scoped to the unimplemented India handoff.
- **Evidence:** Final related selection: **192 examples, 0 failures, 59 pending** (**133 executable**). Three changed Ruby files pass RuboCop; whitespace checks pass.
- **Regression tests:** `spec/services/payroll/consultant_revision_spec.rb`, uncertain/reapproved settlement example; `spec/services/payroll/mercury_split_spec.rb`, receipt/allocation settlement example.
- **Related:** Sonam #2458; previous `claim-release-verification-20261106/report.md`; India accounts handoff, foreign expense FX review, official remittance evidence and actual provider acceptance remain unfinished.
- **Status:** **DONE_WITH_CONCERNS** for this local coverage unit; the broader release is incomplete and unpublished.

## What is proved locally

- A timed-out Mercury submission retains its original instruction and one reservation. An unchanged revision can be reapproved; the reservation moves to it while the original instruction remains bound to its original revision.
- Owner confirmation of the matching request followed by an approved/sent bank fixture does not pay the claim. Recording the full INR credit settles that reassigned reservation once.
- The ₹67,500 entitlement remains separate from the frozen USD principal of $803.57 and OUR cost of $15 ($818.57 company debit). Reapproval and settlement preserve those fields and the instruction digest.
- A 25% fee split produces ₹51,875 for the consultant (including the entire ₹5,000 reimbursement) and ₹15,625 for the spouse. Independent USD principal expectations are $617.56/$186.01, with $15 per-leg OUR costs.
- Even after the consultant leg is credited, the claim remains approved/unpaid until the spouse leg is credited. Original INR amount, owner and receipt blob/bytes survive settlement. Receipts exist before payroll approval.
- Replaying identical credits and status reads five minutes later preserves paid/settled/group timestamps, sole credit events, one completion event and no reopening event. Only the original one/two mocked provider POSTs occur.
- These fixtures represent US funding to India consultants. They do not establish actual bank acceptance, spouse-payment legality, Indian tax completeness or foreign-currency expense support. An expense receipt is not FIRC/FIRA.

## Checks and mutation probes

Final ordinary command selected `consultant_revision_spec.rb`, `mercury_split_spec.rb`, `mercury_reconciliation_spec.rb`, `claim_reservation_concurrency_spec.rb`, `claim_settlement_concurrency_spec.rb` and `payroll_issue_2458_pending_spec.rb`. It ran on an isolated synthetic PostgreSQL database with outbound network denied except localhost; no mutation helper was loaded. Log: `/tmp/miru-claim-credit-final-20261106.log`.

Three process-local mutations each produced **1 example, 1 expected failure** at the relevant assertion:

| Mutation | Detected by |
| --- | --- |
| Settle reservations only on the instruction's old revision | Reapproved claim remains unpaid |
| Complete the group after any credited leg | Group completes before the spouse credit |
| Remove the already-completed group guard | Duplicate credit changes the completion timestamp |

Mutation helper: `/tmp/miru-claim-credit-mutation-20261106.rb`; logs: `/tmp/miru-claim-credit-mutant-{old_revision,first_leg,duplicate_settlement}-20261106.log`. These probes preceded final receipt setup and assertion strengthening. The final ordinary selection passed after those refinements. Application source was never edited by the probes.

Initial two-file run: **51 examples, 0 failures**. The earlier full backend at parent `07e99d4f9` was **5,703 examples, 0 failures, 60 pending**; that is historical evidence, not a full-suite run at this new commit. No frontend build/browser rerun was necessary for this test/document-only unit. Existing TypeScript failures remain unresolved.

## Review and release limits

Local Qwen was reachable and completed a bounded proposal, but it invented model/service APIs and requirements. That proposal was rejected; no generated code was applied.

Claude completed a fresh, tools-disabled source consultation. The host addressed its two medium findings (receipt before approval and independent USD expectations) and the smaller assertions for credit states/currency, unsettled state before credit, sole instruction and no reopening. The final tests/lint passed afterward. There was no second Claude pass; this is not council approval.

Fresh read-only deployment checks, using the approved Render workspace: Render production remains suspended/maintenance enabled; Hatchbox's Miru staging app still reports private commit `fcdeec33d49fea3fcdc9043e34427bbb9074ab72`, deployed 2 November. This does not prove current production routing, runtime health, backups or monitoring. No deployment or transfer was made.

Required exact-head engineering/design/developer-experience council reviews remain missing. The engineering review skill's unanswered scope selector is still pending. Do not bypass the gate or treat these test results as ship approval. The existing freeze boundary belonged to another task and was preserved; only the four named spec/requirements files and this report changed.

## CLAUDE CODE SAYS (consult)

Model: claude-opus-5-5; session `e896f193-1295-41c9-ab53-1a148ac7c0bf`. Original response, before host refinements:

```tool-output
## Findings

**MEDIUM: Split receipt is attached after reservation, so it isn't the "original" receipt.** `spec/services/payroll/mercury_split_spec.rb`, new example, first lines.

- `let!(:base_revision)` references `claim`. The claim is therefore created and final-approved, and its reservation exists, before the example body runs.
- `claim.receipts.attach(...)` then runs on an already-reserved claim. The example never proves that a receipt present at approval survives settlement.
- It also silently depends on the attachment path bypassing the reserved-claim edit guard (`consultant_revision_spec.rb`, "blocks direct settlement, review changes, edits…").
- Fix: attach the receipt when the claim is created, before `base_revision`, for example by overriding `let(:claim)` with a `create(...).tap { attach }`.
- The consultant example is fine here. It attaches before the lazy `claim_revision` is built in `submit_claim`.

**MEDIUM: USD principal and OUR cost are asserted only circularly.** Both new examples.

- The split request and transaction amounts are derived from `leg.principal_minor` itself. A leg priced in INR minor units would still link and pass.
- Add `principal_minor`, `fee_minor` and `company_debit_minor` for the split legs. At rate 84, using the same rounding as the existing legs example, that is `[61_756, 18_601]`, `[1_500, 1_500]` and `[63_256, 20_101]`.
- In `consultant_revision_spec.rb`, capture those three fields plus `frozen_digest` on `claim_instruction` before `approve(replacement)`. After settlement, assert they are unchanged. This proves reapproval didn't re-price the stale instruction.

**LOW: Leg-level settlement state is not pinned.** Both examples.

- Nothing asserts `credit_state: "credited"`, `credited_minor == entitlement_minor` or `entitlement_currency: "INR"`.
- Nothing asserts that the `credit_recorded` event's `data["currency"] == "INR"`.
- In the split case, nothing asserts the consultant leg is `"credited"` while `fully_credited_at` is still nil.
- Without these, entitlement and principal confusion relies on the older single-leg partial-credit example to catch it.

**LOW: Reservation state before credit is not checked in the reapproval case.** `consultant_revision_spec.rb`.

- After `refresh_claim(transaction_status: "sent")`, only the claim is checked.
- Add `expect(reservation.reload.settled_at).to be_nil` to mirror the split example's guard against settling on a sent wire.

**LOW: No assertion that reapproval created no second payment slot.** `consultant_revision_spec.rb`.

- `have_been_made.once` proves only that no second POST happened.
- Add `PayrollPaymentInstruction.where(payroll_run: run, employment:).open_slot.sole.id == claim_instruction.id`. This confirms settlement came from the stale-revision instruction and not from a replacement-bound slot.

**LOW: Reopen events not excluded.** Both examples.

- The replay assertions check timestamps and counts of `credit_recorded` and `group_fully_credited`.
- Asserting `group_credit_reopened` count `== 0` would make transient reopen-then-resettle paths in `sync_group` (`mercury_reconciliation.rb`) explicit.

These findings come from reading the source only. No tests were executed, and this does not satisfy the council gate.
```

## Final source fingerprints

```text
f32cb3e292aa089d523dffe6d0baca70123e79e52b5aaa0904b16ada75a74094  spec/services/payroll/consultant_revision_spec.rb
984149856546d4095b51aad9645dd774d804a4107705b5ed261ef332883be3a8  spec/services/payroll/mercury_split_spec.rb
ec9b5610d4fdd636dbc11d22690ae9ed31583f7e485e4d3d15b6afc520a0bc44  spec/acceptance/payroll_issue_2458_pending_spec.rb
923f48d9226b9768fcd6984c3b2f815dae9cb31a6d440342c653e3ce1332af00  docs/superpowers/specs/2026-10-19-consultant-payroll-requirements.md
```
