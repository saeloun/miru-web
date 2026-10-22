# Employee records implementation plan

Spec: `docs/specs/employee-records.md` (binding authority).

## Global Constraints

- Work only in `/Users/sward/.config/superpowers/worktrees/miru-web/payroll-razorpay-design` on `feature/payroll-razorpay-design`.
- Preserve unrelated work. Use apply_patch for manual edits. No new dependencies. Follow existing Rails/React patterns and keep code small.
- New private functionality is gated by `Payroll::Entitlement`; only active current-company admins or the employee themselves may access an active employment. Never add private fields to shared team/profile responses.
- Encrypt new private data, filter logs, authorize private downloads, validate uploads, require company identity on mutations, escape CSV formula cells.
- Payment records are manual records of external payments; no payment execution or settlement verification. Existing payroll calculations and approved-slip imports keep their current meanings.
- No production changes, real email, payment/provider calls, GitHub posts, pushes, history rewrites or subagents by implementers. Commit task changes locally. Controller handles delivery.
- Run focused meaningful specs sequentially against the local test database. For JS changes run `rtk mise exec -- timeout 30 bin/vite build`; controller verifies real Brave UI before delivery.

## Task 1: Private records, documents, salary and payment API

Own new models/migrations/controllers/policies/serializers and focused specs,
`config/routes/api.rb`, and parameter filtering. Read the spec first. Reuse
existing profile/employment fields; inspect current API authorization and
salary-slip attachment patterns before coding.

Create an employment-owned private record with encrypted JSON Hash details:
`family_members` (array of name/date_of_birth/gender/relationship),
`emergency_contact_name`, `emergency_contact_phone`, `bank_account_name`,
`bank_name`, `bank_branch`, `bank_account_number`, `bank_ifsc`, `bank_swift`,
`salary_amount`, `salary_currency`, `salary_frequency`, `salary_effective_on`.
Salary keys are admin-only. Reject unknown or structurally invalid input;
allow clearing optional data. Bound family to 20 and names/text lengths,
validate dates and no future DOB, positive two-decimal salary, valid supported
currency, monthly/annual frequency, numeric account number and Indian IFSC /
SWIFT format when present. Do not require all fields for initial save.

Use version-preserving attachments for PAN and contracts, validated PDF/JPEG/
PNG <=5 MiB. Contract upload admin only. Scope attachment lookup through the
authorized employment, stream with private/no-store/nosniff, no public URLs.
Add a paginated manual employee-payment ledger with paid_on, positive
two-decimal amount, currency, reference, note and creator. Admin create only;
unique reference per employment prevents accidental duplicate recording.

Provide coherent current-company API under `/api/v1/employee_records`:
GET show with optional `user_id` (default current user), PATCH update with
`employee_record: {company_id, user_id, private_details: {...}}`;
POST `documents` with `employee_document: {company_id,user_id,kind,file}`;
GET `documents/:id` with user_id and kind; GET `payments` with user_id/page;
POST `payments` with `employee_payment: {company_id,user_id,paid_on,amount,currency,reference,note}`.
Return one documented response contract, including existing personal and
employment values, private_details, document metadata, can_manage, company_id.
Use ISO dates. Return existing private record as empty defaults without
creating a row on GET. Payment history is a separate paginated response.

Test owner/staff permissions, cross-company shared user, coworker/client/
former-employee denial, gate off, stale company mutation, encryption, staff
salary rejection, malformed details and upload checks, byte-exact private
document download and contract restriction, payment validation/pagination.
Run relevant existing payroll/profile specs if their shared code changes.
Document exact API response shapes in the report for Task 3. Commit and report.

## Task 2: Admin reports and opt-in occasion reminders

Own new report/settings/reminder models, migrations, controllers/services,
job/mailer/views and focused specs; extend `config/routes/api.rb` and
`config/solid_queue.yml`. Consume Task 1's encrypted record and private auth
rules without weakening them. Read the spec first and inspect existing time
off, timesheet, expense and holiday models/services before defining columns.

Admin-only saved employee report definitions: name and whitelist columns,
insurance/salary presets, index/create/update/delete and GET authorized CSV
download for selected YYYY-MM month. APIs under `/api/v1/employee_reports`;
mutations require company_id. Include existing personal/employment facts,
private family/bank/current salary, and clearly named month-specific time-off,
working-day and reimbursement fields. Use actual approved/recorded sources;
do not label weekday counts as approved PTO or pending expenses as reimbursed.
Keep CSV bounded, company scoped and formula safe. Explain field semantics
in metadata returned for UI; no sensitive saved snapshots.

Company-level `GET/PATCH /api/v1/employee_record_settings` with
`employee_record_setting: {company_id, occasion_reminders_enabled}` defaults
false, admin only. Job runs daily/hourly via existing recurring config and
checks opt-in + entitlement. Seven-calendar-day timezone comparison, active
employees/admins, completed anniversaries, leap policy from spec, mail links
to the current employee private profile. Delivery log deduplicates repeated
job runs per employment/admin/kind/event date. Avoid marking failed sends as
delivered; tests use captured test mail only. Test rendered HTML/text and
date/year boundaries, opt-in/out, inactive users, repeat runs and send failure.

Report API shapes, column semantics and preview procedure to Task 3.
Run focused specs, commit and report.

## Task 3: Profile employee-record and admin report UI

Own new employee-record/report/settings React components, API client,
profile routes/layout integration, translations, browser specs and any
minimal QA fixture additions. Consume Task 1/2's actual reported contracts.
Read the spec and DESIGN.md. Use existing profile/team layout and controls.

Add a gated Employee records profile tab for staff/admins (not clients):
read existing personal/employment facts, edit family/emergency/bank, display
admin-managed current salary, upload/download PAN/contracts by permissions,
show paginated manual payment history and admin record-payment form.
Link existing contact editor instead of bypassing phone password checks.
Admin can set salary and upload contracts. Mask bank number in read view;
editing/reports remain explicitly authorized. Clear field and upload errors,
accessible labels, empty/loading states, no private data outside tab.

Admin-only report UI in this tab or a nested profile route: save named
column selections, insurance/salary presets, choose month, download CSV,
delete definitions, toggle opt-in occasion reminders. Display field source
semantics. Staff never sees admin report/reminder controls.

Add focused real-browser specs for staff save/documents and admin salary/
payment/report/reminder flow, privacy/role failures and mobile layout. Follow
current system spec/auth fixtures; use only synthetic data. Run focused specs,
lint/format touched frontend and required Vite build. Report paths/routes and
seed/browser steps for controller's Brave QA and mail previews. Commit.

## Task 4: Final requirements/security/UI verification and delivery

Controller owns evidence and PR updates. Request broad final independent
review against issue/spec and all Task 1-3 commits. Fix actionable issues with
focused regression checks. Verify real Brave desktop/mobile staff/admin
flows, document bytes/headers, report CSV, and rendered reminder desktop/mobile
previews without actual email. Complete Vite build, focused integration suite,
publish synthetic screenshots and update PR acceptance matrix. Push this
branch and deploy only the existing isolated Render review service, then
verify health and role/feature flows. Observe exact-head CI and report limits.
Do not merge or deploy production.
