# Employee records — issue 2461

Extend the payroll PR with private employee information, accounts documents,
admin reports and advance birthday/work-anniversary reminders. This does not
execute payments, calculate salary, or certify statutory filings.

## Acceptance

| Issue requirement | Behavior |
| --- | --- |
| DOB, address, personal email, phone, LinkedIn/GitHub | Reuse the existing user profile and its edit flow, including password protection for phone changes. Display these with the private record. |
| Joining date, employee ID, designation | Read from the current employment, so later employment updates appear automatically. Preserve existing IDs; never invent a universal SI prefix. |
| PAN copy | Employee or active company admin can upload and privately download PDF/JPEG/PNG copies. |
| Family details | Employee/admin maintain name, DOB, gender and relationship for each family member. |
| Emergency contact | Employee/admin maintain contact name and phone. |
| Bank details | Employee/admin maintain account holder, bank, branch, account number, IFSC and optional SWIFT. Changed nonblank account numbers require an exact second entry. |
| Current salary | Admin sets amount, currency, frequency and effective date; employee sees terms effective today in the company timezone. Retained salary versions require administrator review when unresolved. |
| Previous payments | Admin records an external payment with paid date, amount, currency and reference; employee sees paginated history explicitly labeled as manually recorded. No provider settlement claim. |
| Contract | Admin uploads, employee/admin privately download. Retain uploaded versions. |
| Customizable saved reports | Admin saves a named selection of permitted columns and generates a private CSV for a selected month. Include insurance and salary presets. Save report definitions, not sensitive export snapshots. |
| Insurance fields | Reports include DOB, family, joining date, employee ID, designation and phone. |
| Salary fields | Reports include bank, recorded time off, working days, current salary and reimbursements. Define every time/expense field against existing sources; never invent balances or treat a pending expense as reimbursed. |
| Advance reminders | Company admin explicitly opts in; send admins active on the send day a reminder seven calendar days before active employees' birthdays and completed-year work anniversaries in company timezone. Exclude events after a known final employment date; include events on that date. No year of birth in mail. Feb 29 uses Feb 28 in non-leap years. Record deliveries to avoid ordinary repeat-job duplicates. |

## Security and scope

Employee records follow the active workspace/profile policy independently of the
payroll rollout gate. Payment tools and invoice-consent grants have their own gates. Private
records belong to employment, not a global user profile. Only active admins
and the active employee themselves can access them in the current company.
Clients, coworkers and former employees cannot. An admin of another company
cannot access a shared user's employment in this company.

Encrypt new family/bank/emergency/salary data at rest using Rails encryption.
Do not add private fields to shared team/profile responses. Filter submitted
private values and payment notes from logs. Audit metadata, never raw values.
Serve document and CSV downloads through authorization with attachment,
private/no-store and nosniff headers. Validate document type, size (5 MiB),
and ownership; never expose public blob URLs. Escape CSV formula cells.
Require company identity on mutations to prevent stale-tab writes.

UI uses the current profile/team layout and existing controls. Staff see their
own record; admin controls are absent for staff. All labels and empty/error
states explain manual payment recording and report source limitations. Test
desktop and mobile with synthetic data. No real mail or payment during QA.

## Bank account confirmation API

For `PATCH /api/v1/employee_records`, send a matching string in
`employee_record.bank_account_number_confirmation` when changing or first setting
`employee_record.private_details.bank_account_number`. Keep leading zeros; JSON
numbers are not accepted as confirmation. Missing/mismatched/malformed confirmation
returns422 before encrypted data or audit history changes. The entire nested
request is filtered; confirmation is never persisted or returned.

Confirmation is unnecessary when the account field is absent, unchanged or cleared.
Contact/salary-only API updates keep their existing behavior. The shared self/admin
editor starts confirmation blank and clears it on number changes, successful save
or cancellation. Failed saves retain the entered draft. Existing programmatic model
imports and the spouse/split confirmation workflow are unchanged. Double entry does
not establish bank ownership; recipient verification and payment readiness still apply.

## Reviewing uncertain salary history

Older salary versions may represent either valid history or replaced scheduled raises.
Active versions without review metadata block current salary and compensation-cost
results with `compensation_history_requires_review`; no amount is guessed. Salary
settings remain editable. Entering a correction does not acknowledge unknown rows.
CSV salary fields use the same current-salary reader, not the selected export month,
and show `Administrator review required` while history is unresolved.

The first salary-history entry from the profitability report also preserves existing
salary settings as an unreviewed observation. Original dates stay intact; undated
settings are observed on the company day without adding a salary start date.

Employee-record API responses keep configured salary settings in `private_details`
and expose effective terms separately in `current_salary`. When
`compensation_history_requires_review` is true, all four `current_salary` values
are null; configured settings remain available to the existing editor.

Owners and admins can open `/employee-records/:employment_id/salary-history` from
the profile or compensation report warning, including in free workspaces and for
retained historical employments. Employees see the warning without admin history.
While a profile draft is being edited, save or cancel it before opening salary review.
Every unresolved version requires retain or mark-as-abandoned; already reviewed
rows are read-only. Submission checks the workspace and full active-ID set under
the employment lock. Decisions and actor/ID-only audit commit together, preserving
encrypted salary bytes, dates and row IDs. No automatic backfill is performed.

Apply both salary metadata migrations before activating the new readers and stop
old writers during activation. Inventory/review production history before enabling
affected financial calculations. Keep schema forward on code rollback; the review
migration refuses rollback after retain or abandon decisions, and the supersession
migration protects used retirement metadata. Real browser QA
and production review remain release prerequisites.

See the [salary-history review design](../superpowers/specs/2026-11-16-salary-history-review-design.md),
[recorded synthetic QA](../qa/profile-current-salary-2461/README.md), and
[compensation report guide](../ai/compensation-profitability.md).
