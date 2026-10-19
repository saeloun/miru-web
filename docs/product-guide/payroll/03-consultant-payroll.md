---
id: consultant-payroll
title: Consultant payroll review
---

Owners and admins can open **Consultant payroll** to review a month's consultant fees and reimbursement candidates. This is a preview: it does not approve payroll, reserve claims, transfer money, send accounts instructions or issue invoices. Other staff cannot access coworkers' consultant terms or reports.

This workflow follows Miru's internal payroll rollout gate and is unavailable until the server explicitly enables the authoritative company ID. A role or company name alone does not enable it. The same gate protects API access, direct calculations and term creation; salary-slip archives and tax-evidence collection remain separate workflows.

Choose **Add consultant terms**, select a current staff member, and enter the effective date, INR monthly fee, contracting legal entity, funding source, scheduled weekdays/hours and reason. Save a new version to correct terms; earlier versions remain in **Terms history**. A correction with the same effective date uses the newest version. The funding source is a label for preparation; it does not connect a bank account or change the contracting entity. Workspace/employment deletion follows Miru's existing deletion behavior and removes associated terms.

Select the payroll month and expense cutoff. Defaults and the latest allowed date use the company timezone. The report shows configured consultants active in that period, expected schedule hours, recorded hours across review states, fractional recorded days (`hours / 8`) and the fee estimate. Applicable holiday dates count once. **Review [name]** shows approved, pending, rejected and approval-not-required work separately. Recorded time off is unclassified; approved paid leave and opening/closing PTO require a future approval/balance workflow.

Enter only explicitly confirmed unpaid hours and their decision/reason, select eligible reimbursement claims, then choose **Recalculate preview**. The scenario uses `monthly fee × (expected hours − confirmed unpaid hours) / expected hours`. Missing work alone does not reduce the fee; historical negative PTO is never deducted automatically. Changed inputs hide the old totals until recalculation. These decisions are not saved payroll approvals.

Partial service months, missing service dates, midmonth fee changes and zero expected hours require resolution before a fee/total estimate is shown. Work/leave warnings remain visible for review. Tax withholding and other adjustments are not applied to the estimate.

Invalid historical work or leave durations make the affected source totals unavailable and show a warning to review the original entries. They do not create unpaid hours or deductions.

Reimbursements are selected explicitly, separately from fee proration. Eligible claims belong to that person/workspace, are approved and unpaid, use INR, and were both incurred and approved by the cutoff in the company timezone. The preview shows amount, date, description and receipt count; review original receipts in **Expenses**. Up to 100 claims can be selected in one preview. Changed, paid or otherwise ineligible selections require a refresh. Selection does not prevent another expense settlement; payroll reservation will be added with locked runs.

Historical claims without a recorded approval time, foreign-currency claims and claims with invalid non-finite, zero or negative reimbursement amounts require review and are excluded. Miru does not guess an old approval date or an exchange rate. Editing an approved claim's amount, currency, date, claimant or company returns it to submitted and clears its recorded approval time until reapproved. Repeating approval on an unchanged approved claim preserves the original timestamp. A financial edit based on an older approval state is rejected; reload the claim before editing so a competing approval or explicit reconfirmation cannot silently apply to changed facts.

For an approved historical claim with no recorded approval time, an authorized reviewer can choose **Confirm approval** in its **Expenses** row menu. This records a current review date; it does not backdate approval to an earlier payroll cutoff.

Recording an expense as paid prevents further edits, approval, rejection or resubmission. Payment/review transitions and employee resubmission reload the claim under a row lock; validated writes cannot change settled financial facts, approval time or payment status/timestamp. Reversing a settlement needs a separate reviewed accounting workflow.

Permanent user deletion is blocked when retained payroll records reference that person as uploader, publisher, reviewer or terms creator. The records and their attribution remain intact; deactivate workspace access instead. A blocked deletion does not create a successful-deletion audit record.

Verified beneficiaries, actual funding accounts, PTO decisions/accrual/recovery, delegated accounts permissions, locked runs, withholding, India handoff, Mercury wires/spouse splits, credit reconciliation and consultant invoices/remittance documents remain required follow-on work. See the [complete issue requirements](../../superpowers/specs/2026-10-19-consultant-payroll-requirements.md) for acceptance status.
