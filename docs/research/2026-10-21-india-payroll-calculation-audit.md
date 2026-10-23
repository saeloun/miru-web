# India payroll calculation audit — 21 October 2026

Scope: India employer payroll and employee tax preparation. US work is cancelled.
This note separates verified rules, proposed implementation boundaries and unresolved coverage.
It does not claim support for every Indian tax provision or statutory filing.

## Existing implementation

Read `app/services/payroll_calculation/calculator.rb`, `values.rb` and `app/services/payroll/consultant_review.rb`.
`Calculator::VERSION` is `1`. Its configurable proration, FX, manual income-tax/withholding adjustments and review flags form a settlement preview; it has no Indian tax-year, residency, regime or statutory tax engine.
`ConsultantReview` estimates fees/reimbursements and returns `withholding: nil`, `payment_ready: false`.
These are missing capabilities, not evidence that the existing generic calculator computes the wrong tax slab.

Keep statutory tax estimation separate from settlement arithmetic. A reviewed manual adjustment is not a verified statutory calculation.
Never infer tax residence, employment classification or jurisdiction from INR, a bank account or a payment source.

## Source register

- **A — Enacted current law:** [Income-tax Act, 2025, amended by Finance Act, 2026](https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf).
  Read sections 19, 123–126, 153, 156, 202, 516 and Schedule XV paragraph 1(y).
