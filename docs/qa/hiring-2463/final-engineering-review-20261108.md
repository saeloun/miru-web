# Whole-branch engineering review: assembled branch

Target: the current `feature/sonam-release-integration-20261104` branch diff, including working changes, against `origin/develop` at `10e457e1d0cd2ac782be9d1edbcbd5a1a573486a`.

HEAD observed during preparation: `99e63304b`. This report records the original findings and the final native review of the frozen working source. It is written before the coordinator's final commit; final committed-source binding and required council logging are recorded externally after that commit, without editing this report to insert its own SHA. Earlier pending checkpoints below are historical; the final Completion Summary controls.

## Verified preparation

- The comparison contains 106 commits, 1005 tracked changed paths and 13 untracked paths before creating this report. The union is 1018 paths, including 282 under `app/` or `lib/` and 34 migrations. An estimate from class declarations in newly added app/lib Ruby files is 163 new declarations, including nested classes.
- Read repository `AGENTS.md` and `docs/ai/{testing,production,workflow}.md`.
- Queried GBrain without synthesis. Retrieval is degraded; product/recent-decision cache helpers reported that the brain was unreachable and no cache was available. No credential repair was attempted.
- The design helper found an older generic-signing packaging review. It does not establish the current whole-branch review. The CEO helper returned a plan from a different branch; that plan has not been adopted.
- Relevant prior learnings include private-state clearing after a child denial, stopped-worker evidence for uncertain communication, activation-cohort guards, and test-only Active Job subclass adapter isolation.

## Scope decision

The actual invoked skill is `/Users/sward/.agents/skills/gstack/plan-eng-review/SKILL.md`. Its referenced `sections/review-sections.md`, lines 432–451, requires a structure decision for targets with eight or more files or two or more new classes/services, including when no feature cuts are proposed.

The direct skill-start result reported `SESSION_KIND: interactive` and `QUESTION_TUNING: false`, session `91630-1794098498-e2c282f7`. The spawned-session automatic-choice exception was not used. With no available AskUserQuestion variant, D1 was presented through the documented prose fallback.

Actual answer: the review coordinator chose **A) Original arrangement**, explicitly directing this review to preserve all existing requirements and boundaries. This is the coordinator's current task clarification, not a claim that the human user answered an older menu. No feature cuts or source changes were authorized. Feature answers: no cuts proposed; structure: A, coordinator's response to this invocation's D1; accepted scope: the entire assembled branch diff; pending remedies: none established at this stage.

Scope Challenge result: scope accepted as-is. No smaller arrangement preserving every current contract was established; no arrangement investigation was requested.

## Coverage status

Native Architecture, Code Quality, Test and Performance passes are complete over the risk-based source/test paths described below. Final-SHA binding remains pending. The coordinator independently inspected and reran the completed nine-case ENG-1 remedy: 9/0 in `/tmp/miru-mercury-rollback-root-final-20261108.log`. Earlier bounded onboarding/notes/assignment reviews and the parent's reported tests are separately attributed; they do not establish whole-branch CI.

No clean engineering council entry has been recorded. The coordinator subsequently authorized the bounded ENG-1 migration/spec change and exclusive synthetic database proof. No provider, production or remote mutation was performed.

## Architecture review

The comparison includes the hiring workflow plus financial/authentication changes integrated from earlier feature work. This is a risk-based review of the assembled behavior and changed interfaces, not a claim of line-by-line examination of every screenshot or generated artifact.

The retained shape uses existing Rails controllers, Pundit policies, PostgreSQL constraints/row locks, encrypted snapshots, Active Storage, Action Mailbox and the shared persisted communication outbox. The alternative would centralize all hiring transitions and communication into a single workflow service. That alternative reduces visible classes but couples unrelated assessment, scheduling, offer, retention and provider error policies behind flags; it does not establish a smaller implementation or stronger ownership. The coordinator retained the original arrangement under D1.

Eight-flag check: no new blocking shallow-interface, temporal-decomposition, importable-internal or split-state-owner defect was verified. The shared MessageCommunication/CandidateMessages implementation already owns common outbox/retry mechanics. Similar-looking offer/assignment URL builders retain domain-specific eligibility and snapshot fields; extracting them would add a helper contract without a demonstrated net reliability gain. The database kind/event lists are repeated in model and migration boundaries; integrity tests explicitly exercise that public persistence contract.

```text
private intake -> candidate/application -> screening/assessment -> rounds/feedback
      |                   |                          |                 |
 shared raw source    scoped form/token       frozen submissions   assigned grants
      |                   +--------------------------+-----------------+
      |                                              |
      +------------------ decision -> offer -> explicit onboarding -> employment
                                                      |                  |
                                                  outbox              legal records
                                                      |
                              queued -> sending -> sent / failed / uncertain
                                                                  |
                                                     evidence + stopped worker
```

Security boundaries inspected include workspace/role checks, fragment capability exchange, private projections, bounded uploads, reauthorization after storage I/O, shared-mail retention, source-version checks, OAuth ownership, payment webhook verification and Mercury's explicit write gate. No additional P1/P2 authorization or candidate-content leak was verified in those traced boundaries.

Financial flow: approved revision -> immutable instruction/key -> provider read preflight -> committed submission claim -> provider request -> accepted/uncertain evidence -> independent reconciliation -> explicit credit/claim settlement. A provider timeout remains uncertain; it is not silently retried. Local balance observations are not a bank-side reservation guarantee. Mercury remains feature/write gated; live bank capability and operational rollout are separate acceptance work.

## Code quality and data safety review

### ENG-1: preserve recorded Mercury history during rollback

**[CRITICAL] P2 (confidence 9/10)** `db/migrate/20261103090000_create_payroll_mercury_payments.rb:202-209`.

Motivating code:

```ruby
def down
  drop_table :payroll_payment_events
  drop_table :payroll_payment_instructions
  drop_table :payroll_payment_groups
  drop_table :payroll_mercury_recipient_links
  drop_table :payroll_mercury_connections
  drop_table :payroll_split_arrangements
  drop_table :payroll_expense_reservations
end
```

The same migration declares append-only recipient/payment-event tables at line 4 and installs row-level immutable-history triggers at lines 192–197. Those triggers do not protect table drops. A rollback after a submitted or uncertain bank request removes the frozen request/key, reconciliation evidence and claim reservations. The original failure was reproduced in an exclusively owned synthetic database before the fix: populated connection history did not raise and the original `down` dropped its tables. Evidence: `/tmp/miru-mercury-rollback-red-20261108-abdd.log`.

Actual coordinator answer D3=A authorized the reviewer to implement the bounded remedy. `spec/models/payroll_mercury_migration_rollback_spec.rb` executes the real migration at its historical migration version: seven populated refusals preserve rows, columns, indexes, constraints and immutable triggers; one empty down/up round trip preserves the schema. It uses MigrationContext to roll later empty migrations backward and forward rather than dropping later foreign keys manually. Initial result: **8 examples, 0 failures**, plus RuboCop **2 files, no offenses**, and clean `git diff --check`. Initial green evidence: `/tmp/miru-mercury-rollback-green-20261108-abdd.log`. The reviewer implemented this remediation; the subsequent locking change and independent proof are recorded below. This is not a claim of independently reviewing the reviewer's own patch.

Late implementation caveat was raised and reproduced: without table locks, a live writer inserted after the relevant emptiness check and the rollback then dropped its committed history. Actual held-writer regression was RED (`/tmp/miru-mercury-rollback-concurrency-red-20261108-abdd.log`). The coordinator explicitly authorized the minimal locking remedy plus one regression. The migration now holds all seven ACCESS EXCLUSIVE locks inside its transaction before checking or dropping; the known LOCK statement alone is narrowly `safety_assured` because StrongMigrations cannot inspect opaque SQL. A real separate writer transaction is confirmed as the blocker with PostgreSQL `pg_blocking_pids` and `wait_event_type=Lock`, then committed; rollback must refuse and preserve its row and every schema definition. Final local result: **9 examples, 0 failures**, and both files RuboCop clean. Evidence: `/tmp/miru-mercury-rollback-concurrency-green-20261108-abdd.log`. The coordinator independently inspected and reran the completed locking remedy: **9/0** in `/tmp/miru-mercury-rollback-root-final-20261108.log`, read by this reviewer. No live-provider or production action occurred.

## Decision ledger

### R1: cohort aggregation performance

Observed: `app/services/hiring/pipeline.rb:102-103` loads historical submitted forms before selecting the latest per application; lines 147–153 aggregate all filtered applications and their transition audits. Pagination bounds the response, not cohort computation. Capacity and latency at larger cohorts were not measured.

Actual answer: the coordinator chose A, retain the correct filtered-cohort implementation and record the unmeasured scale/latency limit. No optimization task, feature cut, new scale guarantee or benchmark claim was approved. This is an informational limitation, not a verified P1/P2 runtime failure.

### R2: Mercury rollback guard

Finding: ENG-1, P2/CRITICAL, confidence 9/10, native reviewer.
Plan baseline: current migration permits unconditional table drops; financial histories are otherwise append-only.
Runtime evidence: original populated and concurrent-writer failures reproduced, approved transaction-held guard implemented, all nine focused examples pass locally and in the coordinator's independent rerun. Final committed-source binding remains pending.

| Choice | Current | A | B | C |
| --- | --- | --- | --- | --- |
| Populated rollback | Drops financial evidence | Refuse before any DDL | Keep existing behavior; release remains blocked | Investigate in an exclusive synthetic database; remedy pending |
| Empty rollback/reapply | Supported | Preserve and test | Unchanged | Unchanged |
| Other features and boundaries | As assembled | Unchanged | Unchanged | Unchanged |

Question D3:
D3 — Preserve recorded Mercury history on rollback?
Project/branch/task: assembled branch, ENG-1 financial-history safeguard.
ELI10: A rollback currently drops the tables containing bank requests and reimbursement reservations, even if money is still being reconciled. We need to choose whether to protect those records before treating this branch as ready.
Stakes if we pick wrong: an operational rollback can erase the evidence required to identify or reconcile a bank request.
Recommendation: A because it preserves recorded financial facts and keeps empty rollback available.
Note: options differ in kind, not coverage — no completeness score.
Pending remedies not decided here: none beyond ENG-1; other features remain unchanged.
Pros / cons:
A) Guard retained history (recommended). Preserve populated financial tables by refusing before DDL, and prove both refusal and empty rollback/reapply. This closes the evidence-loss path with a small local change; it preserves every product contract. Cost: human ~1 hour / CC+gstack ~10 minutes, and future operators must explicitly archive or preserve history rather than relying on an automatic destructive rollback.
B) Keep and block release. Leave source unchanged and retain ENG-1 as an open release blocker. This avoids any unreviewed migration edit and accurately preserves the current behavior; it prevents a clean review result. Cost: no coding now, but release remains blocked and the destructive path remains present.
C) Investigate before choosing. Run only a bounded synthetic rollback investigation, leaving the migration and remedy undecided. This provides direct failure evidence without touching real data; it preserves every unrelated feature and approval. Cost: human ~1 hour / CC+gstack ~10 minutes, with another decision still required before any fix or clean review.
Net: protect recorded history now, keep the release blocked, or gather bounded evidence before deciding.
Header: Rollback history
Options:
A) Guard retained history (recommended): pre-DDL populated-history guard plus focused refusal and empty rollback/reapply proof; other features unchanged.
B) Keep and block release: no source change; ENG-1 remains open and release blocked.
C) Investigate before choosing: one exclusive synthetic investigation, no source change, remedy pending.
State: accepted, implemented and independently verified by the coordinator (final nine-case log above); final committed-source binding pending.
Actual answer: coordinator D3=A, explicitly authorizing the migration guard and one focused rollback spec in an exclusively owned synthetic database; subsequent explicit authorization covered all-seven transaction-held locks and one real held-writer concurrency regression for the discovered race.
Accepted scope: refuse before any DDL if any of the seven Mercury tables has rows; preserve empty rollback/reapplication and all other behavior. No banking/provider action or unrelated source change.
History: first raised during this whole-branch review; no earlier bounded hiring review is credited for this finding.

Approval readiness: PASS for D1 (coordinator A: assembled scope), R1 (coordinator A: retain cohort implementation with measured-capacity claim withheld) and R2/D3 (coordinator A: exact financial-history guard plus necessary synthetic regression proof). No unanswered engineering remedy is silently accepted. Final source verification is a completion prerequisite, not another behavior choice.

## Test review

Framework detection: `CLAUDE.md` is a compatibility router without a Testing section. `.rspec`, `spec/rails_helper.rb` and `Gemfile` establish Rails/RSpec; responsive system specs use Capybara/Cuprite with actual Brave. Existing tooling is reused; no framework is introduced.

The traced test map is:

```text
request authentication/workspace -> scoped controller -> service transaction
          |                              |                    |
       request specs                 version/role         model+DB constraints
                                                             |
                                   queue commit -> worker -> external transport
                                      |             |               |
                                rollback specs   real queue     synthetic SMTP
                                                             (no live provider)
public fragment -> exchange -> limited projection -> submission/deadline checks
       |                    |                               |
 portal request specs   Brave mobile flow          stale/replay request cases
```

