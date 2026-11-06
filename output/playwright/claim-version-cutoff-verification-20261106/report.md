# Consultant reimbursement version and cutoff verification — 6 November 2026

## Change

Two #2458 pending contracts now have executable coverage in `consultant_revision_spec.rb`:

- Approved revision payloads and reservation amounts remain unchanged. Editing a claim requires releasing its unsubmitted reservation, fresh expense approval, then accounts and final payroll approvals. Accounts approval alone leaves the revision `accounts_approved`.
- A claim approved after November's cutoff is excluded from November and can be included/reserved in December. November's revision and approval remain unchanged; reserving the claim does not mark it paid.

This unit changes tests and the requirements mapping only. It exercises reapproval and next-run carryover; it does not exercise a separate adjustment/payment alternative. Reservation release with an outstanding/uncertain payment and complete settlement/receipt/allocation contracts remain pending.

## Native verification

| Check | Result | Scope |
| --- | --- | --- |
| Final focused payroll selection | 88 examples, 0 failures, 59 pending | Consultant revision, reservation concurrency, direct-settlement concurrency, remaining acceptance file. 29 executable examples. |
| Full backend | 5,693 examples, 0 failures, 60 pending | All non-system specs, before final message/title/accounts-only assertion refinements. The final focused selection above ran after those refinements. |
| General browser suite | 439 examples, 0 failures, 2 pending | `spec/system` excluding responsive, expenses and auth directories, application source at `8ca8b4d7b`. Two avatar canvas-cropping tests explicitly skipped. No application source changed in this unit. |
| RuboCop | 2 files, no offenses | Both changed spec files, final content. |
| Whitespace | Pass | `git diff --check`. |

Tests ran against synthetic local PostgreSQL databases. Test subprocess network access was restricted to localhost. No live provider writes, transfers, payroll emails, or production data changes occurred.

Logs (local, not uploaded): `/tmp/miru-claim-version-cutoff-focused-final-20261106.log`, `/tmp/miru-backend-claim-version-cutoff-final-20261106.log`, `/tmp/miru-general-browser-full-20261106.log`.

## Static verification is not green

The gstack typecheck (`pnpm exec tsc --noEmit`) failed: 432 diagnostics, including 337 application diagnostics. A clean `origin/develop` worktree at `10e457e1d0cd2ac782be9d1edbcbd5a1a573486a`, using the same installed dependency tree, reports 404 diagnostics, including 309 application diagnostics. `package.json`, `pnpm-lock.yaml` and `tsconfig.json` match between these sources.

After normalizing worktree paths and source positions, there are 29 candidate-only and one baseline-only diagnostic. The invoice diagnostic changes its expanded object shape; additional diagnostics include Hiring API typing, numeric selection values, dynamic imports and `replaceAll`. Existing dependency/JSX errors remain on both sources. This is not a clean typecheck and does not establish release readiness.

Candidate log: `~/.gstack/projects/saeloun-miru-web/verify/d282e76bd439/logs/typecheck.log`. Baseline log: `/tmp/miru-typecheck-develop-20261106.log`. Formal `gstack-checks status` is `NOT_READY`; it has no complete successful run for the current tree. No compiler settings were weakened and no generic build was run over the app's public output directory.

## Release and deployment boundaries

No new commit has been pushed or deployed as part of this report. The combined branch still lacks exact-head council review records, and its review-scope selector is unanswered. Independent source review below is not that council.

Read-only connector checks on 6 November confirm that Render's Miru production web and worker are suspended, with auto-deploy disabled. Hatchbox app 14520 is still `miru-hatchbox-staging`, domain `staging.miru.so`, private branch `release/profitability-planning-20261026`, last deployed SHA `fcdeec33d49fea3fcdc9043e34427bbb9074ab72` on 2 November. Configured active web/worker processes do not prove runtime health or a production cutover.

Automated HTTP probes of `app.miru.so/up`, `staging.miru.so/health` and `monitoring.miru.so/home` returned 403. These responses do not establish an origin outage or authenticated user-flow success. No production sign-in, live provider acceptance, SigNoz dashboard health, hourly R2 restore, server compliance or completed production migration is claimed.

## Independent source review

### CLAUDE CODE SAYS (review)

The following is the complete tools-disabled source-only review result. It did not execute tests.

# Review: #2458 reimbursement contract tests

**Verdict:** I found no actual defects or fixture/time leaks. There are two weak assertions worth tightening and two test titles that claim more than the tests check. I reviewed the supplied source only; I did not run the tests, so the reported pass counts are yours, not mine.

