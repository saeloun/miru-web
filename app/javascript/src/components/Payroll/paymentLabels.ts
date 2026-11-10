const labels: Record<string, string> = {
  service_fee_review_required:
    "Review the service-period base fee before resolving leave and preparing payroll.",
  service_fee_review_changed:
    "The service-period fee or its source changed. Review leave and prepare a new payroll revision.",
  service_terms_missing:
    "Configure compensation terms for every active service date before reviewing this fee.",
  service_routing_changed:
    "The service period has different funding sources or legal entities. Resolve its payment arrangement first.",
  service_period_empty: "This month has no active service dates.",
  pto_policy_required:
    "Configure an approved PTO policy and reconciled opening before payroll approval.",
  pto_decision_required:
    "An owner or admin must record an explicit leave treatment before payroll approval.",
  pto_decision_source_changed:
    "Attendance changed after the leave decision. Refresh and approve its treatment again.",
  pto_accrual_pending:
    "Configured accrual is not posted. Post it or resolve the protected-period review before approving payroll.",
  returned_review: "Prior credit needs owner review",
  pto_decision_superseded:
    "This leave recovery moved to a later reviewed decision. Prepare a fresh revision before submitting.",
  pto_recovery_return_review:
    "Prior credit needs explicit owner review before this recovery is settled.",
  pto_recovery_already_claimed:
    "Another payroll already reserved or settled this recovery. Refresh and reconcile it.",
  pto_reservation_revision_changed:
    "Prepare and approve a fresh payroll revision before creating a replacement payment.",
  pto_historical_source_changed:
    "The original leave decision or attendance changed. Correct or cancel the unsubmitted historical recovery before payroll approval.",
  ready_for_submission: "Ready for submission",
  submission_uncertain: "Outcome unknown. Reconcile before anything else",
  submission_rejected: "Mercury rejected this request",
  voided: "Voided",
  returned: "Returned",
  transaction_failed: "Failed",
  transaction_cancelled: "Cancelled",
  transaction_blocked: "Blocked by Mercury",
  partially_credited: "Partially credited",
  credited: "Credited",
  credited_shortfall_resolved: "Credited; shortfall resolved by accounts",
  reconciliation_required: "Reconciliation required",
  credited_unlinked: "Credited on manual proof. Mercury link unresolved",
  cancelled_after_approval: "Mercury cancelled this after approving it",
  failed_after_sent: "Mercury reported failure after sending or crediting",
  candidates_must_be_resolved:
    "Mercury lists a possible match. Resolve it first",
  scan_incomplete: "Mercury's list was too long to check completely",
  void_stale_transfer_first:
    "A prepared transfer no longer matches. Void it first",
  allocation_changed: "The allocation changed. Void and prepare again",
  rate_implausible: "That rate is outside 50 to 200 INR per USD. Check it",
  split_locked_by_bank_activity:
    "A transfer for this consultant can still complete, so the split's amounts can't change. You can correct bank details if the allocation stays the same",
  request_mismatch: "Mercury's request differs from this transfer",
  transaction_mismatch: "Mercury's transaction does not match this transfer",
  multiple_transactions:
    "Mercury lists more than one transaction for this request, so credit is on hold",
  transaction_list_incomplete: "Mercury's transaction list was incomplete",
  transaction_not_found: "No transaction found since approval",
  outcome_unknown: "Mercury's response was unclear",
  response_mismatch: "Mercury's response differs from this transfer",
  response_malformed: "Mercury's response could not be read",
  awaiting_mercury_approval: "Awaiting Mercury approval",
  bank_rejected: "Rejected in Mercury",
  bank_cancelled: "Cancelled in Mercury",
  processing: "Processing",
  sent_awaiting_credit: "Sent. Awaiting credit confirmation",
  bank_approved_awaiting_transaction:
    "Approved in Mercury. Awaiting the transaction",
  run_not_approved: "Payroll needs both approvals on the current revision",
  connection_missing: "Set up the Mercury connection",
  connection_unverified: "Verify read access to the Mercury account",
  not_consultant_line: "Only consultant lines can be paid here",
  unsupported_currency: "Only INR entitlements can be paid here",
  invalid_net_amount: "The approved net amount must be positive",
  terms_missing: "Consultant terms are missing",
  funding_not_mercury: "Funding is not set to US Mercury",
  terms_changed_during_month: "Terms changed during the month and need review",
  terms_changed: "Consultant terms changed after review",
  consultant_inactive: "Consultant is no longer active",
  split_pending_approval: "A spouse split awaits verification and approval",
  split_changed: "The spouse split changed. Prepare again",
  bank_profile_incomplete:
    "Add account holder, bank name, country code, account currency, account number, IFSC and SWIFT in Employee records",
  spouse_bank_profile_incomplete: "Spouse bank details are incomplete",
  recipient_not_linked: "Link the consultant's Mercury recipient",
  spouse_recipient_not_linked: "Link the spouse's Mercury recipient",
  bank_details_changed: "Bank details changed. Verify the recipient again",
  spouse_bank_details_changed:
    "Spouse bank details changed. Verify the recipient again",
  recipient_changed: "Mercury recipient changed. Verify it again",
  recipient_inactive: "That Mercury recipient is not active",
  recipient_not_international_wire:
    "That Mercury recipient has no international wire details",
  recipient_swift_mismatch: "SWIFT differs from the Miru profile",
  recipient_ifsc_mismatch: "IFSC differs from the Miru profile",
  recipient_account_mismatch: "Account number differs from the Miru profile",
  recipient_name_mismatch: "Account holder differs from the Miru profile",
  recipient_check_failed: "Could not read the Mercury recipient",
  recipient_id_invalid: "Enter a valid Mercury recipient ID",
  allocation_leaves_empty_transfer: "The split would leave an empty transfer",
  allocation_exceeds_split_base: "The fixed amount exceeds the fee being split",
  account_number_mismatch: "The account numbers do not match",
  split_not_verified: "Accounts must verify this split first",
  split_approver_must_differ: "The approver must differ from the verifier",
  split_not_current:
    "A newer split exists. Reload, and withdraw any pending correction first",
  rate_unavailable: "No fresh stored USD to INR rate. Enter one manually",
  rate_invalid: "Enter a valid rate and time",
  rate_source_missing: "Name the rate source",
  rate_not_positive: "The rate less INR 1.50 must be positive",
  rate_stale_or_future: "The rate must be from the last 24 hours",
  principal_out_of_range: "The USD principal is outside Mercury's limit",
  bank_activity_requires_same_amounts:
    "A transfer is in flight, so the amounts must stay unchanged",
  writes_disabled: "Mercury requests are switched off on this server",
  quote_expired: "The quote expired. Void and prepare a fresh one",
  revision_changed: "A newer revision exists. Prepare again",
  connection_changed: "The Mercury connection changed. Prepare again",
  source_account_ineligible:
    "Couldn't confirm the source account. It may be inactive, its legal name may differ, or Mercury may have refused the read",
  mercury_read_failed:
    "Mercury refused or didn't answer. Check the token, its read permissions and the environment",
  insufficient_balance: "The balance does not cover principal and fees",
  reconcile_before_retry: "Reconcile the earlier attempt first",
  submission_in_progress: "A submission is in progress",
  already_submitted: "Already submitted",
  instruction_closed: "This transfer is closed",
  instruction_tampered: "This transfer's frozen details changed. Do not send",
  attester_cannot_retry:
    "The person who attested absence cannot also retry the transfer",
  provider_status_unavailable: "Mercury's status could not be read",
  request_does_not_match: "That request does not match this transfer",
  request_id_invalid: "Enter a valid request ID",
  request_id_known:
    "Mercury returned a request for this transfer. Check it in Mercury. It must be cancelled there with no transaction before this can continue",
  absence_evidence_required:
    "Enter a reference using letters, numbers and basic punctuation",
  credit_amount_invalid: "Enter a plain INR amount such as 100000.50",
  credit_date_invalid: "Enter a credit date that is not in the future",
  credit_reference_invalid: "Enter a transaction reference",
  credit_not_recordable: "Credit cannot be recorded in this state",
  shortfall_reason_required: "Enter the resolution",
  no_open_shortfall: "There is no open shortfall",
  acknowledgement_required: "Acknowledge the listed items for each consultant",
  fee_unavailable: "Fee needs a reviewed treatment",
  no_work_entries: "No timesheets recorded",
  no_timeoff_entries: "No time off recorded",
  timeoff_pay_classification_required: "Recorded time off needs classification",
  work_review_required: "Some work is pending or rejected",
  work_requires_review: "Some work is not approved",
  timeoff_requires_review: "Recorded time off needs review",
  unexplained_hours: "Some expected hours are unexplained",
  reserved_by_payroll: "reserved by a payroll run",
  unknown_approval_time: "unknown approval time",
  approved_after_cutoff: "approved after cutoff",
  foreign_currency: "needs a reviewed INR conversion",
  invalid_amount: "invalid amount",
  no_consultants_selected: "Include at least one consultant",
  mercury_us: "US Mercury",
  india: "India account",
  no_funding_source: "No funding source",
  consultant: "Consultant",
  spouse: "Spouse",
  percentage: "Percentage",
  fixed_inr: "Fixed INR",
  requested: "Requested",
  verified: "Verified by accounts",
  approved: "Approved",
  withdrawn: "Withdrawn",
};

