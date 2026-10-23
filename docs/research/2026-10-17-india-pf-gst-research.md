# India statutory contributions and GST research

Research date: 17 October 2026. Employer payroll first; employee tax preparation follows.
This is a product research register, not a statement that every applicable law has been verified.
“Verified” means the cited official material was read in this session; its publication date still limits currency.

## 1. Evidence and implementation boundaries

| Area | Evidence obtained | What Miru may safely do first |
| --- | --- | --- |
| Employee salary slips | Approved-provider import is the chosen first workflow | Publish approved PDFs with recipient-only employee access and owner/admin management; preserve provider totals and provenance |
| ESI | ESIC contribution guidance read; last reviewed 4 April 2025 | Record employee/employer amounts; add calculation only after current applicability/wage rules are reviewed |
| PF / EPS / EDLI | EPFO employer/FAQ access returned 403; contribution PDF unavailable | Capture provider contribution lines; no invented current statutory defaults |
| Labour-code transition | Ministry labour-codes page returned an empty migrated application shell | Require an effective-date review before enabling a statutory wage formula |
| PT / LWF | No complete current state notification set obtained | Import explicit deductions and retain work-location/state basis; do not advertise all-state calculation |
| GST | GST Portal return manuals, GST Council rules consolidation, government notification PDF and authorized IRP read | Build bookkeeping/reconciliation readiness; filing needs separate authorized integration |

Web discovery used the required `mgrep --web --answer`; it returned no source context.
Public official URLs and their actual links were then read directly. Unavailable material is a research gap, not evidence of repeal or unchanged law.

## 2. ESI: verified published guidance