| Behavior | Concrete source/test evidence reviewed | What that evidence protects |
| --- | --- | --- |
| Hiring intake, source ownership and private downloads | `spec/services/hiring/{email_intake,review_receipt,intake}_spec.rb`; hiring request specs and `spec/support/hiring_download_helpers.rb` | Tenant scope, source integrity, unauthorized/stale download rejection |
| Approved configuration and persisted communication | `spec/services/hiring/{assignment_communication,offer_communication,interview_delivery}_spec.rb`; message request/integrity specs | Preview intent, latest-attempt retry, stale approval, pretransport eligibility, uncertain delivery |
| Candidate capability, assessment and scheduling | `spec/requests/{hiring_portal,hiring_assignments}_spec.rb`; responsive portal/assessment/scheduling specs | Limited candidate projection, version/deadline/replay checks and booking conflicts |
| Decisions, onboarding and preservation | `spec/services/hiring/onboarding_concurrency_spec.rb`; onboarding request/integrity specs | Current invite ownership, employment identity, legal/profile retention and concurrent completion |
| Explicit/configured retention | `spec/services/hiring/retention_spec.rb`; `spec/jobs/hiring_retention_job_spec.rb`; responsive retention specs | Shared inbound data, tenant isolation, held locks, unknown/sending refusal, policy/age recheck, real purge bytes and queue failure rollback |
| Financial settlement and ambiguity | `spec/services/invoice_payment/{settle,stripe_checkout_fulfillment_intent_validation,razorpay_payment_link_webhook_fulfillment}_spec.rb`; Mercury concurrency/reconciliation specs | Account binding, stale/duplicate/late events, committed provider claim, uncertain reconciliation and reserved claims |
| Signing and sealed artifacts | `spec/services/signatures/{delivery,reconcile,sealed_pdf}_spec.rb`; signature request/archive specs | Frozen source/recipient state, rejected provider mismatch and preserved sealed evidence |
| Populated/concurrent migration rollback | New Mercury migration rollback spec (actual 9/0 in this review) | No financial table/row/index/constraint/trigger loss; real held-writer serialization; historical empty down/up |

Review execution versus supplied proof: this review personally executed the original populated Mercury RED, the concurrent-writer RED and final nine-case GREEN, the two-file RuboCop check and diff whitespace check. The coordinator reports 860 related backend examples and 160 combined actual Brave examples passing, including a continuous journey with six persisted jobs, four synthetic SMTP captures and five artifact hashes. Those numbers are coordinator-supplied evidence, not independently repeated by this reviewer. The coordinator's whole-backend run is pending. Existing 329 TypeScript diagnostics, 150 unsupported generic Ruby scanner files and 59 old pending contracts are limitations, not passing tests. No production, real banking, live signing or real recipient test was performed.

No new test-only seam was added to production. The Mercury spec runs the actual migration and snapshots real database state; it does not mirror the guard implementation. Its historical-schema isolation is necessary because later migrations reference the Mercury tables. Cleanup must drop only the newly created test database and verify its absence.

### QA Test Plan — not persisted separately

Auxiliary QA/task/TODO paths are outside this agent's file ownership. This is the complete compact QA plan presented in the permitted report, not a claim that a discovery-path artifact was saved.

- Affected pages/routes: hiring settings and application detail; candidate portal and assessment portal; interview/panel review; offer/onboarding; private hiring/source downloads; payroll Mercury review/submission/reconciliation; invoice payment and signature archive surfaces.
- Key interactions: approve draft settings before communication/automatic retention; preview then explicitly queue an assignment/offer; reconcile unknown delivery before retry; submit/accept with the current version before a clearly zoned deadline; switch/revoke workspace access; explicitly confirm application deletion; retain onboarded employee/legal files; reconcile ambiguous financial/provider results.
- Edge cases: old preview/current workspace changes, same-source cross-tenant retention, locked current work, stale or revoked candidate capability, uncertain transport, account/recipient changes and duplicate/out-of-order provider events. Value: protects=private data and irreversible intent; fails_when=stale authority or replay mutates current state; why_new=assembled integration boundaries; seam=none; no_claim=live-provider acceptance.
- Critical paths: synthetic intake through explicit onboarding with persisted queue/SMTP evidence; closed approved retention with actual blob purge; submitted/uncertain payroll history surviving rollback refusal. Value: protects=completion and retained evidence; fails_when=queue rollback, tenant crossing or destructive history loss; why_new=integration plus ENG-1; seam=none; no_claim=whole-branch CI or production readiness.
- Tests to retire: none identified; no duplicate-test removal is authorized here.
- Pending decisions: none. Late UI/DX fixes still need their supplied focused proof and final-source recheck.

## Performance review

R1 is the only established performance limitation: hiring pipeline response pagination does not bound historical/cohort computation. Its row count, resident memory and latency at large tenant sizes are unknown; no throughput guarantee is made. The coordinator explicitly retained the implementation without a new optimization task.

Other inspected paths use tenant/version composite indexes, bounded recovery batches, provider HTTP timeouts and source size/page limits. Query loops and provider I/O were examined at the payment/outbox/retention boundaries; no additional verified P1/P2 performance defect was established. Private downloads intentionally load bounded bytes to reauthorize the actual artifact after I/O. Mail/PDF handling still consumes memory/CPU within the configured limits. No production load profile, query plan benchmark or deployment capacity measurement was performed. Existing queue workers/default polling are reuse, not proof of operational capacity.

## What already exists and reuse choices

`Hiring::MessageCommunication` owns common preview intent, operation idempotency, versioned retry and after-commit enqueue behavior for assignment/offer callers. `Hiring::Delivery` owns transport claims and pretransport checks. `Hiring::Retention` owns manual/policy deletion guards and shared-source protection. Existing Pundit, Audited, Active Storage, Action Mailbox, Solid Queue and provider clients are reused.

No new extraction is proposed. Offer/assignment URL methods differ in source eligibility and frozen payload; a common option-driven helper would obscure those domain checks. This rejects a superficially similar extraction without asserting net line savings. No generated/vendor lines count toward a savings claim. The migration guard is local and retains the original seven drop operations inside transaction-held table locks; its regression spec increases total lines to protect an irreversible boundary rather than claim compression.

## Failure modes and security disposition

| Path | Realistic failure | Existing handling / coverage | User/operations signal |
| --- | --- | --- | --- |
| Intake/shared source | Duplicate receipt or another tenant retains the same inbound mail | Receipt identity/locking and retention shared-source cases | Conflict/review state; source remains where still referenced |
| Candidate submission | Link expired, revoked or stale while form is open | Capability/version/deadline checks in portal request specs | Limited unavailable/conflict response; no management projection |
| Communication | Worker dies after transport may have accepted | Persisted sending/uncertain evidence, stopped-worker reconciliation and current-attempt retry tests | Unknown state requires evidence; no blind automatic resend |
| Onboarding | Duplicate acceptance or invite replaced by another workspace | Tenant/actual invite binding and concurrency request/service tests | Conflict/unavailable; employment/legal records retained |
| Retention | Current child activity or purge queue unavailable | Same-lock policy/activity recheck and queue-failure rollback, shared blob tests | Skipped aggregate or raised cleanup failure; no silently forced deletion |
| Stripe/Razorpay | Late or conflicting signed event after checkout/capture changes | Account/current-link/amount/currency validation and reconciliation specs | Review/uncertain state rather than unsupported settlement |
| Mercury | Timeout after bank may have accepted | Durable key/claim and uncertain state, independent reconciliation cases | Submission stays uncertain until checked; no automatic duplicate payment |
| Mercury rollback | Operator rolls back after financial history exists | ENG-1 guard; seven-table refusal snapshots, real writer block and empty historical round trip | Explicit IrreversibleMigration; independent 9/0 |
| Signing | Provider returns mismatched/incomplete artifact | Frozen source/recipient checks, sealed PDF/page validation and reconcile tests | Review/failure, preserved original sealed evidence |

Failure modes: **0 newly established silent critical gaps** in the traced boundaries after ENG-1's approved remedy. This does not assert exhaustive examination of every changed artifact or live-provider failure mode. Secret values, real applicant records and production data were not inspected. Error/log filtering and private projections were read; late DX503 logging changes remain subject to source recheck.

## Current external review disposition

Actual GitHub read found PR #2479 at `1593440809407bc59e00cdd92e3b281b1bc6c86e`, branch `feature/ats-2463`, with a different base/head from this integration branch. Its CI/review is not current integration CI. There are **five total threads**, not five CodeRabbit threads: three resolved/outdated CodeQL threads and two unresolved/current CodeRabbit threads.

- `PRRT_kwDOGdxl586y6SCm`: avoid company FOR UPDATE locks on reads/downloads. Locally addressed in assignments/forms/reviews: GET/HEAD avoid company mutation locks; bytes are read outside transaction and current grant/blob are checked again. Mutations retain their scoped lock contract.
- `PRRT_kwDOGdxl586y6SCp`: refresh ApplicationForms when the parent version advances. Locally addressed by the applicationVersion prop and stale-version effect; application detail passes the current version.
- The other three threads (`...y5ZRC`, `...y5ZRF`, `...y5ZRK`) are resolved/outdated CodeQL mailbox/role authorization comments.

No review replies, resolutions or remote changes were made. The two CodeRabbit threads remain remotely unresolved; local remediation does not waive the repository's merge-feedback requirement.

## Outside Voice

The installed skill's default-on preflight was actually run and reported: `Codex outside review unavailable: harness mismatch; no outside process started. Missing coverage.` It returned `CODEX_MODE: under_current_harness`. Stored `codex_reviews` was unset/enabled; this was not an opt-out. The native fallback requires Plan-agent/TaskStop/background-Bash capabilities absent from this host. Actual result: **OUTSIDE_VOICE_UNAVAILABLE**, source `none`, actual host `codex`, requested outside provider `codex`; no outside model result exists for this whole-branch invocation. No substitute external provider was invented. Earlier configured Claude onboarding consultation is bounded prior evidence, not this whole-branch outside review. Missing outside coverage is recorded explicitly and receives no clean-review credit.

## NOT in scope

- Live bank/payment/signing capability, production mutation and deployment acceptance: require their separate approved operational rollout; synthetic proof cannot establish them.
- A generic workflow DSL, shared URL abstraction, archive feature or new retention policy language: no demonstrated requirement or approved extraction.
- A new pipeline optimization or capacity guarantee: coordinator R1=A retained current behavior with the unmeasured limit.
- Separate PR waves or rewriting existing integration history: coordinator retained the assembled scope; this review authorizes no push/merge.
- Remote CodeRabbit replies/resolutions: not authorized; source disposition is recorded only.

## Implementation Tasks

Earlier-list lookup returned no prior eng-review task list. JSONL output is **not persisted** outside the permitted report; the complete single actionable row is:

- [x] **T1 (P2, human: ~1h / CC+gstack: ~15min, estimated)** — Mercury migration — Refuse populated rollback before DDL while retaining empty historical rollback/reapplication.
  - Surfaced by: Code Quality ENG-1.
  - Files: `db/migrate/20261103090000_create_payroll_mercury_payments.rb`, `spec/models/payroll_mercury_migration_rollback_spec.rb`.
  - Verify: focused rollback spec 9/0, independent coordinator 9/0, RuboCop 2 files/no offenses, whitespace check; final committed-source binding still pending.
  - Task row: `{"id":"T1","priority":"P2","component":"Mercury migration","title":"Refuse populated rollback before DDL","source_finding":"ENG-1","effort_human":"~1h","effort_cc":"~15min","files":["db/migrate/20261103090000_create_payroll_mercury_payments.rb","spec/models/payroll_mercury_migration_rollback_spec.rb"]}`.

_No new tasks from Architecture, Test or Performance in run 1._ No TODO is proposed: R1 explicitly approved recording a limit without an optimization task. Task effort is an estimate for a small migration fix with real regression/isolation proof, not elapsed-time measurement.

Sequential remediation, no parallelization opportunity within ENG-1. Other coordinator-owned UI/DX work remains separate; shared source certification waits for all writers to finish. No alternate source edits were made by this reviewer.

## Reality and premise receipts

| Premise | Claim | Receipt | Verdict |
| --- | --- | --- | --- |
| Scope | Explicit assembled branch versus pinned current develop | Target header; coordinator D1=A | Verified target, no scope substitution |
| Financial rollback | Original down loses populated Mercury evidence | Migration original lines 202–209 and actual RED log | Verified; approved remediation locally green |
| Queue/storage | Retention preserves rollback and checks actual purged bytes | `spec/jobs/hiring_retention_job_spec.rb:38-51`; service/request cases | Source/assertions verified; parent execution separately attributed |
| Scale | Pipeline computes full filtered history/cohort | `app/services/hiring/pipeline.rb:102-103,147-153` | Verified algorithm, capacity unmeasured |
| Whole-branch CI | Local focused/Brave evidence equals remote CI | Different PR head and pending full-backend terminal | Rejected; not claimed |
| Reviewed snapshot | Frozen runtime bytes captured for later exact commit comparison | Run-3 manifest below, 328 paths | Verified working-source manifest; external final binding pending, no commit identity invented |