const eventLabels: Record<string, string> = {
  prepared: "Transfer review prepared",
  voided: "Voided",
  voided_by_new_revision: "Voided by a new revision",
  submission_started: "Mercury request attempted",
  submission_accepted: "Mercury accepted the request",
  submission_uncertain: "Mercury's response was unclear",
  submission_rejected: "Mercury rejected the request",
  reconcile_scan: "Checked Mercury for the request",
  request_reconciled: "Linked to the Mercury request",
  request_linked_by_owner: "Owner linked the Mercury request",
  absence_attested: "Accounts recorded evidence that no request exists",
  request_status_changed: "Mercury request status changed",
  transaction_status_changed: "Mercury transaction status changed",
  reconciliation_required: "Marked for reconciliation",
  credit_recorded: "Credit recorded",
  shortfall_resolved: "Shortfall resolved",
  group_fully_credited: "All transfers credited",
  group_credit_reopened: "Credit reopened after a return",
};

export const eventLabel = (code: string): string =>
  Object.prototype.hasOwnProperty.call(eventLabels, code)
    ? eventLabels[code]
    : code.replace(/_/g, " ");

export const label = (code: string): string =>
  Object.prototype.hasOwnProperty.call(labels, code)
    ? labels[code]
    : code
        .replace(/^provider_returned_/, "Mercury returned ")
        .replace(/_/g, " ");

export const errorMessage = (failure: any, formatCode = label): string => {
  const data = failure?.response?.data;
  if (Array.isArray(data?.codes)) {
    return data.codes.map((code: string) => formatCode(code)).join(". ");
  }

  if (typeof data?.errors === "string") return data.errors;

  return "The action could not be completed. Reload and try again.";
};
