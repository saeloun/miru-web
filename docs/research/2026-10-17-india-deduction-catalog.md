# India deductions and consultant coverage inventory

Research date: 17 October 2026. Product research, not an implemented calculation engine or an exhaustive legal opinion.

## Reading this catalog

- **P**: official AY 2026–27 guidance checked; this is prior-year evidence, not authority to calculate TY 2026–27 under the Income-tax Act, 2025.
- **C**: specific 2026 form/process confirmed; this does not confirm every underlying exemption, cap or eligibility rule.
- **U**: proposed coverage requiring primary-source statutory verification before calculation.
- Legacy section numbers are search/display aliases. Do not silently use them as current statutory identifiers. The official [1961/2025 comparison utility](https://www.incometaxindia.gov.in/utility-to-check-provisions-of-income-tax-act-1961-vis-a-vis-income-tax-act-2025) returned a page shell without usable provision mappings during this research.
- Every executable rule needs the governing Act, applicable tax year, effective dates, regime, claimant category, eligibility tests, limit interactions, authoritative reference, and reviewer approval. An unverified claim may be stored but must not reduce taxable income.

## Verified legacy subjects and proposed evidence inputs

The following names and subjects come from the Department's [AY 2026–27 salaried-individual guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1). All are **P**; all TY 2026–27 successor-section mappings and calculations remain **U**. Evidence suggestions are Miru product requirements, not statements that every listed document is legally mandatory.

| Legacy alias | Coverage subject | Proposed evidence/eligibility inputs |
| --- | --- | --- |
| 80C | Insurance, provident fund, tuition, housing principal and eligible investments | Scheme subtype; policy/document ID; owner/beneficiary; payment date; amount; receipt; existing payroll PF contributions |
| 80CCC | Pension annuity | Provider, policy, contribution statement |
| 80CCD(1), (1B), (2) | Employee/additional/employer pension contributions | Separate contributor; PRAN; contribution date; salary basis; employer category; annual statement |
| 80CCH | Agnipath contributions | Enrollment, corpus statement, employee/government split |
| 80D | Health insurance, checkups, qualifying medical expenditure | Insurer/policy; beneficiary relationship; age; payment mode; coverage; receipt |
| 80DD | Dependent disability | Relationship, disability/certificate details, validity, claim ownership |
| 80DDB | Specified disease treatment | Patient, prescription/certificate, expenditure and recoveries |
| 80E | Education-loan interest | Lender, borrower/student relationship, sanction/first-repayment dates, interest certificate |
| 80EE / 80EEA | Qualifying housing-loan interest | Sanction date, first-home conditions, property value, lender, allocation of interest |
| 80EEB | Qualifying electric-vehicle-loan interest | Sanction date, vehicle registration, lender, interest certificate |
| 80G | Eligible donations | Donee identity/approval, category, payment mode, receipt, amount |
| 80GG | Qualifying rent without HRA | Rent period, residence/ownership checks, declaration acknowledgement |
| 80GGA | Research/rural-development donations | Donee approval, receipt, mode, business-income flag |
| 80GGC | Political contributions | Recipient eligibility, noncash payment evidence |
| 80TTA / 80TTB | Eligible interest | Age/residency, account/deposit category, bank statement, interest reconciliation |
| 80U | Taxpayer disability | Certificate type/validity, disability category, declaration |
| 24(b) | Housing-loan interest | Property use/ownership, lender, sanction date, loan balance, interest allocation |

Proposed calculation design: retain claimed, eligible and allowed amounts separately, with shared-limit and mutual-exclusion checks. Do not hardcode current-year caps from this legacy inventory.

The senior-citizen guidance separately documents age-sensitive medical/disability/interest categories; personal circumstances cannot be inferred from job title or salary alone. Use these only as **P** coverage evidence, with birth date, residency and disability facts effective for the relevant period. [Source](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-2).

## Further section and salary coverage: research backlog, not approved rules

All entries below are **U** until their operative provision, conditions and current-year treatment are reviewed. These are explicit coverage candidates, not a dropdown promising that every amount is deductible.

| Candidate family | Proposed coverage and inputs |
| --- | --- |
| 80QQB / 80RRB | Author/patent royalty income, ownership, payer certificates, foreign receipts; distinguish from consultancy fees |
| Specialist business deductions | Eligible undertakings/startups, employment-generation incentives, research donations/business expense treatment; admit only after entity/activity qualification |
| Salary definition and valuation | Basic, DA, bonus, commission, overtime, arrears, advances, leave encashment, severance, gratuity, pension, joining/retention awards |
| Benefits and perquisites | Accommodation, vehicles, employer loans, equity/ESOPs, vouchers/meals, employer-paid expenses, retirement-contribution benefits and annual accretions |
| Exemptions/reliefs | HRA, LTA/LTC, duty allowances, disability-related allowances, retirement receipts, arrears relief; track legacy 10-series/89 aliases without assuming successor numbers |
| Salary deductions | Standard deduction, professional tax, entertainment allowance where eligible; state/employee category and year gates |
| Statutory payroll deductions | Employee PF/VPF, ESI, professional tax, labour welfare fund, salary TDS; distinct employer contributions and liabilities |
| Other cash deductions | Loans/advances, salary recoveries, voluntary benefits, garnishments; approval and lawful deduction limits |
| Other income/tax readiness | Interest, property, capital gains, foreign income/assets, losses, relief/credits, advance/self-assessment tax; separate tax-preparation scope |

This backlog deliberately does not assign historical rates to current payroll. PF, ESI, state levies, employment classification and wage-base rules require their own statutory sources; a personal income-tax deduction catalog cannot establish them.

## Documents and reimbursements

**C:** [Form 124 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-124-faqs) identifies employee evidence claims under section 392(5)(b), replacing Form 12BB. It covers HRA, LTA, housing-loan interest and investment/expenditure claims; rent agreements, travel evidence, loan agreements and supporting investment documents are described. Landlord PAN is specified above ₹100,000 annual rent. Submission may be physical/electronic to the employer; separate tax-portal upload is not required. Standard deduction needs no separate declaration. Previous-employer income/TDS is supplied through Form 122.

Proposed Miru behavior:

1. Distinguish **payroll cash deduction**, **income-tax deduction**, **salary exemption**, **business expense**, **reimbursement**, **employer cost**, and **tax credit**. One label must not stand in for the others.
2. Keep claimed, approved, rejected and paid amounts, document versions, reviewer/reason, service/payment period, financial/tax year and employee or consultant ownership. Avoid collecting Aadhaar or full medical records unless an identified requirement demands it.
3. An approved reimbursement joins payroll only when scheduled for that pay run. Reference the original expense and payment so an expense cannot be reimbursed twice through accounts payable and salary.
4. Capture business purpose, actual/flat allowance, receipt, recipient/beneficiary and tax classification. Approval of a receipt alone must not mark a payment tax-exempt; each exemption/perquisite valuation requires its own verified rule.
5. Show gross salary, taxable salary, payroll deductions, TDS, reimbursements and net payment separately. Reimbursement may increase cash paid without increasing taxable salary only when the reviewed tax treatment permits it. Never include every reimbursement in PF wages or exclude every reimbursement by default.
6. Keep employer PF/ESI or other employer costs outside employee cash deductions; a CTC view must reconcile to the separate payroll and liability ledgers.
7. Resubmission creates a new review version. Approved payroll snapshots retain the rule version and evidence relied upon; corrections use auditable adjustments rather than replacing prior published values.

The separation above is a proposed accounting/product contract. It is not verification that any reimbursement category is exempt under the current law.

## Consultant payments and tax readiness

The official [ITR-4 FAQ](https://www.incometax.gov.in/iec/foportal/help/e-filing-itr4-form-sugam-faq) is explicitly framed for AY 2025–26, so it is **P**, not current-year authority. It distinguishes specified-profession presumptive taxation from ordinary business treatment; professional presumptive eligibility is conditional, not available merely because someone is called a consultant. It explains that presumptive expenses are deemed covered rather than deducted again, and describes restrictions on business-income regime switching. It also lists bank statements, AIS/26AS and tax certificates among readiness documents. Current-year eligibility, rates, forms and deadlines remain **U**.

| Workflow | Proposed minimum coverage | Validation required before calculation |
| --- | --- | --- |
| Classification | Employee vs independent service supplier; individual/firm/company; resident/nonresident; actual service and contract | Employment/legal classification; correct withholding provision |
| Resident withholding | Professional/technical services, contracts, commission, director payments, other categories; legacy 194J/194C/194H/194M aliases as candidates | Current successor provision; payer applicability; thresholds; aggregation; rate; deduction timing; GST basis; PAN/certificate exceptions |
| Supplier settlement | Fee, separately stated GST, reimbursed costs, withholding, advances, retention, net payable | Approved invoice and applicable tax treatment; no automatic salary PF or employee deductions |
| Evidence | Contract, invoice, PAN/status, service category, GST registration where applicable, lower/nil-deduction certificate with validity/limit | Certificate authenticity/scope and supplier identity |
| Personal computation | Books/actual expenses vs qualifying presumptive method, receipts split, expenses, assets/depreciation, advances/tax credits | Current qualification and method; no duplicate actual expenses under a deemed-expense method |
| Reconciliation | Payment/withholding ledger, challan/statement reference, certificate, bank receipt, AIS/26AS mismatch review | Withheld, deposited, reported and credited are separate states |
| GST boundary | Output/inward invoices, debit/credit notes, input-credit evidence, payments and return preparation | GST-specific rules and filing integration belong in the separate GST research; no automatic credit from an upload |

Salary tax-saving declarations do not automatically reduce a client's withholding on a consultant invoice. That behavior requires an explicit, verified statutory mechanism; Miru should keep the personal tax estimate and payer withholding calculation separate.

## Completion and release gates

- This inventory covers the requested deduction families and important edge categories; it is not a claim that every Indian tax section is applicable or implemented.
- Current-year calculation remains blocked on enacted-law mappings, amendments/rates, rules and professional review. The official Act/comparison pages were reachable only as empty shells in this research; several old tutorial/TDS URLs failed.
- The safe first deliverable remains importing and publishing already approved salary slips with access controls, followed by claims/evidence review. Enable each calculation family only after its current-year rules and boundary tests are complete.
- No application code, payroll calculation, return filing, certificate issuance or live payment was executed for this research.