REALITY: premise-table pass frozen source manifest verified; post-commit identity is explicitly conditional rather than an asserted fact; docs/qa/hiring-2463/final-engineering-review-20261108.md:1
REALITY: already-done pass coordinator supplied freshly fetched develop10e457e1d0cd; base history checked before T1 and no Mercury rollback remedy exists there; db/migrate/20261103090000_create_payroll_mercury_payments.rb:202
REALITY: surface-check pass current API routes, migration API and invoked helper flags checked against actual source/help; config/routes/api.rb:1
REALITY: binding-decisions pass branch decision search returned no rows; actual D1/R1/D3 coordinator answers retained in ledger; docs/qa/hiring-2463/final-engineering-review-20261108.md:1
REALITY: numbers pass scope counts and nine-example proof measured from git inventory/test log; human effort estimated and coordinator test counts attributed; docs/qa/hiring-2463/final-engineering-review-20261108.md:1
REALITY: deferred-asks pass no feature cut approved; live operational acceptance and capacity claims explicitly excluded rather than silently dropped; docs/qa/hiring-2463/final-engineering-review-20261108.md:1
REALITY: pr-count pass no ship-policy file; default one assembled wave retained, no split PR/queue-cost claim; docs/qa/hiring-2463/final-engineering-review-20261108.md:1
REALITY: prior-art pass upstream Axios tracker/docs checked and open-PR search attempted (direct results URL restricted); no dependency patch adopted because the reproduced defect is app watcher installation timing; app/javascript/src/components/Hiring/index.tsx:315
REALITY: transaction-semantics pass no driver/pool/protocol change; actual historical MigrationContext rollback and restored schema checked on exclusive PostgreSQL; spec/models/payroll_mercury_migration_rollback_spec.rb:11
REALITY: contract-assumptions pass no unverified cross-repo default adopted; current Rails/SolidQueue and provider boundaries read locally; config/application.rb:85
REALITY: dependency-fallback pass migration remedy is local and requires no predecessor/provider availability; db/migrate/20261103090000_create_payroll_mercury_payments.rb:203
REALITY: obligation-tiers pass T1 same-branch P2 is the sole new must-ship task; no next-PR/deferred feature task invented; docs/qa/hiring-2463/final-engineering-review-20261108.md:1

## Completion state (pending final binding)

Native four-section review: one P2/CRITICAL finding, approved and implemented with local 9/0 proof including real writer serialization; independently inspected/rerun by the coordinator, 9/0. Owned synthetic database `miru_mercury_rollback_test_20261108_abdd` was dropped after both terminal runs; a final pg_database query returned absence count 0. No additional P1/P2 verified in traced boundaries. Architecture and current requirements retained. Outside review unavailable. Final committed-source fingerprint and late UI/DX source checks pending. Required review log, terminal structured report and readiness dashboard are intentionally not published before final source binding. No clean outcome is asserted.

## Fresh whole-branch review — run 2

The coordinator explicitly requested a genuinely new full engineering invocation after independently verifying ENG-1, rather than relabeling the first run. Actual `gstack-skill-start` session: `91630-1794100463-a85ed54d`, interactive, question tuning false. The fixed target remains the entire current assembled branch diff against develop10e457e1d0cd, including working changes. Exact prior coordinator D1=A and R1=A apply unchanged: original arrangement, no feature cuts, correct filtered-cohort behavior retained without a scale claim. No automatic answer or invented human response was used.

Preparation was repeated: review/decision/task lookups, project and configured cross-project learnings, current base history and design/CEO lookup. No prior review/task rows were returned. The design helper again found the older signing review; the CEO result explicitly belongs to another branch and was not adopted. `gbrain query` and best-hit `get` returned keyword-only material; semantic retrieval reported a missing configured key, so recall is partial and current source controls. No credentials were fetched or repaired. The direct SSH fetch failed `git@github.com: Permission denied (publickey)` with prompts disabled. The coordinator then performed an anonymous HTTPS fetch successfully; the reviewer verified current origin/develop is still `10e457e1d0cd2ac782be9d1edbcbd5a1a573486a`. Base symbol/path history contains no already-landed replacement for the assembled work.

Prior learning applied: **activejob-subclass-adapter-isolation** (confidence 10/10, observed 2026-11-07), checked against the scoped real Solid Queue adapter stub and actual purge-byte assertions. Prior learning applied: **miru-parent-candidate-denial** and **miru-feedback-activation-cohort** (confidence 10/10, observed 2026-11-07), checked against current parent denial clearing and activation eligibility. Learnings are leads; their older pass counts are not current proof.

### Run 2 Architecture and security

The review retraced workspace/role policy through scoped controllers, user/company/application locks, private CSV revalidation, hiring source/capability projections, assignment intent/deadline/source eligibility, committed outbox claims, policy retention, payment reconciliation and sealed-artifact archival. The diagram and failure-mode table above remain the current shapes. Distribution stays the existing Rails/Vite application plus Solid Queue workers, scheduled recovery/retention and database migrations; `.github/workflows/validations.yml` includes build/lint, non-system tests and responsive system specs. Local tests do not prove a current remote CI or deployment.

The structurally different alternative is recorded as a comparison only (not implemented):

```text
HiringWorkflow.transition(application:, action:, actor:, expected_version:) # not implemented
HiringWorkflow.preview(application:, operation:, actor:)                    # not implemented
HiringWorkflow.confirm(application:, intent:, actor:)                      # not implemented
HiringWorkflow.reconcile(application:, operation:, evidence:, actor:)       # not implemented
HiringWorkflow.retain_or_delete(application:, policy:, actor:)               # not implemented
```

It would centralize unrelated domain policies and require flags/state dispatch behind each operation. Current domain owners hide their eligibility/frozen snapshots while shared MessageCommunication/Delivery own durable transport. No deeper, smaller replacement was established; coordinator A retains the current shape.

| Eight-flag screen | Current disposition |
| --- | --- |
| Shallow modules | Operation services hide version/auth/persistence policies; no new blocking shallow boundary established |
| Information leakage | Domain JSON is validated at controller/model/DB boundaries; repeated integrity lists are exercised by constraints/integrity tests |
| Temporal decomposition | Shared outbox stages persist an irreversible transport protocol; domain eligibility remains with the domain owner |
| Pass-through methods | Reviewed entrypoint wrappers provide controller/API boundaries; no worthwhile removal established |
| Split state ownership | Application stage owner and persisted operation/attempt records use scoped locking and version checks; no conflicting current writer verified |
| Two ways to do one task | Assignment/offer reuse shared communication; payment providers preserve different replay/capture contracts |
| Importable internals | No new cross-package internal API or independently published package is introduced by this target |
| Hand-synced lists | Model/migration event kinds agree and have real integrity tests; no observed mismatch |

Result: **0 new architecture/security P1/P2 findings**. Original ENG-1 is carried as resolved history, not silently removed.

### Run 2 Code Quality

Re-read current `Authenticable`, employee CSV controller, HiringPolicy/InterviewPolicy, AssignmentCommunication, Delivery, Retention, HiringSetting, Stripe settlement/intent validation, Mercury reconciliation and concurrency assertions, Signatures::Reconcile, and invoice/PDF amount changes. The common communication interface is reused; domain URL builders remain separate because eligibility and frozen intent differ. No option-heavy helper or extraction is proposed, and no savings are invented. Error states retain explicit conflict/unavailable/uncertain outcomes. Privacy-sensitive 503 cause logging is undergoing the coordinator's final focused proof and source freeze.

ENG-1's completed patch was independently inspected and rerun by the coordinator (9/0); the reviewer checks that exact source and evidence without claiming independence for their own implementation. The guard holds all seven table locks until refusal/drop completes. Original tables, index definitions, constraints, triggers and empty rollback behavior remain covered.

**ENG-2 [CRITICAL] P2 (confidence 8/10), late D2 integration finding:** `app/javascript/src/components/Hiring/index.tsx:315` originally installed `useEffect(() => watchWorkspaceAccess(companyId, setDenial), [companyId]);`, while `Settings.tsx:45-50` and `ApplicationDetail.tsx:57-67` start their initial `read(...)` in child passive effects. Child passive effects run before the parent watcher effect. The installed Axios implementation (`node_modules/axios/lib/core/Axios.js:165-188`) captures its interceptor arrays synchronously at request creation, so those first requests can escape the WeakSet watcher. An initial authoritative 403 can retain the management shell/Retry even though an after-load child 403 is covered. Static claim sent to the coordinator before runtime reproduction; the coordinator independently found the same race and assigned a real initial-403 browser regression plus installation before child passive effects. The successful-response workspace-mismatch path must also reject after denial rather than return mismatched data as success. This is necessary follow-through on approved Design D2, not a new product policy. Runtime RED/GREEN and final source recheck are pending. Run 2 therefore has **one real new finding**, not a zero-finding clean review; fixing it will not erase its history/count.

Run-2 task output, **not persisted separately**:

- [x] **T2 (P2, human: ~1h / CC+gstack: ~15min, estimated)** — Hiring workspace denial — Install the watcher before initial child requests and reject mismatched responses after clearing the workspace.
  - Surfaced by: Code Quality ENG-2; coordinator independently corroborated and assigned the UI worker under existing Design D2 authority.
  - Files: `app/javascript/src/components/Hiring/index.tsx`, `app/javascript/src/components/Hiring/api.ts`, `spec/system/responsive/hiring_design_recovery_spec.rb`.
  - Verify: a real initial authoritative-403 browser case must fail before the fix, pass after it, preserve transient 503 Retry, clear all management/candidate state, and retain valid response behavior; focused/full existing checks plus Vite build and final source recheck.
  - Task row: `{"id":"T2","priority":"P2","component":"Hiring workspace denial","title":"Observe initial child denial before rendering current workspace","source_finding":"ENG-2","effort_human":"~1h","effort_cc":"~15min","files":["app/javascript/src/components/Hiring/index.tsx","app/javascript/src/components/Hiring/api.ts","spec/system/responsive/hiring_design_recovery_spec.rb"]}`.

### Run 2 Test review

Rails/RSpec and actual Brave remain the detected existing frameworks. The concrete source/test map and complete QA Test Plan above are carried forward unchanged, with the additional held-writer regression now verified. The following ratings describe observed assertion quality in named tests, not a percentage of every line or proof that the reviewer reran all tests:

```text
CODE / CONTRACTS                                  USER FLOWS
[★★★] assignment preview/queue/delivery           [→E2E] issue -> preview -> confirmed send
   duplicate operation, stale approval/recipient     actual queue + synthetic SMTP journey
   after-construction submission, unknown retry      (coordinator evidence; no real recipient)
[★★★] retention policy/delete/purge               [→E2E] review -> confirm deletion -> lost links
   shared source/blob, locked work, queue failure    actual Brave + storage-byte assertions
[★★★] Mercury status/credit compare-and-apply     [→E2E] approve -> uncertain -> reconcile
   real connections, opposite completion orders     existing synthetic provider boundary
[★★★] Mercury migration rollback                  [→E2E] operational rollback with active writer
   seven populated snapshots, real PG blocker       real held writer -> refusal -> retained row
[★★★] private download/CSV authorization           [→E2E] revoke/switch during generation
   final grant/blob/employment checks               actual denial cases; no live private data
```

★★★ means behavior plus edge/error assertions; [→E2E] marks a multi-component/security/data-destruction integration path. Test counts are not coverage scores. No production LLM/prompt integration changes were identified; no eval suite is invented. A separate missing-test requirement was not established after reading these assertion branches. Fast/repeated submit, stale state, unavailable storage, role/workspace changes, duplicate/late event and unknown transport are addressed by named request/service/integration cases. Large-cohort capacity and live providers remain explicitly unverified, not counted as test passes.

No new test or framework task is proposed by run 2. The original migration and writer tests derive from coordinator D3=A and its exact concurrency follow-up authorization, not from a new implicit policy. Auxiliary QA plan is presented above, **not persisted separately**. Fresh task JSONL is the empty task list `[]`, **not persisted**; no prior task artifact exists to duplicate. Tests to retire: none. Pending test decisions: none.

Late carried ENG-1 validation correction: the coordinator's whole-backend run returned **6,127 examples, 1 failure, 59 pending** (`/tmp/miru-final-reviewed-whole-backend-20261108.log`). Its only failure was the new empty-round-trip spec: a schema-loaded database deparsed equivalent CHECK array casts differently from the original migration's `up`. The strict populated-refusal snapshots passed. The reviewer recreated only the owned database, verified the temporary SCHEMA byte-equal to current `db/schema.rb`, and reproduced the same single failure from a fresh schema load (`/tmp/miru-mercury-rollback-schema-loaded-red-20261108-abdd.log`). No string normalization or constraint assertion removal was used. The empty case now executes one actual empty down/up before taking its exact migration-output baseline, then repeats down/up and compares every definition. Fresh schema reload plus the corrected full focused spec passed **9/0**, with clean two-file RuboCop (`/tmp/miru-mercury-rollback-schema-loaded-green-20261108-abdd.log`). The recreated owned database was dropped and absence count 0 verified. The root database was not used or dropped. The coordinator's complete broad rerun is pending; the failed broad result is not relabeled green. This is required follow-through on the same original ENG-1 regression task.

