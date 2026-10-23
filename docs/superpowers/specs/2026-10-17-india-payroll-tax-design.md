# India employer payroll and tax workspace

Priority update, 19 October: [Sonam issue #2458 requirements](2026-10-19-consultant-payroll-requirements.md) now govern the payroll delivery order: consultant preparation, approval, settlement and invoices first. This document remains the later India employee-tax/statutory/GST research scope; its original employer-first sequence is superseded.

Status: expanded product design, informed by primary-source research; statutory calculation rules remain subject to the evidence gates below.

Implemented foundations: private salary slips and [manual employer declaration/evidence review](../../product-guide/payroll/02-tax-declarations.md). The declaration workflow records year/category, claimed/reviewed INR amounts, private proof, reviewer decisions and linked corrections. It does not determine eligibility, apply shared caps or admit amounts to a calculated payroll. Compensation/opening balances, expense settlement controls, structured eligibility questions/cutoffs and statutory calculations remain subsequent work.

## Scope and order

User chose employer payroll first, then employee tax preparation. Build salary slips, documented deductions and reimbursements; then validated payroll calculation, consultant settlements, company GST and year-end tax preparation. Keep Razorpay merchant connect/create and Payroll integrations from the earlier design as separate, compatible workstreams.

This supersedes the earlier design's assumption that native payroll calculation is outside the product. The earlier Release 1 private salary-slip import workflow remains the first deliverable and does not require a calculation engine.

Research: [payroll and tax findings](../../research/2026-10-17-india-payroll-tax-research.md), [deduction inventory](../../research/2026-10-17-india-deduction-catalog.md), [statutory contributions and GST](../../research/2026-10-17-india-pf-gst-research.md).

## Employer setup and midyear onboarding

Use company and employment records. Add an India payroll profile only when calculations are introduced: legal employer, PAN/TAN, locations, registrations and applicable statutory schemes. GST registrations belong to the company by state; personal PAN and declaration information are private to the authorized person/employment workflow. Encrypt identifiers where necessary, mask in ordinary responses, and collect no unnecessary identity documents.

Choose the applicable law/year explicitly. Preserve historical FY/AY records and current Tax Year records separately. Readable labels may show familiar legacy section/form names, but retain the actual statutory version. Never choose a legal version by upload date.

Opening balances require structured earnings, taxable amounts, deductions, contributions, reimbursements and payments already made, withholding/deposit records and prior-employer declarations. An owner/admin reviews and locks them before the first calculated run. Missing opening balances block a supposedly complete annual estimate; the UI may show a clearly incomplete draft.

## Salary slips and proof documents

First delivery is the approved PDF import workflow specified in [the initial design](2026-10-17-payroll-razorpay-design.md). No parsed PDF values automatically become payroll data. Private download, current-company authorization, restricted coworker access and original/corrected document history apply throughout.

Next add an employee declaration/evidence workflow per employment/year/rule, with claimed amount, eligibility answers, evidence, approved amount, reviewer and revision. Separate estimate-only declarations from approved proof. Support explicit needs-information/rejection and cutoffs. Only an authorized reviewer can change the amount admitted to payroll. Policy changes apply through adjustments rather than rewriting approved history.

Employees access their own documents and declarations. Owner/admin manages employer payroll; existing bookkeeper/manager privileges do not confer coworker salary or medical-document access. Accountant assistance initially uses an owner/admin-issued minimal export; a new delegated payroll role requires a separate authorization design rather than broadening the general bookkeeper role.

## Calculation model

Use explicit Ruby calculation code and reviewed versioned rule data. No formula DSL, user-provided executable formulas or dynamically evaluated section names. Store money as decimal/minor-unit amounts, never floating-point. Store period, effective date, calculation version, rounding decisions and input provenance.

Keep these separate:

- Cash earnings and noncash benefits.
- Taxable earnings, exemptions and personal tax deductions.
- Employee cash deductions/withholding/recoveries.
- Employer contributions and employer-only liabilities.
- Business reimbursements and advance settlements.
- Tax credits/deposits, net bank payment, and employer cost.

Each rule requires a verified section/table mapping, operative dates, jurisdiction/person/regime applicability, evidence, limits/interactions, rounding and worked examples. Support statuses `researched`, `needs_verification`, `calculation_enabled`, and `retired`. Only enabled rules may affect calculated payroll. A manual amount may be recorded with reviewer/reason and must be labeled manual; it cannot masquerade as Miru's statutory calculation.

The deduction catalog includes the requested families and an explicit backlog for specialist provisions. "All sections" means every candidate is accounted for and its support visible; it does not mean automatically granting every exemption to every worker. Current successor mappings, PF/labour transitions and state tables identified as gaps in research block those calculations, not document storage.

## Payroll run and reimbursements

Draft run → reviewed → approved/locked → slips published; disbursement and statutory deposits have separate states and evidence. Retrying approval or provider events must not duplicate a run, statement or payment. Reopen/correct through a new version or adjustment, never mutate a finalized statement silently.

Salary component inputs include effective-dated compensation, approved payable days/leave, variable amounts, benefits, arrears and join/exit changes. Annual TDS uses actuals, opening balances, remaining projections, permitted declarations and already deducted tax. Show annual estimate and current-month withholding separately, including manual corrections and unsupported situations.

Reuse `Expense` for reimbursement evidence and approval. Add a unique expense-to-settlement allocation under a transaction; exclude previously paid amounts and prevent payroll/direct-payment races. Tax treatment, payment eligibility and GST input-credit treatment are separate review decisions. Refunds or corrections produce linked adjustments. Show net-pay reconciliation before approval.

PDF generation from approved native statements follows verified calculation support. It must include employer/employee/period identity, itemized earnings/deductions, contributions distinguished from cash deductions, reimbursement totals, YTD where reliable, net amount and revision provenance. A slip is not a payment receipt or TDS certificate.

## Consultant settlements

Use separate consultant payment/withholding records, reusing suitable vendor/invoice/expense foundations after confirming their actual contracts. Do not coerce all consultants into employment payroll or mirror the employee standard-deduction/PF assumptions.

Collect payer/payee/residency/engagement classification, fee invoice, tax year, credit/payment dates, cumulative relevant payments, GST components, reimbursement evidence and valid withholding certificates. Apply only a verified relevant rule, including threshold crossing, lower/nil certificates, PAN-related treatment and corrections. Show the withholding base and rule, not a single unexplained consultant tax percentage.

Track fee, GST, expense recoveries, TDS, advances/credits and net settlement separately. Personal business taxation and presumptive eligibility belong to later tax preparation; withholding is not final income-tax liability. Non-resident/treaty cases require their own validated rules and cannot default to resident professional-fee treatment.

## Company GST

Extend invoice/purchase records with structured GST registration and transaction data; generic `TaxConfiguration` percentages do not satisfy this contract. Track GSTIN, place of supply, HSN/SAC, component taxes, reverse charge, notes/exports and input-credit review/reversal. Match purchases with imported portal statements and retain unresolved differences.

Prepare outward-supply and liability/input-credit registers and accountant-reviewed exports. Keep preparation, submission, acceptance and payment separate, with acknowledgments/ARNs and challans. Determine e-invoice applicability using verified entity/year rules; IRN/QR success needs portal evidence. Do not claim arbitrary receipts establish input credit or consultant recoveries are universally GST-free.

## Form 16/130 and tax readiness

Support historical Form 16/16A and current Form 130/131 identities. Prepare salary/non-salary withholding reconciliation and the applicable quarterly statement data (138/140 for the confirmed current workflows). Guided handoff initially: prepare/export → employer/accountant files → import acknowledgement and processed state → retrieve signed TRACES certificate → publish to recipient. Later authorized APIs may automate these steps.

Never label a Miru-generated facsimile an official certificate. Certify issuance only with the actual TRACES-generated document. Corrections link revised returns and replacement certificates. Use a year-specific calendar with notification updates rather than one universal filing deadline. TY 2026-27 year-end certificates normally come in 2027; historical tax preparation can start now.

Employee tax preparation follows employer payroll: opt-in private document collection, AIS/26AS reconciliation, all relevant income/credit schedules, regime comparison, eligibility-aware return choice, and accountant-ready export. Cross-employer/personal information must not be exposed to a new workspace automatically. Direct ITR/GST/TDS filing requires its own supported integration and acceptance evidence.

## Bounded releases and acceptance

1. **Private salary-slip archive:** model, database constraints, API/policy, file validation, publication/correction history, private downloads, dashboard page and pagination; focused authorization/file/state specs, Vite build and real Brave verification.
2. **Evidence and payroll inputs:** year-aware employer profile, compensation/opening balances, claims/proof review and expense settlement controls; assert shared-cap inputs, no duplicate claim use, no double reimbursement and no cross-company disclosure.
3. **Verified employee calculations:** native gross-to-net and annual TDS with only supported statutory rules; independently reviewed expected examples for caps, eligibility, regimes, partial months, YTD, threshold boundaries, rounding, retroactive changes and employer/employee totals.
4. **Consultant calculations:** verify classification, cumulative thresholds, invoice GST presentation, applicable withholding and certificate treatment; prove credit/payment timing, adjustments and payment-versus-remittance reconciliation.
5. **GST and year-end preparation:** reconcile registers/statements/challans, export the actual supported schemas, link official certificates and acknowledgement evidence. Add personal-tax readiness after employer workflow validation.

No release may imply another release's calculations, filing integrations or statutory coverage are complete. Current research gaps and native-calculation release evidence remain visible in the coverage register.
