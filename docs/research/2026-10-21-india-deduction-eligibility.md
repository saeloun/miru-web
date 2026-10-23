# Ordinary salaried deductions: eligibility research

Checked 21 October 2026. Scope: ordinary individual salary estimates; no return filing, complex perquisite valuation, pension withdrawals, foreign income or complete business-tax computation. Read `app/models/tax_declaration.rb`: its category, approved amount and attachment fields establish a review workflow; they do not establish statutory eligibility.

## Current provisions and regime gates

Primary authority: [Income-tax Act, 2025, as amended by Finance Act, 2026](https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf), PDF pages 21, 46, 53–54, 185–188, 265–266, 673–676. Legacy labels below are user-facing aliases; enactment/year selection belongs to the separate tax-transition research.

| Legacy alias | Current provision |
| --- | --- |
| 16(ia), 16(iii) | 19(1), table rows 2 and 1 |
| 24(b) | 22 |
| 80C, 80CCC, 80CCD(1) | 123 and Schedule XV |
| 80CCD(1B) | 124(3); minor contributions share its cap under 124(4) |
| 80CCD(2) | 124(1)–(2) |
| 80D | 126 |

Section 202 denies professional-tax deduction, self-occupied interest, section 123, personal pension deductions and section 126 in the new regime; standard deduction and employer pension deduction remain available.

Employer pension: `min(contribution, salary*rate)`; old rate = government 14%, other 10%; new = 14%. Salary includes DA where employment terms provide, excluding other allowances/perquisites. Employee pension within Schedule XV has a 10%-salary limit. Section 124's ₹50,000 personal/minor pool cannot reuse section 123 amounts.

Self-occupied interest: ₹200,000 with acquisition/construction completed within five years after borrowing-year end and interest certificate; otherwise ₹30,000. Preconstruction interest is spread over five years and included in applicable caps. Let-out property requires a separate property computation; new-regime house-property losses cannot offset other heads or carry forward.

For health deductions, senior means resident aged 60 sometime during the year. Medical expenditure requires an uninsured senior; checkups share ₹5,000 across both buckets. Other payments must be noncash; multi-year insurance is apportioned. These are conditions, not optional reviewer settings.

## Bounded calculation data

The Department's [deduction reference table](https://www.incometaxindia.gov.in/w/deductions-allowable-to-tax-payer) supplies the familiar 1961-Act labels and limits below; current statutory counterparts were checked above. Amounts are INR. Apply each provision's paid/payable treatment after rule-specific checks; housing interest is not interchangeable with a cash-payment deduction.

| Item | Old regime | New regime |
| --- | --- | --- |
| Standard deduction | `min(salary,50000)` | `min(salary,75000)` |
| Professional tax | Actual eligible employment tax paid | 0 |
| Investment/annuity/employee-pension shared pool | `min(eligible_80C+eligible_80CCC+eligible_80CCD1,150000)` | 0 |
| Additional personal pension | `min(eligible_unused_personal_pension,50000)` | 0 |
| Health, self/spouse/dependent children | Insurance/checkups ₹25,000; qualifying senior insurance raises to ₹50,000 | 0 |
| Health, parents | Separate ₹25,000; qualifying senior insurance raises to ₹50,000 | 0 |

