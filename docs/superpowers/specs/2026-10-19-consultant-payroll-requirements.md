# Consultant payroll and payments — recalibrated requirements

Primary source: [Sonam Goyal's Miru issue #2458](https://github.com/saeloun/miru-web/issues/2458), read on 19 October 2026, including its appended section 4. User direction: continue the payroll work and recalibrate requirements around this issue.

## Product priority

The first complete payroll workflow is **Saeloun consultant payment preparation → review → approval → bank submission/handoff → credit reconciliation → consultant invoice**. This supersedes the earlier employer-employee-payroll-first delivery order. Private salary slips and tax declarations remain usable foundations; they do not satisfy consultant payroll, determine consultant tax eligibility or authorize a transfer. Broad employee tax preparation, native PF/ESI/TDS engines and company GST remain separate later workstreams.

Razorpay merchant connect/create for customer collections remains requested independently. Mercury consultant payouts, India account handoff and Razorpay merchant onboarding have distinct credentials, account ownership, funds flows and acceptance checks. Funding-bank selection never determines the consultant's contracting entity or statutory treatment.

## 1. Consultant identity, consent and beneficiaries

- Store legal name, billing address and relevant tax facts for the consultant, scoped to the contracting workspace/engagement. Capture authorization to issue invoices on their behalf, including its date/version and withdrawal.
- Collect account holder, bank, country, currency, account number twice, Indian IFSC where applicable, and SWIFT/additional beneficiary fields required by the selected Mercury method. A nonempty SWIFT field alone is not verified beneficiary setup.
- Encrypt sensitive bank/tax identifiers, show masked values, restrict full-value access to the payroll/payment workflow, and exclude them from logs/audits/error reports. Preserve bank-detail versions used by approved or submitted payments.
- Bank changes notify accounts, require verification and invalidate unsubmitted approvals tied to the older details. Never rewrite the destination of an in-flight/submitted transfer.
- Missing data notifies the consultant and marks only that consultant/transfer **Not ready for payment**. Other eligible consultants can progress.

## 2. Effective-dated commercial and payroll configuration

- Admins configure monthly consultancy fees in INR with effective dates and immutable history/corrections. The issue's word “salary” is a consultant fee here; configuring it does not classify the person as an employee.
- Admins configure actual company funding accounts, not just source labels. Record contracting legal entity separately from the company funding account and payment source. Choose US Mercury or India funding explicitly; do not route funds through a shared platform account by default.
- Configure the person's weekday schedule, daily hours, applicable holidays, active service dates, PTO entitlement/accrual/leave year and significant overdraw/exception thresholds.
- In the completed workflow, accounts prepares payroll; authorized admins approve it and initiate payment. Define assigned preparation, payroll approval, bank-detail verification and payment initiation permissions. Existing generic bookkeeper/manager access must not silently grant access to coworkers' remuneration or bank details. Owner/admin-only preparation is the initial restricted implementation until delegated permissions exist.
- Version inputs affecting pay or destination. Changes to fees, attendance, leave, claims, beneficiaries, split allocations, rates or fees require recalculation and renewed approval before submission. Historical approved/submitted snapshots remain immutable.

## 3. Monthly report before payment

Selecting the period and **Make Payment** first opens a review report; it never transfers money directly. A bounded preview may be labeled **Review payroll** until approval/payment functionality exists.

For every consultant show expected hours, recorded work, fractional worked days (`recorded hours / 8`), approved paid/unpaid/advance leave, opening/closing PTO, unresolved hours, monthly fee, proposed deductions, approved adjustments, reimbursement items/total, withholding separately, INR entitlement, funding source, beneficiary and readiness. For US transfers also show reference/buffered INR-per-USD rate, each USD principal, provider fees and total company debit.

Normalize Miru's stored minutes to decimal hours at the boundary. Keep recorded work and its approval classification separate: include nonbillable work, show pending/rejected/not-required classifications, and never equate billability with payroll eligibility. Only a verified/configured approval policy may declare recorded hours approved for payroll.

Current code gaps: `TimeoffEntry` has no approved/paid/unpaid decision; company settings provide weekly totals rather than an explicit weekday schedule; existing balances are not an approved payroll PTO ledger. Until these contracts exist, show legacy recorded time off as requiring review, and mark actual approved PTO/balances unavailable. Do not populate those fields with guessed zeroes or relabel recorded leave as approved paid leave.

## 4. Hours, proration and PTO decisions

Calculate expected hours from the configured schedule, distinct applicable holiday dates and active service dates. Do not subtract the same holiday via both calendar and time-off entry. Retain fractional work days.

For the configured hours-based policy:

`fee payable = monthly fee × (expected hours − approved unpaid hours) / expected hours`

Only explicit approved unpaid time can reduce the fee. Missing timesheets, historical negative PTO, deferred cases and unclassified time off cannot become deductions automatically. A partial-service month, midmonth fee change, missing service dates or zero expected hours requires a reviewed treatment rather than division by zero or an invented full-month proration.

| 160 expected hours | Required behavior |
| --- | --- |
| 150 work + 10 approved paid PTO, opening PTO 40 | Full fee; closing PTO 30 |
| 100 work + 60 approved unpaid | 62.5% fee |
| 100 work + 60 approved advance PTO | Full fee; maintain the approved negative balance |
| 100 work + 60 unexplained | Flag correction/review; no automatic fee reduction |
| Full current work; historical PTO −40 | Full current fee; historical case reviewed separately |

Notify the admin when an exception meets the configured threshold. Offer **deduct this month**, **allow advance PTO**, **defer review**, **waive with reason**, or **request correction**. Advance PTO pays normally and is recovered through future accrual. Maintain an auditable case/recovery ledger: the same absence cannot be recovered twice. Leave-year-end and consultant-exit reports must include deferred and unresolved cases. Deferral never silently converts into a later deduction.

## 5. Reimbursements and monetary reconciliation

Reuse Expenses as the source of claims/receipts. Include only explicitly selected approved, unpaid claims incurred and approved by the payroll cutoff. Retain original currency, date, description, amount and receipts. Unknown approval dates require review; `updated_at` is not an approval timestamp. Foreign-currency claims require a reviewed conversion, never Miru's reporting-rate fallback.

Show consultancy fees, fee adjustments, reimbursements, other approved deductions and withholding separately. Prorate only the fee under its policy, never reimbursements. Do not deduct PTO twice by including the same reduction in both the prorated fee and other deductions. Tax withholding is a distinct liability and is deducted once from the actual transfer, when applicable; it is not inferred from employee tax declarations or the funding bank.

At payroll approval, reserve selected claims atomically against the run and direct expense settlement. Exclude pending/rejected/paid/reserved claims, and carry later approvals into another run/payment. Preview selection alone does not reserve or pay a claim. Freeze approved source amounts and record later changes as adjustments/reapproval.

## 6. Mercury USD transfers

- Indian beneficiaries receive USD; their bank performs INR conversion. Verify that each beneficiary/payment method supports this before submission.
- For INR entitlement `P` and reference INR-per-USD rate `R`, use `buffered rate = R − 1.50`, `USD principal = P / buffered rate`; require a positive buffered rate. The buffer is company policy, not a guarantee of the receiving bank's rate.
- Store source, observation time, validity and approval-time quote. Refresh stale rates and reapprove changed calculations before submission. Use decimal money and supported currency precision, retaining rounding reconciliation.
- OUR charges are company-paid and separate from consultant income. Issue #2458 supplies US$15 as the current business default; store it as configurable and verify actual provider method/fee support before execution. Show principal, fee and combined debit for approval.
- Keep provider submission, any Mercury approval, processing, sent and credited states separate. Provider receipts are not automatic proof of INR credit or bank-issued FIRC.
- Capture actual INR credited and shortfalls. Shortfalls require an accounts resolution/adjustment; do not silently change the consultant's entitlement or mark an unresolved settlement fully paid.

The [verified public Mercury contract](../../research/2026-10-19-mercury-consultant-payroll-contract.md) requires `request-send-money` approval requests for international wires, with beneficiaries onboarded through Mercury invitations/dashboard. Approval requests require polling; transaction webhooks follow separately. OUR currently costs $15 where applicable and does not cover receiving-bank acceptance fees. Provider `sent` status does not prove INR credit. No particular funding account's entitlement, sandbox execution or actual fee quote has been verified. Existing Mercury CLI access/history is not production payout acceptance evidence.

## 7. India handoff

After payroll approval, send the approved report to the configured accounts recipient (issue default `accounts@saeloun.com`), containing consultant/month, hours, worked days at hours/8, approved paid leave separately, monthly fee/adjustments/payable, itemized reimbursements/total, total INR payable and verified account-holder/bank/account-number/IFSC details required by the issue. Restrict the recipient and template; bank details must not enter delivery logs or generic analytics.

Successful handoff becomes **Sent to Accounts—Awaiting Payment**, not paid/credited. Accounts records transfer date, transaction reference and credit confirmation. A mail failure remains retryable and must not create duplicate transfers or send conflicting stale approved data. Development verification uses previews/test delivery, not real emails.

## 8. Consultant/spouse allocation

Mercury consultants may request a spouse beneficiary, with full legal/bank/SWIFT details, accounts verification and admin approval for setup/changes. Preserve consultant identity/tax ownership.

Apply approved percentage/fixed-INR allocations after fee/PTO adjustments. State the allocation base and remainder recipient; allocations must reconcile exactly. Reimbursements stay with the consultant by default unless explicitly reallocated. Withholding and its allocation are separately reviewed, never duplicated across beneficiaries.

Calculate and round each USD principal; charge OUR per transfer and show combined cost. Track independent transfer IDs/status/idempotency. If one leg succeeds, retry only the failed leg after resolving uncertain outcomes. Overall credited/settled status requires every required credit and shortfall resolution.

## 9. Invoices and remittance documents

After full confirmed credit, generate one authorized consultant invoice for the settlement, make its PDF available to the consultant and send it to accounts. Include unique numbering/date/service period, both legal parties and tax facts, separate fee/reimbursement lines, adjustments/withholding/net, payment dates/currencies/references, INR entitlement and USD settlement detail, and paid status. OUR fees are not consultant income. One invoice links all split transfers.

Honor applicable invoice timing/tax requirements: where an invoice already exists or was legally required earlier, link/reconcile it and mark it paid instead of generating a duplicate. A submitted/processing/sent transfer cannot trigger a paid invoice. Invoice authorization, tax validation and duplicate protection are required before automation.

Consultants or accounts can attach bank-issued FIRC/FIRA/inward-remittance advice to the relevant payment/invoice where available. Track credit confirmation and remittance-document receipt independently, and flag missing documents without calling a Mercury receipt a FIRC.

## 10. State and audit contract

Prepare a reviewed payroll snapshot, then authorize payment/handoff against that exact snapshot and beneficiary/quote versions. Keep per-person/per-transfer states: not ready; awaiting payroll approval; ready for submission; sent to accounts; awaiting Mercury approval; processing; sent awaiting credit; partially credited; credited; failed/cancelled/returned. Do not force every provider through every state.

Repeated clicks, retries, timeouts and webhooks must not duplicate a run, reserved claim, transfer, invoice or email. Resolve ambiguous bank outcomes before resubmission. Audit actors, input versions, PTO decisions, approvals, quotes/fees, reimbursement allocations, payment references and invoice linkage, excluding confidential document/bank contents.

## Delivery order and acceptance

1. **Consultant terms and monthly review preview:** effective-dated fee/entity/funding/schedule, period/cutoff report, explicit unpaid-time scenarios, candidate expense selection and visible data gaps. No payment readiness, reservation or payroll approval claimed.
2. **Profiles, verified beneficiaries and PTO decisions:** encrypted bank versions, invoice consent, actual leave approval/classification, opening/accrual balances, exception decisions and recovery ledger.
3. **Locked payroll runs:** explicit preparation/approval permissions, source snapshots, adjustment/withholding lines, atomic claim reservation and invalidation/reapproval.
4. **India handoff and Mercury submission:** provider-verified accounts/methods, rate/fee quote approval, split allocations, durable idempotency and reconciliation. Actual external operations require the applicable session authorization and account capability.
5. **Credit, invoices and remittance:** partial/failure/return reconciliation, actual-credit/shortfall resolution, invoice link/generation, test mailers and bank-issued document follow-up.

Acceptance must cover the five 160-hour examples, nonbillable work, holidays counted once, partial months/term changes, no automatic negative-PTO recovery, cutoff/foreign/paid/reserved expense cases, tenant/role isolation, bank-change invalidation, stale quotes, split partial failure, duplicate/retry/uncertain outcomes, and paid-invoice creation only after full confirmed credit. Real provider sandbox/controlled acceptance is required before claiming payment automation works. The whole issue remains open until all applicable acceptance is satisfied.

## Acceptance ledger

Every issue section is retained below. **Preview** means covered only by delivery 1; **Pending** means a required follow-on acceptance, not an implemented feature. Preserve this ledger as later deliveries replace pending entries with test/browser/provider evidence.

Executable coverage: `spec/requests/api/v1/consultant_payroll_spec.rb` tests implemented preview behavior; the merged `spec/services/payroll*`, `spec/services/payroll_calculation`, `spec/services/payroll_sources`, `spec/services/payroll_providers`, `spec/policies/payroll_run_policy_spec.rb` and `spec/requests/api/v1/payroll_runs_spec.rb` cover the existing dry-run calculation/source/revision/preflight foundations. They do not establish completed payment workflows. `spec/acceptance/payroll_issue_2458_pending_spec.rb` enumerates the remaining end-to-end contracts for all 12 issue sections as explicitly pending RSpec examples; replace each with executable assertions as its workflow is implemented, rather than deleting it or treating pending as passed.

Rollout integration: the consultant terms/review feature uses the same trusted, company-ID-bound `Payroll::Entitlement` gate as the merged payroll foundation. API/policy, direct service/model writes and UI navigation/routes enforce it. Payroll is disabled by default; this work does not enable any production company. Existing source/revision/approval foundations reduce later delivery work, but the consultant preview is not yet connected to locked runs, claims reservations or transfers.

| Issue | Required cases and improvements | Delivery 1 status |
| --- | --- | --- |
| 1 | Consultant legal/tax facts, invoice consent/version/withdrawal; account number confirmed twice; country/currency/IFSC/SWIFT and provider-specific fields | Pending |
| 1 | Missing-data notification blocks only affected person/leg; encrypted/masked details, restricted access; verified bank changes notify accounts and invalidate unsubmitted approvals | Pending |
| 2 | Append fee corrections/history, source separate from contracting entity, weekday/daily-hour schedule; reject malformed money/dates/duplicate weekdays | Preview |
| 2 | Actual funding accounts, PTO policy/year/accrual/thresholds; explicit accounts preparation and admin approval/initiation permissions | Pending; preview restricted to owner/admin |
| 3 | Monthly report before any payment action; expected/recorded/approved/pending hours, days = hours/8, fee and separate selected reimbursements | Preview; leave balances/withholding explicitly unavailable |
| 3–4 | Approved nonbillable work, holiday/optional-holiday overlap counted once, service dates, fractional work; unresolved work visible without automatic deductions | Preview; approval/PTO policy pending |
| 4 example 1 | 160 expected, 150 worked, 10 approved paid PTO, opening 40: full fee, closing 30 | Pending PTO ledger; preview preserves full fee without inventing approval/balance |
| 4 example 2 | 160 expected, 100 worked, 60 approved unpaid: 62.5% fee; reimbursements unchanged | Preview scenario with explicit unpaid hours/reason; persisted approval pending |
| 4 example 3 | 160 expected, 100 worked, 60 approved advance PTO: full fee, negative balance recovered by future accrual | Pending PTO ledger |
| 4 example 4 | 100 worked, 60 unexplained: correction/review, never automatic deduction | Preview |
| 4 example 5 | Full work with historical PTO −40: full current fee; separate historical decision | Preview never reads legacy balance as a deduction; recovery workflow pending |
| 4 | Missing service dates, midmonth join/exit, midmonth fee changes, zero scheduled hours | Preview withholds estimate until policy/resolution; no divide-by-zero or guessed proration |
| 5 | Threshold/admin notifications; deduct/advance/defer/waive-with-reason/correction decisions; exit/year-end review; no repeated recovery or automatic future deduction | Pending |
| 6 | Own-company/person approved unpaid claims; incurred/approved cutoff in company timezone; original amount/date/currency/receipt detail; unknown historical approval and foreign currency require review | Preview; no guessed historical timestamp or FX |
| 6 | Explicit selection, duplicate/stale/paid/foreign IDs rejected; changed claim amounts/currency/date/claimant invalidate approval time | Preview |
| 6 | Atomic run reservation versus concurrent payroll/direct settlement; late approvals next run; immutable approved amounts | Pending; preview never reserves or settles claims |
| 7 | Timestamped rate source R; buffered R−1.50 positive; decimal P/(R−1.50); configurable separate OUR fee/combined debit; stale quotes reapproved | Pending; public provider contract researched |
| 7 | International recipient onboarding, account capability/scopes, provider approval polling, transaction correlation; actual INR credit/shortfall resolution | Pending sandbox/account acceptance |
| 8 | Approved India handoff to configured accounts recipient with all hours/leave/fee/reimbursement/bank fields; retry-safe mail; sent awaiting payment, reference/date/credit capture | Pending |
| 9 | Verified/admin-approved spouse; fixed/percentage splits and explicit remainder; adjusted fee base, consultant reimbursements by default, withholding once | Pending |
| 9 | INR rounding reconciles exactly; no zero/negative wire leg; independent USD principal/OUR cost/state/idempotency; retry failed leg only; all required credits before full settlement | Pending |
| 10 | One authorized consultant invoice/PDF linked to all legs; legal/tax/service/payment/currency detail, separate reimbursements/withholding; company OUR excluded from income | Pending |
| 10 | Confirmed full credit triggers paid invoice; reconcile pre-existing/earlier required invoice; concurrent jobs/email retries cannot duplicate invoice | Pending |
| 11 | Consultant/accounts bank-issued FIRC/FIRA/advice upload and follow-up, linked payment/invoice; document state independent of credit | Pending |
| 12 | Exact-version approval, input-change invalidation, actor audit; independent transfer state transitions, partial/failure/cancel/return history | Pending; term versions already retained |
| 12 | Duplicate clicks, uncertain timeouts, repeated/out-of-order events; reconcile before retry; failed/returned funds tracked without silent resend | Pending |
| Cross-cutting | Tenant/role isolation, stale workspace guard, private no-store responses, CSRF, redacted request payloads; retained source/history and no confidential audit contents | Preview for new terms/review endpoints; repeat for every later endpoint |

Additional completion rules: define service-date timezone and overlap handling before PTO approvals; release reservations only when cancellation/failure proves no outstanding payment; retain reservations while outcomes are uncertain. Reconcile rounding and withholding once across allocations. A late return must reopen reconciliation with its original invoice/payment history. Never auto-approve unexplained work or infer receiving-bank/legal acceptance of spouse allocations from a successful API request.
