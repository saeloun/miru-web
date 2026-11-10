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
approval-not-required work separately. Recorded time off alone is unclassified;
PTO decisions approved by an active owner or admin supply paid leave and opening/closing
balances. See [PTO policy adoption and decisions](../../payroll-pto-ledger.md).

For consultants with an approved PTO policy, approved leave decisions supply the
unpaid quantity; it cannot be overridden in the preview. Without a policy, enter
only explicitly confirmed unpaid hours and their decision/reason for the preview.
Select eligible reimbursement claims, then choose **Recalculate preview**. The scenario
uses `period base fee × (expected hours − confirmed unpaid hours) / expected hours`.
For an unchanged full month, the base is the contractual monthly fee. An explicitly
reviewed service-period fee replaces that base for a joining, exit or changed-terms month.
Missing work alone does not reduce the fee; historical negative PTO is never
deducted automatically. Changed inputs hide the old totals until recalculation.
These decisions are not saved payroll approvals.

Partial service months, missing service dates, midmonth fee changes and zero
expected hours require resolution before a fee/total estimate is shown.
Work/leave warnings remain visible for review. Tax withholding and other
adjustments are not applied to the estimate.

### Review a service-period fee

Open **Service-period fee review** in accounts preparation, or under **PTO and
decisions** in Consultant payroll. Check the active dates, scheduled time,
contractual terms, funding source and legal entity. Enter the agreed **Service-period
base fee (INR)** and a reason. This amount is before approved unpaid time; Miru
does not choose a calendar-day or working-day proration policy for you.

Save the basis before resolving leave. For example, an agreed INR 50,000 for 80
scheduled hours with 8 explicitly unpaid hours yields INR 45,000. Reimbursements,
withholding and other adjustments remain separate. The contractual monthly fee,
reviewed period base and final amount are shown separately in the review and India report.

Changing dates, applicable terms or the reviewed amount requires refreshed leave
decisions and a new payroll revision with both approvals. Unsubmitted reservations
that depend on this basis are released; unrelated recoveries are retained. A basis
already used by protected bank activity or consumed historical PTO cannot be rewritten.
Missing term coverage, inconsistent routing and zero scheduled time remain blocked.
Saving this review does not transfer money or send an accounts email.

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

Assigned accounts reviewers can read leave facts and review service-period fees
for configured consultants active during that run's month, including before the
first revision is prepared. Unconfigured or out-of-period staff are outside this
assignment; owners and admins retain historical review access.

The accounts reviewer opens the run and chooses who to include. Consultants with
unresolved data show **Not ready for payment** and don't hold up anyone else. For
each consultant, an owner/admin must first configure a reconciled PTO policy and
explicitly classify missing scheduled hours. The accounts reviewer prepares from
those approved quantities, selects reimbursements, adds other earnings,
deductions or withholding, and acknowledges any listed warnings. Acknowledgment
cannot replace the owner's leave decision or change its unpaid quantity. Missing
time alone never reduces the fee. Reimbursements are never prorated.

The accounts reviewer approves the revision, then the owner gives final approval.
Final approval reserves the selected claims, so they can't be edited, reviewed,
deleted, marked paid directly or included in another run. Changing source records,
claims or that month's consultant terms returns the run to draft until a new revision
is approved. Once a transfer exists for a month, new terms have to start in a later month.
A new revision starts from the current one, and a consultant with a transfer must keep
the same amounts and claims.

If an original transfer is cancelled without moving funds, or its India handoff
is voided, a carried leave reservation can still belong to the earlier revision.
Prepare and approve a fresh revision before creating a replacement payment.
This hold returns the whole run to draft, so other new payments also wait for
both approvals. Existing credit recording and reconciliation remain available.
Keep an original active handoff attached to its approved revision. If multiple
leave recoveries need return review, resolve each one before the group is complete.

### Request missing consultant details

