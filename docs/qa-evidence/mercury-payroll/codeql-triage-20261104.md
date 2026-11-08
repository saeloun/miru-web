# Mercury CodeQL triage — 4 November 2026

The failed CodeQL check on PR #2492's published commit `51a74dcd4ab154f73633da5aefb69852c3d88b1f` reported three `rb/clear-text-storage-sensitive-data` alerts. Their instances are on `refs/pull/2492/head`; querying the merge or branch refs does not return them.

| Alert | Verified dataflow | Disposition |
| --- | --- | --- |
| [48](https://github.com/saeloun/miru-web/security/code-scanning/48) | `MercurySetup#persist_link` stores the `beneficiary` role label. The service rejects arbitrary labels before recipient I/O. Model inclusion and PostgreSQL's `payroll_recipient_beneficiary` CHECK restrict it to `consultant` or `spouse`. | False positive for this fixed role field. |
| [49](https://github.com/saeloun/miru-web/security/code-scanning/49) | `MercuryPayment#create_leg!` stores `allocation.beneficiary`. `ConsultantAllocation` constructs only those two literals. Model inclusion and PostgreSQL's `payroll_payment_beneficiary` CHECK enforce the set. | False positive for this fixed role field. |
| [50](https://github.com/saeloun/miru-web/security/code-scanning/50) | The concurrency spec writes hard-coded synthetic bank fixtures through `EmployeeRecord`, which declares `encrypts :private_details`. No real bank details or credentials are in this test. | Used in tests. |

The exact alert source/sink links, source code and applied local database constraints were inspected. No query exclusion, renamed field, encryption bypass or CodeQL configuration change was used. GitHub accepted all three dispositions and subsequent readback confirmed them. CodeQL check `125666937947` then changed from failure to success on the published commit.

## Verification

- An isolated native PostgreSQL database was created from this branch's schema. The test process denied outbound network access; Mercury HTTP responses were stubbed.
- Baseline: **122 examples passed** across employee-record requests, Mercury requests, payments, spouse splits and concurrent submission.
- The existing employee-record request verifies decrypted round-trip values, raw database column exclusion and audit exclusion for synthetic private data. Mercury request coverage verifies encrypted/redacted API tokens.
- Added API regression rejects an arbitrary beneficiary label with HTTP 422 / `beneficiary_invalid`, no recipient row and no provider recipient read. The updated request file passed **23 examples**. This is not a claim of a new 123-example full run.
- RuboCop and diff checks passed for the changed request spec.
- Fresh native Claude reviewed a supplied bounded description without tools or file access. It supported false-positive classification for 48/49 and test-only classification for 50, conditional on verifying their actual paths. Those paths and the local runtime results were checked separately by Codex. Local Qwen's proposed request example used incorrect assertions and was corrected before application; helper output is not test evidence.

## Limits

These classifications cover only the flagged role-field and synthetic-fixture paths. A role linked to an employment can still reveal that there is a spouse payee. They do not clear the storage or exposure of `purpose_info`, recipient names, routing metadata, other private fields or production encryption keys. They do not prove live Mercury compatibility, payroll completeness, SOC 2 or HIPAA compliance.

The new request test and this report are local until published and checked by current-head CI. Existing financial release holds, provider credentials/approval requirements and exact-commit reviews remain in force. No bank account was connected, transfer initiated or real email sent.
