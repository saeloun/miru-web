---
id: consultant-payroll
title: Consultant payroll review
---

Owners and admins can open **Consultant payroll** to review a month's consultant
fees and reimbursement candidates. This page is a preview: it does not approve
payroll, reserve claims or transfer money. Use **Payroll** for that, as described
below. Other staff cannot access coworkers' consultant terms or reports.

This workflow follows Miru's internal payroll rollout gate and is unavailable
until the server explicitly enables the authoritative company ID. A role or
company name alone does not enable it. The same gate protects API access, direct
calculations and term creation; salary-slip archives and tax-evidence collection
remain separate workflows.

Choose **Add consultant terms**, select a current staff member, and enter the
effective date, INR monthly fee, contracting legal entity, funding source,
scheduled weekdays/hours and reason. Save a new version to correct terms;
earlier versions remain in **Terms history**. A correction with the same
effective date uses the newest version. The funding source is a label for
preparation; it does not connect a bank account or change the contracting
entity. Workspace/employment deletion follows Miru's existing deletion behavior
and removes associated terms.

Select the payroll month and expense cutoff. Defaults and the latest allowed
date use the company timezone. The report shows configured consultants active in
that period, expected schedule hours, recorded hours across review states,
fractional recorded days (`hours / 8`) and the fee estimate. Applicable holiday
dates count once. **Review [name]** shows approved, pending, rejected and
approval-not-required work separately. Recorded time off is unclassified;
approved paid leave and opening/closing PTO require a future approval/balance
workflow.

Enter only explicitly confirmed unpaid hours and their decision/reason, select
eligible reimbursement claims, then choose **Recalculate preview**. The scenario
uses `monthly fee × (expected hours − confirmed unpaid hours) / expected hours`.
Missing work alone does not reduce the fee; historical negative PTO is never
deducted automatically. Changed inputs hide the old totals until recalculation.
These decisions are not saved payroll approvals.

Partial service months, missing service dates, midmonth fee changes and zero
expected hours require resolution before a fee/total estimate is shown.
Work/leave warnings remain visible for review. Tax withholding and other
adjustments are not applied to the estimate.

Changing a selected holiday's calendar date can leave its recorded leave date
unchanged. If either date falls in the service period, conflicting dates make
expected hours and fee/total estimates unavailable until the source dates are
reconciled. The preview explains the discrepancy and preserves both source
records; it does not choose an observance date or move leave automatically.
Unrelated periods remain available.

Invalid historical work or leave durations make the affected source totals
unavailable and show a warning to review the original entries. They do not
create unpaid hours or deductions.

Reimbursements are selected explicitly, separately from fee proration. Eligible
claims belong to that person/workspace, are approved and unpaid, use INR, and
were both incurred and approved by the cutoff in the company timezone. The
preview shows amount, date, description and receipt count; review original
receipts in **Expenses**. Up to 100 claims can be selected in one preview.
Changed, paid or otherwise ineligible selections require a refresh. Selecting a
claim in this preview doesn't reserve it. Claims are reserved when an owner gives
final approval to a payroll run.

Historical claims without a recorded approval time, foreign-currency claims and
claims with invalid non-finite, zero or negative reimbursement amounts require
review and are excluded. Miru does not guess an old approval date or an exchange
rate. Editing an approved claim's amount, currency, date, claimant or company
returns it to submitted and clears its recorded approval time until reapproved.
Repeating approval on an unchanged approved claim preserves the original
timestamp. A financial edit based on an older approval state is rejected; reload
the claim before editing so a competing approval or explicit reconfirmation
cannot silently apply to changed facts.

For an approved historical claim with no recorded approval time, an authorized
reviewer can choose **Confirm approval** in its **Expenses** row menu. This
records a current review date; it does not backdate approval to an earlier
payroll cutoff.

Recording an expense as paid prevents further edits, approval, rejection or
resubmission. Payment/review transitions and employee resubmission reload the
claim under a row lock; validated writes cannot change settled financial facts,
approval time or payment status/timestamp. Reversing a settlement needs a
separate reviewed accounting workflow.

Permanent user deletion is blocked when retained payroll records reference that
person as uploader, publisher, reviewer or terms creator. The records and their
attribution remain intact; deactivate workspace access instead. A blocked
deletion does not create a successful-deletion audit record.

## Prepare and approve a payroll run

