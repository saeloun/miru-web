# Consultant bank account confirmation

Sonam #2458 requires account numbers to be entered twice. The primary employee-record editor/API currently accepts one entry; the spouse/split workflow already checks confirmation. EmployeeRecord is the sole primary consultant bank source; company invoice-bank and provider funding accounts are separate workflows.

Add transient `employee_record.bank_account_number_confirmation` beside `private_details`. Under the existing authorized employment lock, a changed nonblank account number must have an exact matching string confirmation before the existing encrypted save/audit. Preserve leading zeros; do not trim or convert numbers. Reject malformed confirmation without echoing either value. Do not persist, return, prefill or log confirmation.

The shared self/admin form provides an independently blank confirmation field, required only for a changed nonblank number. Retain rejected drafts; clear confirmation when the number changes and after success/cancel. API clients use the same endpoint rule. Absent/unchanged account fields, contact/salary-only edits, clearing an account and trusted model imports retain their existing behavior.

Existing bank digests, new-payment verification, stale-approval and accepted-credit reconciliation remain authoritative. Double entry prevents a class of input errors; it does not verify bank ownership or complete all beneficiary requirements.

Verify session/token requests, missing/mismatched/malformed/exact confirmation, initial entry, leading zeros, unchanged/clear/contact-only compatibility, unchanged ciphertext/audit on rejection, no stored/returned confirmation and filtered payloads. Native desktop/mobile covers explicit correction and saved masked values with zero console errors; existing profile and payroll bank-change/reconciliation tests remain intact.