Earlier terminal results were read directly: **6,115 examples, 0 failures, 59 pending** in `/tmp/miru-final-whole-backend-20261108.log`, and **160 actual Brave examples, 0 failures** in `/tmp/miru-hiring-gaps-related-browser-20261108.log`. Those predate the final review fixes; the current broad rerun and late focused UI/DX proof must be reported separately.

### Run 2 Performance

Rechecked pagination/index boundaries, recovery batches, source limits, private whole-byte reads, provider timeouts and cohort aggregation. The known full-cohort history computation remains R1's accepted informational capacity limit; no scale/latency number was measured. Mercury network reads stay outside row locks and stale snapshots are compared before applying. Default queue/pool capacity is not an operational guarantee. Result: **0 new P1/P2 performance findings**; no optimization task approved or manufactured.

### Run 2 Outside Voice and readiness

The required outside preflight was repeated for this invocation, after the four sections: the same Codex harness mismatch prevented any outside process. The complete bounded read-only prompt was constructed in session storage, with the required filesystem/skill exclusion and actual decisions; its plan body was explicitly truncated to 30 KB. Native fallback prerequisites (Plan agent type, TaskStop and background Bash timer) are absent; no general-purpose replacement was dispatched. Outcome: `OUTSIDE_VOICE_UNAVAILABLE`, source none, host codex, outside provider codex. This is missing outside coverage; it is not a clean outside result. No cross-model agreement is claimed.

TODO decision: no new TODO proposed; R1=A explicitly retains only an unmeasured limit. Approval readiness: **PASS**, reusing exact current D1=A, R1=A, D3=A and the explicit held-writer authorization. No new/reopened remedy choice arose in run 2. The only required follow-through is rechecking the final late UI/DX files, capturing their reviewed byte manifest, and externally binding that manifest to the coordinator's final commit. A final commit SHA is not invented in a report written before that commit.

## Final full engineering review — run 3

Actual new skill session `91630-1794101130-d4903262` began only after the coordinator explicitly froze the four UI runtime paths. Target remains the whole assembled branch diff against current develop10e457e1d0cd. Exact prior A choices retain scope, structure and the unmeasured cohort limit. Both earlier findings remain recorded and counted in their own runs; this run does not rewrite them as zero-findings history.

1. **Architecture/security:** reevaluated the current Rails/Pundit/tenant/version boundaries, common outbox versus domain state ownership, retention/shared-source graph, payroll/payment/signing flows and the eight-flag screen above. The final six runtime changes were explicitly re-read; all other manifest bytes match the earlier whole-branch source review snapshot. The unchanged source traces remain applicable; no claim of line-by-line artifact or provider inspection is made. No new P1/P2 established.
2. **Code quality:** confirmed `useLayoutEffect` installs the scoped watcher before child passive fetches; company-key remount/ejection bounds watcher lifetime. A successful wrong-company response clears the shell and throws instead of returning success. Initial/server403/explicit workspace conflict lead to denied recovery; ordinary404 and transient503 retain their separate behavior. Zoned browser IANA labels display the unchanged absolute deadline/expiry inside semantic time elements. Storage diagnostics expose only exception class/request id. The Mercury guard holds all seven locks through check/refusal/drop. No new P1/P2 established.
3. **Tests:** read the final seven-case native design-recovery spec including initial403, successful mismatch, explicit conflict, transient503 recovery, ordinary404 and both zoned cutoff instants; rechecked exact rollback/writer/schema-loaded assertions and storage diagnostic cases. The diagrams, named test map, value cards and complete QA plan above remain the test plan. No new framework/eval or obsolete-test claim. Real final browser/build/broad terminal results are a publication prerequisite and recorded below when available; no synthetic pass is invented.
4. **Performance:** rechecked query/index/batch/byte/timeouts and watcher lifecycle. Cohort capacity/latency remains unknown and explicitly retained under R1=A. No new optimization or throughput guarantee, no new P1/P2.

The default-on outside preflight was genuinely repeated after these phases: harness mismatch, no outside process. The bounded read-only challenge was reconstructed with current decisions, manifest and both original remediations; its plan body is capped at30KB. Required native fallback capabilities remain absent (Plan type, TaskStop, background Bash). Outcome unavailable/source none/host codex/provider codex; no outside clean or cross-model agreement credit. Current branch decision/task lookup again returned no rows. No new TODO/task/decision is proposed; run-3 task list `[]` is presented, not persisted outside this report. The original T1/T2 and their source/regression obligations remain in history. Approval readiness: PASS for the exact D1/R1/D3 and D2 follow-up authority; no unresolved choice is defaulted.

### Reviewed runtime manifest

This manifest covers the328 changed runtime/build/schema paths under app/lib/db/config/.github and relevant top-level build/runtime files from the pinned base, including untracked authored additions. No runtime path is deleted. It does not imply every artifact was read line by line. Canonical aggregate: SHA256 of sorted `path + NUL + sha256 + LF` entries, **`30bc97c618e346e9b7314806da70152c1e2d8e2b6adeb38fdce8b2a8370afcca`**. Final commit binding will be recorded externally in the council log after the coordinator commits this report; this tracked report will not be edited after that commit merely to insert its own SHA. Any mismatched runtime byte or added/removed runtime path invalidates that binding and requires review of the difference.