Open **Payroll** and use **Make Payment**. Choose the month, an accounts reviewer
and a different owner. This creates a run for review and moves no money.

The accounts reviewer opens the run and chooses who to include. Consultants with
unresolved data show **Not ready for payment** and don't hold up anyone else. For
each consultant, the reviewer can enter confirmed unpaid hours with a reason,
select reimbursements, and add other earnings, deductions or withholding, then
acknowledges any listed warnings. Missing time never reduces the fee unless
unpaid hours are entered. Reimbursements are never prorated.

The accounts reviewer approves the revision, then the owner gives final approval.
Final approval reserves the selected claims, so they can't be edited, reviewed,
deleted, marked paid directly or included in another run. Changing source records
or claims returns the run to draft until a new revision is approved.

## Pay through Mercury

Payments go from your own Mercury account in USD, one request per transfer. The
amount owed stays in INR. The receiving bank does the conversion, so the final
INR credit is an estimate until accounts confirms it.

**Mercury requests stay off until an administrator turns them on for this server
and environment, and they haven't been tried against a real Mercury account yet.**

1. **Set up the connection (owner).** Enter a scoped API token, the source account
   ID, the expected legal name and the OUR fee. The token can't be viewed again.
   **Verify read access** checks the account and legal name. It doesn't prove the
   token can create payment requests; Mercury only confirms that on the first
   request.
2. **Link recipients (owner).** Onboard the consultant in Mercury first, then enter
   their existing Mercury recipient ID. Miru compares SWIFT, IFSC, account number
   and account holder with the Miru profile and refuses any difference. It doesn't
   create recipients or send invitations. Filling in a SWIFT code in Miru isn't
   Mercury setup.
3. **Prepare the transfer review (owner).** Use Miru's stored USD to INR rate when
   one is less than 24 hours old, or enter a rate with its source and time. The
   principal is the INR amount divided by the rate less INR 1.50, rounded to cents.
   Quotes expire after 24 hours.
4. **Create the approval request (owner).** Check the principal, OUR fee, company
   debit, purpose and masked accounts, then choose **Create Mercury approval
   request**. Miru rechecks approvals, roles, bank details, the recipient, the
   quote and the balance first. A different person approves the request in Mercury.
5. **Track it.** Miru reads request and transaction status automatically every 30
   minutes, or when you choose **Refresh bank status**. Approved or sent doesn't
   mean credited.
6. **Record the credit (owner or accounts reviewer).** Enter the actual INR credited,
   the date and the bank reference. A lower credit stays **Partially credited** until
   accounts records a resolution, and it never changes what the consultant was owed.
   When every transfer is credited, the reserved claims are marked paid.

### If the outcome is unknown

After a timeout or an unclear response, Mercury may have accepted the request, so
Miru shows **Outcome unknown** and blocks retries and replacements. Choose **Check
Mercury for this request**. An exact match links automatically. Other possible
matches are only listed, and the owner must confirm one after checking it in
Mercury.

Finding nothing doesn't prove that no request exists. To retry, the assigned accounts
reviewer records evidence, such as a Mercury support reference, that no request exists.
Then someone else can retry with the same key or void the transfer. Miru checks Mercury
again first and stops if a possible match has appeared.

If Miru can't match a wire to a request exactly, it shows **Reconciliation required**.
Accounts can still record the credit with its bank reference, and the history stays.

### Spouse splits

The owner or accounts reviewer enters the spouse's legal name and bank details, the
account number twice, and a percentage or fixed INR amount with the other party
taking the remainder. The assigned accounts reviewer verifies it and a different person,
an owner, approves it. Any change needs verifying and approving again, and a split can't
change while one of its transfers is in flight.

The split applies to the fee after adjustments. Reimbursements stay with the
consultant. Each transfer has its own principal, OUR fee, key and status, so a failed
transfer can be prepared again without resending the one that succeeded. The consultant
stays the service provider for income and tax purposes.

## Not available yet

Consultant invoices, FIRC or FIRA attachments, replacing returned funds, the India
account handoff, consultant self-service for bank details and split requests, bank
change notifications, Mercury webhooks and the PTO ledger and exception decisions are
required follow-on work. A returned wire stays visible and can't be replaced from Miru.
See the [complete issue requirements](../../superpowers/specs/2026-10-19-consultant-payroll-requirements.md)
for acceptance status.
