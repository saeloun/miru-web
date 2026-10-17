# Payroll delivery and dry-run acceptance

Updated: 2026-10-17. Target: the November 2026 payroll dry run. March 2027 is a provisional wider product milestone, not a confirmed statutory deadline or a committed feature-completion date.

## Current inventory and ownership

The inspected develop baseline is `16be9654f34b3baf327b4ee8e8de94720e7167f5`.

| Area | Existing state | Delivery boundary |
| --- | --- | --- |
| Salary slips | Separate proposed design on `feature/payroll-razorpay-design`, commit `afbafaebaeb89d5ddcd310c7faaa19a6088c03ea`; no product implementation in that branch | Preserve the import-and-publish design and its worktree. This branch does not implement another document archive. |
| Reimbursements | Expenses already support receipts, submission, approval/rejection, resubmission and recorded paid status, with company and submitter permissions | Reuse reviewed expense records. Recording paid status is not evidence of a bank transfer or a payroll payment. |
| Employment | Company-scoped membership, employment dates and descriptive employment type exist | Employee/consultant payroll classification and effective pay rules need explicit reviewed mapping. |
| Worked time and PTO | Project timesheets and company-scoped leave/holiday entries exist | Capture source facts. Billability is not attendance; a leave entry alone does not establish paid leave. |
| Payroll calculation and review | No matching implementation or open payroll PR was found during the inventory | This branch owns review snapshots and read-only facts/provider adapters. A calculation engine must use separately verified policies. |
| Invoice taxes and payment providers | Existing invoice-tax and invoice-payment integrations | Do not treat invoice taxes as salary deductions, invoice payouts as payroll, or merchant login metadata as payroll API entitlement. |

The independent monthly-workbook analysis supplies anonymized rules and exceptions. Do not copy the private workbook, screenshots, names, salaries, bank details or tax identifiers into the repository, fixtures, logs or review artifacts. Its 41 visible monthly tabs end in September 2026; no October or November run exists. The analysis reports stale period labels, differing proration directions, inconsistent rounding, hardcoded conversion divisors, a deduction subtotal that disagrees with its components, and a gross total covering fewer recipients than its detail rows. These require decisions; historical formulas are not statutory authority.

The salary-slip design commit identifies the branch and Git author, not a verified live agent identity. Do not edit that worktree or start a competing archive implementation without coordinating ownership.

## November dry run

1. **Confirm inputs and authority.** Accounts verifies employee/consultant classifications, effective dates, source month, legal company, settlement currency, work schedule and paid/unpaid leave policy. Verify accounts reviewers and the named final reviewer using existing active memberships before enabling access or notifications. Do not infer identity from an email address or an owner role alone.
2. **Version rules explicitly.** Record pay policy, proration basis and direction, rounding stage/mode, holiday/PTO treatment, effective period and any FX source/rate date. Keep source currency and settlement currency distinct. Missing or contradictory rules remain blocking exceptions. Never silently substitute a conversion divisor, zero salary or a tax rate.
3. **Capture and calculate.** Capture source record identifiers, versions, worked-time and PTO facts for the exact employment/company/month. Accounts can correct source data and add explained extras, reimbursements and deductions. Recalculate into a new immutable revision. Compare outputs against an independently reviewed synthetic case set before applying rules to private records.
4. **Accounts review, then final review.** Approval binds to the exact revision. A material input, source, policy, FX, recipient or amount change creates a new revision and invalidates downstream approval. Retain prior revisions and decisions. Reject stale edits, changed-payload idempotency retries and concurrent lost updates.
5. **Local payment preflight.** Bind every proposed item to the approved revision, existing legal company, exact provider account and currency. Read available balance with an observation timestamp; account for fees/reserve explicitly. Missing/stale balance, unresolved exceptions, unverified recipient/account capability, or incomplete reconciliation blocks readiness. Preflight must not create a provider-side transfer or approval request.
6. **Reconcile the dry run.** Compare every line and company/currency total against the approved snapshot, account for all exceptions and duplicate identifiers, and review provider response contracts using synthetic mocks or an already authorized sandbox. A successful mock is not proof of live entitlement, available funds, successful transfer or employee receipt.

Any real payment, including a test payment or international transfer, requires the user's final action with exact source account, recipient, currency, amount, fees and approved revision. Do not execute transfers, create recipients, create persistent credentials, enroll accounts, expand grants, or change bank users/directors as part of the dry run.

Keep pay basis (annual, monthly or hourly), engagement classification (employee or consultant), legal company and payout currency as separate fields. Preserve itemized arrears, bonus, profit share, reimbursements, GST, tax withholding, professional tax and advance recovery with origin period, currency and reason. A professional's historical formula omitting an advance deduction does not establish the intended new policy. Preserve calculated amounts, manual overrides and deltas separately; a prior settlement reference requires reconciliation before any repeated settlement can be proposed. No source formula establishes paid-leave, holiday, joining or leaving treatment.

For each proposed profile, synthetic checks must include a zero divisor, zero payable quantity, fractional and above-basis quantities, annual-to-monthly rounding followed by proration rounding, missing net, direct-net overrides, mixed-currency adjustments, explicit FX direction and date, already-settled adjustments, duplicate identities and incomplete subtotal populations. Reproduce observed arithmetic separately from proposing corrected policy; do not preserve a known subtotal defect to claim parity.

## Provider contracts and access status

Verified official documentation on 2026-10-17:

- [RazorpayX balances](https://razorpay.com/docs/api/x/account-validation/balance-fetch/): `GET /v1/banking_balances`; use the configured account's `available_amount` in paise and `refreshed_at`, not the combined balance of unrelated accounts. Existing payment-gateway keys do not establish RazorpayX capability or legal-account binding.
- [Razorpay payouts](https://razorpay.com/docs/api/x/payouts/): payout requests require idempotency and IP allowlisting. The dry-run adapters do not implement a payout request.
- [Mercury accounts](https://docs.mercury.com/reference/getaccounts): paginated `GET /api/v1/accounts`; match the configured account and legal business, require active status, and use available balance with exact minor-unit conversion.
- [Mercury sandbox](https://docs.mercury.com/docs/using-mercury-sandbox): separate sandbox endpoint and sandbox credentials. No sandbox was created and no token was provisioned during this work.
- [Mercury token policies](https://docs.mercury.com/docs/api-token-security-policies): scope and permission restrictions are material integration prerequisites. Do not broaden a token to make a test pass.

Metadata-only credential discovery found existing provider login entries. It did not establish an API token, the intended bank account, a company-bound balance-read capability, or transfer entitlement. No credential values were opened and no authenticated bank/provider request was made. Actual configured access remains unverified; the implementation must fail closed until an authorized configuration is confirmed. US payroll uses the existing Mercury preference; Plaid is outside scope. India payroll uses the existing India Razorpay account preference, subject to capability and legal-entity verification.

## Stages after the dry run

| Stage | Intended outcome | Required gate |
| --- | --- | --- |
| November 2026 | Reviewed monthly employee/consultant dry run, correction and approval history, local payment preflight | Workbook policy mapping, verified reviewers, synthetic parity cases, reviewed account bindings and provider capabilities |
| Following releases | Publish approved salary slips and corrections; connect authoritative structured payroll output to the archive | Coordinate the existing archive design, private download authorization, revision/audit and browser acceptance |
| Before annual preparation | Reconciled year-to-date earnings, deductions and certificate-preparation workpapers | Versioned official tax sources, applicable tax period, accountant review; preparation output must not claim to be an issued certificate |
| Provisional March 2027 milestone | Broader payroll/document workflow and carefully bounded employee self-service | Reassess readiness and scope; chatbot answers need authorization, sources and escalation for payroll/tax uncertainty |
| Later | Consultant tax preparation and GST guidance for US receipts | Official effective-dated rules and accountant review; no automatic filing or assumed export eligibility |

The Income Tax Department's [Form 130 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs) identifies Form 130 as the certificate formerly called Form 16 under the 2026 rules. Support historical terminology by applicable period; do not hardcode a single form or reuse prior-year rules without review. GST export eligibility needs its own fact review against the [official IGST Act definition](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_IGST_Act/active/chapteri/section2_v1.00.html). Receiving a payment from the US alone is not an implementation rule.

## Verification and rollout

The branch provides a routed, read-only payroll review screen backed by authenticated GET endpoints for the run list, current revision detail and local preflight. Active owners can read company runs; active eligible accounts reviewers can read only their assigned runs. Authorization checks fresh role and employment records in the authenticated workspace. Responses use private, no-store caching. Revision details include persisted calculation and source snapshots, fresh source-review issues and approval history. List and history queries load revision metadata without historical payroll payloads.

Preflight derives the run, current revision, company, currency, recipient set, totals and approval state from persisted records. It remains blocked until provider setup, capabilities, recipient verification and a complete trusted roster are established; dry runs never enable execution. There are no create, edit, approve, transfer or payslip-publish endpoints. The calculator supports reviewed fixed-amount adjustments; statutory rate calculation is not implemented. Do not describe the entire payroll feature as complete from this read-only candidate.

Before enabling an operational write or payment workflow, complete these integration gates:

- Bind policy definitions, complete roster, accounts identity and named final reviewer to trusted persisted review records. The standalone calculator's reviewed fields and local preflight's approval/capability flags are internal caller assertions, not authorization from client input.
- Add append-only reviewer and roster reassignment/supersession. Current run identity and assigned reviewers are immutable and unique per company/month/currency; removing an assigned reviewer strands that draft. Do not repair this by mutating history or bypassing constraints.
- The read-only preflight reconciles the explicit recipient set in the persisted current revision. Bind that set to a verified complete company/currency roster and authoritative settlement evidence before operational use. A local coverage result does not establish roster completeness, bank approval or transfer success.
- Batch source capture and benchmark the actual roster before enabling larger runs. The initial review snapshot is limited to 25 lines, 1 MB serialized payload and nesting depth 20. Larger rosters must block rather than silently split or omit people. Apply input, monthly source-entry and component-count limits before public request parsing; these trusted internal services are not an ingress boundary.
- Preserve private run details and original source evidence behind verified roles. Source corrections after review are detected by fresh source comparison; no cross-request cache may make stale approval appear current.

Verification must cover the schema-load path as well as migration execution, because the append-only PostgreSQL triggers must survive fresh database creation. Keep test databases exclusive and synthetic. The routed review screen and preflight component are included through the application's Vite entrypoints; verify the production build and actual authenticated screen in a fresh headless browser, including role denials and workspace changes.

Keep login-rollout verification separate: its final Render deployment/migration check remains pending confirmation of the Render workspace. No payroll work authorizes a new manual production deployment or closes that verification task.