```text
1252ace8d025e6870102d3abf30ca77fe6ea4f72da40c4828f8c2f44fea1e68f  .github/workflows/validations.yml
39b416e3599254357cae6f11ad51b210bcb471d289af833262141a3b6e2259db  app/controllers/api/v1/agreements_controller.rb
4808576af806be0ed6e8d36e8d7dd3d288721cd7ea2843305957ab45edece5df  app/controllers/api/v1/calendars_controller.rb
b7832428fbdbc81a6ba83fa4b00f33a880c85fa06e2e1c29a7f9e1a432e554c9  app/controllers/api/v1/employee_records_controller.rb
6001f216de3a2bfb2274426e6ae2cc682d56c46640535ec590eca8a3ace6e793  app/controllers/api/v1/employee_reports_controller.rb
d1d26b946fba55fcbb56748bf2b41cb8e45ffbb867b43d5f8a4526740c256df8  app/controllers/api/v1/hiring/applications_controller.rb
ee3b9e104280897893a567fc0e1f79383a2a7f007ec70138b42f60e7b7bbfe8d  app/controllers/api/v1/hiring/assignment_messages_controller.rb
d62679fcfd6e42077d58053a95055d36bcde38648c7afe1b1ed1a046e200ba91  app/controllers/api/v1/hiring/assignment_reviews_controller.rb
068db93842e709de390f7832daeb68e787c3edff05b1ef2db19731b1a0e98e38  app/controllers/api/v1/hiring/assignment_templates_controller.rb
4b859467b93ef69520f9f15a870ef08d0c137721323421f94c0b6e2859e35082  app/controllers/api/v1/hiring/assignments_controller.rb
64fc50523c1b7bde51ce066601cf81b507349756f04f71fd268bb4687947b7cb  app/controllers/api/v1/hiring/base_controller.rb
b78d0574b490ccc70c9a785ec072502cf655f9f8803b173edd8f498081de32cd  app/controllers/api/v1/hiring/bookings_controller.rb
7aa7b0899d49745e5d94b17d9a29afacc53fb1c4c27679d361e3727554ef8ef4  app/controllers/api/v1/hiring/calendar_events_controller.rb
40b9c948bc82ef535ae46e6df13a49640301a21e7cef43cc7ed6067d5b2fe1bf  app/controllers/api/v1/hiring/candidate_messages_controller.rb
de67e4e71055a27553b68d7b464a25e66c3cda896e162758351407f7bc3ed26d  app/controllers/api/v1/hiring/decision_messages_controller.rb
3235b3aff95a279e7eadb7cba47cb7ec2278ed8a27bf0568e948d7d73059cc65  app/controllers/api/v1/hiring/decisions_controller.rb
e8fbf371b5c5f8ee34b0b9fc00b6284a8e0b1fbbd5643a1aff4b4515307161fb  app/controllers/api/v1/hiring/feedback_messages_controller.rb
e4b1d0a9e0150d2d0c45757f3c29d3f5919fdeb9655b6b035c45e01ee9e59169  app/controllers/api/v1/hiring/forms_controller.rb
099800a79bc680e51f7f492a97ce55de6d629c7e9ed1e751ff1e926c50bd1a65  app/controllers/api/v1/hiring/interview_feedback_controller.rb
f73deb0676bca5cc5a9e1610a5aaf2eb8ae6db4f2e20c042be78ba8f9d5e00f8  app/controllers/api/v1/hiring/interview_feedback_history_controller.rb
e8b363886c1dcdebfe50f35487e6bce33fc796db354ed7917236839a9497f6ea  app/controllers/api/v1/hiring/interview_reviews_controller.rb
6b59e2894d4b0a8f10df27aacf6c37865ac9225692f40a933df1440fa00046b0  app/controllers/api/v1/hiring/interviews_controller.rb
c170c4b765567f6aa8464b562998ab07bd3008fc334763934c697734e97e19f7  app/controllers/api/v1/hiring/mailboxes_controller.rb
2cdaf8e86887ddd4418ff2127a8d1ec1890a55e478f76565cdd35da39a00d639  app/controllers/api/v1/hiring/offer_messages_controller.rb
8c0516883e5f048e7d9d6418aede0ac863f017138e37dd68c46b838b69d75063  app/controllers/api/v1/hiring/offers_controller.rb
434d589e14d9d6944adbd06eda3a07d9528d28821b2d0a5d246814b9f956d44a  app/controllers/api/v1/hiring/onboarding_controller.rb
05bd5b54872936d3733c502df500e4f03cbdc6dc39e8e7b0e87dc2047a6147be  app/controllers/api/v1/hiring/panel_members_controller.rb
981783aa823846b731155782fa591b310ffbc35924cce1fb675b94ae944c3df5  app/controllers/api/v1/hiring/pipeline_controller.rb
d3f7c7b16e6698096dc48caa77da9301d2c09ccd3b65a205e1af549a68afdf20  app/controllers/api/v1/hiring/receipts_controller.rb
ec0c21a8ab97ea03cb1e02211c07e68414075a384eb0e75d7bcf951d69264da1  app/controllers/api/v1/hiring/retention_controller.rb
2296c3324e9c7a6a046bb217e87539d8428b66e49c17d479006e6fe1686eaf63  app/controllers/api/v1/hiring/roles_controller.rb
8636c424230309014c2b093dadfb8876e96a1242bab645e7c47863875dd0eeee  app/controllers/api/v1/hiring/screenings_controller.rb
6e98f6e51f02673ba651cf1701bef8d2ea7ba22d262ac9f35f6ceca728fd487a  app/controllers/api/v1/hiring/settings_controller.rb
e4b324a3b7012d5b695f0d5864e83b40ef36a25b297180d569ccecf8b599023e  app/controllers/api/v1/invoices/bulk_deletion_controller.rb
84b5c2d669ecdcc10d81cdd2e397e414f20a44927205ac7b1a4edd25f7bd8204  app/controllers/api/v1/invoices_controller.rb
3994af87ac60068011745f34f7e8fa8df5cfdc62ac360823e4187dfbc92eef04  app/controllers/api/v1/mobile/bootstrap_controller.rb
e0bfe84a4483f7dea37daf1313b1d1f78e20675cd8bde159d9a778454ceb4f63  app/controllers/api/v1/mobile/collections_controller.rb
49a83afdb0392dd6cbadc87a9a409af46f6487abcab7c6a00a15d5ce62e2b973  app/controllers/api/v1/payment_settings_controller.rb
2c32159d3d3de96bc943f7180bf778af458960100b124197336938e8cf20dc7c  app/controllers/api/v1/payroll_base_controller.rb
18a79e1089d5a41e4d7798bebcd7157d62556d735b848569f90f15bf69cafca8  app/controllers/api/v1/payroll_mercury_connections_controller.rb
65bc8dbc75ea9a47405dea3c44cc9ea3de96ed0fc0e5f5007ddae1a1674360f8  app/controllers/api/v1/payroll_mercury_payments_controller.rb
9880c4cfa381a7abd3acc642aab86425cb8165338ad50006b73142d0c4473a7f  app/controllers/api/v1/payroll_runs_controller.rb
be4b27fd26e8e00e165b4538d5bcdd6ab41a8ce287f5460ca0d08bb2bafe051a  app/controllers/api/v1/payroll_split_arrangements_controller.rb
e88e2cb8956eeff3929c55a149d256746ae56a9448540c988726a4804afa3605  app/controllers/api/v1/salary_slips_controller.rb
6ecdc1ebbf17653cab5fbfdfab4ac01e260d69954285e461a7770a4a441c94b9  app/controllers/api/v1/tax_declarations_controller.rb
2b542f13d5e76f04ce54f87d6fa0e3f69c939074173b357e304b627df26c36b5  app/controllers/api/v1/users_controller.rb
79059b4d402b6919ba80c72b0f2877112eb27cf3892935a597d42500d44833aa  app/controllers/concerns/authenticable.rb
386ada2e97c1e0d53243e08493251b097d17c9007109d30acc0a2662442aa792  app/controllers/concerns/hiring_calendar_connection.rb
a4722b38b55b3b76eaff584609d2731b274db24be2d85421cc1584d821a60873  app/controllers/hiring/inbound_emails_controller.rb
68a8426ca147613d9255d3e8b1e24aaf6fcf7b887cd96f2c56c7d81777e44e06  app/controllers/hiring_assignment_portal_controller.rb
6434c62360193e17eb46f23181af77381c6f63bf20331ab79a1704d7963e2670  app/controllers/hiring_offer_portal_controller.rb
e5e84f1093cb57cac4d98cc153462a94593519fcc0c33b3e491f7754a676218a  app/controllers/hiring_portal_controller.rb
275b46eaf95bf19674b9ccf20ec0ae4ab192a203b6ae1eaef526515b01da0883  app/controllers/invitations/accept_controller.rb
e8607923f471d8dc2f412f08ebcdf4671c5b8e6b1ea38a07782ce8a6c325437f  app/controllers/invoices/payments_controller.rb
8fc55564a980c1cc265c448f9404a8f144e058cabf543372bde3da241ed9e654  app/controllers/razorpay_connections_controller.rb
746e4a3d10db58b77f6b7c68af0e10131dbfa5674cda17312dd89ba732838f04  app/controllers/webhooks/razorpay_controller.rb
0e04249c7ff02d6f4034768c3436530e8b3cbe9192bb4a881b8283d8e80bce94  app/javascript/entrypoints/hiring_assignment.ts
fa1e3211093c9d9262f87ac83f7dbadc720eefd9ef638242bdd7900ec09f340a  app/javascript/entrypoints/hiring_form.ts
e29a1b1aeb7ca49afc2e2c7ff0c5f3949317799fbdf3b07d4837c35590e03230  app/javascript/entrypoints/hiring_offer.ts
0f5091ec1a573501f093ed156c13aaa3a2f81e952866dd6d44504141b394b127  app/javascript/src/apis/api.ts
b990be3505d8fdab304712d4c5f93097a09560bafec1a8f7226c22fafead1901  app/javascript/src/components/ClientInvoices/Details/Header.tsx
51049d58d9fc3e3243dcf2882362968883067f6c4accca7e8e318edfe66e99c9  app/javascript/src/components/ClientInvoices/Details/InvoiceDetails.tsx
a5ae57c57eebff21bb6bb417646d405f2d977c9cba853139da5e3b13cd220bd4  app/javascript/src/components/ClientInvoices/Details/MobileView/InvoiceLineItems.tsx
4f160446c2d3111aba89cde8e2d351a7b07620311d0b898d60129fb91c71f5e8  app/javascript/src/components/ClientInvoices/Details/MobileView/LineItem.tsx
fc324f378febe9c95db0d4f5e6e8e571c1726609f6cfb69f0c5650c9aa195348  app/javascript/src/components/ClientInvoices/Details/MobileView/index.tsx
075e72ea094b3829df2f560cb54c943a96780406e019a0e4ad561e88d9e1ff83  app/javascript/src/components/ClientInvoices/Details/index.tsx
4d04195bc7f8dc878f56a7b696279493fb932315de5a66bbe4ad2531363bd3cb  app/javascript/src/components/Dashboard/DashboardLayout.tsx
b86c911c572bf03464de0d749dfbd2f3b8ec1139a26dd2d8770eb58867cc2abb  app/javascript/src/components/DocumentSignatures/index.tsx
c5be104b42c47c1f13e10ef758e4fdf2d69fb714a0edd52a0570ba79d57669a8  app/javascript/src/components/Hiring/AcknowledgementQueue.tsx
0aab82399d13ac1241621c87bfbdac062dabbd116a71d1b53dff5286c03644c9  app/javascript/src/components/Hiring/ApplicationAssignments.tsx
36ddb5e0c88a06532403e66c801fe15ae57f6ceaff05c2b780ae7ce925b2054f  app/javascript/src/components/Hiring/ApplicationDecisions.tsx
62f61d039fd0439f8d68ac372b357af1f49eb1c4db32ee5c7aa4dd3673145ef5  app/javascript/src/components/Hiring/ApplicationDetail.tsx
c75e05ffd0b37c87d889f8a4287907513aa8c5b1e59fd1f4c441c191c2f20f15  app/javascript/src/components/Hiring/ApplicationForm.tsx
e128690577d1435a0a21e1d0be05dcc7a81bb8696e95c8957e7e0d8bbe5351b1  app/javascript/src/components/Hiring/ApplicationForms.tsx
c910e58ce3c70fe6129f9775cf196bd3c07bc50fd8ba4e2acf6cd4dc00975be5  app/javascript/src/components/Hiring/ApplicationInterviews.tsx
ce4002ec4b7d5336898975d700008ca7770aa060a82dcad162fee153f89cef66  app/javascript/src/components/Hiring/ApplicationOffers.tsx
74835ce65663d72da0afdb5da1067f14527596b5c88add18f1646720dc4265a1  app/javascript/src/components/Hiring/ApplicationRetention.tsx
6c95522156a872f605c3aa418063a5b905003df5b68440a76da817d48a0a5331  app/javascript/src/components/Hiring/ApplicationScreening.tsx
dd063500a91242946c16e460efbb5e7f99480f813bb3ec582e6e61756760a124  app/javascript/src/components/Hiring/AssessmentPortal.tsx
9a3b0da6464a8dbef5c51c3d24c389f2958cd27ce9a2b0cefe3fb9719d4e5c69  app/javascript/src/components/Hiring/AssessmentWork.tsx
a4d4b7037ae88d854035daef55c79a3342519e0ba30bda58423b0f810e195a53  app/javascript/src/components/Hiring/AssignmentLibrary.tsx
04cb018de1c53f09ebde027e3445b24690da571bcbd630a5bf996b239be70009  app/javascript/src/components/Hiring/AssignmentReviews.tsx
62a9612f551fe12ca0c73d677d71e38fc4b9777ca24f5cf2158f78d212d7943e  app/javascript/src/components/Hiring/AssignmentTemplateEditor.tsx
702e830c32197f17a02380c35ab6a177dd0072dc57e62c589f0015ad2d33a1ec  app/javascript/src/components/Hiring/CalendarBooking.tsx
a69a8635949981a217853aaa7e0954f7bed94e5b438474de972a4241f630bbb2  app/javascript/src/components/Hiring/CandidateMessages.tsx
a214bce0995d3a1d92c1a48a3b10e98fe69ee8445eff31dbc23393ed2509e985  app/javascript/src/components/Hiring/DeliveryReview.tsx
f004de6d6771e2f49f65fb3bb3a46dcf66907935fbaa64982e464d317d018587  app/javascript/src/components/Hiring/FeedbackDetails.tsx
cd884d7d4a42e88bb1671df2ed46d8281d68c3b1fa990304bd8af69b7d5cbea4  app/javascript/src/components/Hiring/FeedbackHistory.tsx
ca728099748bcd40a83821b8dc001e22b2ed825fdbcffa716f7296b20b8b1c2a  app/javascript/src/components/Hiring/FormSettings.tsx
ef6980f959a608ecb4b974afe511e3ec66decdc17e1af1e738a2c549207b7f22  app/javascript/src/components/Hiring/Inbox.tsx
fcfc7cfc88bbdee45be2dc7a7a1910719c2bfd6741748c903ebb12d282d488d0  app/javascript/src/components/Hiring/InternalNoticeHistory.tsx
c8248fddd4dbd342d63ad9823c70133646059df3440c99fc1d3e5a2ac0a11188  app/javascript/src/components/Hiring/InterviewBookings.tsx
83dbf3a5c4574c707fbf9752717e93e4642660974c80396618876eb7f1323e4b  app/javascript/src/components/Hiring/InterviewFeedback.tsx
9827b1428fb70556a8ded949966bfbefe18f557d2c5d3196b8b0c340990d0022  app/javascript/src/components/Hiring/InterviewPanel.tsx
5530a6015040221002df2f68b529fcb9c28f1475a81dbf1756ceaf5de8c2c5d9  app/javascript/src/components/Hiring/InterviewReviews.tsx
9172ba2ab190056ecc6ee172803fda1f57eee9b7eee647f38182b275dd4ae743  app/javascript/src/components/Hiring/Mailboxes.tsx
10858571531c6559f4575646f654aa1fedda3024c8e00e82caec64e13c2aa492  app/javascript/src/components/Hiring/OfferPortal.tsx
d0d72478a06b7d192700be0e99be92e7c859d22fae788c9acb109c020401f97d  app/javascript/src/components/Hiring/Onboarding.tsx
f5bbfbaed1803c7f29d888b8d25691ee68be282dfa8568c739df7cf8dc4dd213  app/javascript/src/components/Hiring/Pager.tsx
27b4f02a5f406975d552973661ef49f64d902c4e0a41b5784291c73e64229159  app/javascript/src/components/Hiring/Picker.tsx
d9f6b1435e1ef11909ab0b52d41921f766489797475e445a9049e04873b298f7  app/javascript/src/components/Hiring/Pipeline.tsx
d72e48c1c1f5f7aa64b2cb1417409dfee79f90ca553f1c1820878c5af514fde3  app/javascript/src/components/Hiring/Portal.tsx
112614f968768aa01c41446218373072163715d5ce9005ba23c9860f5f83b45e  app/javascript/src/components/Hiring/PortalField.tsx
f1357082e7e89e3c9e16a80cd4916c76c19dcb8b2f4b1b5ee85a81542c0c69f6  app/javascript/src/components/Hiring/ReceiptDetail.tsx
b302dd2c51fd6b2933d2598f7ae12876d2c9850cdbd6011bc3c4165e38ee0d72  app/javascript/src/components/Hiring/Roles.tsx
c8ee84ace1f5abeb99fd7df871df1d8f0f03b4bee7fb8579e27fb6369134416e  app/javascript/src/components/Hiring/Settings.tsx
70bb71789374d3f213c5f27d4ac8ea9006b8d721cc8304e6566df4c015f82ef1  app/javascript/src/components/Hiring/api.ts
35f4469c753fb5477849da9d70890a15fe2dc5086e7bf985fb32a0ae47142935  app/javascript/src/components/Hiring/assessmentTypes.ts
d266686b4284bf05cda8d8281688f8a37066dd53a0eee3a5e9d73948d53b2c27  app/javascript/src/components/Hiring/bookingTypes.ts
a65fef782bcbf8bfcd39d12e51b51378f6a2ea0ee72554f39f24fff4742ad1b1  app/javascript/src/components/Hiring/feedbackTypes.ts
610cea6efa2ff40683c297088c5f847b451e68b6150a682d2ce7093f640dd57c  app/javascript/src/components/Hiring/index.tsx
857af9b44eb78912903f1dc93ece24776a580f928e691adff4b76536cac4ba57  app/javascript/src/components/Hiring/interviewTypes.ts
66abd0b85470956a8f3ee3625a6841208d36e92feb4915559cc1fffd397fdf11  app/javascript/src/components/Hiring/types.ts
7821a5675bc347676e44d16cd3b0c66423fccb61bf3305aad85d8f025d114796  app/javascript/src/components/InvoiceEmail/Header.tsx
ac097db29e045acc860b5fe2a9a1565f2f87fa8cd4956c95fe7970d9054fe18e  app/javascript/src/components/InvoiceEmail/InvoiceDetails.tsx
0996829bc2f3896c37480e8bc6cee0187e595106fc9478d1f36e6bd3087dbb0c  app/javascript/src/components/InvoiceEmail/index.tsx
ebaf9176aaa78bef8f9df49cac37f53cb0b1ab534cd5e00a172429e8df0e2b0f  app/javascript/src/components/Invoices/Invoice/ClientInfo.tsx
df369ad980ae546d9b99047b0eb021c600031ca92f836e944c9a416365d471ba  app/javascript/src/components/Invoices/Invoice/InvoiceDetails.tsx
03eef0a7cb0e699f2fee330237b3aed02ad22c5a892742b897a5c41b46dffb60  app/javascript/src/components/Invoices/InvoiceEditor/index.tsx
1df12833d6da28a6baa67b67eed50b152655162a4e9b2727658fa979f5bd1a27  app/javascript/src/components/Invoices/InvoiceList.tsx
97b860739d0fec044fbb99465abda30824819695c30cd9b5d2f66a463007bd6b  app/javascript/src/components/Invoices/InvoicePreview/ClientAnalyticsSummary.tsx
19b7336c17b38813ebb600876dbbded03bc2b947f3fddc1d073bbc6d8523ab89  app/javascript/src/components/Invoices/InvoicePreview/index.tsx
13e4127c05d7e46beffbe2e2bc40ff1ef9be02e6df8ce9095634ab1da98fe2dc  app/javascript/src/components/Invoices/common/CompanyInfo/index.tsx
44787638b3c5352837e2af85e9b6322f58d72c14d7af8d2b837c3a6e4c1fa6e5  app/javascript/src/components/Invoices/common/PaymentHoldNotice.tsx
80d3e42ea9d6b879df6dd73d0c455e7e5e20e0975723e42a58243436a99e7b93  app/javascript/src/components/Payroll/MercuryPayments.tsx
f052190c5889c850777118dad19a8dbcef971cc8d8bfc4c4ddc1e809122e6f38  app/javascript/src/components/Payroll/PreflightSummary.tsx
b9233e2ba20ec1031892f5270b724a21655a36b34b766e6fae3ed3fafd6fb00e  app/javascript/src/components/Payroll/Review.tsx
7a771abef8dbda5945549f27ae757cdf0fd49d1322e210df34daa681f8354e11  app/javascript/src/components/Payroll/RunPreparation.tsx
a666016064712ca97913ba989bba57bda768d75ca42dc532619f304636df6fcc  app/javascript/src/components/Payroll/amount.ts
c1b436e4fbf0777d6edbfd19e07baa4fa650a177745056527c6e2035e5682604  app/javascript/src/components/Payroll/api.ts
a5c387e3e60af4b4b1ba48bfb75a7dd3b0b3bcf09509c0e9c9fa1d23ed27fdbe  app/javascript/src/components/Payroll/paymentLabels.ts
600cad0fc3db002f992db44bfa6994cad3515284abd97e8141a2608c48089ce3  app/javascript/src/components/Profile/Organization/Payment/Page.tsx
509be655a8a16b5cf5a069d0274c0687698064a1a0ece58cb38771e66819b1d5  app/javascript/src/components/Profile/Organization/Payment/RazorpayConnection.tsx
7b641348edacc2856e3bd7bd01099d3a6b89067f6c4519d191927946f9b253f9  app/javascript/src/components/TimeTracking/index.tsx
f947fab16e5d3e10cafb81785b2285af354f5de50c221c5e42aa62bcfcac40c1  app/javascript/src/constants/routes.ts
96283b19ef54208458329734b575046223bc10b72d343e9369f545dd3c9cbf23  app/javascript/src/i18n/locales/en.ts
b6afec4bb3c82cb53154890307d777dfeff987b7c25f00725b86a723808a865a  app/javascript/src/i18n/locales/hi.ts
1a984120c5f487a641595edfd0971eaa85002f9f9d4feec0b719909d511b6dde  app/javascript/src/services/invoiceApi.ts
53a30b801c382ca1c48a90bd0933b68f03a7d67b1669fb78f732eb1d7d844a46  app/javascript/src/types/invoice.ts
fd6f54e0ba240815f705bcc3752a709615ba48e5b75f40d926e593e8a32b1df8  app/jobs/cancel_razorpay_payment_link_job.rb
8f5ec669d58236c69448e1bf89b919c02ad6a37a2c0b1990120841c1d855f9e1  app/jobs/hiring_decision_notifications_job.rb
e8305d8379d2a8ece44ed96debc7eeba87de8e5ae6e5dc9189d25e9a2dc91268  app/jobs/hiring_delivery_job.rb
7d4c4ceb49a838d5e10fe5c4acb117a8b929646062368bc8e6deba72ab51adff  app/jobs/hiring_delivery_recovery_job.rb
a43d800ab69f75dc9495c5c0ac763983bd418b6118ed20d52c463033d61f67a2  app/jobs/hiring_feedback_requests_job.rb
0af46eb3dec7aec9bedaed0d8a80351e0a9f660b15ea0a4603a16208ec82683f  app/jobs/hiring_intake_job.rb
75f0c04ae1105af2166d095e6df500c0feeab7bc4d7c350a9a337fc313040a7b  app/jobs/hiring_offer_expiry_job.rb
8dfc41576efb40bdc30ea3de8e442fd2e49c65fcb1e3bfbc7d0a47843cc58dd7  app/jobs/hiring_retention_job.rb
bc7cf474770bec1870715c1973e43b778f547eabf552b0659dded0e0c76fc588  app/jobs/payroll/mercury_status_refresh_job.rb
79c18df731a05c4fbba7b1e57b64a4e3f0b86a4fb8208ff075aa2ab259ddb7fd  app/jobs/reconcile_razorpay_payment_links_job.rb
b123dc5d0cea5c555731dc1278789186b81ad312c9fcf995b7626f8c110b043b  app/jobs/refresh_razorpay_oauth_tokens_job.rb
9f92852b674ac2fd304745c51a206a12650097375ec13734fa36abde4143b05d  app/mailboxes/application_mailbox.rb
0711234da746a5e8ea19ba24090ce0bd759b56c04b2d558a8e71eb456a8335f7  app/mailboxes/hiring_inbound_mailbox.rb
68a6e3355a7539c46742aaf6b80073666d34da8ff0b740c81189025c30ba9fa1  app/mailers/hiring_mailer.rb
85f9788a0990ad0e19a0f5e5e9204452c9058ac0d21cc78fd1e167adf91df4a6  app/models/company.rb
f4a73a945cdb92fdb324d82548f1aab13daa3cc3b0fe9235fe6049777d9b1577  app/models/consultant_compensation.rb
aac047d31b29ceb32ecbdd59c43af06b9c60e9446f73c1cddcd6d51c69acaf2e  app/models/employment.rb
3ed5680560228a818656e5f3a2a35d0054f3d0bec2e3d4cbb3ebad93f9d113c1  app/models/expense.rb
8342fa2e169398395e2805e4c3b2f1fa3712f248aade827c8862d4302d0ba2d1  app/models/hiring_access_grant.rb
ff78b4db63b97878cf959ef823973a7e1d7a9b3a167a82e9b4c366f2df368d01  app/models/hiring_application.rb
9e40ddbe4c273f0f8ab98ee47daea80da56f4b6002ba23f7416ccce13391aeed  app/models/hiring_assignment.rb
d777915d6f08a7943ccc47815ccd3517096af6696d355b889a55f5260ad6bfbb  app/models/hiring_assignment_event.rb
7cce7cf89940f2240f2f2789e6899d4f7e42d99471879cd1b0654e468ec50f37  app/models/hiring_assignment_review.rb
6da405731f3600fc2c171238158510c7574796be15925f458fb8ed7a402c69e7  app/models/hiring_assignment_submission.rb
8141e8d393544088c4fda01e64daca5561445b25ed92a572b166ad6ab6e4523c  app/models/hiring_assignment_template.rb
04a1958155ae4ea36ac332eec2140b4e8894f9651049d9f06690c564f9aad7b8  app/models/hiring_assignment_template_revision.rb
22fda9534b39722e12711a2d578f1e6c9a4b7ee32aaba1695b1dec23aa001e55  app/models/hiring_candidate.rb
18b38d77f1ee4f28eaf0d0b4b6bb1db09021f60982035a637b02c9fb6542f08f  app/models/hiring_decision.rb
8af948cfcc12c259c535b0009937328ac80fe454ee51a49de310f0191a562c9e  app/models/hiring_feedback.rb
aa9abe273476070759c40a8e551e9d2df6af6fa5e50188811ec8123db9d09ea8  app/models/hiring_interview.rb
b0f4e5e9793d5122e6a18f0b2a7b273641ac0e8cb26b879538c0e1caf4bdb53d  app/models/hiring_interview_booking.rb
b8d5f783f41c69b5bd9cee4dad38a60cd6fd314cacab707282a2f9efc69b1df0  app/models/hiring_interview_event.rb
5e142f6393bf4e7e6e18265fc51bcbdbc03fb2c0d2ef35b31e9cf318a493071c  app/models/hiring_mailbox.rb
d8f1aec16e566dbf32f74ccc3c204ea4ce6fc177bbd293c7ab5d35ddb2fb30c2  app/models/hiring_message.rb
6be860c517a3d034d83a69fbc4a572bc1ac1a86ba3b356d834474e7f754bb681  app/models/hiring_offer.rb
edae7dea18b2cfcc0b7bd0a9089d087fd97cd3b0d5d61b6588eeaec6a7f982cf  app/models/hiring_panel_member.rb
c2f68d290e1d5d32403084e5e6a6ce7d44e09d917c695d04eef455f29f4eed37  app/models/hiring_portal_access.rb
d494eaa76feef4aacd315e97e71edcb950424bdb9e6698cb9407e5d97e289b76  app/models/hiring_receipt.rb
1dd566a703c694d102cd22d7e7d9e1cd20398e903045ee9c3aed61c097972dde  app/models/hiring_role.rb
90c5dbd35fd0fe1457cc551dec47a493fe0967960a817b908f3711d9a47e317b  app/models/hiring_screening.rb
a3002e0b379425050e6c82d077d371de7754a79dc0bcf74b8faa5727540586e8  app/models/hiring_setting.rb
fe0ffb26465c604430b8b9267943705b2a90399d2c13664cde5e1a62c2631589  app/models/hiring_submission.rb
fe96d35c3fbe599d321ea8999ac6048e0d7b4c63ad9c49b25de5b81c628a5441  app/models/invitation.rb
73ae4885e12c1f2648e0b9174e81387755f907073a5ff5670487983c95e2a08c  app/models/invoice.rb
995241cc65b0090a2fcbb08f7e931a69ca89f80e9ae0f04b65984038d5a21703  app/models/payments_provider.rb
c5a004565dfaaf38e8bcc80cba5d738b2eb2c436157700b9747ee7697e284e86  app/models/payroll_expense_reservation.rb
44ff1ff4576b412bd27f2c3a60fa99e4007279b3e5fadba00998051c7f12004e  app/models/payroll_mercury_connection.rb
16bc5836732daefa1a0a2c1b642b7179aa7453beeb4d3027838a5f84e5e85b37  app/models/payroll_mercury_recipient_link.rb
1c9f2339a06d5be7dccbc5bbc2d6f118fcb3119110f3a767a71c8cb692f37ff0  app/models/payroll_payment_event.rb
acd699a080248e29bf251b3bd2c9fd28eb75526acb1eb10975069393906a46e2  app/models/payroll_payment_group.rb
31779c7a9c577cc674291feef1ebc9e703423730979dd133f60e7dbf0e7ed767  app/models/payroll_payment_instruction.rb
de761671b26cde5b8453ab1dcf145a8491383b309989b90af4132c0a49832917  app/models/payroll_split_arrangement.rb
31f67711cda9bf580d17b522982332dc5285c8490eaf4c5333e365b4ef0cf2cd  app/models/user.rb
54014115efb74a3fdf86a235d964df84a3af57ef7afba390cdd6245931d91f91  app/policies/employee_record_policy.rb
a072e8bca3fc91e48db3fd4c84ef281a20f98848b6d71772ddee9e5ff7817e60  app/policies/expense_policy.rb
8ff89be6ca0d9eacaf5f4b0c15edc5c8cc949d944b679748ce682d9d29f6c0df  app/policies/hiring_assignment_policy.rb
09d703ff5f5c25d163c067d37cc92ead16b5a59ae6d635c8dfbc979e152c8ad7  app/policies/hiring_feedback_policy.rb
721dd23e836cbd31428b8620e00146fa1f4c2eb06339901dcf7b59047a790be2  app/policies/hiring_interview_policy.rb
d2a363ab95a0d4cb968aa897a0e652426f51842171a5d923b5841bccdafa9271  app/policies/hiring_policy.rb
99639f0bc056a26d019d02abeae5358e7830b3f2e2a8f5b4663da18b6898f60c  app/policies/payroll_run_policy.rb
12e501c1639c051aeebcaac7ee365ba2c6fd4a77b0bb565d85a2a75711baa4d5  app/policies/razorpay_connection_policy.rb
ed59a4c00439912fe9f384ce8a469459190164281c984280f263d614fca8d984  app/services/calendars/connection.rb
de93b7af9937ae88c6ae002ff339e260ae160338648851036ed55e8bc7bec613  app/services/create_invited_user_service.rb
a853f21d20dac4a61c676dbe4a222820c062a60a5c76d3216017699c29b698d1  app/services/employee_reports/download_service.rb
1b701bcc00f3294b9fbafc4b22b18b0e799c7209a745c8a90acbced7b2c11079  app/services/handle_stripe_checkout_event_service.rb
d2e0ffd84ae520d1934407294701364a34907d21c8402e576d7f02085243a9f4  app/services/hiring/acknowledgement.rb
7628d3db5ee3e4a2c2bbb1315e900c718b679644a26e6db36a67ad8caba2a7df  app/services/hiring/assignment_communication.rb
2eefad38d41f9d78d50dd044bd94237c8da630ddd71be13f96d15622ee116973  app/services/hiring/assignment_templates.rb
d42a3fa7df7ce86349bf2b56945c489cddce31d5bb8e2fe8a12f86c8972258c8  app/services/hiring/assignments.rb
f3f34a30c53bddf9a9b471b44401586676ed26d15244b71534fb654f353025f5  app/services/hiring/calendar_events.rb
d3e0db199f1ea02164f9df4eef8b3697d37791805700bfb8a6f7dd42ea2a242b  app/services/hiring/configure.rb
fdc5cee49400f5df9d694d2bccdb480d8c6abd6a5714cfcd9e5835ed255de61c  app/services/hiring/decision_communication.rb
22ee063e062941dd4fbbcad58eeac4981673364da897875fe656ab4fd27f35eb  app/services/hiring/decision_notifications.rb
2cfbe2a7b6ed788223086e78047e435363572b9ba8daba87c36afd023a38173d  app/services/hiring/decisions.rb
d26f489220feca38689163fc8e5cd6eae9fc480749c65a015a3597ae604898a6  app/services/hiring/delivery.rb
571ef17b9612a12b4b3aa91c26637475731f2065f3e24c5ab013bf60bf64dcf6  app/services/hiring/email_content.rb
5db93a148c6a5876c635d98cd1f57aac5bbe6f801d5ce030d00256dbc06a8721  app/services/hiring/email_intake.rb
55050d7d33a64c596732f5e762c4afcdef4d07eebc170fffe75e08b305ed5d17  app/services/hiring/feedback_communication.rb
24f2aab618db71421acf6e142cb0775629dfbb38b5b807d21f3713bf2010baff  app/services/hiring/feedback_notifications.rb
6becfe3997a39d017de90550bef8f22df87bd4f85ec9bf5c5cd8f8ba458ba7c4  app/services/hiring/feedback_submission.rb
17d5aa05f1fefb9c9e8678e6a9384cf2a3d58dc466757c7db513dc10523de9cd  app/services/hiring/form.rb
2e45b4fbb51eced942c6344651ba082987973059e3c651bbdd7c22e9092c8385  app/services/hiring/intake.rb
de0ec5839d274c9d01736672f462537a0ce302b1aa24b602f8167846f0fd13e8  app/services/hiring/interview_communication.rb
863dc34047363038be0a276637370cb911a2bdaf7132205b3737a8e3783c1f71  app/services/hiring/interview_handover.rb
b335b8792b39676d95b114dd6916d94a2b434e3528b4bf1dd35f1ab156ccb854  app/services/hiring/interview_time.rb
b450112227475d41380a8f0c966453678f85da54f60ad909df10b85809b48cce  app/services/hiring/interviews.rb
10ba96c0e172706327e5d2d8b9aeb5f33f2e6de6237156f1d0e6d8c3af255b77  app/services/hiring/message_communication.rb
e7fa67e3ee85c8e4bfbe4ca69940d657c6df7e2ce181e51e8ef01decc1fbf164  app/services/hiring/offer_communication.rb
b12c5efe7a9e6578500a09f0465e2dab771cf3d112d7dda684f21a82b00fad50  app/services/hiring/offers.rb
e2f128e33d6ea11ca7640066bc61bbcad5a02dc693a27804a17ab3bd5f89f31a  app/services/hiring/onboarding.rb
2b666b209772d86fc1c49a8e1a60d382954c998c8e8d24719ed0602744dc3ea6  app/services/hiring/pipeline.rb
c7595aa05428005ade78aee4a3049fc046c9d2ed8498856402074b947949e266  app/services/hiring/receive_email.rb
70c4c39cdc9b1f1815002f78d6522a1ecb2142228259240c3072484a5a5bb1ae  app/services/hiring/retention.rb
e1a3966d24d5f136898fc33a6750d86e78ce439c5909e3149ae08c6d2e4c8893  app/services/hiring/review_receipt.rb
d9f12c3b45443146ef8c4847300a876c16226d230ed8b76b1aa9ef96e18f3848  app/services/hiring/scheduling.rb
213f35f6b55fa912623ed3b7cc67a0c59461e5ce98e558a5ac6c08ada6d5da18  app/services/hiring/screening.rb
c19471bca4161c432bb7eef66418047de1f5ca93fb46abc240180dd3d9e121f8  app/services/invitations/create_invitation_service.rb
bedb29b9d3930d20a115e837997bfb9261686db0f1484ae3dbf81aac35c68ffd  app/services/invoice_payment/checkout.rb
818c9f5c8989052a21bbaa294674ce07f766be59c7a3d5307a8896e20430c765  app/services/invoice_payment/razorpay_oauth_payment_link_webhook_fulfillment.rb
509c2c0e9a940a363fc9c8acc2d31234aa67fb2be84c356ceee2bdf0493c8385  app/services/invoice_payment/razorpay_payment_link_fulfillment.rb
4aa1226c67174df0cf4f4b61e6d499911932a80316bcebaa5959d0d8105dc364  app/services/invoice_payment/razorpay_payment_link_webhook_fulfillment.rb
22266b29c5349257d57d99abcfb33ce5b06576673735c79490c550136d71b62e  app/services/invoice_payment/settle.rb
6ff3d6c4f9285cacc2b1d1ba52d75ea1bd9236f4776c7a4ac9639b9649483fb7  app/services/invoice_payment/stripe_checkout_fulfillment.rb
b52b0041d5c4b0bdbb22ab9b9a58a9fadc56aa7daa23db120f35d9f893c195e7  app/services/invoice_payment/stripe_payment_succeeded.rb
965b79c1c01baf474fa61da8edc84fe05ce1fb85d070775e288c85aaecd185cb  app/services/payment_providers/paypal_order_service.rb
01c67dd6a8ac22f7826521995e261e99c327aac4dd1a28be008e650e2d54cb29  app/services/payment_providers/razorpay_client.rb
7690560efb64ee450a8b29a1b1874b4c41cf87a1a9babe2bd97905736cd8a7da  app/services/payment_providers/razorpay_oauth_client.rb
8c788425aa3a79b9cbae25df2df665228584761ac9cfe2712c2b33014638dbdb  app/services/payment_providers/razorpay_oauth_connection.rb
5733dc19e3b2a408f9148cab8bd861eceed7f1634c519836c2ce9d4d9e434535  app/services/payment_providers/razorpay_oauth_webhook.rb
772a3beea99ae1870902c9b40851434930731b595659305ffdb879a27a649b69  app/services/payment_providers/razorpay_payment_link_cancellation.rb
da533c60f54c9dd84ee435f5145e27c62b14d52ef45a1586220a70ee6f21d91c  app/services/payment_providers/razorpay_payment_link_creation.rb
766538ce67e3f8b1448a72d356588f24593a0d15000eb7113f9871b2051f4bc3  app/services/payment_providers/razorpay_payment_link_service.rb
1db85abd3b75f67d9aac32f6c0c0bb1d3c08fb274d202955a29105018955986f  app/services/payment_providers/razorpay_payment_link_verification.rb
3002944c75a079de38c1008b6cd1760d8952b9bd9eb89f964204eb956415b4eb  app/services/payment_providers/razorpay_payment_review.rb
c0b884a4ab124ea853a2a0c0bf6af26fb4f0125c4fef368b5b662349c6359da0  app/services/payment_providers/upi_intent_service.rb
ec164b671de60f4d9a5ca6a35c2da584dffed5054318e0a9347eb8db5cb0e29a  app/services/payroll/claim_reference.rb
8051a7a3356d94928cca60f74cd93ff237965d2f0210d3053b2d737cc48401af  app/services/payroll/consultant_allocation.rb
ed5462779360528ae81681c6591d6dfddf8c5ef8369ff3aa8587882851092d59  app/services/payroll/consultant_review.rb
c7703b2793c310854a63445194c8933cc6c3701d9569166696cde76b2e22cc0e  app/services/payroll/consultant_revision.rb
ae0c8b095d1f0f1b7d1ee32a961b47d414defaadcc729b5bf106c8c68fe4379f  app/services/payroll/mercury_payment.rb
fd9a354d1f119cc85017574bfc59095aa118126c41716a3cf07d4472354e1a04  app/services/payroll/mercury_payment_review.rb
87e6b0c8eef6ac04249e07e23325e53007dca7906f1991bedff8fe069790b8bc  app/services/payroll/mercury_readiness.rb
17aa911c2327dfdd0bdf345eb373af4daffaf4a0d4ab0406a64a01990c2a5b83  app/services/payroll/mercury_reconciliation.rb
9a3bb249eb344b95d153685252367a4aab035c2bc7c38261f244bef7743533bb  app/services/payroll/mercury_revision_guard.rb
db66bbc718fa1e4d2cb4334866a95840e320dbe8c68713b1b7a324a1d6076f10  app/services/payroll/mercury_setup.rb
710f3ccfeb16eecc35ba1cc41390557767d32d6d74322de113f430dea58be6de  app/services/payroll/mercury_writes.rb
d6085e0557503e185b10b7c82ef79ae2045228709ef0693f1fa4e80235c64417  app/services/payroll/review_summary.rb
dd5eab4323d629288eadf9d8d4e47264830ab494f7fcd422002e144a1cb45908  app/services/payroll/snapshot.rb
fdf40d867fa04374d0a11eecf8be391931ccb24fb77d844c8c0f2cb7445a34f9  app/services/payroll/split_arrangements.rb
030604c5aeb834aca47124935752b45afef481c2a55f537297cac1a5000a4c79  app/services/payroll/workflow.rb
164b4a587e5202c30d88970d9362642de09db45df98bcc52c4dba431c0efd2d7  app/services/payroll_providers/mercury_client.rb
07db35575ecc516b276b73e42933c6382d694125deb84ff244d48eb3444a8ffc  app/services/payroll_providers/mercury_contract.rb
f6d836f8197d77eacc1dbc7c9d2cd16048648b71dcb7becf259b2c051c1dbf0c  app/services/pdf_generation/invoice_service.rb
637a7dfff6c8daf705f08555c128733295d70f9fc58e852b8b8092870cb03e1a  app/services/signatures/reconcile.rb
f55ac6144fd87f95fd9a0bac63bba0507bff2431cabcb96648820a156010abab  app/views/api/v1/invoices/_index_invoice.json.jbuilder
6f5088dee6ecf47967fe91e84a4724cc05b53e03ff0cbb95d5f081161efed283  app/views/api/v1/invoices/view/show.json.jbuilder
d0623fc39ec1da3c86f5285e448f69b1cfeea5ed919d8126b7b2b18c92699745  app/views/hiring_assignment_portal/show.html.erb
fac76d5a981d6960d25827098b6b71c51ec3743f5858a766d0f8a0731f5ea4a0  app/views/hiring_offer_portal/show.html.erb
49dc198fab2e9bf779243b467c46942b736974380299fba697e02db5704c1a56  app/views/hiring_portal/show.html.erb
70729573df81e5e52da7413b6e1bf738ee472ae90978c6d4c41729a8a06836eb  app/views/internal_api/v1/invoices/view/show.json.jbuilder
631f500091f1d8c33f640d749a19908e3c3e3e7b8897a5b88cc9e0d2f83039f6  app/views/internal_api/v1/partial/_invoice.json.jbuilder
5c858698d166a1bf4c5e44f630d9c0a44b52f3e8d70474b4807c18d9cc97545c  app/views/invitations/accept/index.html.erb
7051f05c858f942aa509a2611f98a0adbaaebb6c823736e6ad728c685314d59b  app/views/invoices/payments/cancel.html.erb
78ecc482657b2f39360daabeb830997691f59f5e264aab59471ca0f5016d99da  app/views/pdfs/invoices.html.erb
7ef5a4a29cbc0ab82f78fd5a77f025afe00ed5637d631b2735b9b33c62136fe8  config/application.rb
3d56a123319b14b9afb36859c9e1d05941a7fabf35d96e1482e47d32b21f248b  config/initializers/filter_parameter_logging.rb
23d46dbaf439b5a0e09d57f3dc94dd889608a5c6481ffbe1ec7f52b1be3824d7  config/initializers/hiring_portal_body_limit.rb
77c14cb93eb395586bea78f0adf9ba5303d065b933daf998a6b919ddc034a0f0  config/initializers/payroll_schema_dumper.rb
e2ec1867581ca9c2c84109fe9ff06ea8cbc3061dd07fadf469be19d218a9eb2b  config/initializers/rack_attack.rb
454d709f307a4c222cb6612710cdd63da7506a998f8ee7dee0ad22f9f760fb8f  config/initializers/sentry.rb
e989c5dcf5db29819246e6f5b784902e089a9643b62d819d605f9d95d73b9c38  config/routes.rb
592c83aa7eea80e70bf9c2cf347cfabf5ac49c846d0c94c3ee5c37b852df92e1  config/routes/api.rb
cab0dcdf0613de96ef50057a83b69f73bf604d7611daf7e0e411cd2f81f9c2a9  config/solid_queue.yml
956cfe2dcef546d0bd5b93cc720e8a7e0849c6c39e2fe2eb97b222e0c0f75c9d  config/vite.json
a160414099ffe8817a5eb807217f40306de472662c9ebe398ae02045a267a765  db/migrate/20261025085700_create_hiring_intake.rb
5201c8c80c72117ab368cf2dbf222d352e895acb6761838fad729f9d1e720762  db/migrate/20261025133000_add_hiring_email_identity.rb
5a3a7bb9f8b36e72f546f9daa58c71ee311241ae79d30d6f49d784c2354a2e6a  db/migrate/20261025133100_create_hiring_email_intake.rb
7fff3f4c2aadc31164cbb8a99f25896f11a817bb4230e6e7516670df336e3c73  db/migrate/20261025133200_scope_hiring_message_settings.rb
715c7f1cce99a9c243baee321faccb0f8c52615931812e80138afb5026c64260  db/migrate/20261025133300_preserve_hiring_send_attempts.rb
ec862752148dff69a88dd9e4cd56e185411c5beef3ad01bd0f7a4c97fd447f65  db/migrate/20261026090000_add_hiring_form_schema.rb
c225c04f54751915f4025ec5807817f334eaa9ff91e520549590c3c657625cc6  db/migrate/20261026090100_create_hiring_forms.rb
334a98aa4c037ceeaf621a9a8e3a2785cd8599f0d18df5aa0584c5c5eeaa27ce  db/migrate/20261026090200_create_hiring_screenings.rb
8a16abff2f86cfae4656b5bd98376360f4560acdd0a46064c4f519b19f8d5180  db/migrate/20261026090300_create_hiring_assignment_templates.rb
81f7e84ce6c41f7b4d5be333f4d381f05d2ee9ca378e7c066ca9589da1913010  db/migrate/20261026090400_index_hiring_task_revisions_for_tenant.rb
759f21d01f89bc04aed22d564143242dea5d828f86294c463990bc248cd06853  db/migrate/20261026090500_create_hiring_assignments.rb
b8797839a6edc86070c948669f704569dbf21926ad6e10c655d930666fa65ffa  db/migrate/20261103090000_create_payroll_mercury_payments.rb
9280c52300207a64ad23725df968c79096ab3097459f3a7173314a8289e668d8  db/migrate/20261107092900_index_hiring_employment_tenants.rb
23ee9ef993b921d5d352ae4a509a601db9859de13d559960ffc04dce5b838898  db/migrate/20261107093000_create_hiring_interview_panel.rb
bb33b8032499b6434ce63feb8b28c02f0f59a981ded68bc5d7137bc160a882cf  db/migrate/20261107094000_create_hiring_interviews.rb
9da6bb73e7b7554346caa2f94b604d1125e2724802cc56ef6dced1a7b40a5235  db/migrate/20261107110200_create_hiring_interview_bookings.rb
619b3fbd821d4969c6ea0f11bdd3ec69aa69b1234531481b1462af7f15e342b1  db/migrate/20261107133000_create_hiring_feedbacks.rb
3330dd6f313afa675a3c46b99c4fccac34de947947dc07e793817934f5b82c0a  db/migrate/20261107143000_add_hiring_message_events.rb
864d6dd211aeaea1fcc7442bc8f53236b0ea46ab62e070a5d85960973cf4c746  db/migrate/20261107144000_index_hiring_message_events.rb
0a605f307ee1d2ac059d0fd86f5938f4927cb6d7717bab8cc1f21b09357265b4  db/migrate/20261107150000_allow_unbooked_hiring_invitations.rb
29ec640995cd668b32597f2c0f014fafd2dd53d11f968e68eab09f8718e0fc68  db/migrate/20261107151000_validate_unbooked_hiring_invitations.rb
40fa5bc237859c7f2cd3d2b443d4589e19a4103b7ba4aacac85f1c8f2971ea73  db/migrate/20261107160000_add_hiring_feedback_notifications.rb
b0b9636a2f1a6eb5ed0989fc92275339a7f5130a82a5036108b66cdefc09473f  db/migrate/20261107161000_validate_hiring_feedback_notifications.rb
b9b7bc586bb0693044fc13e235fc9dbc95394f825c4df5d0c0ab3bbe08c7f8a1  db/migrate/20261107170000_create_hiring_decisions.rb
b787bb19930e9bb0c2dda8420e8942f106a589f0a36f45e1136b184939924328  db/migrate/20261107180000_add_hiring_decision_messages.rb
aa4349a7a12f3cf4748315e1f937a10a1f13018d895e3f0b629675d455bd94b4  db/migrate/20261107180100_validate_hiring_decision_messages.rb
a8e97f41f9ceab7da2ff5caee32465d9a0a9644a2d814410124dffe086db9423  db/migrate/20261107180200_index_finalized_hiring_decisions.rb
dd85e8adabd8744917adb6aca46bb45972aa3aa5532625dbacc98d66c491c98e  db/migrate/20261108010000_create_hiring_offers.rb
0c2616c462a49fa8019f15cd7f32b6db43340868482a1d3bf362598d164acac9  db/migrate/20261108020000_add_hiring_offer_messages.rb
99884713a0f58e2e25d83b4d85273fd84352b2a7621b53c291f6cb195db06a09  db/migrate/20261108020100_validate_hiring_offer_messages.rb
33d2ed7918474acc290b77b9efbae6845ba038e717cdd3e16d8840816f0278fb  db/migrate/20261108030000_add_hiring_onboarding.rb
acaa8047e226ef0b87bffdb476f28509e9cb847fdaff71cb6ad60aba985f00dd  db/migrate/20261108030100_validate_hiring_onboarding.rb
8581891970920591aa849ebbb96e2ef45e173817bea1eeaa7873998b6542d0b3  db/migrate/20261108040000_add_hiring_assignment_messages.rb
744d870a4ebb477fa1852b382059b1e8f06de3e10784ad95aacbe020042039c3  db/migrate/20261108040100_validate_hiring_assignment_messages.rb
4058460bf6d5f5fd677329ea2abec0ada938add5d6aa8776e20a5437f77aa211  db/schema.rb
```