An owner or the assigned accounts reviewer can choose **Request profile
completion** beside a consultant who needs bank or billing details. Miru emails
that consultant links to their own forms in the correct workspace. Other
consultants remain available for preparation. Billing facts already awaiting
accounts review are not treated as missing consultant information.

**Request email queued** means delivery is pending; **Request email sent** means
the mail transport accepted it. **Delivery needs review** holds an uncertain
send rather than automatically sending another email. A **skipped** request sent
no email because the details or access changed before delivery. Refresh the run
to see current requirements before requesting again.

Consultants complete their own forms, and accounts still reviews billing facts.
The request does not grant invoice authorization, verify a bank account or
approve a payment. Repeating a request for the same unchanged details does not
send another email, and requesting details preserves other unsaved selections.

## Pay through Mercury

When a configured consultant's bank details change, Miru queues a private review
notice for active workspace owners and assigned payroll accounts reviewers. The
email contains a sign-in link, without bank details or remuneration. Review and
verify the current beneficiary before preparing a new payment; an email never
verifies the account. Submitted transfers retain their original destination.
Unchanged saves and contact-only edits do not create another notice. Delivery
with an uncertain transport outcome is held for review rather than resent.

Payments go from your own Mercury account in USD, one request per transfer. The
amount owed stays in INR. The receiving bank does the conversion, so the final
INR credit is an estimate until accounts confirms it.

**Mercury requests stay off until an administrator turns them on for this server
and environment, and they haven't been tried against a real Mercury account yet.**

Before you start, a server administrator needs to:

- Set `MIRU_PAYROLL_ENABLED=true` and `MIRU_PAYROLL_SAELOUN_COMPANY_ID` to your company ID.
- Configure the Active Record encryption keys. Without them, the token can't be saved.
- Set `MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT` to `sandbox` or `live` when you're ready
  to create requests. It must match the connection's environment, and it's unset by
  default.

1. **Set up the connection (owner).** In Mercury, create a Custom API token with the
   `RequestSendMoney` scope (Send Money with Approval) and read access to accounts,
   recipients, send-money requests and transactions. Mercury's scope names for those
   reads aren't publicly documented, so check them when you create the token. Have
   someone other than the token creator approve requests. Custom scopes can't be edited
   later, and Mercury deletes tokens that go unused for 45 days.

   Enter the token, the source account ID, the expected legal name and the OUR fee. The
   token can't be viewed again. **Verify read access** checks the account and legal name.
   It doesn't prove the token can create payment requests. Mercury only confirms that on
   the first request, and a token without that permission leaves the first transfer as
   **Outcome unknown**, so get the scope right first.
2. **Link recipients (owner).** Onboard the consultant in Mercury first, then enter
   their existing Mercury recipient ID. Miru compares SWIFT, IFSC, account number
   and account holder with the Miru profile and refuses any difference. It doesn't
   create recipients or send invitations. Filling in a SWIFT code in Miru isn't
   Mercury setup, though it's required here even though Employee records marks it
   optional. If bank details change, verify the recipient again.
3. **Prepare the transfer review (owner).** Use Miru's stored USD to INR rate when
   one is less than 24 hours old, or enter a rate with its source and time. The
   principal is the INR amount divided by the rate less INR 1.50, rounded to cents.
   Quotes expire 24 hours after the rate was observed, not after you prepare them.
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
an owner, approves it. Any change needs verifying and approving again. While a month's
transfers can still complete, a split's amounts can't change and it can't be withdrawn. You
can still correct the spouse's bank details by requesting a split with the same allocation,
which is how to fix a failed wire to a closed account. A correction that hasn't been
approved yet can be withdrawn, which restores the approved split. A returned or held transfer
doesn't block a change. If the amounts change, anything left unsent in that month can't be
sent afterwards.

The split applies to the fee after adjustments. Reimbursements stay with the
consultant. Each transfer has its own principal, OUR fee, key and status, so a failed
transfer can be prepared again without resending the one that succeeded. The consultant
stays the service provider for income and tax purposes.

