# India: official salary certificates and ITR automation

Verified 2026-10-21 from public primary sources. Repository integration inventory checked at `21315352d57b00e749fa229d87f3fca86f0807b3`; the separate annual-estimate implementation is concurrent work. No accounts, credentials, signatures, OTPs, filings or authenticated APIs were exercised.

## What is possible

Miru can prepare tax computations and return data, distribute authentic certificates, and eventually submit eligible returns through an approved ERI integration. These are separate capabilities. A calculated salary PDF cannot substitute for an official TRACES certificate. An uploaded return is not necessarily verified or processed. The Department publishes ERI APIs for consent, prefill, submission, verification and acknowledgement; publication does not grant Miru production access. [ERI API catalogue](https://www.incometax.gov.in/iec/foportal/api-specifications), [Form 130 FAQ, questions 6–7](https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs).

## Certificate year and legal provenance

| Income period | Salary statement / certificate | Issuance deadline in transition guidance |
| --- | --- | --- |
| FY 2025–26, under the 1961 Act | Form 24Q / Form 16 | 15 June 2026 |
| TY 2026–27, under the 2025 Act | Form 138 / Form 130 | 15 June 2027 |

AY 2026–27 ITRs concern FY 2025–26 under the old Act; they are different from TY 2026–27 returns. Preserve the governing Act and period explicitly rather than renaming every historical Form 16. [CBDT transition FAQs, Q3.5–3.6, Q6.10 and Q6.15](https://www.incometaxindia.gov.in/documents/d/guest/faqs-on-interplay-and-transition-pdf).

Form 130 has Parts A, B and C, with salary details in Part C Annexure I; it is not merely Form 16 with another title. Quarterly Form 138 statements and supporting annexures must be filed and processed before the certificate can be generated. Corrections require a revised statement, processing and a newly downloaded certificate. [Form 130 FAQ, questions 2, 6 and 9](https://www.incometaxindia.gov.in/documents/d/guest/form-130-faqs).

The new certificate note explicitly requires TRACES generation and a digital or physical signature of the deductor/collector. Non-salary TDS uses a separate certificate route, including Form 131 replacing Form 16A; consultant classification must not automatically produce a salary certificate. [CBDT certificate note, pages 2–4](https://www.incometaxindia.gov.in/documents/d/guest/fn-130-131-132-133).

### Documented TRACES route

1. Establish the correct employer/deductor, PAN/TAN, period and filed statement provenance; reconcile salary, tax deducted and tax deposited.
2. Use the authorized deductor account to request the relevant certificate. TRACES documents a request/download workflow; the legacy Form 16 download is converted using its prescribed utility and signed by the responsible deductor representative.
3. Retain the downloaded official bytes and signed issued version, including replacement history. Do not edit certificate data to repair a mismatch; correct the underlying statement first. [TRACES general FAQ](https://traces61contents.tdscpc.gov.in/en/faq-dedu-form16-general.html), [download FAQ](https://traces61contents.tdscpc.gov.in/en/faq-dedu-form16-download.html), [certificate-content FAQ](https://traces61contents.tdscpc.gov.in/en/faq-dedu-form16-content.html).

**Unverified integration:** these sources establish the official portal route, not a public TRACES certificate-download API or Miru's entitlement to one. ERI ITR API approval is not evidence of TRACES access. Before promising unattended retrieval, obtain the actual authorized TRACES/provider interface, permissions and acceptance evidence. Keep any portal handoff human-controlled; do not build CAPTCHA/OTP bypasses or infer a connector from browser endpoints.

## ERI access: approval and certification precede production

| Route | Official distinction | Consequence for Miru |
| --- | --- | --- |
| Type 2 | Software provider acts for the taxpayer; own ERI session through the API gateway. | Appropriate candidate for a hosted filing service, subject to approval and client authorization. |
| Type 3 | Software provider supplies a utility; session belongs to the taxpayer or Type 1 ERI. | A separate integration model, not permission to impersonate clients using Miru's employer login. |

The overview specifies Type 2 client credentials and ERI credentials, PAN-bound authorization and ERI request signing. Keep the ERI request signature distinct from the taxpayer's return verification/DSC. [ERI specification v1.1, sections 1, 2.2 and 4](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-11/ERI%20API%20Specification_v1.1.pdf).

The Department's registration manual includes PAN/TAN validation, principal contact, OTP checks, document submission and Registrar approval; its Type 2/3 attachment list includes an undertaking, bank guarantee and audit report. [ITD registration manual](https://www.incometax.gov.in/iec/foportal/help/eri/registration).

Protean's own registration procedure specifies sandbox testing and a test-status report for Types 2 and 3. Type 2 production access follows report approval and IP whitelisting, with a public-key certificate meeting the published SHA-2/2048-bit RSA requirement. Registration alone is insufficient. Confirm the current application package and production terms through the approved onboarding process before implementation commitment. [Protean ERI registration procedure](https://tinpan.proteantech.in/services/e-return/ereturn-regproc.html).

## Return preparation, submission and verification

1. **Consent and client binding:** record a separate taxpayer authorization with validity and PAN binding. Adding a client and fetching prefill both require consent; employer/admin access to Miru is not that authorization. [ITD API catalogue](https://www.incometax.gov.in/iec/foportal/api-specifications), [Add Client v1.1](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-11/API_AddClientFlow_v1.1.pdf).
2. **Complete the taxpayer return:** reconcile salary certificates with AIS/26AS and other income, deductions and taxes. A single employer's salary computation is insufficient. [ITD ITR preparation guidance](https://www.incometax.gov.in/iec/foportal/node/11454).
3. **Pin form/year/version:** official AY 2026–27 downloads include separate ITR schemas, validation rules and schema changes; the common utility was version 1.2.5, dated 16 October 2026, when checked. This does not establish TY 2026–27 filing readiness. Support only explicitly selected, eligible forms and years; reject unsupported cases. [ITD return downloads](https://www.incometax.gov.in/iec/foportal/downloads/income-tax-returns).
4. **Validate locally and remotely:** implement published schema and computation rules, then use the authorized validation/submission flow. Its success response includes `successFlag`, `arnNumber` and `transactionNo`; retain these alongside the exact submitted payload/version. HTTP acceptance alone is insufficient. [Submit API v1.1, sections 4–5](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-11/API_SubmitFlow_v1.1.pdf).
5. **Complete taxpayer verification:** the detailed e-Verify API documents taxpayer-chosen Aadhaar OTP/bank EVC/demat EVC and a taxpayer-provided code, with acknowledgement/year/form binding. Never persist verification codes or assume filing consent authorizes unattended verification. [e-Verify API v1.1, sections 5–6](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-11/API_Everify_Return_v1.1.pdf).
6. **Retrieve evidence and follow status:** retain acknowledgement and distinguish submission, pending verification, verification and subsequent processing. The portal exposes filed JSON, acknowledgement, return PDF and lifecycle details to authorized users. A generic status/refund API is not established by the reviewed public ERI overview. [Acknowledgement API](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-10/API_AcknowledgementFlow.pdf), [ITR status manual](https://www.incometax.gov.in/iec/foportal/help/how-to-know-the-itr-status).

The current published overview and detailed API PDFs are dated 2021. Their verification descriptions differ: the overview limits OTP modes to Type 3, while the detailed e-Verify specification describes Types 2 and 3. Some endpoint URLs remain `TBD`. Obtain the enabled mode matrix, actual endpoints, environments and current contracts during certification; do not resolve this by guessing an API route. [Overview, sections 2.3–4](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-11/ERI%20API%20Specification_v1.1.pdf), [detailed e-Verify specification](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-11/API_Everify_Return_v1.1.pdf).

For currently documented ITRs, verification/ITR-V generally has a 30-day limit; late or absent verification changes filing consequences and can leave the return invalid. Implement a visible pending-verification state and deadline rather than displaying completion at upload. [ITD verification-timeline FAQ](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/itr-v-faqs30-days-timeline-e-verification-returns).

## Exact missing integration work

Source inventory found private document/workflow foundations in `SalarySlip`, `TaxDeclaration` and payroll review/calculation services, but no TRACES/ERI submission implementation in the inspected Ruby services/controllers/models. This is a repository observation, not evidence about any separately held company/provider account.

| Deliverable | Missing integration or domain contract |
| --- | --- |
| Official certificate issuance | Deposited-TDS/statement reconciliation, filing receipt and processed-state ingestion; authorized TRACES retrieval; accountable employer signing; year-specific certificate provenance, corrections and delivery. Existing monthly slip imports do not establish these facts. |
| Authorized ITR transport | Approved ERI identity or a contracted authorized intermediary, certified environments, signing, scoped authentication and production permissions. No provider contract was verified. |
| Client data and return preparation | Expiring/revocable consent, PAN-bound prefill, complete taxpayer inputs, form eligibility, annual schema/validation versions and reconciliation. Employee deduction review is not a full return. |
| Filing lifecycle | Immutable reviewed payload, explicit submission authority, returned identifiers/errors, retry/unknown-outcome reconciliation, taxpayer verification, acknowledgement retention and independently observed status. Do not invent endpoint idempotency guarantees. |

## Smallest useful delivery path

These are implementation recommendations, not claims of delivered capability:

1. Keep annual estimates explicitly separate from official certificates and filed returns.
2. Add an import/review/distribution workflow for already issued, signed TRACES certificates, retaining issuer, recipient, law/year, statement provenance and original bytes. Reuse private attachment/access infrastructure; do not label a generated draft “Form 16/130 issued.”
3. Add a narrowly eligible, year-specific return-preparation export only after validating its JSON against the official schema, business rules and utility. Leave filing and verification to the taxpayer/authorized intermediary until integration acceptance is proven.
4. Choose approved Type 2 onboarding or a verified authorized-provider contract for the next filing slice. Treat certificate retrieval and ITR submission as separate acceptance tracks; prove each in its authorized test environment before enabling any real submission.