Focused proof file hashes at the same checkpoint:

```text
159ca1cf59cbbf992c5bb5b1c1a0f9eb15cf9352903833bc92b1cc3775a541d2  spec/models/payroll_mercury_migration_rollback_spec.rb
8be49983a9c090fa2cac6f469888dfa7e7e2a38aca296639646239e46d481d52  spec/requests/api/v1/hiring/storage_diagnostics_spec.rb
2c0b1ba534944913561c50d3b221ccbbf1808d8f8eadbd13796541fa9de7257f  spec/system/responsive/hiring_design_recovery_spec.rb
```


## Completion Summary — frozen source checkpoint

- Scope: **FULL_REVIEW**, complete assembled branch target retained. Three actual native skill invocations are preserved: run1 found ENG-1, run2 found ENG-2, run3 found **0 new issues**, **0 open findings**, **0 silent critical gaps**, **0 unresolved decisions**. No prior issue count is rewritten.
- ENG-1: populated rollback and a real concurrent writer reproduced loss before the guard; final transaction-held seven-table guard is locally9/0 and independently9/0. Fresh schema-load harness difference was reproduced1/1, then the exact migration-output round trip passed9/0 without normalizing or deleting any constraint assertion. Both owned database lifetimes ended with verified absence count0.
- ENG-2/DesignD2: actual initial403 was RED1/1; final watcher installation uses useLayoutEffect and wrong-company success denies then throws. The final seven-case actual Brave suite passed7/0 in7.9s, with browser console exceptions/errors and375px overflow assertions. Exact logs read: `/tmp/miru-hiring-design-initial-red-20261108.log`, `/tmp/miru-hiring-design-green-20261108.log`. The two original design cases were also RED2/2 in `/tmp/miru-hiring-design-red-20261108.log` (coordinator/worker evidence). Candidate cutoffs retain their original ISO instants and display the actual browser IANA zone.
- Latest complete non-system backend: **6,127 examples, 0 failures, 59 pending**,6m31s; terminal summary read from `/tmp/miru-final-reviewed-whole-backend-green-20261108.log`. The earlier6127/1 failure is preserved above, not hidden. Pending contracts remain unfinished. This is local backend evidence, not current remote CI.
- UI build evidence: worker reports required development and forced test build commands exit0; logs `/tmp/miru-hiring-design-vite-{dev,test}-20261108.log` were read and each shows9,822 actual modules transformed. The reviewer did not launch another build. Prior combined actual Brave160/0 is distinct from the final focused7/0; counts are not added. Any later expanded native result belongs in the coordinator's external final handoff.
- Storage diagnostics: focused and root-independent **16/0** terminal summaries read from `/tmp/miru-hiring-dx-{focused,root}-20261108.log`; source and three error-class cases inspected. RuboCop2files/no offenses and whitespace checks pass for the reviewer's migration/spec scope.
- Required outside coverage: unavailable for all three engineering invocations because installed Codex preflight rejects the current harness and the exact fallback capabilities are absent. No provider substitution, model claim or outside clean credit. GBrain retrieval is degraded keyword-only, not evidence that notes do not exist.
- Performance: cohort memory/latency unmeasured under explicit R1=A; no capacity promise. Baseline329 TypeScript diagnostics,150 unsupported scanner files and59 pending contracts are not passing results. Live providers, private production parity, deploy/backup/cutover and actual real-user acceptance are unverified.
- Final source checkpoint: **328 runtime paths**, aggregate **30bc97c618e346e9b7314806da70152c1e2d8e2b6adeb38fdce8b2a8370afcca**, plus three proof-file hashes above. The only runtime differences from the initial whole-branch snapshot are the four frozen UI files, storage handler and Mercury migration, all explicitly rechecked. Final commit identity is deliberately not asserted before the commit exists. The coordinator will supply the SHA; the reviewer must compare every manifest byte and runtime path set to that commit before recording the saved council entries.
- Required logs are pending only that final commit binding. Planned truthful records: run1 issues_found1/issues_open, run2 issues_found1/issues_open, run3 issues_found0/clean if and only if exact bytes still match. These are planned fields, **not a claim that logging already occurred**. The external log will include the final SHA and manifest identity. This tracked report is frozen before the commit; no post-commit report write is planned.
- Approval readiness: **PASS** for exact current coordinator choices and required regression follow-through; no proposed remedy is awaiting an answer. No new task/TODO in run3. Auxiliary test/task artifacts are presented fully above and not persisted outside this permitted report. There is no feature cut, new workflow abstraction or extra provider operation.