- **B — Prior-year guidance:** [Income Tax Department, salaried individuals AY 2026-27](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1).
- **C — Transition:** [CBDT transition FAQ](https://www.incometaxindia.gov.in/documents/81799/11848482/Updated-FQAs-on-Interplay%26Transitions.pdf/e10ad2b6-9495-de90-58d3-20606d8954ae?t=1775128640970), questions 1.9–1.12 and TDS chapter.
- **D — 2026 rate explanation:** [Budget 2026 memorandum](https://www.indiabudget.gov.in/doc/memo.pdf), pages 5–10. This explains proposals; A is the enacted authority.
- **E — 2025 changes:** [Budget 2025 memorandum](https://www.indiabudget.gov.in/budget2025-26/doc/memo.pdf), pages 10–12; [Budget speech](https://www.indiabudget.gov.in/budget2025-26/doc/Budget_Speech.pdf), printed pages 27–28.
- **F — Current evidence claims:** [Form 124 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-124-faqs).
- **G — Certificates:** [Form 130 FAQ](https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs), [certificate guidance](https://www.incometaxindia.gov.in/documents/d/guest/fn-130-131-132-133), [forms mapping](https://www.incometaxindia.gov.in/faqs-and-guidance-notes-on-forms-as-per-income-tax-rules-2026).
- **H — Consultants:** [Income Tax Department, business/profession AY 2026-27](https://www.incometax.gov.in/iec/foportal/help/individual-business-profession).
- **I — Contributions:** [ESIC contribution page](https://esic.gov.in/contribution); [EPFO FAQ](https://www.epfindia.gov.in/site_en/FAQ.php) returned 403.

Required `mgrep` local/web searches returned no context. Official pages and their actual document links were read directly.
No database tests, provider operations, payments, filings or secret access were performed.

## Income period and governing law

C explicitly distinguishes:

| Income period | Correct reference | Governing law |
| --- | --- | --- |
| 1 April 2025–31 March 2026 | FY 2025-26 / AY 2026-27 | Income-tax Act, 1961 |
| 1 April 2026–31 March 2027 | Tax Year 2026-27 | Income-tax Act, 2025 |

Do not use the ambiguous label “2026-27” as the entire rule key.
Persist income-period start/end, governing Act, rule version, source revision, assumptions and calculation timestamp.
Do not silently apply today's rule version to an approved historical snapshot.

## Verified numerical contract

From A, with PDF page numbers counted from one:

- Section 19, page 46: standard deduction `min(salary, 75000)` new; `min(salary, 50000)` otherwise.
- Section 202, pages 264–266: new bands `0/4L/8L/12L/16L/20L/24L`, rates `0/5/10/15/20/25/30%`; PT, HRA/LTA and ordinary Chapter VIII claims are barred, subject to named exceptions.
- Section 156, pages 216–217: resident rebate old `min(tax,12500)` through `5L`; new `min(tax,60000)` through `12L`; new marginal relief above `12L`, capped to section-202 tax.
- Sections 123/124, pages 185–187: shared investment ceiling `150000`; additional employee NPS `50000`, without double claim; employer NPS old government `14%`, other `10%`, new `14%` of qualifying salary.
- Section 126, pages 187–188: family/parents separate `25000`/senior `50000` buckets; preventive check-ups share one `5000` limit; premium noncash; medical expense only uninsured seniors.
- Section 516, page 576: discard paise, then round total income/payable/refundable to nearest `10`, last digit `5` upwards.

Use A's exact definitions and exclusions at the cited sections, not a generic percentage of CTC.

## Old regime, surcharge and deduction guidance

B gives resident old-regime nil bands by age: under 60 `250000`, 60–79 `300000`, 80+ `500000`; subsequent marginal rates are `5%` to `500000`, `20%` to `1000000`, then `30%`.
Age is assessed during the income year; a current birthday alone is not the year-specific answer.
B/D describe surcharge above `50L/1Cr/2Cr/5Cr`: `10/15/25/37%`; new maximum `25%`. Thresholds are strictly exceeded.
Apply surcharge marginal relief before `4%` cess. Special capital-gain/dividend surcharge caps require separate handling; exclude those cases initially.
B describes the old shared 80C/80CCC/80CCD(1) ceiling `150000`, additional 80CCD(1B) `50000`, health-insurance age buckets, and employer NPS limits.
It distinguishes new-regime employer NPS from unavailable ordinary personal investment deductions.

For implementation, health check-up amounts must consume their family's/parents' bucket and the global check-up limit simultaneously.
Senior medical expenditure requires the uninsured condition; a parent marked “senior” alone is insufficient.
Do not reuse the same NPS payment in the shared pool and the additional pool.
The employee NPS salary cap and employer NPS salary base must have distinct explicit inputs.
Do not treat employee PF, employer PF, NPS and income-tax withholding as interchangeable deductions.

## Proposed first complete calculation boundary

Accept explicit resident individual status, age band for the selected income year, employee engagement and INR amounts.
Compute ordinary domestic salary income under both regimes; include only individually supported, reviewed exemption/deduction categories.
Return unavailable with reasons for business/profession income, nonresidence, foreign income/credit, agricultural aggregation, special-rate income, loss set-offs, arrears relief or unsupported retirement/perquisite calculations.
Never silently discard one of these inputs to produce a reassuring tax number.

Recommended input distinctions:

- Salary before exemptions, reviewed HRA/LTA exemptions, other supported salary adjustments and actual professional tax paid.
- Shared eligible investments, employee NPS contributions with allocation, additional NPS and employer NPS with qualifying salary and employer type.
- Family/parents insurance, check-ups and uninsured-senior medical amounts with payment mode and relevant ages.
- Supported other ordinary income only when its tax treatment is explicit; otherwise keep the initial scope salary-only.
- Taxes already deducted/paid as credits, not reductions to taxable income.

Return claimed, eligible, disallowed and capped amounts separately, with reasons.
An “approved evidence” flag confirms a review workflow; it must not override eligibility, regime restrictions, caps or year rules.
HRA/LTA need evidence and statutory sub-rules; accept only separately reviewed eligible amounts initially. Detailed 2026 Rule formulas/blocks were not independently verified here.
Do not accept a catch-all “other deduction” that bypasses the supported catalogue.

## Algorithm and verification cases

The following algorithm is an implementation inference from the cited rules, for ordinary income only:

1. Compute each regime's salary deductions/exemptions and permitted Chapter deductions independently.
2. Clamp taxable income to zero and apply statutory total-income rounding.
3. Sum marginal slab slices; apply resident rebate or new-regime rebate marginal relief.
4. Compute applicable surcharge and its threshold relief; add cess afterwards.
5. Apply final statutory rounding; show annual liability separately from credits and any monthly withholding estimate.

For ordinary new-regime income `T > 1200000`, pre-cess tax after rebate marginal relief is `min(slab_tax(T), T - 1200000)`.
For a surcharge threshold `H`, cap tax plus surcharge at `tax_plus_surcharge_at(H) + T - H` when lower than nominal tax plus surcharge.
Use the lower bracket's applicable surcharge when computing the reference at `H`.
These are two separate relief mechanisms; test both.

Self-derived regression vectors, resident under 60, salary only, no other deductions; amounts in rupees:

| Gross salary | New taxable | New annual tax | Old annual tax |
| --- | --- | --- | --- |
| 1275000 | 1200000 | 0 | 187200 |
| 1300000 | 1225000 | 26000 | 195000 |
| 1875000 | 1800000 | 166400 | 374400 |
| 2575000 | 2500000 | 343200 | 592800 |

Additional new-regime taxable-income tests: `1200004.99 → 1200000 → tax 0`; `1200005 → 1200010 → tax 10`; `5000010 → tax 1123210` after surcharge relief and cess.
Standalone Decimal arithmetic reproduced these vectors; it did not exercise application code.
The official Budget 2025 speech independently illustrates the `1275000` salary/no-tax case through standard deduction; other vectors above are calculated expectations, not claimed official examples.
Also test every slab/rebate/surcharge boundary below/at/above, age changes, low salaries, duplicate deductions, unsupported categories, and reviewed evidence that is legally ineligible.

## Consultant and tax-document boundaries

H identifies business/profession income, separate returns and non-salary TDS certificates. Consultant withholding is a payer obligation, not the consultant's final annual income tax.
Do not apply salary standard deduction to consultant fees or derive annual consultant tax simply by multiplying a TDS rate.
Automating withholding requires separate payment-nature, payer/payee eligibility, financial-year aggregation, thresholds, PAN/certificate and current section mapping; no universal consultant percentage is verified here.

F documents Form 124 replacing Form 12BB and requires supporting evidence for claims.
G maps Form 130 to former Form 16, Form 131 to former Form 16A, Form 138 to former 24Q and Form 140 to former 26Q.
The certificate guidance says valid certificates must come from TRACES and carry the deductor's signature.
Miru may prepare computation/reconciliation statements and import certificates; a generated salary PDF must not be represented as a valid statutory TDS certificate.

## PF, ESI, state deductions and GST follow-on

I publishes employee/employer ESI rates `0.75%/3.25%`, daily-wage employee exemption `176` and separate contribution periods, but its review date is April 2025.
EPFO current rules and labour-code transition material remain unverified due access failures.
Keep provider-imported PF/EPS/EDLI, ESI, PT and LWF amounts distinct, with wage bases and effective dates; do not assert all-state automation.
Company GST belongs to business invoicing/purchase/reconciliation workflows, with independent eligibility and document rules. It is not an employee salary deduction.
See `2026-10-17-india-pf-gst-research.md` for the prior source-backed GST and statutory research register.

Skipped: US work, application/database changes, unsupported statutory defaults and filing automation.
Risk: complete ClearTax-like coverage requires additional rules and period-specific review; this audit supports a bounded estimator with explicit unavailable cases.
