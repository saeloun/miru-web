# Miru salary slips, payroll integration, and India payments

Status: Release 1 implemented in the isolated worktree; later releases remain proposed and depend on provider access and statutory verification.

Scope update: the user subsequently requested native India employer payroll and tax preparation, including deductions/evidence, reimbursements, statutory contributions, consultants and company GST. See [the expanded design](2026-10-17-india-payroll-tax-design.md) and [research](../../research/2026-10-17-india-payroll-tax-research.md). This document's Release 1 remains the salary-slip import foundation; its provider-only assumptions do not limit the expanded product.

## Intent and decisions

Bring useful greytHR workflows into Miru, starting with salary slips. The user selected **import and publish approved slips from an existing payroll provider**. They also requested connecting existing Razorpay merchant accounts and creating new accounts from Miru for India payments.

Proposed delivery order: salary-slip import and employee downloads; Razorpay merchant onboarding; payroll data exchange. Each is independently deliverable. A payroll partnership must not delay salary-slip imports.

Miru remains the place employees work and retrieve documents. The payroll provider remains responsible for the salary calculation and statutory outputs in this design. This is an implementation choice for review, not a user-approved decision to exclude future native payroll.

## Current source evidence

Inspected at `96cd954b759e0cbb5f68f7c3b71b93611428dbfb` on 2026-10-17. Local `develop` and fetched `origin/develop` matched.

- `Employment` associates an employee with a company and holds employment metadata. Salary documents must belong to that employment, not merely a global user.
- `Company`, `Leave`, and `TimeoffEntry` already provide workforce and leave foundations; extend these rather than introduce parallel employee or leave systems.
- `PaymentsProvider`, `Api::V1::PaymentSettingsController`, and `PaymentSettingsPolicy` already support company-scoped Razorpay settings and owner/admin management.
- `PaymentProviders::RazorpayClient` uses merchant API keys. It protects the SDK's global authentication state with a mutex and restores it after requests.
- `PaymentProviders::RazorpayPaymentLinkService` already creates invoice payment links, including optional Route transfers. `Webhooks::RazorpayController` handles payment-link and payout events.
- `RazorpayPayout` belongs to an invoice payment. It is not a salary payment model and must not become one.
- Existing Razorpay setup is documented in `docs/product-guide/payments/02-razorpay.md`. No existing salary-slip model was identified in the inspected schema.

This was source inspection, not verification of deployed behavior. QMD returned older payment documentation, gbrain was keyword-only, and mgrep returned no useful matches; current source and official provider pages supplied the findings below.

## Useful greytHR capabilities and rollout

