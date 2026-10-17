# India payroll and tax workspace: research and product decisions

Research date: 2026-10-17. This is a research baseline and implementation specification, not a released calculator or certification of complete statutory coverage.

## User direction

Employer payroll first; employee tax preparation next. Cover salary slips, adding deductions with evidence, reimbursements in payroll, PF and other statutory contributions, consultant payments, company GST, and year-end certificates. The earlier import-only decision remains useful as the first delivery, but no longer describes the full requested product. Razorpay merchant onboarding and Payroll integration remain separate workstreams.

## The year boundary matters immediately

The official e-filing portal distinguishes dues through FY 2025-26 under the 1961 Act from Tax Year 2026-27 onwards under the 2025 Act. Therefore "this year" cannot be one ruleset: support historical FY 2025-26 / AY 2026-27 records and current TY 2026-27 payroll separately. The portal also publishes deadline extensions for particular taxpayers; do not claim every October 2026 return can still be filed on the same terms. [Official portal](https://www.incometax.gov.in/iec/foportal/)

CBDT's transition guidance requires payroll/reporting systems to adopt new terminology, numbering and forms while preserving earlier-period obligations. Payment/credit timing can determine the applicable law for non-salary TDS. Do not select a ruleset solely from the PDF upload date or the date someone submits a return. [Transition guidance, TDS chapter](https://www.incometaxindia.gov.in/documents/81799/11848482/Updated-FQAs-on-Interplay%26Transitions.pdf/e10ad2b6-9495-de90-58d3-20606d8954ae?t=1775128640970)

For an employer starting in October, import April-to-date payroll, employee/employer contributions, approved claims, reimbursements already paid, tax withheld, tax deposited, and prior-employer information where applicable. A payslip PDF is evidence, not a reliable machine-readable opening balance. Require structured amounts and employer review.

## Five different financial effects

These are proposed accounting boundaries, not interchangeable deduction categories:

| Kind | Effect on employee cash | Effect on taxable income | Example input |
| --- | --- | --- | --- |
| Salary earnings | Add to payable gross | Depends on component/rules | Basic pay, variable pay, allowance, taxable benefit |
| Cash withholding/recovery | Subtract from payable | Depends on rule; never automatically a tax deduction | Employee PF, TDS, professional tax, advance recovery |
| Tax exemption/deduction | Usually no independent cash movement | Reduce eligible tax base only | Approved investment claim, eligible rent-related exemption |
| Business reimbursement | Settle an approved company liability | Must classify; receipt alone is not an exemption | Approved travel expense, recovery of an advance |
| Employer contribution/cost | Employer liability, not employee withholding | Can have employee tax implications | Employer PF/EPS/ESI, employer NPS, gratuity provision |

Use separate gross-pay, taxable-pay, tax-benefit, cash-deduction, reimbursement, net-pay, and employer-cost totals. An upload must not automatically reduce tax, increase net pay, or establish GST input credit.

## Declarations, proof uploads, and approval

The current employee claim statement is Form 124, replacing Form 12BB. It supports HRA/LTA, housing-loan and investment/expenditure claims with evidence. Standard deduction does not need this claim form. Previous-employer information belongs in the separate Form 122 workflow. [Form 124 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-124-faqs)

Form 122 replaces Forms 12B and 12BAA and brings prior-employer salary and relevant other income/TDS/TCS details into salary-TDS estimation. Personal declaration must remain scoped to the relevant employer/year. [Form 122 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-122-faqs)

Proposed claim record: person/employment, tax year, rule identifier, claimed amount, evidence files, eligibility answers, period covered, approved amount, reviewer/reason, and revisions. Show declared, submitted, needs-information, approved, rejected, and withdrawn states. A missing proof may be an estimate during declarations, but must be visible as unverified; final payroll uses the configured proof cutoff and reviewer-approved treatment. Deadline/transition treatment needs an explicit payroll policy.

Proposed document classes include rent agreements/receipts and landlord details; insurance premium receipts; investment and pension statements; tuition/loan-interest documents; donation certificates; disability/medical evidence; travel bills; consultant invoices; official TDS certificates; and challan/return acknowledgments. Collect sensitive identity/medical details only when the selected verified rule requires them. Preserve original evidence, access controls, review history and withdrawal/correction history.

## Deduction coverage and the meaning of "all sections"

The companion [deduction catalog](2026-10-17-india-deduction-catalog.md) is the coverage inventory. Each entry needs legal version, familiar alias, current section/table mapping, regime/person applicability, evidence requirements, monetary limits, shared caps, rounding and independent examples before calculation is enabled. A catalog entry is not a claim that the engine supports it.

Never provide an arbitrary section-name text box whose amount reduces taxable income. Unsupported sections can be recorded for accountant review, with no automatic tax benefit. Separate employer-considerable deductions from items evaluated only during an individual's return preparation. Use explicit unsupported status instead of zero, a default percentage, or an invented mapping.

The AY 2026-27 salary guide gives useful prior-year deduction/slab inputs, but must not be used as the TY 2026-27 legal specification. An older regime FAQ still displays AY 2024-25 examples; a page footer saying "current time" does not make those amounts current. [AY 2026-27 guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1), [older regime FAQ](https://www.incometax.gov.in/iec/foportal/help/new-tax-vs-old-tax-regime-faqs)

## Reimbursements in salary calculations

Miru's existing `Expense` supports receipts and submitted/approved/rejected/paid states. Extend it with payroll settlement links instead of creating a second claims system. Existing expense approval is not itself a tax determination.

For each reimbursement, record approved expense, beneficiary, amount/currency, settlement route, payroll period, prior settlements, and reviewer-approved payroll/tax treatment. Personal spending, a fixed allowance and an actual company expense must remain distinguishable. A receipt attached to a fixed allowance does not automatically turn it into tax-free business reimbursement.

Use a unique settlement link and transaction so one approved expense cannot be paid by payroll and direct bank transfer simultaneously. Exclude already paid/rejected claims. Lock the linked amount at payroll approval; a later expense correction produces an adjustment. Preserve foreign-currency original amount and reviewed INR conversion rather than silently using a changing reporting rate.

Arithmetic-only example: gross cash earnings ₹100,000 + approved unpaid reimbursement ₹5,000 − employee withholding ₹7,000 − salary TDS ₹8,000 − advance recovery ₹2,000 = net transfer ₹88,000. An approved ₹20,000 investment claim changes the eligible annual tax computation, not this transfer by ₹20,000. This example does not assert the legality of any tax/contribution rate.

## Salary calculation requirements

Use approved effective-dated compensation and attendance/payable-day decisions. Basic, DA, HRA, allowances, overtime, incentives, bonus, arrears, joining/exit adjustments, noncash perquisites, tax gross-ups and negative adjustments each require a separate type and period. Billable time is not payable days.

Annual tax projection must account for prior-employer/current-employer actuals, remaining expected income, eligible claims, regime, residency and relevant other-income declarations. Reconcile already-withheld TDS and credits without applying personal-return choices automatically to employer withholding. Store actuals separately from forecasts and final statements.

Implement progressive slabs, eligible rebate/marginal relief, surcharge/marginal relief, cess and statutory rounding only in approved year-specific rule modules. Special-rate income needs a separate path; it must not inherit a blanket rebate from a salary-only example. Preserve every approved calculation's inputs, rule version, result and reason for manual overrides.

See the [PF/GST research](2026-10-17-india-pf-gst-research.md) for statutory contributions, state-specific deductions, wage-definition transition and GST obligations. Employer PF/ESI and employee PF/ESI must not share a single salary-deduction field.

## Consultant payments and personal tax preparation

An employer's withholding obligation and a consultant's final personal tax are separate computations. Classify actual work, payer/payee type, residency, contract, credit/payment event, cumulative eligible payments, GST presentation and any valid lower/nil withholding certificate before choosing a verified rule. A job title alone cannot decide professional-fee versus contractor treatment.

Maintain consultant fees, chargeable reimbursements, GST, credit notes, withheld TDS, advances, net amount due and settlement state separately. Do not apply employee standard deduction, HRA, or employee contribution rules to all consultants. A contractor label also must not suppress statutory obligations where the underlying engagement is covered.

Track consultant TDS certificates separately from salary certificates. The department prescribes Form 140 for resident non-salary quarterly withholding statements; corrected filings retain their own lifecycle. [Form 140 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-140-faqs)

Arithmetic-only example: fees ₹100,000 + explicitly invoiced GST ₹18,000 − approved withholding ₹10,000 = ₹108,000 to settle, with ₹10,000 separately tracked as tax to remit. These are supplied example amounts, not an assertion that all consulting attracts 18% GST, 10% TDS, or the same taxable base.

Later personal-tax preparation should gather business receipts/expenses, eligible presumptive-tax treatment, advance/self-assessment tax, losses, capital gains, interest, foreign income/assets, tax credits, AIS/26AS and applicable return schedules. Do not select ITR-1 for every consultant or turn payroll's withholding estimate into a final ITR calculation. Eligibility and year-specific forms remain part of the reviewed coverage catalog.

## Certificates: prepare, reconcile, retrieve, distribute

Form 130 replaces Form 16 for the new framework. It depends on processed salary TDS statements in Form 138. The employer must download the certificate from TRACES and sign it; an independently prepared substitute is not valid. Its normal issuance deadline is 15 June following the tax year. Miru can generate preparation schedules and reconciliation reports, not fabricate an official certificate. [Form 130 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs)

Form 131 replaces Form 16A for relevant non-salary TDS. It likewise requires processed statements and a TRACES-generated certificate; corrections go through corrected statements. Store original and corrected certificates and link them to their reporting periods. [Form 131 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-131-faqs)

Build an employer checklist linking approved runs, withholding, deposits/challans, quarterly returns/acknowledgments, processed status, certificates and distribution. "Exported", "uploaded", "filed", "accepted", "paid" and "certificate issued" need distinct recorded evidence. Form 138 is the current salary-TDS quarterly statement, replacing 24Q. [Form 138 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-138-faqs)

For TY 2026-27, year-end certification normally falls in 2027, not October 2026. Prior-year Form 16/16A import and reconciliation can help with current historical-return work. Do not rewrite historical form identities to new labels.

## Existing Miru fit and proposed architecture

Read current models `Employment`, `PreviousEmployment`, `Expense`, `TaxConfiguration`, `PaymentsProvider`, and `RazorpayPayout` plus payment/expense authorization. `PreviousEmployment` contains descriptive history, not payroll opening balances. `TaxConfiguration` calculates generic percentage/flat invoice taxes; that is not a GST return, payroll-tax engine or statutory-rule registry. `RazorpayPayout` belongs to invoice payments.

Add only the models needed by each release: salary documents first; later structured compensation/payroll runs and approved immutable statements, benefit claims/evidence and expense settlement links; then consultant withholding and employer filing records. Reuse company, employment, expenses, attachments and authorization. Do not add a generic tax DSL, execute uploaded formulas, or share a global personal-tax profile with every workspace.

Separate payroll approval, publication and disbursement. A published slip does not prove a bank payment; a bank payment does not prove tax deposit or filing. Razorpay Payroll may supply authoritative results when an approved contract is available; native calculation and imports both retain their provenance. Never call an invoice payout endpoint to execute payroll.

## Release order and evidence required

1. Salary-slip upload/review/publication/private download, preserving corrections. This is already specified independently of statutory rates.
2. Employer India setup, tax-year-aware declarations/evidence, reviewed opening balances, and reimbursement settlement controls; enable only calculations whose rules are verified.
3. Native salary statements with validated PF/ESI/PT/LWF and annual TDS; generate salary-slip PDFs from approved immutable statements. Compare results with an independent payroll/accountant reference set before live use.
4. Consultant fee/GST/TDS calculations and reconciliation, using the same evidence and settlement boundaries without employee assumptions.
5. Company GST registers/reconciliation and year-end filing preparation/certificate retrieval/distribution; employee personal-tax preparation follows employer payroll.
6. Provider-authorized payment/filing automation, after the relevant partner/API entitlements and test environments are verified. Merchant onboarding can proceed independently.

The next design identifies the complete change surface and release checks. A rate is not ready just because it appears on a marketing page or in an introduced Finance Bill. Record enacted law, effective date, subsequent amendments and verified examples. No rule pack is represented as enabled by this research.

## Research limits

mgrep returned no useful web context. Direct official documents supplied the confirmed form/year findings. Some official EPFO, Labour and GST pages were blocked or served incomplete dynamic content. Companion notes identify precise verification gaps rather than treating remembered rates as current. The Finance Bill 2026 memorandum was inspected as a proposal locator, not used as proof of the final enacted position.

No private employer/payroll data, credentials, government account, return filing, payment or production system was accessed. This report does not claim every income-tax, labour, GST, treaty and state provision has been validated. It establishes the coverage workflow and records what must still be verified before each calculation is released.
