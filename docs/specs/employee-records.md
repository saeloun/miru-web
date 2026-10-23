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
| Bank details | Employee/admin maintain account holder, bank, branch, account number, IFSC and optional SWIFT. |
| Current salary | Admin sets amount, currency, frequency and effective date; employee can view it. Increment history is optional and deferred. |
| Previous payments | Admin records an external payment with paid date, amount, currency and reference; employee sees paginated history explicitly labeled as manually recorded. No provider settlement claim. |
| Contract | Admin uploads, employee/admin privately download. Retain uploaded versions. |
| Customizable saved reports | Admin saves a named selection of permitted columns and generates a private CSV for a selected month. Include insurance and salary presets. Save report definitions, not sensitive export snapshots. |
| Insurance fields | Reports include DOB, family, joining date, employee ID, designation and phone. |
| Salary fields | Reports include bank, recorded time off, working days, current salary and reimbursements. Define every time/expense field against existing sources; never invent balances or treat a pending expense as reimbursed. |
| Advance reminders | Company admin explicitly opts in; send active admins a reminder seven calendar days before active employees' birthdays and completed-year work anniversaries in company timezone. No year of birth in mail. Feb 29 uses Feb 28 in non-leap years. Record deliveries to avoid ordinary repeat-job duplicates. |

## Security and scope

New functionality uses the existing default-off payroll entitlement. Private
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
