# Consultant payroll to Mercury approval requests

Date: 3 November 2026. Primary source: [issue #2458](https://github.com/saeloun/miru-web/issues/2458) by sonamvg, last updated 19 October 2026, re-read 3 November. Requirements: [recalibrated consultant payroll](2026-10-19-consultant-payroll-requirements.md). Provider contract: [Mercury contract note](../../research/2026-10-19-mercury-consultant-payroll-contract.md), rechecked 3 November against the official reference pages.

This replaces the first draft of this design, which left the bank feature unreachable from the app and cut reimbursements and spouse splits. It delivers an operable path, not all of issue #2458.

## The path

Owner or admin prepares a run → assigned accounts reviewer prepares a revision and approves it → assigned owner gives final approval, which reserves claims → owner verifies Mercury setup and links recipients → owner prepares payment legs with a recorded quote → owner creates a Mercury approval request per leg → a distinct bank approver acts in Mercury → Miru tracks request and transaction status → accounts records actual INR credit → full credit settles the reserved claims.

The funds flow is the one requested: Saeloun's own Mercury account pays USD to Indian accounts, one approval request per transfer. `PayrollRun` stays an immutable dry-run row and never sends money. All bank execution lives in the sidecar tables below.

## Approaches

1. **Sidecar groups and legs on the approved revision (chosen).** One consultant aggregate per run, one leg per beneficiary. Run, revision and approval rows remain immutable.
2. One instruction per consultant. Rejected: issue section 9 requires independent transfers, fees, keys and retries.
3. Reuse `Payment`, `RazorpayPayout` or `PaymentsProvider`. Rejected: those are invoice collections.

## Reuse

| Existing | Use |
| --- | --- |
| `Payroll::Workflow#revise!`, `#approve!`, `#status` | Now reachable from the API. Final approval reserves claims in the same lock |
| `PayrollSources::MonthlyFacts`, `PayrollCalculation::Calculator`, `Payroll::Snapshot` | Source capture, calculation and approval validation for the prepared revision |
| `Payroll::ConsultantReview`, `ConsultantSources` | Fee proration, claim eligibility, warnings, Mercury funding terms |
| `Expense#mark_paid!`, `ExpensePolicy` | Direct settlement is refused while reserved. Full credit settles through the same method |
| `ExchangeRate` | Default USD→INR reference rate when a row is fresh |
| `MercuryBalance`, `ReadOnlyClient`, `LocalPreflight` | Account, legal name and balance checks. `ReadOnlyClient` unchanged |
| `EmployeeRecord` bank fields | Compared with the Mercury recipient. Never treated as Mercury setup |
| Solid Queue recurring jobs | Read-only status refresh |

## Data boundaries

- `payroll_expense_reservations`: one active reservation per expense (partial unique index). Created at final approval, settled at full credit, released only when a new revision replaces a consultant with nothing in flight.
- `payroll_split_arrangements`: versioned spouse beneficiary and allocation. Encrypted details, requester, accounts verifier, a distinct approving owner. Any change is a new row, which invalidates unsubmitted legs.
- `payroll_mercury_connections`: per company. Encrypted write-only token, source account, expected legal name, positive configured OUR fee.
- `payroll_mercury_recipient_links`: append-only per employment and beneficiary.
- `payroll_payment_groups`: consultant aggregate, one per run and employment. Frozen line digest, entitlement, fee and reimbursement parts, arrangement version, required leg count, `fully_credited_at`.
- `payroll_payment_instructions`: one leg. Stable identity is group + beneficiary (partial unique index on unreleased rows). Frozen allocated INR, quote, principal, configured fee, company debit, recipient and bank versions, key. Separate lifecycle columns for submission, request, transaction link and credit.
- `payroll_payment_events`: append-only, database-enforced. Codes and actors only.

A revision may replace a consultant's line only when no leg is in flight for that consultant. If a leg is in flight, the new line must have the same amounts and claims, or the revision is refused. Claims the run already settled stay selectable for that purpose. Prepared legs are voided by any new revision. A split's allocation cannot change, and it cannot be withdrawn, while a group in any run can still complete: it has bank activity and no held leg. A new arrangement with the same allocation is allowed, so a closed account can be corrected and only the failed leg replaced. A held leg (returned, failed, cancelled, or with a durable `held_reason`) means the group cannot complete in Miru, so it does not lock future months; if the allocation then changes, an unsent sibling in that group stays unsent. An unapproved correction can always be withdrawn, which restores the approved arrangement. A leg whose allocation no longer matches cannot be sent. New consultant terms cannot take effect in a month that has bank activity.

## Preparation and approval

- Runs: owner or admin picks the month, an accounts reviewer and a distinct owner. Currency is INR.
- Revisions: only the assigned accounts reviewer. Each consultant is included explicitly with confirmed unpaid hours and reason, selected claims, and optional other earnings, other deductions and withholding. Unsupported cases stay **not ready** and don't block anyone else. Warnings and resolvable source exceptions need an explicit acknowledgement, recorded with the actor.
- Approvals: `Workflow#approve!` with the expected digest, by the assigned reviewers. Any source, claim or same-month terms change returns the run to draft through `Snapshot`. Terms starting in a later month do not disturb an approved run. The cutoff, unpaid hours and reason are kept on the approved line.
- The calculation policy is a versioned constant implementing section 4's formula: `monthly fee × (expected − unpaid) ÷ expected`, rounded once to paise.

## Reimbursements

Eligibility comes from `ConsultantReview`: approved, unpaid, in cutoff, INR, plus not reserved by another run. Claims stay itemized and are never prorated. Each line component references `expense:<id>:<digest>`. `Snapshot` raises `claim_changed` if the claim's amount, currency, date, claimant or approval changes, or if it is no longer payable. Reserved claims cannot be edited, reviewed, deleted or marked paid directly.

## Spouse split

The base is the consultant's net less reimbursements, so it applies after fee and PTO adjustments. Allocation is a percentage or fixed INR to a named party, with an explicit remainder party. INR sums exactly by construction. Reimbursements go to the consultant. Reallocating them is not offered. Zero or negative legs block.

Each leg has its own principal from the same quote, its own OUR fee, key, status and credit. A released failed leg can be prepared again without touching the other leg. The purpose field and consultant identity remain the consultant's on both legs. Consultant self-requests await the profile work; owners and accounts enter them for now.

## Quote and fee

- `R` defaults to the newest direct USD→INR `ExchangeRate` row updated within 24 hours. Otherwise the owner enters a rate with a named source and time, and the actor is recorded. Neither path silently invents a rate. Quotes expire after 24 hours and are rechecked before submission.
- `buffered = R − 1.50`, which must be positive. `principal = P ÷ buffered`, rounded half up to cents.
- `chargeType: ours` is always sent. The configured fee must be positive. No exemption is modelled, because no verified exempt semantics exist. Principal, configured fee and company debit are stored separately. Mercury's actual fee is shown as unconfirmed.
- Indian account currency is not compared with USD. Eligibility means the Mercury recipient has international-wire routing with SWIFT and IFSC. The account's nominal currency is irrelevant to this check.

## Uncertainty, corrected

| Provider result | Result in Miru |
| --- | --- |
| 200 with fields matching the frozen leg | `accepted` |
| 200 malformed or mismatched | `uncertain`; well-formed request ID retained |
| Timeout, 5xx, 3xx, 408, 429 | `uncertain` |
| 400, 401, 403, other 4xx | `uncertain`. Duplicate and error-body behaviour is undocumented, and 400 is the duplicate response on Mercury's direct-send endpoint |
| 404 on the persisted first attempt | `rejected`, slot released. Documented as "`accountId` not found", so no request could exist |
| Any 4xx on a later attempt | `uncertain` |
| Process dies after commit | Stays `submitting`, shown as uncertain. The attempt count is persisted before the POST, so a restart is never a fresh first attempt |

Recovery is one of three paths, none based on a timer or an empty list:

1. A retained request ID, re-read and strictly matched.
2. A list scan where `memo` exactly equals the key links automatically. Any other same-recipient, same-amount candidate is only shown, and the owner must confirm one by ID.
3. **Manual attestation.** An empty scan is information, never proof, but a listed candidate or an incomplete list refuses attestation. The assigned accounts reviewer records an evidence reference, such as a Mercury support confirmation, stating no request exists. Only then may a different person retry with the same key and payload, or void. The list is read again immediately before either action, and a candidate blocks it. If Mercury returned a request that doesn't match the transfer, attestation is refused until Mercury shows that request rejected or cancelled and its transaction list is empty. Scans look back to the leg's creation, so a later attempt cannot hide the first.

## Transaction linkage, corrected

Link only when all hold: `requestId` is exact, `kind` is `outgoingPayment`, the account is the source account, the amount is negative, and its magnitude equals the principal. Mercury documents neither the amount's sign nor the wire's kind, so a real wire that differs goes to `reconciliation_required`. That is the safe direction. Any other transaction carrying the request ID, except `wireFee`, also goes to reconciliation. So does no transaction three days after approval. An unlinked transaction's observed status is still stored, and with several transactions the most severe one wins, so a failed or returned wire bars credit. Several transactions for one request also put credit on hold and reopen a fully credited group, even if all say `sent`, because a return's shape is undocumented. These holds live in `held_reason`, separate from `last_error_code`, so a transient read failure cannot clear them. If a real wire always has a second non-fee transaction, sandbox acceptance will show it and this rule needs revisiting. `sent` never implies credited.

Release needs proof too. A terminal request is released only after reading transactions, finding none, and never having seen it approved. A wire that fails after `sent` or after a credit stays held and goes to reconciliation.

## Status tracking

`Payroll::MercuryStatusRefreshJob` runs on the recurring schedule, read-only, for verified connections and bounded per run. It never writes to Mercury, and neither does any GET. **Refresh bank status** does the same on demand. Transaction webhooks remain open: they need an endpoint, a secret and live registration, and Mercury has no sandbox webhooks. Polling covers tracking until then.

## Write gate

`MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT` must exactly equal the connection's environment. It is unset by default, checked in the service and again in the client. Sandbox does not enable live. Read verification is reported as read access only.

## Builder's calls, for the owner to check

- 24-hour quote validity. The issue says refresh stale rates but sets no threshold. A stale same-key retry stays blocked; recovery is void and re-quote by someone other than the attester.
- The accounts reviewer and the owner who retries or voids after attestation must be different people.
- Reference rates outside 50–200 INR per USD are refused as a typo guard.
- Only the assigned accounts reviewer can verify a split, and the approving owner must be someone else. The person who enters it may be either.
- A shortfall has no size limit and needs one person's reason. Whether large shortfalls need a second approver is an owner decision.
- Bookkeepers see only runs assigned to them, including masked split and recipient data for those runs.

## Still open against #2458

Each is a later unit with its integration point. None is dropped.

| Section | Open | Integration point |
| --- | --- | --- |
| 10 | Consultant invoice, PDF, linking an existing invoice | `payroll_payment_groups.fully_credited_at`, unique per group |
| 11 | FIRC and FIRA attachment and follow-up | Attach to group and legs; credit state is already separate |
| 12 | Returned funds replacement | A reversed leg holds its slot and reopens the group. Replacement is blocked, not automatic |
| 1 | Profile fields, consent, bank-change notifications | Bank changes already invalidate through digests |
| 3–5 | PTO ledger and exception decisions | Unpaid hours are explicit input today |
| 8 | India handoff | Separate parallel unit; non-Mercury lines stay blocked here |
| 9 | Consultant self-request, reallocating reimbursements | Arrangement versions |
| 12 | Overriding a held transfer | Multi-transaction and cancelled-after-approval holds have no in-app exit, like returned wires. They need Mercury's real response shapes from sandbox acceptance before an override is designed |
| 12 | Replacing a departed assigned reviewer | Runs are immutable, so this needs append-only reassignment |
| 7 | Date-bounded request scans | An account with over 2,000 requests reports an incomplete scan, which blocks attestation |

## Actual unverified prerequisites

No Mercury credential exists and no provider request was made. Everything provider-facing is tested with mocks only. Unverified: the scoped token and read scopes, international-wire eligibility and fee applicability on the funding account, onboarded recipients and where Mercury exposes an Indian account number, real responses including the wire's `kind` and amount sign, idempotency and error behaviour, the distinct approver's permissions, and Indian-bank acceptance. Sandbox and then controlled live acceptance are required before calling this payment automation working.