This is a fit assessment, not a promise to clone every greytHR module. The payroll feature reference covers salary components, payslips, settlements, advances, reimbursements, statutory documents, and reporting. [greytHR payroll](https://www.greythr.com/payroll-software/)

| Capability | Fit for Miru | Proposed treatment |
| --- | --- | --- |
| Salary-slip archive and employee self-service | First deliverable | Import approved PDFs, review, publish, authenticated downloads |
| Employee records and join/exit details | Existing foundation | Reuse employments; add provider employee mappings when a connector needs them |
| Leave, holidays, and loss-of-pay inputs | Strong follow-up | Reuse leave records; add reviewed payroll exports after agreeing provider definitions |
| Compensation history and salary revisions | Follow-up | Import effective-dated provider data when its contract is available |
| Expense reimbursement claims | Follow-up | Review existing expense workflow and add approval/payment tracking as needed |
| Form 16 and other payroll documents | Follow-up | Extend the document archive after salary slips; keep provider-generated originals |
| Payroll reconciliation and employer-cost reports | Follow-up | Add from authoritative structured payroll data; PDFs alone do not provide reliable totals |
| Loans, salary advances, arrears, and final settlements | Provider-led initially | Bring approved results and status into Miru when supported |
| Tax declarations and statutory calculations/filings | Provider-led | Do not invent Indian compliance calculations from timesheets |
| Attendance and overtime | Needs product definition | Billable time is not attendance or payable time; establish work schedules and approval rules first |
| Onboarding documents and offboarding checklists | Later | Reuse workforce records after the payroll/document foundation |

Recruiting, performance reviews, biometric hardware, insurance marketplaces, and engagement tools are outside these first releases. Their usefulness needs separate evidence.

## Release 1: import and publish salary slips

### User experience

Use Miru's existing layout, components, and `DESIGN.md`. Add a Salary slips page accessible to active non-client staff. Employees see their own published documents with period filters, newest first, and a download action. Empty states explain that slips appear after their administrator publishes them.

Owners/admins also have a management view. They upload one or more approved PDFs, explicitly assign each to an employee and pay month, and review all assignments before publishing. No filename guessing or automatic publication. The preview shows employee identity, period, original filename, and draft/published status. Failed rows remain drafts with actionable errors; valid rows may be published explicitly. Files may originate from greytHR, Razorpay Payroll, or another provider.

An import creates drafts. Publishing makes selected slips visible to their recipients; it does not mark a salary as paid. No payment is initiated. An incorrect published slip can be withdrawn and replaced, with the prior revision retained for audit and hidden from employees. No published file is silently overwritten.

### Data and access

- Add an employment-scoped salary-slip record with a normalized pay month, source/provider label, original PDF attachment, publication/withdrawal timestamps, importing/publishing actor, and revision/supersession reference. Use existing Rails attachment and validation patterns.
- Enforce one current published revision per employment and pay month at the database and transaction levels. Multiple corrections retain history. Do not extract financial amounts from PDFs or duplicate salary/bank/tax fields into JSON.
- Owners/admins manage documents only in their current company. Staff see only their own published current revisions in that company. Managers/bookkeepers get no additional access to coworkers' salaries; client-only users have none. Discarded employments cannot access the workspace archive. An active employee's documents in another company remain inaccessible.
- Authorization applies to lists, previews, downloads, imports, publication, withdrawal, and revision history. Scope records through the current company before lookup. Do not trust a submitted user/employment ID.
- Accept PDFs only, validate actual file type and a 5 MiB limit on the server, and validate attachment presence before publication. Reject unsupported or oversized files without publishing anything. Upload via the authorized controller; do not accept arbitrary existing blob IDs.
- Keep files in private storage. Download through an authenticated, authorized controller with attachment disposition and private/no-store caching. Do not return generic Active Storage blob URLs or signed blob identifiers. Confirm the selected storage service does not expose files publicly.
- Record import, publication, withdrawal, and download metadata in the existing audit mechanism. Exclude PDF contents and confidential fields from logs, event payloads, analytics, and error reports. Initial release has no emailed attachments or public sharing.
- Retain original documents and revision history; no new automatic deletion or employee-termination purge. Reuse existing workspace deletion behavior and document its effect before release.

### Acceptance and change surface

The deliverable includes migration/model, employment/company associations, authorization policy, API endpoints/serialization, private download handling, frontend API client and page/navigation, existing component styles/translations, focused factories/specs, and product documentation. No provider SDK or new dependency is needed for this release.

Verify import → draft → publish → employee list/download in the running app, including a correction and withdrawal. Focused specs cover cross-company and coworker access, client-only and discarded memberships, unpublished downloads, file validation, and competing publication attempts. Verify blocked requests return no document metadata or bytes. Check browser console errors and the required Vite build. Capture a screenshot using synthetic slips; never use real salaries as test fixtures.

## Release 2: connect or create a Razorpay merchant account

### Provider model

Use Razorpay's Technology Partner model. Miru's customers connect their own merchant accounts. Routing customer collections through a single Miru merchant account would require a separate funds-flow decision and is outside this design. Existing Route options are not authorization to impose a platform fee.

The proposed first implementation uses **Standard Co-branded Onboarding**, whose hosted flow supports both login and new-account signup/KYC. It requires partner enrollment, account activation, application registration, and co-branded capability enablement. New account creation does not imply immediate payment activation. [Onboarding businesses](https://razorpay.com/docs/partners/technology-partners/onboard-businesses)

### User flow and implementation boundary

An owner/admin opens Payment Settings → Razorpay and chooses Connect or create account. Razorpay hosts signup, identity verification, and consent, then returns to Miru. Show connection and payment activation separately: connected, onboarding under review, needs information, active, suspended/rejected, or reconnect required. Retain the current API-key connection for existing customers. Do not switch an existing merchant to a different account while invoices or unsettled payments depend on it; block replacement pending a separately reviewed migration.

Add OAuth start/callback/disconnect actions, encrypted connection credentials, and an explicit authentication mode to the existing provider model. Scope the one-use expiring callback state to initiating user, company, environment, and a fixed internal return path. Recheck permissions on callback. Rotate refresh credentials under a lock and make failed refreshes require reconnection. Keep app credentials in deployment secrets and all credentials out of browser responses/logs. [OAuth integration](https://razorpay.com/docs/partners/technology-partners/onboard-businesses/integrate-oauth/integration-steps)

Request payment access only initially. Access to RazorpayX resources or Payroll is a separate authorization and capability decision. Extend the existing client without losing its global SDK state restoration or company isolation. Disconnect/revocation stops new API operations while preserving invoice/payment records and reconciliation data. Give owners/admins clear status and recovery actions.

Use provider-authenticated account activation/revocation events with company/account binding and replay protection. Reuse payment-link fulfillment, but review its signature and account lookup paths for OAuth compatibility. A browser callback alone never marks an invoice paid. Validate provider account, invoice ownership, currency, and actual settled payment amount through the existing fulfillment contract. [Onboarding status](https://razorpay.com/docs/partners/technology-partners/onboard-businesses/status)

### Acceptance and change surface

Touches provider persistence, settings controller/policy/views, routes, frontend settings/API/types/translations, Razorpay client, payment-link authorization/signature handling, webhook verification/account routing, factories/specs, and setup docs. Verify exact OAuth API support for Payment Links and webhook provisioning against enabled partner test credentials before claiming end-to-end success. Preserve existing API-key and non-Razorpay payment flows.

Focused tests cover state mismatch/reuse/expiry/workspace switching, denied consent, merchant replacement, encrypted credentials, refresh races, revocation, forged/wrong-account/replayed webhooks, and API-key regression. Browser checks cover connect/create redirect, return states, reconnect, and disconnect. Provider test-account acceptance additionally covers new signup, existing-account consent, INR invoice payment, fulfillment, and refund/reconciliation behavior already supported by Miru. No live financial transaction is required for this acceptance.

## Release 3: RazorpayX Payroll automation

Razorpay Payroll documents HRMS partnerships, including greytHR, and directs requests for more integrations to sales. Some partnerships cost extra. These pages do not establish an available public Payroll API contract for Miru. RazorpayX payout API access is not evidence of Payroll access. [Payroll integrations](https://razorpay.com/docs/payroll/integrations)

The provider can manage salary processing, statutory outputs, reimbursements, and employee documents. Its employee dashboard exposes payslips and Form 16. These are product capabilities, not verified machine-readable endpoints. [Payroll overview](https://razorpay.com/docs/payroll/) and [Payroll documents](https://razorpay.com/docs/payroll/employees/payslips-form16)

Before a connector is implemented, obtain an approved integration contract covering authentication, employee/company identifiers, environments, supported input exports, payslip/document retrieval, payment/run status, events or polling, limits, idempotency, correction handling, and commercial entitlement. No invented endpoint, scraping of employee dashboards, or shared merchant key.

Start automation with reviewed employee mappings and supported data exchange, then read-only import of approved slips and payroll status into Release 1. Any export of payable days or reimbursements requires an admin preview and explicit submission. Missing timesheets must never silently reduce salary. Provider-confirmed artifacts remain drafts until an admin publishes them.

Submitting/executing payroll and moving money is a later release with its own approved workflow, approval authority, duplicate-run protection, authoritative status reconciliation, and failure recovery. That release must use a payroll-specific model rather than invoice payouts. Until the contract is confirmed, manually importing provider-generated PDFs is the complete supported workflow.

## External prerequisites and decisions left to the builder

No Razorpay account enrollment, external messages, credential retrieval, production changes, push, or deployment occurred during this research.

- Razorpay partner status, co-branded entitlement, app credentials, redirect registration, and test merchant availability are unverified. Inspect approved account metadata before requesting missing access; use `agent-vault` for secrets.
- Payroll partnership/API access and export formats remain unverified. This blocks the connector, not Release 1.
- Builder chooses exact class/route names, pagination, batch-size cap, and transaction implementation consistent with current Miru patterns. Keep the first upload workflow explicit and small; CSV manifests, ZIP extraction, OCR, PDF generation, notifications, and custom KYC collection are deferred.
- Financial-year summaries and payroll analytics require structured authoritative inputs and are not inferred from uploaded PDFs.

## Approval and verification status

User-selected first workflow: provider-generated salary-slip import/publication. The subsequent direction prioritizes employer payroll, with employee tax preparation next, and delegates routine implementation choices. Razorpay connect/create remains requested but unimplemented.

Release 1 adds private PDF imports, draft/publication/withdrawal history, employee downloads, company-scoped audit records and dashboard navigation. See the [implementation plan and verification record](../plans/2026-10-17-salary-slip-import.md). No native payroll/tax calculation, provider account integration, production change or deployment is included. The expanded India design records the remaining calculation and tax-readiness work.
