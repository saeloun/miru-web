# Reviewed consultant service-period fees

Sonam #2458 requires joining, exit and midmonth term changes to have a reviewed treatment. The user has authorized manual consultant salary edits and delegated implementation choices. Today those cases stop at `fee_unavailable`; a normal adjustment cannot resolve them.

## Approach

Use one append-only `ConsultantServiceFeeReview` per employment/month revision chain. Accounts or an active owner/admin records an explicit INR service-period base fee and reason before resolving PTO. The normal payroll revision and two approvals still authorize payment. No automatic calendar-day or workday proration is chosen.

A revision-only field is insufficient: PTO decisions freeze a recovery rate before a valid revision exists. Changing contractual compensation would also change future terms and scheduling. Existing PTO entry kinds represent leave/debt rather than fee agreements. The new record supplies the shared basis without changing those meanings.

## Money and source contract

- The recorded amount is the agreed base for the actual service period **before** approved unpaid time. Apply the existing exact-minute unpaid ratio once. Reimbursements, adjustments, withholding and historical recovery remain separate.
- Resolve effective compensation for each active service date and exclude configured holidays once. Joining/exit bounds are explicit. Missing dates, uncovered terms, invalid holidays or zero scheduled minutes remain blocked.
- All applicable terms must agree on funding source and legal entity. A midmonth routing change requires a separate payment arrangement; a fee review cannot choose a route implicitly.
- Canonical versioned context binds employment/month, service dates, applicable term IDs and relevant immutable attributes, holidays, timezone, scheduled minutes and routing. Exclude PTO and `MonthlyFacts.digest` to avoid recursion. Normal revision source validation remains intact.
- A saved review applies only to its exact current context. Bind its ID and amount into PTO attendance facts; changing only the amount still invalidates the old monthly PTO decision and payroll approvals. New monetary origins freeze the reviewed amount/minutes. Never rewrite historical debt.
- Untouched full-month/no-change calculations and legacy accepted payment reconciliation retain existing behavior.

## Persistence and authorization

Store tenant/employment/month, integer minor-unit amount, bounded reason, canonical context/digest, actor, idempotency key and optional predecessor. No backfill. Enforce tenant FKs, one root per employment/month, one successor per predecessor and employment/idempotency uniqueness. Validate current predecessor and protected payment activity under the existing run-then-employment lock order. SQL rejects update/delete and invalid inserts; rollback refuses to drop adopted records.

Authorize before replay; an identical replay returns its original record without promoting an obsolete review. Conflicting commands, stale context and stale predecessor refuse without writes. Protect in-flight or accepted downstream payment activity as existing PTO mutations do.

## UI and API

Show service dates, configured monthly terms, scheduled minutes, routing and why review is required. Authorized users enter “Service-period base fee (INR)” and a reason, then save against the displayed context digest/current review ID. Explain that approved unpaid time is deducted afterward and payroll still needs both approvals. Preserve rejected drafts and display source conflicts clearly. Show the saved basis/reason in payroll review and reports.

Keep this addition in a separate worktree/PR. Public #2498 and private #19 remain frozen while their release checks finish. Real provider transfers, statutory tax filing and production migration are separate gates.

## Verification

Prove joining, exit, changed fee/schedule, exact unpaid money, missing coverage, mixed routing, stale source/amount/predecessor, tenant/actor denial, replay and concurrent append/payment races. Verify SQL immutability and tenant constraints. Exercise both funding paths through the existing two approvals, PTO origin valuation/invalidation and unchanged historical debt. Verify owner UI in Brave, zero console errors, required builds and screenshots. Baseline: 74 focused request/revision examples pass on an isolated synthetic database.
