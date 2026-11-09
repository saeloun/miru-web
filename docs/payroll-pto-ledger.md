# Consultant PTO ledger

This delivery implements the PTO clauses in [issue #2458, sections 2–5 and 8](https://github.com/saeloun/miru-web/issues/2458). It does not complete consultant invoice authorization/generation, bank-issued FIRC/FIRA evidence, or live provider acceptance. Synthetic tests establish local behavior, not paid production payroll.

## Adoption

Keep the existing company-bound payroll entitlement gate. An active owner/admin must configure every consultant's policy explicitly in **Consultant payroll → PTO and decisions** before preparing a new consultant revision. No monthly entitlement, opening balance, leave year, threshold, borrowing limit or recovery rate is inferred from hiring copy or old time-off records.

Choose the first unsubmitted payroll month as the initial effective date. Its reconciled opening is as of that month's first day, with an evidence reference and reason; the initial effective date must equal this opening date. Reconcile balances and any earlier cash recovery outside this ledger before entering the opening. A negative opening is an identified historical obligation, not an automatic deduction. Later policy versions retain the original opening and append approved effective changes; they cannot reset money history. Existing accepted bank records keep their exact frozen report and reconciliation path. A known-unsent handoff may use the existing verified void/review flow before preparing a fresh revision. Never rewrite an accepted report to adopt this policy.

Configured hours keep two-decimal validation; attendance-derived ledger minutes and accrual allocations preserve their full finite decimal precision. Display hours are rounded only for presentation. The configured monthly credit day and service dates determine whether a credit is earned, using the company's local date. The reconciled opening already includes credits through its date. A credit due that same day is not posted twice; a later credit day in the opening month remains due. No credit is required or posted after exit before that day, or before the credit becomes due. Scheduled processing uses the active company owner/admin membership, independent of their selected browser workspace, and resolves the current policy under the employment lock. Posted accrual prevents retroactive policy replacement; choose a later effective period. Earned credits append once even after early payment; the accepted payment's frozen entitlement/report remain unchanged.

The owner/admin classifies the entire missing scheduled quantity as paid, unpaid, advance, deferred, waived or correction requested. An explicit split must sum exactly to the gap. Ordinary split hours retain two decimals; optionally choose one treatment for the remaining source gap, resolved exactly in minutes by the server. Correction portions block approval; acknowledgment cannot replace this decision. If corrected work removes the entire gap, explicitly clear the obsolete allocation with a reason; history remains and bank/recovery protections still apply. Paid leave consumes only available balance. Advance records only newly borrowed hours; an existing negative opening is not borrowed a second time. A backdated debit cannot consume balance already used by a later approved leave decision. Reconcile that later decision first. Accounts can read assigned run facts and prepare from approved quantities but cannot edit the policy or decisions. Joining, leaving or mid-month fee changes require an explicit reviewed service-period base; they are never automatically prorated.

## Recovery and closing review

Future accrual first allocates to eligible outstanding debt once. Historical cash recovery requires an explicit owner/admin decision and the immutable approved origin-period amount/hours basis. An imported negative opening without a known rate requires an explicit reconciled rate and evidence. Already allocated or consumed origin portions cannot be recovered again or silently replaced.

For a partial service month or a fee/schedule change, record an explicit service-period base fee before deciding leave. New origins use that reviewed fee and the scheduled service minutes; approved unpaid time is deducted afterward. The review identity is part of the attendance source, so replacing the fee requires fresh leave decisions and payroll approvals. A consumed, accrued-against or settled historical origin retains its original basis.

A historical treatment that already changes the leave balance retains its original effective period when corrected. Moving that full balance event to another month would break closing-to-opening continuity and is rejected by both service and SQL guards. Same-period corrections remain possible when no payment/recovery guard applies. A zero-delta deferral can still be reviewed in a later period. Cash treatment cannot be reopened as leave debt after intervening earned accrual has already used the resulting balance.

Cash recovery remains visible as unreserved, reserved, released or credit-review pending until full confirmed credit on its exact reserved revision and financial line. Replacing a safely unsubmitted revision releases its reservation; another approval reserves it again. Partial or uncertain payment retains the original claim on those hours. An old credited revision cannot settle a newer reservation. A provably identical protected line may retain the original reservation without a second deduction.

An ambiguous post-credit hold reopens review. Only the assigned active final owner can resolve its exact review head, with a reason and reverified full credit; replay returns the same result. Carried split legs must retain an original revision leg and the same approved financial/source line on every replacement. Owner review restores the matching group's completion marker, so a later reversal reopens review again. Confirmed reversal remains a manual bank-reconciliation hold. This action neither resends money nor creates another cash deduction.

The configured leave-year boundary and consultant exit produce review worklists/notices. Unresolved prior-year cases remain visible after the boundary; there is no automatic expiry, forgiveness or negative-balance cash deduction. Closing balance as of a month uses the approved policy opening plus immutable earned credits and decisions through that month, excluding future replacements. Deferred and unresolved historical components, and outstanding cash recoveries, remain separately visible. Resolve each through an approved historical decision; a warning acknowledgment does not close it.

## Database and deployment

Apply the four `2026110820*` migrations in order using the normal migration path. They add five tenant-bound tables, append-only financial history, composite foreign keys, checks and eight SQL triggers. The existing `payroll_schema_dumper` also writes those exact database functions/triggers into `schema.rb`; `db:schema:load` must preserve the same guards. No test hook installs or repairs missing guards.

Before promotion, compare migration **version sets** against the deployment baseline, not just their counts. Take the normal verified backup and follow the existing deployment procedure. Once financial history exists, roll forward with a reviewed correction; the final breakdown migration explicitly refuses destructive rollback. An old application build is not a safe write-compatible rollback after adoption. Keep payment initiation disabled for affected cases until the new source and ledger are verified, or restore the complete approved database/application pair through the existing restore process. Do not delete financial history or fabricate guard installation to make an older build pass.

New source capture uses MonthlyFacts v2 and requires fresh policy-backed preparation. Accepted v1 Mercury instructions still reconcile/credit against their saved instruction, and sent v1 India handoffs against their frozen report; those bank-credit paths do not revalidate current MonthlyFacts or require a new PTO policy. This compatibility is source-traced; local new-ledger tests are not represented as a preexisting-v1 production trial. No old approved snapshot is rewritten or automatically reapproved.

## Executable acceptance

| Requirement | Focused evidence |
| --- | --- |
| Five exact 160-hour cases, every explicit exception action, canonical split/idempotency, source invalidation | `spec/services/payroll/pto_ledger_spec.rb`; native `spec/system/responsive/payroll_pto_spec.rb` |
| Opening 40 + gap 60 borrows only 20; opening −40 + new 10 creates only 10 new debt | `pto_ledger_spec.rb` |
| Accrual and cash cannot recover the same hours; cash survives an unpaid/released run and settles once | `pto_ledger_spec.rb`; `pto_integrity_spec.rb` |
| Revision-bound credit, identical protected carry, ambiguous return review and confirmed-reversal hold | `spec/services/payroll/pto_credit_review_spec.rb` |
| Direct SQL tenant/immutability/cap rejection and real independent-connection serialization | `spec/services/payroll/pto_integrity_spec.rb` |
| Role/workspace separation, stale facts, no-store responses and filtered private payloads | `spec/requests/api/v1/payroll_pto_spec.rb` |
| Private threshold/correction/exit/year-end notice, active recipients and deduplicated delivery | `spec/jobs/payroll_pto_review_job_spec.rb` |
| Frozen approved paid/unpaid/advance/opening/closing India report and escaped private mail | `pto_ledger_spec.rb`; `spec/mailers/payroll_india_mailer_spec.rb`; native `payroll_pto_spec.rb` |

Only the covered PTO placeholders in `spec/acceptance/payroll_issue_2458_pending_spec.rb` are replaced by these executable contracts. Remaining issue-wide placeholders continue to identify unshipped work. No real mail, money, employee data or provider account is used by this verification.
