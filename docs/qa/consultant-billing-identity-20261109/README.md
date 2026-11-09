# Consultant billing identity

This implements the declared billing/tax identity prerequisite in Sonam #2458,
section 1. It collects legal name/address, declared PAN/GST applicability and
private evidence, with a distinct authorized person's exact-version manual review.
It does not validate government registrations, choose tax treatment or issue invoices.

| Synthetic browser checkpoint | Evidence |
| --- | --- |
| Declared PAN/GST evidence selected | [1440px](declared-evidence-1440.png) |
| Accounts-reviewed submission with identifiers masked | [1440px](accounts-reviewed-1440.png), [375px](accounts-reviewed-375.png) |
| Existing transfer retained alongside another ready consultant | [1440px](retained-transfer-1440.png), [375px](retained-transfer-375.png) |

The dedicated self/accounts page supports corrections, submission/review history,
private evidence downloads, explicit missing-PAN acknowledgement, unresolved-GST
blocking and lost-response retries using the original command and files. It is
separate from Employee records and invoice authorization. Kept consultants can
provide facts for past services after exit; disabled payroll retains history and
revocation while blocking new submissions/approvals.

Submissions and reviews are encrypted append-only chains with tenant, actor and
predecessor constraints. Evidence is private, MIME-sniffed PDF/JPEG/PNG, at most
5 MiB per PAN/GST file. Immutable blob references prevent purging adopted evidence.
Scope-bound HMACs authenticate facts/evidence and review commands; ordinary payroll
lines retain only the opaque versioned binding. Logs filter the complete private
command roots. Final downloads recheck workspace and token access after reading bytes.

New consultant revisions, approvals, Mercury preparation/submission and India
handoff creation/dispatch require the current approved binding under the employment
lock. Accepted bank activity retains its original source, amounts and claims when
another consultant's revision is prepared. Carrying a historical line never authorizes
a new outbound transfer; a remaining split leg still needs current review.

Known recovery limit: after bank activity starts, changed source facts or a new
accounts reviewer can hold a remaining unsent leg or an otherwise unlocked retry.
The retained line is not automatically rebuilt. Reconcile bank status and leave
the hold in place; there is no supported refresh command or permission to mark an
unconfirmed payment credited. A separately reviewed recovery workflow is still
needed. Claude's final scoped review reports this low-severity liveness finding;
it is not an outside-clean verdict or a completed recovery feature.

## Verification boundaries

- Backend identity: **24/0** on both the migrated and independently fresh synthetic
  PostgreSQL 16 schema. This includes real independent-connection retries/revocation,
  private storage/reuse, SQL immutability, tenant isolation and final download access.
  Three reproduced security failures were fixed: late CLI revocation during download,
  unauthenticated review flags/commands, and cross-tenant copied encrypted submissions.
- Migrated/fresh catalogs match: 306 migration versions, 12 trigger functions,
  24 triggers, 578 constraints, 745 indexes and 1761 columns. One additive migration;
  no backfill, key rotation or MonthlyFacts-v2 change.
- Real old-code upgrade fixtures were produced at public `8cdef6b` using actual
  Workflow/provider methods with WebMock and test mail, restored, then migrated once.
  Six states pass: prepared and accepted Mercury, queued and sent India, an old later
  capture-time revision, and an actually sent legacy report without preparation data.
  Prepared/queued writes are blocked without review; accepted/sent credit, duplicate
  handling and Mercury late-return reconciliation preserve the frozen records.
  The legacy nil-preparation case also adopts a real reviewed binding without changing
  old report bytes. These fixtures contain no reimbursement claims; separate mixed-run
  regressions cover claims and PTO.
- Final local broad run: **668 examples: 630 passed, one failed, 37 pending**.
  Its remaining failure was the existing India dispatch error-priority assertion:
  the new strict source check preceded `run_not_approved`. Restoring the existing
  priority removed no validation; all **53 affected India/outbound/binding checks
  pass** afterward. This is not reported as a single 668/0 run. Earlier broad-query
  failures also reproduced redundant delivery reads; qualified joined evidence now
  preserves the unchanged batch-query assertions and fresh queued→sending→sent state.
- Real source-change regressions first failed **3/3** for an unsent split leg,
  replacement preparation and India pre-send recheck; the strict outbound fix's
  affected run passes **82/0**. Separate actual failures for stripped provenance,
  original claim attribution and explicit-null legacy split/PTO settlement are fixed.
  The faithful old split replay credits both legs and settles the original recovery.
- Brave: **8 identity journeys and one final mixed-run journey pass**, with empty
  console-error/exception collections. The mixed run saves only the second consultant,
  obtains both approvals and retains the first transfer and its original claim
  reservation. The adjacent native group had 26 passing examples and one external
  console-wrapper failure on a no-login mail preview; correcting that wrapper yields
  a separate **1/0**. No single all-native combined pass is inferred.
- Both required Vite builds and focused ESLint pass. Ruby lint covers 40 files with
  no offenses; Reek reports no warnings. TypeScript remains **329 diagnostics**,
  matching the parent's existing diagnostics apart from equivalent PNG/JPEG union
  ordering in an unchanged component; no type-clean claim.

Exact-head hosted results belong to the PR's verification record. The issue's
37 other pending contracts remain unfinished,
including consultant invoice numbering/PDF/delivery, remittance documents, complete
beneficiary fields and provider/account acceptance. No production restore/deployment,
live provider request, real mail, official tax computation or statutory filing is
established by these synthetic PostgreSQL 16 tests.