[ESIC contribution guidance](https://esic.gov.in/contribution) states:

- Employee contribution: 0.75%; employer contribution: 3.25%, effective 1 July 2019.
- Average daily wages up to ₹176 exempt the employee contribution; employer contribution remains payable.
- Contributions are payable within 15 days after the relevant calendar month ends.
- Contribution periods run April–September and October–March, with corresponding benefit periods.

The page was last reviewed on 4 April 2025. These are published reference values, not confirmation that later 2025–26 legislation/notifications leave every calculation unchanged.
The linked [coverage page](https://esic.gov.in/coverage) and [Code on Social Security material](https://esic.gov.in/esi-acts) timed out in this research session.
Coverage ceilings, establishment coverage, continuation after crossing a ceiling, wage inclusions/exclusions, join/exit treatment and rounding remain activation checks.

Implementation requirements, inferred from the separate contribution and benefit concepts:

- Store insured-person number, coverage start/end, employer establishment and contribution-period membership separately from salary amount.
- Keep employee deduction and employer expense in separate fields and ledger lines.
- Preserve actual contribution wages and the rule version used; do not assume gross salary equals contribution wages.
- Test daily-wage exemption, threshold crossing, partial periods, arrears and correction runs before calculation release.

## 3. PF, EPS, EDLI: calculation contract to verify

[EPFO employer portal](https://www.epfindia.gov.in/site_en/For_Employers.php) and [EPFO FAQ](https://www.epfindia.gov.in/site_en/FAQ.php) were inaccessible.
No PF rate, ceiling or allocation is approved as a current 2026 default by this note.

The following is the minimum research and data checklist, not a verified rules table:

| Topic | Required evidence and behavior |
| --- | --- |
| Establishment applicability | Coverage threshold, notified establishment class, registration date, voluntary coverage and exempted-trust status |
| Person eligibility | Existing membership, entry wage test, international-worker status, employment relationship, eligibility dates |
| Identity | UAN, member ID, joining/leaving dates, previous membership and scheme eligibility; restrict access to payroll staff |
| Contribution base | Component-by-component wage inclusion, allowance treatment, noncontributory days, leave without pay and arrears |
| Employee share | Applicable statutory rate, voluntary excess contribution, wage cap/actual-wage election and rounding |
| Employer allocation | Separate employer PF and pension allocation, pension eligibility, any higher-pension election and wage ceiling |
| Employer-only charges | EDLI and administrative/inspection charges, caps/minima, exemptions and allocation; never silently deduct these from employees |
| Remittance | ECR schema/version, member-level totals, challan identifier, payment date and portal acknowledgement |
| Corrections | Negative adjustments, prior-period arrears, revised submissions, exit and rejoin cases |

Persist provider-supplied PF/EPS/EDLI lines now without claiming Miru recalculated their legal correctness.
Do not collapse all contributions into a single “PF” percentage: employee take-home, employer cost and remittance liability have different accounting roles.
Do not infer that every consultant is outside coverage merely from their payment label; employment/contract facts need classification.

## 4. Labour codes and the wage-definition transition

[Ministry of Labour labour-codes route](https://labour.gov.in/labour-codes) was reachable only as an empty application shell.
This session did not independently verify the claimed late-2025 commencement date, operative provisions, transitional savings or final central/state rules.
Do not copy a “50% of CTC” formula from vendor articles into payroll.

Before releasing any wage-definition calculation, verify and link:

1. Gazette commencement for each relevant provision, rather than the enactment date alone.
2. The operative definition, included components, excluded components, add-back mechanism and its denominator.
3. Treatment of employer contributions, gratuity provision, in-kind benefits, reimbursements, bonus and irregular earnings.
4. Applicability to EPF, ESI, gratuity and other benefits separately; one wage base is not automatically valid for all schemes.
5. Central/state final rules and transition guidance for each supported employer location.

Product requirement: use effective-dated rule versions and store each run's inputs, component classifications, calculation trace and approver.
Changing a rule must not recalculate an already approved historical salary slip in place.
Imported historical periods need their provider attribution and period-specific amounts even when the current rule differs.

## 5. Professional tax and labour welfare fund

No complete current primary-source matrix was obtained; no state rates are asserted here.
Before supporting a state, obtain its own tax/labour notifications and file due dates in a signed-off rules register.

The register needs state/territory, work location, establishment registration, employee category, wage band, exemptions, period, employee amount and employer amount.
Research special-month deductions, annual or half-yearly LWF, ceiling/exemption changes and join/exit rules explicitly.
PT and LWF are different liabilities and must have independent registrations, payment records and reconciliation.
Support verified states individually; show unsupported states as requiring a provider or payroll reviewer.

## 6. Reimbursements: three independent decisions

This is the proposed product model; it deliberately does not grant a tax exemption merely because a receipt was uploaded.

1. **Payment:** approved amount, claimant, company, expense date, payroll period and whether it was already paid elsewhere.
2. **Payroll tax:** evidence-based taxable/exempt classification under the applicable employee tax rule and period.
3. **Company GST:** supplier invoice, recipient GSTIN, tax breakdown, place of supply, business purpose and input-credit eligibility/reversal.

Use one source expense/claim identifier to prevent payment both through expenses and payroll.
Keep approved business reimbursement outside salary earnings when its reviewed classification permits; display it separately in the net-pay reconciliation.
Treat allowances and flat reimbursements as distinct component types; neither a label nor the presence of a document determines statutory treatment.
Retain approval, rejected amount/reason, documents, payment reference and later correction history.

For consultant billing, [CGST Rule 33 in the GST Council consolidation](https://gstcouncil.gov.in/sites/default/files/2024-04/01062021-cgst-rules-2017-part-a-rules.pdf) (PDF page 32, printed page 29) conditions pure-agent exclusion on authorization, separate disclosure and procurement beyond the supplier's own services.
Its definition also requires a contract, no title or own use, and recovery of actual expenditure.
The consolidation is only current to 1 June 2021; current amendments require verification before automation.
Miru should retain the contract, authorization, original third-party invoice, separate recovery line and reviewer decision. Consultant reimbursements must not default to GST-free.

## 7. Company GST: verified workflow and proposed records

[GST Portal GSTR-1 FAQ](https://tutorial.gst.gov.in/userguide/returns/GSTR_1.htm) describes outward-supply reporting, invoice/note and export information, amendments and HSN/SAC summaries.
It supports preparation through the portal, offline tools or ASP applications via GSPs.
It describes GSTIN/FY invoice uniqueness, a 16-character invoice-number limit and two-decimal values.
Its examples and some answers are visibly historical; current deadlines and thresholds need notification-level checking.

[GST Portal GSTR-2B FAQ](https://tutorial.gst.gov.in/userguide/returns/FAQ_gstr2b.htm) describes a read-only input-credit statement, downloadable data and reconciliation with books.
It warns against duplicate credit and calls for reversals and reverse-charge payment; appearing in 2B is not proof that every legal ITC condition is met.
[GSTR-3B manual](https://tutorial.gst.gov.in/userguide/returns/Create_and_Submit_GSTR3B.htm) provides the official return workflow.

Proposed record set, inferred from those workflows:

- Company PAN and GST registrations per state/establishment, taxpayer type, effective dates, filing frequency and authorized signatory.
- Invoice/note identity, supplier and recipient GSTIN, document/date, place of supply, SAC/HSN, taxable value and individual tax components.
- Outward sales, consultant/vendor purchases, employee expense invoices and reimbursements linked to their underlying transaction.
- Separate outward tax, eligible/provisional/blocked ITC, reversals, reverse charge, payments and reconciliation differences.
- Imported 2B/other portal statement file, statement period, match status and reviewer notes; prevent duplicate import and duplicate credit.
- GSTR-1 and 3B preparation exports, accountant review, filed acknowledgement/ARN and challans. “Prepared” and “filed” must be separate states.

Company GST is an adjacent business compliance area; it must not become an employee salary deduction or an employee income-tax deduction.
Consultant settlement needs separate fee, invoice GST, reimbursed expenses, income-tax withholding, credits and cash paid; validate withholding rules in the income-tax research.

## 8. E-invoice readiness

[Government Notification 10/2023 PDF on authorized IRP](https://einvoice6.gst.gov.in/content/wp-content/uploads/2023/05/GST-notification-10-central-tax-english-2023.pdf) changes the relevant threshold wording from ten crore to five crore effective 1 August 2023.
The principal notification and subsequent amendments still determine exact applicability and exemptions; do not infer applicability from this amendment alone.
[GSTN-authorized IRP release notes](https://einvoice6.gst.gov.in/content/) publish a 30-day reporting restriction for AATO ₹10 crore and above from 1 April 2025, including invoices and credit/debit notes.
The linked [GST advisory 543](https://services.gst.gov.in/services/advisoryandreleases/read/543) returned 403, so direct advisory inspection remains incomplete.
The same IRP documents 2025–26 master/validation changes: keep schemas and tax masters versioned rather than freezing a guessed universal rate list.

Implementation requirements: determine applicability per legal entity, retain IRN, signed invoice/QR, acknowledgement, cancellation status and errors; reconcile source invoices with accepted submissions.
An ordinary PDF with a QR code is not evidence that IRN registration succeeded.
GST return filing and IRN registration are separate integrations; successful payment through Razorpay does not complete either.

## 9. Completion gates for calculation releases

- Verified rule source and effective date, reviewer sign-off, supported jurisdictions and explicit unsupported cases.
- Worked expected results covering eligibility, caps, exemptions, partial months, prior-period changes and rounding.
- Separate employee deductions, employer costs, tax liabilities and cash settlements; no float arithmetic for money.
- Immutable approval snapshots with reversal/reissue, evidence access controls and company isolation.
- Portal/provider acknowledgement for remittance or filing claims; uploaded/generated documents alone do not prove submission.

Skipped: a speculative all-India rate table, unverified PF/2026 wage defaults and direct statutory filing integrations.
Risk: accessible ESIC and GST consolidations include older material; current notification review is required before statutory calculation activation.