## Test 1: freezes approved amounts and requires reapproval

**Sound:**
- `original.update!` raising `ReadOnlyRecord` follows from `PayrollRevision#readonly?` returning `persisted?`.
- Editing the reserved claim is blocked by `/reserved/`, and the amount stays at 5,000.
- `build` with no expenses calls `MercuryRevisionGuard#release_reservations`. No groups are in flight, so the reservation is released.
- Reapproval timing works. The outer `around` hook wraps the `before` hooks, so `claim.approve!` sets `approved_at` to Dec 5 12:00 UTC. That is before the end of Dec 5 in IST (18:30 UTC), so the claim is eligible again.
- `PayrollExpenseReservation.active...sole` with `revised.id` and `600_000` proves that a new reservation was created. The released one is excluded by the `active` scope.

**Tighten:**
1. **Possible false positive.** `approve!(stage: "final", expected_digest: revised.digest)` only checks for a bare `ActiveRecord::RecordInvalid`. That error could come from approval issues (for example `claim_changed`) instead of "accounts stage missing". Match the message, as the "two runs" test does with `/unresolved review issues/`.
2. **Partial check of "requires both approvals".** Nothing checks that `workflow.status` is still not `approved` after only the accounts approval. Add that check between the two `approve!` calls.
3. **Weak assertions.** `original.reload.payroll_payload == snapshot` and `reservation.reload.amount_minor == 500_000` pass trivially: the revision is readonly, and nothing writes `amount_minor` on release. They are harmless, but they are not real evidence. The `sole` check is what actually proves "unchanged".
4. **Title overclaims.** The title says "or an adjustment", but only the reapproval path is exercised. Either rename the test or say so explicitly in the requirements doc.
5. The `expect(claim).to be_submitted` check depends on Expense model behavior I wasn't shown. It is plausible, but I can't verify it.

## Test 2: claim approved after the Nov 30 cutoff

**Sound:**
- The outer `let!(:claim)` runs before the inner `before`, so `approved_at` is Dec 5 11:59 UTC. That is after the end of Nov 30 in IST, so the claim is correctly excluded as `approved_after_cutoff`.
- The blockless `travel_to(Jan 5)` inside the outer block does not leak. On Rails 7.1+ and 8, the outer block's `ensure` calls `travel_back` because no stubs existed before it, and teardown also resets time.
- `ConsultantReview.period` accepts a Nov run with a Nov 30 cutoff and a Dec run with a Jan 5 cutoff when today is Jan 5.
- Checking `workflow.status == "approved"` for the Nov run after the Dec approval is the meaningful "Nov unchanged" check. The empty-reimbursements check on `previous` is trivial for the same readonly reason as in test 1.

**Tighten:**
1. The two `raise_error(Payroll::ConsultantReview::InvalidInput)` checks (here and in test 1) have no message match. The risk is low because the matching `build` without expenses succeeds just before or after, but matching `/no longer eligible/` would rule out the wrong-reason case.
2. **Title overclaims.** The title says "or an explicitly separate payment", but that branch is untested. Testing one branch of a disjunctive contract is acceptable, but the name suggests both are covered.
3. Optional: assert that `run.current_revision == previous` after the Dec approval, to make "without changing Nov" explicit rather than inferred from status.

## Scope

- No application code changed, which is consistent with what you described.
- Leaving release, settlement, receipt and allocation pending is honest. Neither test claims provider acceptance.

### Host assessment

Accepted: narrow both test titles to the paths exercised; match ineligibility and missing-accounts errors; explicitly check accounts-only state and November's current revision. All refinements pass in the final focused run.

Retained: explicit historical payload/reservation assertions alongside the direct readonly-write rejection. They bind the stated immutable-history contract through the workflow. The review's exact original approval timestamp is not relied on; Expense callbacks control it.

No new durable workflow learning was identified in this unit.

## Source fingerprints

SHA-256 of final test/document inputs:

```text
bb1d7cec6882501a1c08ebb13e0881edd80570852ab6bf4b4550cca14b9dfa63  spec/services/payroll/consultant_revision_spec.rb
624aca53ec14047e10dd557fa2ca1ec06dc653de8b99b08240addbea2d46f15a  spec/acceptance/payroll_issue_2458_pending_spec.rb
70f81a0abb3864ff811a3cd567e00234da0e36ff05a425e5376fc4a4955d33ef  docs/superpowers/specs/2026-10-19-consultant-payroll-requirements.md
```