## Bank account entry

When setting or changing an account number in **Employee records**, enter it again
in **Confirm bank account number**. The entries must match exactly, including leading
zeros. Confirmation starts blank, clears when the number changes, and is never saved
as profile data. Unchanged account numbers and edits to other fields need no repeat
entry. The same requirement applies to direct API clients.

This entry check does not verify the beneficiary. Continue the recipient verification
and approval workflow after changing bank details; existing submitted transfers keep
their frozen destination.

## Invoice authorization

Configured consultants can open **Invoice authorization** in their profile settings
or Employee records. Read the displayed statement, explicitly confirm it, then
choose **Grant invoice authorization**. Owners and assigned accounts can inspect the status
and receipts, but cannot grant or withdraw on someone else's behalf. Accounts
preparation links to the consultant's authorization page without exposing their
broader private employee record.

Choose **Withdraw invoice authorization** to withdraw permission for future invoices.
The dedicated settings page retains this action after service ends while your
kept account remains signed into the workspace; granting again requires active
service. Turning the payroll feature off also preserves your existing history and
withdrawal action while blocking new grants and issuance. Each grant or withdrawal retains the statement, version, actor and date.
An existing permission can still cover a final invoice for past services after exit;
withdraw it explicitly if you no longer authorize that future issuance.
Older receipts remain available through history. Withdrawal preserves previous
receipts and any existing invoice or payment record.

Saving permission does not generate an invoice. Consultant invoice issuance still
needs verified legal/billing/tax facts, full settlement, numbering, document and
delivery workflows. The later issuer must recheck current permission when it issues
an invoice and retain the exact consent receipt.

## Billing identity and tax evidence

Configured consultants open **Billing identity** in their profile settings. Enter
the legal name and billing address, declare PAN and GST status, and upload the
applicable private PDF or image evidence. If PAN is unavailable, record why; if
GST treatment needs review, leave it unresolved until accounts can resolve it.
Miru checks identifier syntax and consistency, not government registration.

An eligible owner, admin or assigned accounts reviewer, other than the consultant,
reviews the exact submission and records a reason and explicit manual tax review.
Approving missing PAN also requires a separate acknowledgement. This does not
select a withholding rate, grant an exemption or authorize invoice issuance.
New payroll preparation and outgoing payment actions require the current approved
identity. A correction or revoked review requires a fresh review and payroll revision.

History and private evidence remain available to authorized people. Consultants
can correct facts for past services after exit while payroll remains enabled.
Turning payroll off preserves history and revocation of an existing approval;
it does not permit new submissions or approvals. Lost-response retries retain the
original command, while a confirmed conflict requires an explicit refresh before resubmission.

An existing transfer remains visible as **Existing transfer retained** when preparing
another consultant in the same run. Its approved amounts, claims and source stay
frozen. Retaining it does not create another payment. A new transfer or remaining
split leg still needs the current reviewed identity.

If supporting work/PTO facts or the accounts reviewer change after a transfer
starts, Miru can hold a remaining unsent leg even when its amount is unchanged.
There is currently no reviewed refresh operation for that retained line. Stop
and ask accounts to reconcile the bank status. Do not bypass the hold, replay a
send or record a credit without matching bank evidence. Recovery of this case
requires a separate workflow that preserves the original transfer and claim/PTO history.

## Not available yet

Consultant invoice issuance, government verification of tax identity, FIRC or FIRA
attachments, replacing returned funds, consultant split requests and Mercury
webhooks remain follow-on work.
A returned wire stays visible and can't be replaced from Miru. The India accounts
handoff, consultant bank-detail editing and explicit PTO policy/decision workflows
are described above and in Employee records; they remain subject to their workspace
rollout gates and payment-verification safeguards.
See the [complete issue requirements](../../superpowers/specs/2026-10-19-consultant-payroll-requirements.md)
for acceptance status.
