# Consultant bank-change notices

Sonam #2458 section 1 requires accounts to be notified when bank details change. The issue was re-read on 9 November; its last update remains 19 October. The user delegated implementation decisions and asked to finish delivery using parallel resources.

## Approach

Use a small transactional delivery journal and the existing private-mail transport pattern. Sending directly during the profile request can notify on rollback and lose retries; reusing the PTO-specific journal would confuse separate security and recovery rules. No new dependency or configurable notification framework is needed.

A persisted consultant bank change creates private notice rows in the same transaction. Compare all existing bank fields, excluding compensation/contact/family data and the transient account confirmation. Repeated unchanged saves create no event; changing A to B and back to A creates distinct events. Store only workspace, employment, recipient, event identity and delivery state/timestamps, never old/new bank values or an unkeyed bank digest.

Recipients are active workspace owners and active accounts reviewers explicitly assigned to existing workspace payroll runs, deduplicated. Do not grant every bookkeeper access or accept recipient input from the consultant. Mail contains only a generic changed-details/reverification instruction and a sign-in link to Payroll; it contains no consultant name, account value, amount or sensitive identifiers. Use `/payroll`, which assigned accounts can access; Consultant payroll is restricted to owners/admins. Check entitlement, current membership and reviewer assignment again before delivery; selected workspace does not need to match for background delivery.

Capture changes for employments with actual consultant compensation configuration; do not guess from the legacy employment-type label. The feature must not break employee profile changes when consultant payroll is disabled or widen profile access after exit. Existing fingerprint/source checks continue to block new preparation against changed bank data; accepted transfers keep their original destination and remain reconcilable. A notice never verifies an account or initiates payment.

Use row locking to claim queued delivery once. Disabled delivery must not be marked sent. Any transport exception after attempting delivery is uncertain and never automatically resent. A recurring recovery job enqueues committed queued rows and marks stale sending rows uncertain, so enqueue failure after commit is recoverable without making the profile request appear unsaved. Skip ineligible recipients terminally without sending. No real email is sent during verification.

## Acceptance

Prove initial/change/clear versus unchanged and salary-only behavior, rollback, duplicate jobs, A→B→A, recipient/tenant/exit/role/entitlement boundaries, private queue/mail/log payloads, transport disabled/exception/interruption and recovery after enqueue failure. Exercise the real self profile edit and rendered desktop/mobile email. Re-run existing bank confirmation, readiness invalidation and frozen credit reconciliation. No bank country/currency, missing-profile reminder, tax profile or invoice-generation completion is claimed.