Health implementation: compute each bucket separately. Limit ordinary insurance/checkups to its applicable ₹25,000/₹50,000 ceiling; include only qualifying uninsured-senior medical expenditure; cap insurance-plus-medical per bucket at ₹50,000. Allocate at most ₹5,000 total checkups once across both buckets, inside their limits. Do not add a fresh ₹5,000 to each bucket. Government health-scheme contributions belong to the permitted self/family branch, not an arbitrary expense category. [Current section 126](https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf#page=187).

## Required structured answers and proof: proposed Miru contract

These are implementation requirements inferred from the above rules; an upload alone cannot supply them reliably. An approval means the employer accepted evidence. The calculator must independently establish category, year, regime, claimant, legal conditions, interactions and allowed amount.

| Calculation family | Structured answers to collect | Evidence to review |
| --- | --- | --- |
| Shared investment pool | Exact scheme/payment subtype; payment date; contributor and beneficiary; eligible amount; existing payroll PF/NPS amounts; refunds/withdrawals; policy inception and sum assured where relevant | Policy/scheme identifier, contribution/payment statement; scheme eligibility; payroll source reference |
| Pension | Employee vs employer vs guardian contribution; PRAN/account; allocation to shared or additional pool; employer category; salary/DA basis and contribution period | Pension statement and employer contribution/payroll reconciliation |
| Health | Beneficiary and relationship; DOB; residence; dependent-child status; insured person; premium/checkup/medical split; insurance coverage; payer; mode/date; multi-year coverage and allocation | Insurance schedule, premium receipt, checkup receipt; medical evidence only as needed for uninsured-senior eligibility |
| Professional tax | Employment-tax jurisdiction, actual payment and period, payer/recovery treatment | Payroll deduction/payment record; exclude unpaid projected amounts |
| Housing interest | Property ownership/share and use; acquisition/construction/repair; borrowing and completion dates; current/preconstruction interest; previous claims; other properties; lender/residency | Loan agreement and interest certificate; completion evidence; ownership and interest allocation |
| Standard deduction | Aggregate salary across employers, applicable year/regime | Payroll/previous-employer salary records; no investment receipt |

An `investment`, `pension`, `health_insurance` or `housing_interest` row with only a total and a PDF is insufficient for automatic calculation. Unsupported subtypes must stay recorded for review and contribute zero to the automated estimate until their rules are implemented. Keep rule-version, eligibility result and reason separately from `approved_amount`.

## Evidence process

[Form 124 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-124-faqs) confirms that evidence-backed exemption/deduction claims are supplied to the employer, replacing Form 12BB; standard deduction needs no declaration. Form 122 supplies previous-employer income/TDS. A missing investment declaration must not remove the statutory standard deduction. The form process is distinct from proving each underlying claim's tax eligibility.

Proposed execution order: normalize annual salary and other supported income; determine exemptions and salary-head deductions; compute supported property income/loss; establish gross total income; apply regime-eligible annual deduction pools and their limits; then hand the resulting taxable income to the separately verified annual-tax calculator. Cash payroll deductions and TDS withheld are reconciliation/payment outputs, not additional annual deduction pools.

## Computed examples for boundary tests

These examples assume every stated payment is otherwise eligible and sufficient income exists. They demonstrate arithmetic; they are not advice on an unstated person's eligibility.

- Shared pool: eligible investment ₹120,000 + annuity ₹40,000 + shared-pool employee NPS ₹30,000 yields ₹150,000, not ₹190,000. Distinct unused additional pension ₹50,000 yields combined ₹200,000. New regime: these personal pools yield zero.
- Health: eligible self/family insurance ₹30,000, all under 60, and resident senior-parent insurance ₹55,000 yield ₹25,000 + ₹50,000 = ₹75,000. A further checkup receipt cannot increase either exhausted bucket.
- Health: checkups ₹4,000 self + ₹4,000 parents with otherwise empty buckets allow at most ₹5,000 combined; the software must allocate rather than duplicate it. Cash insurance contributes zero; a cash checkup can pass the payment-mode test.
- Employer pension: verified salary basis ₹1,000,000, employer contribution ₹150,000, private employer gives ₹100,000 old or ₹140,000 new. Including unrelated allowances in the salary basis would overstate eligibility.
- Salary ₹40,000: standard deduction is ₹40,000 in either regime, not ₹50,000/₹75,000. Multiple employers do not create multiple annual standard deductions in the aggregate estimate.
- Self-occupied interest ₹240,000: with the higher-cap conditions met, old deduction ₹200,000; otherwise ₹30,000; new zero. A reviewed receipt cannot bypass the property-use or completion tests.

## Bounded exclusions and validation

- Section 123 is not a generic investment cap: Schedule XV contains beneficiary, scheme, insurance-percentage, loan/tuition, lock-in and clawback conditions. Use a positive list of implemented subtypes; do not declare all Schedule XV support from this memo.
- Housing additional-interest claims (legacy 80EE/80EEA), let-out property, overseas interest, multiple-property losses and co-ownership need their own supported computations; do not add an approved interest number directly to personal deduction totals.
- Health HUF cases, pension withdrawals/recapture, NPS minor-account claims, special retirement payouts and consultant business methods are outside the first ordinary salaried calculator unless explicitly implemented and checked.
- No code or database changed, no filing/provider operation executed. Source verification was read-only; calculation examples above were derived manually and need tests in the implementation.