## Suppressed findings

Upstream receipts for the lifecycle remedy: [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect) documents layout-effect timing and cleanup; [Axios interceptor docs](https://axios.rest/pages/advanced/interceptors) document registration, rejection and ejection; [Axios issue3870](https://github.com/axios/axios/issues/3870) distinguishes asynchronous execution from the synchronous option. An upstream issue/PR search was performed, but opening the filtered current PR-results URL was restricted by the web fetcher; current open-PR completeness is unverified. No upstream patch is adopted: the installed source and real initial403 regression identify application installation timing, addressed with the existing supported APIs. This is an inference from primary sources plus local reproduction, not a claim that an exhaustive upstream search proved no related issue exists.

- Cross-run Mercury balance observations cannot reserve a bank balance. Existing contracts already describe preflight as an observation; no additional confirmed defect established.
- Stripe event validation's pre-lock lookup predates the selected baseline; no new replay regression was established from the changed path, and the current idempotency/late-payment tests were read. No unrelated implementation expansion is proposed.
- Offer/assignment URL similarity is insufficient extraction evidence: source eligibility/snapshot contracts differ. No net-savings claim/helper task invented.
- Missing outside review, unmeasured capacity, baseline diagnostics and different public PR heads remain explicit coverage/operational limits.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO Review | Design helper lookup | Scope/strategy context |0 adopted | Not adopted | Helper points to another branch; coordinator current A controls |
| Outside Review | Codex default plan-review preflight | Independent second opinion |3 preflights | UNAVAILABLE | No outside process/result; no clean outside credit |
| Eng Review | /plan-eng-review | Whole assembled architecture/code/tests/performance |3 actual | Native complete; final binding/log pending | Run1:1 resolved; run2:1 resolved; run3:0 new/open,0 critical gaps |
| Design Review | Separate design review and approved remedies | Candidate cutoff/access recovery | Separate scope | Remedies7/0; council handled separately | Two P2s corrected; initial403 regression included |
| DX Review | Separate developer-experience review | Maintainer docs/storage diagnostics | Separate scope | Remedies16/0; council handled separately | Two fixes recorded in separate report; live-origin limits remain |

**OUTSIDE COVERAGE:** Engineering provider codex, plan-review phase, unavailable in all three invocations; host codex, source none, fallback unavailable. Separate bounded Claude design/DX consultations do not constitute this engineering outside review or whole-branch CI.

**VERDICT:** Native engineering review of the frozen source is complete with no open findings. Exact-commit saved council credit is pending the external SHA/hash comparison and required logs; until those occur, eng review required. No deployment, live-provider or production acceptance is granted.

NO UNRESOLVED DECISIONS

