# Agreement editor implementation plan

Spec: docs/superpowers/specs/2026-10-24-agreement-editor-design.md
Base: 778afd11428187831b5534af19e63713da7967d9
Execution: native, root implements; one fresh whole-branch reviewer after all tasks. Standing user autonomy applies; do not repeat approval menus. Use dedicated test DB miru_agreement_editor_test, no production writes during implementation.

## Global constraints

Meet the full body AND field editor requirement. This is the editable templates/drafts unit, not approval/signing completion. Preserve all existing contracts/payroll and private billing behavior. No dependency for JSON/schema/rendering that Rails already provides. Tiptap is justified for full rich-text editing; no paid editor/provider plan. Manual edits use apply_patch. Every trust-boundary branch needs a meaningful failing test. Every command's observed output, not intended output, determines success.

## Files and responsibilities

- db/migrate/*_create_agreement_templates_and_agreements.rb and db/schema.rb: company-owned restricted references, encrypted text storage, lock versions and draft constraint.
- app/models/agreement_template.rb, agreement.rb: independent copies, tenant/party checks, metadata-only audits and validation.
- app/services/agreements/document.rb: bounded document/field/value schema shared by both models and renderer.
- app/services/agreements/docx_import.rb, document_html.rb; app/views/agreements/draft.html.erb: safe import and trusted PDF rendering.
- app/policies/agreement_template_policy.rb, agreement_policy.rb; app/controllers/api/v1/agreement_templates_controller.rb, agreements_controller.rb; config/routes/api.rb and filter_parameter_logging.rb: scoped, CSRF protected, no-store CRUD/import/generate/export and conflict handling.
- app/javascript/src/components/Agreements/{index,Editor,Fields,api,types}.tsx/ts, editor.css; existing router/sidebar/en locale: lists, draft generation, actual editor/field settings/autosave/recovery/PDF download.
- spec/services/agreements/*, spec/models/agreement*_spec.rb, spec/requests/api/v1/agreement*_spec.rb, spec/system/responsive/agreements_spec.rb and minimal fixture helper: observable security/content/copy/export and real browser checks.

### Task 1: Bounded documents and independent copies

**Interfaces:** Agreements::Document validates structured JSON, field definitions and typed values. AgreementTemplate#build_agreement creates an unsaved independent Agreement with copied document/fields and explicit attributes. Agreement draft-only model validates exactly one matching party/company/kind. Persist encrypted content/values, metadata-only audits, optimistic locks and restricted relations.

1. Baseline: run existing employee-record policy/client agreement request specs in isolated DB.
Expected: zero failures; report existing pending separately.
2. Write schema and copy-isolation specs first: supported formatting/table/fields, invalid nesting/attrs/types/IDs/limits, typed checkbox/date/number/dropdown, no fabricated signature values; client/consultant party boundaries, cross-company rejection, encrypted storage/audit privacy, template/profile independence, concurrent stale update and deletion retention.
Expected: RED because the new document/domain capability is absent, not fixture/setup errors.
3. Add migration/models and minimal schema validator, run tests, fix implementation and focused Ruby lint.
Expected: all new and baseline examples pass; real ciphertext excludes body/value plaintext and auditors do not contain it.
4. Commit this complete domain task. Complete command: env RAILS_ENV=test DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/miru_agreement_editor_test rtk mise exec -- bundle exec rspec spec/services/agreements/document_spec.rb spec/models/agreement_template_spec.rb spec/models/agreement_spec.rb spec/policies/employee_record_policy_spec.rb spec/requests/api/v1/client_agreement_details_spec.rb
Expected: zero failures. No API/editor/release claim from domain-only tests.

### Task 2: Secure authoring APIs, DOCX import and real PDFs

**Interfaces:** Consume Task1 document schema and independent-copy builder. CRUD carries company_id/lock_version; HTTP409 preserves stale content, 403 role denial, 404 cross-company. Safe preview import returns validated JSON without modifying records. Draft generation snapshots approved explicit values plus identity prefills; PDF renders persisted draft, marked DRAFT. Typed value/field errors return422.

1. Write focused request/import/render specs RED: authorized creation/copy/update/list/pagination; role/tenant/stale workspace/CSRF; stale saves; no-store; uploaded forged/oversized/ZIP-bomb/unsupported DOCX; escaped text and no external fetches; draft PDF headers/exact content/breaks/fields.
Expected: RED for missing endpoints/import/render behavior.
2. Implement allowlisted routes/policies/controllers/importer/renderer and filtered bodies. Reuse PDF service and current approved auth conventions. Run focused tests and lint.
Expected: zero failures, actual generated PDF bytes readable and escaped; no provider/network/signature or real mail.
3. Commit. Complete command: env RAILS_ENV=test DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/miru_agreement_editor_test rtk mise exec -- bundle exec rspec spec/services/agreements spec/models/agreement_template_spec.rb spec/models/agreement_spec.rb spec/requests/api/v1/agreement_templates_spec.rb spec/requests/api/v1/agreements_spec.rb
Expected: zero failures; extract/render representative short/long PDFs separately.

### Task 3: Full body/field editor and measured browser behavior

**Interfaces:** Consume Task2 API exactly. Tiptap emits only Task1 schema, field nodes reference stable keys. Generate copies independent of master. Debounced autosave uses returned lock_version, never advances saved state over unsaved newer text; conflicts retain recoverable current content. Draft-only signing placeholders visibly do not sign anything.

1. Add focused real-browser specs RED: create rich template/table/field, configure role/type/required/options, generate client/consultant draft, edit clauses independently, save/reopen, stale conflict recovery, import preview/replace guard, draft PDF download, forbidden route and mobile keyboard/layout. Include console errors and Unicode/long names.
Expected: RED for missing route/editor/actions.
2. Add exact compatible open-source Tiptap packages/lockfile, lazy route/editor, field node/settings, bounded import preview, autosave/error/recovery, lists/navigation and English labels using current ui primitives.
Expected: actual body editing AND fields work; unsupported import cannot replace existing content; no raw HTML execution.
3. Run focused browser suite in Brave, required `rtk mise exec -- timeout 30 bin/vite build`, lint and Task2 regression suite. Capture synthetic desktop/mobile screenshots and real PDF. Measure short and25page/50+field cold/warm readiness, typing, save/recovery and export; report raw timings/environment rather than a blanket fast claim.
Expected: zero relevant failures/console errors, documented measurements and useful screenshots/PDF. Full DOCX round-trip and real signatures are not claimed.
4. Commit. Complete command: env RAILS_ENV=test DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/miru_agreement_editor_test rtk mise exec -- bundle exec rspec spec/services/agreements spec/models/agreement_template_spec.rb spec/models/agreement_spec.rb spec/requests/api/v1/agreement_templates_spec.rb spec/requests/api/v1/agreements_spec.rb spec/system/responsive/agreements_spec.rb
Expected: zero failures. Broad CI may retain pre-existing pending tests; count/report them.

## Review focus

Review the document/parser trust boundary and resource limits; encrypted fields versus audits/logs; role/tenant/CSRF/current-workspace enforcement; copy/template isolation and optimistic locking; prototype-shaped/duplicate field IDs; unsupported/lossy import behavior; XML/ZIP resource abuse; PDF external resources/escaping; editor and save request races; unsaved changes on navigation/import; meaningful required/read-only and signer-role behavior; no false signing/approval or performance claims. Examine malformed trees beyond happy fixtures, empty tables/nested marks, lock omission/coercion, readonly field override and unexpected compensation exposure.

## Delivery after implementation

One fresh whole-branch review and RED/GREEN fix pass, then exact-head public PR checks/CodeRabbit and screenshots. Merge/deploy only after gates, preserving private production deltas and recording image/revision/web/worker/live-browser/schema/log evidence. No issue2462 closure while review/signing requirements remain. Rollback application without dropping populated agreement tables.

## Engineering review — 2026-10-24

Target: this implementation plan and its concrete interfaces at d03555b65, compared with origin/develop 778afd114. Host: Codex. This is the engineering plan review, distinct from the completed independent whole-branch code review.

### Scope Challenge and authority

Scope accepted as-is. The user authorized continued implementation, all reviews and shipping, and delegated routine technical choices. No new user answer or scope reduction is claimed. Retain the original file/class arrangement: separate master/draft models and endpoints have different party/value contracts; a shared validator, authoring concern and renderer already centralize the common behavior. Consolidating them into generic controllers/models would introduce conditional permissions and copied-value behavior without reducing the required interfaces.

The branch changes 68 files, including 23 documentation/evidence files; application code accounts for 26 files. It introduces 10 application Ruby classes including the import error class, plus one migration class [measured: d03555b65]. The count is substantial because the unit includes its parser, schema, API, editor and behavioral evidence. No new feature cuts are needed to make this unit reviewable. The overall issue remains open.

Already done: a fresh HTTPS origin/develop fetch still points to 778afd114; the agreement model/editor path history contains no upstream implementation. Existing client agreement identity fields are reused, not rebuilt. No tracked TODOS.md or ship-policy override exists; one PR for this authoring unit remains the delivery arrangement. Brain recall is degraded; QMD lexical search returned no relevant hits. Current repository, issue and browser evidence determine this review.

### Premise table

| Premise | Receipt | Verdict |
| --- | --- | --- |
| Independent encrypted masters and drafts exist, not signed records | app/models/agreement_template.rb:3; app/models/agreement.rb:3 | verified |
| Server owns the accepted document and field/value schema | app/services/agreements/document.rb:5 | verified |
| Import is preview-only and bounded before persistence | app/controllers/api/v1/agreement_templates_controller.rb:37; app/services/agreements/docx_import.rb:34 | verified |
| Editor provides clauses and field controls, not just file upload | app/javascript/src/components/Agreements/DocumentEditor.tsx:1; app/javascript/src/components/Agreements/Fields.tsx:1 | verified |
| Local measurements describe the tested machine, not production guarantees | docs/qa/agreement-editor-2462/README.md:35; docs/qa/agreement-editor-2462/editor-performance.json:1 | verified |

Unverified factual premises used to approve the design: 0. Production readiness is explicitly unproven and remains a release gate.

### Architecture review

No new issues found. Dispositions: retain the current boundaries under the user's implementation authorization.

```
authenticated request
  -> current workspace + kept membership + owner/admin policy
       deny -> 401/403; scoped lookup miss -> 404
       allow -> expected parameter root + matching company
                  malformed -> 400; wrong workspace/version -> 409
                  valid -> Document(document, fields, values)
                             invalid -> 422, no persistence
                             valid -> encrypted master or independent draft + metadata audit

DOCX upload -> file/ZIP/expanded-part limits -> strict NONET XML
  unsafe/revision/unsupported content -> visible 422, existing document unchanged
  supported -> normalized validated JSON preview -> explicit replace -> normal save path

persisted draft -> same schema -> escaped DocumentHtml -> existing PDF service
  success -> private DRAFT PDF + metadata download audit
  failure -> visible download error; editable draft remains intact
```

The database migration creates new tables and foreign keys, with draft/party/source-version constraints; it does not rewrite existing rows. Company references, restricted deletion, immutable identity/source fields and optimistic locks complement policy scoping. Audits exclude bodies/field values; request filters cover authoring payloads. No recipient access or signature assertions are created. The existing PDF service and Rails encryption/locking are [Layer 1] framework reuse. Tiptap is [Layer 2] established rich-text infrastructure, not a custom editing engine.

Distribution: package lockfile and migration accompany Rails/Vite changes. Existing CI/immutable-image deployment must run; integration must preserve private production webhook raw-body handling. Encryption keys, Linux fonts and deployed UI/revisions require release evidence. Rolling application code back must retain populated tables.

### Code Quality review

No new issues found. Dispositions: preserve the current explicit contracts; no extraction proposed.

Shared-code checks: AgreementTemplate#valid_document and Agreement#valid_document both use Agreements::Document, with draft-only values intentionally different. An additional validation concern would remove approximately six simple lines and add roughly thirteen concern/include lines [estimated: app/models/agreement_template.rb:25; app/models/agreement.rb:30], with no reliability improvement. Keep the shared validator and explicit callers. Both controller archives already share pagination/metadata and write-lock checks through AgreementAuthoring. Template import, draft generation and PDF export differ enough that a configurable generic endpoint would increase coupling. The HTML renderer is shared with export; no duplicate contract body is built for PDFs.

The independent review's hidden tracked-revision defect and populated-field configuration minor are fixed, with failing-before/passing-after evidence in the QA record. Those earlier findings are not relabeled as findings from this review. Signature values remain forbidden; required blanks and recipient read-only flags retain their explicitly draft-only meaning.

### Test review

Source and test boundaries were read together before this map. Framework: RSpec request/model/service tests and actual Brave/Cuprite system tests; no new test framework or production-only test seam.

```
CODE CONTRACT                                      USER FLOW / PROOF
Document errors/limits/tree/fields/typed values      [***] service malformed, limits, date/number/false/signature cases
Template/draft tenant/source/identity/copy checks    [***] model copy/profile isolation, ciphertext, audits, locks, retention
Authoring params/policy/company/CSRF/version         [***] request 400/401/403/404/409/422 + no-write assertions
Archive projection/pagination/party query           [***] SQL excludes encrypted bodies, bounded pages/query and tenant tests
DOCX container/XML/relationships/stories/revisions   [***] hostile archive/XML and tracked-row/property cases
DOCX styles/lists/split fields/table/break parsing   [***] independent short/long fixtures plus malformed properties
DocumentHtml escaping/fields/breaks/table           [***] escaped output + real PDF request + rendered artifact evidence
Editor body/field configuration/remove/undo         [*** E2E] create, reopen, Unicode and required/signing placeholders
Generate and edit independent party copies         [*** E2E] client/consultant snapshots and master unchanged
Save debounce/in-flight/failure/stale conflicts     [*** E2E] newer edits stay dirty; retry/recovery and explicit reload
Navigation/import/workspace guards                 [*** E2E] prevent mutation/discard until explicit leave/replacement
Mobile long editor/field settings/export            [*** E2E] widths, title, long Unicode, actual downloaded PDF, console errors
```

Legend: *** = behavior with meaningful boundary/error coverage; E2E = real running-app flow. This is a contract-group map, not measured line/branch coverage. The schema/import/request/model/system specs and artifact paths are listed in the implementation tasks and QA record. No LLM/eval scope. No existing tests become obsolete.

No new test gaps found for this authoring unit. Dispositions: keep existing focused checks and shared navigation/login/client regression checks. Repository-wide TypeScript is not green and has no established clean baseline; a changed-module check does not replace exact-head CI. Physical software keyboards, Linux PDF fonts and production/load remain explicitly unverified release checks, not covered by viewport/local PDF tests. Test plan: /Users/sward/.gstack/projects/saeloun-miru-web/sward-feature-agreement-editor-2462-eng-review-test-plan-20261024-023332.md.

### Performance review

No new issues found. Dispositions: retain bounded payloads, metadata-only archives, lazy editor and explicit export; no speculative cache.

Archive/party queries are company-scoped, paginated and eager-load users where required. Encrypted bodies are excluded from archive SQL. The document, field, ZIP-entry and decompressed-part limits bound work and memory. PDF rendering is explicit, not per keystroke. Tiptap's transaction renders are isolated; field nodes use DOM views instead of a React root per field. This follows the current upstream performance guidance at https://tiptap.dev/docs/guides/performance. The shared data router uses React Router's documented blocker at https://reactrouter.com/api/hooks/useBlocker.

Measurements are local single observations: long-document cold readiness 925/921 ms and input-to-next-frame p95 7.8/8.1 ms at desktop/mobile widths [measured: docs/qa/agreement-editor-2462/editor-performance.json:1]. Save includes the debounce. This is not an interleaved main/branch benchmark, speedup claim, SLO, physical-device or load guarantee. Existing main has no equivalent editor. No measurement units/thresholds changed.

### Failure modes and scope ledger

| Path | Failure / handling / evidence | Silent critical gap |
| --- | --- | --- |
| Create/edit | Bad schema/party/role/company rejects without mutation; model/request specs | none |
| Import | Unsafe/unsupported content rejects before replacement; service/request/browser cases | none |
| Save | Network/validation/stale responses retain unsaved state and recovery; system cases | none |
| Leave/switch | Dirty guard runs before navigation/session mutation; system cases | none |
| Export | Trusted validated/escaped persisted body; real browser PDF; visible error on failure | none |
| Distribution | Exact-head CI/private integration/encryption/Linux/image/live checks required before release | not claimed complete |

NOT in scope for this authoring PR: mandatory invitation onboarding; version-bound client comments/replies and approval records; addenda/supporting-document relationships; signature provider/status/reminders/cancel/resend; sent locks and immutable signed bundles; counterparty/profile downloads. These remain the explicit next units of #2462 and must not be described as delivered or closed. Payroll/tax/ATS work also remains in the active overall goal. A static PDF overlay and lossless Word round-trip are not provided by this editor.

What already exists: client identity/contact fields, auth/company membership, ui primitives, existing PDF generation, Rubyzip/Nokogiri and Rails encryption/locking are reused. No provider plan purchase, external mail, signing request or payment was made during QA.

Sequential implementation, no parallelization opportunity for the remaining connected review/delivery gates. Original domain -> APIs/import/export -> editor tasks are completed and share interfaces. No new parallel worker is needed.

### Outside Voice, decisions and tasks

Outside voice unavailable: current host is Codex; the preflight refuses nested Codex outside execution. The native fallback requires a Plan agent type, TaskStop and background Bash, which this harness does not offer. No substitute agent or external process was launched; no outside coverage/clean credit is claimed. Fix: a supported outside-review host/runtime, or the required installed host adapter. This does not erase the separate completed independent code review and its resolved findings.

No new pending engineering decisions, TODOs or implementation tasks. No scope cuts or user answers were fabricated. No new tasks from Architecture, Code Quality, Test or Performance review. Task aggregation artifact is empty to indicate completed review with no new tasks. Lake Score: N/A (no completeness-scored user choices). Suppressed findings: no low-confidence findings promoted; existing unrelated no-workspace routing behavior and unknown whole-project TypeScript baseline are not called regressions.

REALITY: premise-table pass Verified concrete interfaces; no unverified approval premise docs/superpowers/plans/2026-10-24-agreement-editor.md:64
REALITY: already-done pass Fresh origin/develop fetch and named agreement path history contain no upstream equivalent 778afd114
REALITY: surface-check pass API routes and parameter contracts checked against actual callers app/javascript/src/components/Agreements/api.ts:1
REALITY: binding-decisions pass No recorded branch decisions supersede user-authorized native scope docs/superpowers/specs/2026-10-24-agreement-editor-design.md:5
REALITY: numbers pass Local raw measurements and code counts are labeled; no production or speedup claim docs/qa/agreement-editor-2462/editor-performance.json:1
REALITY: deferred-asks pass Issue review/signing/onboarding/addenda requirements remain explicitly separate docs/superpowers/specs/2026-10-24-agreement-editor-design.md:7
REALITY: pr-count pass No ship policy override; one authoring PR with all matching UI/API/tests/docs docs/superpowers/plans/2026-10-24-agreement-editor.md:62
REALITY: prior-art pass Adopt supported Tiptap rendering and React Router blocker behavior without vendored patches app/javascript/src/components/Agreements/DocumentEditor.tsx:234
REALITY: transaction-semantics pass Checked unchanged driver/pool/protocol; new-table migration and optimistic locks use current Rails db/migrate/20261024100000_create_agreement_templates_and_agreements.rb:3
REALITY: contract-assumptions pass Runtime fields and lock versions checked at shared schema/API boundaries app/services/agreements/document.rb:5
REALITY: units pass Checked unchanged input units and accuracy; raw browser observations retain milliseconds with no retuned threshold docs/qa/agreement-editor-2462/editor-performance.json:1
REALITY: perf-table pass Machine/data/single-observation limits recorded; main has no comparable editor docs/qa/agreement-editor-2462/README.md:35
REALITY: dependency-fallback pass Draft authoring/export stands alone; provider unavailable does not fabricate signing docs/superpowers/specs/2026-10-24-agreement-editor-design.md:7
REALITY: obligation-tiers pass Must-ship authoring gates retained; next review/signing units keep original issue open docs/superpowers/plans/2026-10-24-agreement-editor.md:62

### Completion summary

Scope accepted as-is; no new issues in the four engineering sections, no critical silent gaps, no unresolved decisions. Required reality rows and saved-report read-back must pass before the review is logged. Local completion suite: 149 examples, zero failures [measured: docs/qa/agreement-editor-2462/README.md:7]. Full CI and production release remain unproven.

## Design review — implemented authoring unit

Target: the agreement editor branch and this plan's authoring requirements. Calibration: DESIGN.md's Operational Calm, role clarity, semantic tokens, existing ui primitives and mobile-safe flows. This is app UI (OPERATE), not a landing page. Step0 initial impression:8/10; a complete plan here defines authoring hierarchy, all failure/recovery states, copy isolation, mobile controls and honest Draft status. All seven dimensions were assessed under the user's standing instruction to perform UI/UX reviews and fixes; no new user answer or product-scope decision is claimed.

Designer setup found an installed binary, but its authentication resolver prioritizes a local JSON credential outside the mandated agent-vault flow; metadata lookup found no gstack OpenAI item. No secret was read, setup run, paid mockup generated or visual choice falsely attributed to the user. The user's secret-source rule takes precedence; review continued using the actual implemented UI. The external Codex voice is unavailable under the current Codex host. An explicitly required, read-only native design reviewer completed the separate design-plan assessment; it is in-host evidence, not Claude or external-provider coverage.

### Pass1 — Information architecture:9/10 ->9/10

No issues found. The shell identifies Agreements; archives distinguish Templates/Drafts; each editor identifies master or independent draft, title, save status and action before clauses. The contract body owns the workspace; field settings are secondary and open in a focused mobile dialog. No scope or layout redesign needed.

```
Miru shell -> Agreements -> Templates / Drafts archive
  Template -> title/status/actions -> editable body + secondary fields
    Generate -> choose company-scoped party -> independent Draft editor
  Draft -> title/status/actions -> clauses/typed values -> explicit DRAFT PDF
  Mobile -> full-width title/action row -> body -> Fields dialog -> field settings
```

### Pass2 — Interaction states:7/10 ->9/10

Finding2 (Low, reproduced): failed party search described retry but offered no Retry control. Fixed with the existing button/state pattern and active-request cleanup. Query stays unchanged; a successful retry can generate the selected party's draft. This restores the already-required recoverable error state without adding a new product policy.

| Feature | Loading | Empty | Error | Success | Partial |
| --- | --- | --- | --- | --- | --- |
| Archive | Loading agreements | Start master / generate copy guidance | Inline message + Retry | Named newest records | Explicit pagination |
| Editor/save | Loading / Saving status | Editable blank paragraph | Retained dirty state + retry/recovery | All changes saved | Required-missing count |
| Fields | Local explicit dialog | Add identity/payment/custom field | Validation beside configuration | Labeled placement/value | Required blanks stay Draft |
| Word import | Checking Word document | Empty supported body normalizes | Unsupported upload leaves body intact | Preview before explicit replace | Normalized-layout warning |
| Generation | Loading counterparties / Generating | Search/profile guidance | Retry search or retry submission | Independent draft route | No selection disables generate |
| PDF | Preparing PDF | No invented completed document | Visible error, draft retained | Actual download | Dirty/busy disables export |

### Pass3 — Journey:8/10 ->9/10

No separate issue beyond the same search recovery gap. This storyboard is a simulated user journey, not usability-study evidence.

| Step | User does | Likely concern | Specified support |
| --- | --- | --- | --- |
| Arrive | Opens Agreements | What can I edit? | Templates/Drafts and clear first action |
| Author | Edits/imports terms and fields | Will text/formatting survive? | Schema, preview, warnings, actual reopen/export proof |
| Save | Types and waits | Did it save? | Visible status; failed/stale writes retain recovery |
| Generate | Finds client/consultant | Did the master change? | Explicit independent-copy explanation and identity snapshot |
| Recover | Search/network/save fails | Must I start over? | Retry, retained query/body and explicit discard decisions |
| Export | Downloads draft | Is this already approved/signed? | Draft label; no false approval/sign controls |

### Pass4 — Specificity / slop:9/10 ->9/10

No issues found; no hard rejection. The record rows and field sections contain actual actions/configuration. No decorative feature grid, generic hero, ornamental imagery, gradient, carousel, repeated mood copy or dashboard mosaic was added. All seven litmus answers are YES: Miru/Agreements context is clear; body is the visual anchor; title/status/actions scan; each section has one job; bounded record/field containers earn their function; motion is confined to state/dialog feedback; the layout works without decorative shadows. These are primary/native design judgments from source and actual screenshots, not external consensus.

### Pass5 — Design system:8/10 ->9/10

Finding1 overlaps Pass6: small controls did not meet the touch target contract. Existing Button/Input/Dialog primitives and CSS variables remain the vocabulary; the fix is scoped to agreement controls, including portals. Shared application primitives and theme settings are unchanged. Current dark screenshots are readable; color-only status is avoided and focus rings remain. Full assistive-technology/contrast certification is not claimed.

### Pass6 — Responsive and accessibility:6/10 ->9/10

Finding1 (Medium, reproduced): toolbar buttons were36px tall [measured: spec/system/responsive/agreements_spec.rb:94], below the design minimum. The shared agreement control style now enforces44px controls and clickable checkbox/radio labels; portal close buttons are centered with header clearance. First browser checks failed before the fix; settled toolbar and dialog geometry now pass without lowering the threshold. Dialog opening animation is allowed to finish before measuring. Width checks still cover320/375/1440, and the long mobile title remains readable [measured: spec/system/responsive/agreements_spec.rb:87].

Finding3 (Low, static): formatting declared a toolbar while providing ordinary Tab stops. It is now a labeled group, matching its retained keyboard behavior. No bespoke arrow-key implementation was added. This follows the distinction in https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/; no measured WCAG failure is claimed. Actual screen-reader sessions and physical mobile software keyboards remain unverified, with no claim that viewport testing proves them.

### Pass7 — Unresolved design decisions

None. Three concrete defects are fixed under existing user authorization for UI/UX fixes and established design/recovery requirements. No new product/design decisions were added, no user menu answer invented and no in-scope design remedy deferred. The9/10 completeness judgment reflects remaining real-environment validation limits rather than a pending design choice.

NOT in scope: approvals/sharing/signing/addenda/immutable completed artifacts remain later units of the same open issue; arbitrary PDF body editing and lossless Word round-trip are not provided. What already exists: DESIGN.md, shell/navigation, ui primitives, focus/dialog behavior and theme tokens are reused. No new TODO proposed. No new tasks from Pass1, Pass3 or Pass4. Pass2 search recovery and Pass5/6 control/semantic tasks are implemented and verified; no open implementation task remains for this review.

## Implementation Tasks

- [x] T1 (P2, estimated human45min / agent10min): meet the existing touch-target requirement in agreement controls and portal dialogs. Files: Agreements CSS/Editor/Fields/index and system spec. Verified by settled44px measurements, mobile widths and actual screenshots.
- [x] T2 (P2, estimated human30min / agent5min): recover failed party lookup with Retry search, retaining the query and active-request cleanup. Files: Agreements/index and system spec. Verified by a failed real-browser request followed by successful selection/generation.
- [x] T3 (P2, estimated human5min / agent1min): use group semantics for existing ordinary Tab controls. File: Agreements/DocumentEditor. Verified by source and refreshed browser snapshot; no screen-reader certification claimed.

## Design Review Completion Summary

System audit: existing DESIGN.md, new archive/editor/dialog interactions; Step0 impression8/10. Passes1–6 before/after:9->9,7->9,8->9,9->9,8->9,6->9. Overall uses the lowest rated pass:6->9. Pass7: zero pending or deferred decisions. New product/design decisions:0. Generated/approved mockups:0/0. Native read-only reviewer: three findings, all fixed; external coverage unavailable. Scores are review judgments, not measurements.

Standard combined suite:150/0 [measured: docs/qa/agreement-editor-2462/README.md:7]; Vite and focused lint pass. Real Playwright/Brave mobile screenshot and native field-settings screenshot are refreshed; current PDF text matches the previously rendered artifact. The separate screenshot harness's expired marker wait is explicitly excluded from passing-test evidence. No durable learning write-back performed. Full CI, CodeRabbit and production checks remain pending.

## Engineering follow-up after design fixes

Revisited the affected stages before refreshing exact-head evidence: architecture/security/storage/API contracts unchanged; code quality retains active-request cancellation for the new search refresh state and the existing error envelope; tests prove failed lookup recovery plus44px settled geometry; performance adds bounded local state/CSS work without new endpoints, loops over records, eager payloads or rendering per keystroke. No new engineering issues or silent critical gap. Unchanged model/parser/auth/export evidence is reused; the current150-example combined run also rechecks those contracts [measured: docs/qa/agreement-editor-2462/README.md:7]. Original scope/deferred requirements stay intact.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO Review | not run | No new product-scope decision | 0 | NOT RUN | Existing authoring unit retained |
| Outside Review | Codex preflight / native design assessment | Independent challenge | 2 phases | EXTERNAL UNAVAILABLE | Native design reviewer completed; three findings fixed |
| Eng Review | /plan-eng-review + affected-stage follow-up | Architecture and tests | 2 | CLEAR; refreshed log follows read-back | No new issues; no critical gaps or unresolved decisions |
| Design Review | /plan-design-review | UI/UX coverage | 1 | CLEAR; log follows read-back | Overall6->9; three implementation fixes; zero unresolved |
| DX Review | /plan-devex-review | Internal API developer experience | 0 | PENDING | Separate review remains required |

**OUTSIDE COVERAGE:** External Codex plan/design phases unavailable in current host. Native design assessment is in-host only; no outside-completion or cross-provider consensus claim.
**VERDICT:** Engineering and design clear for this authoring unit after fixes. DX, exact-head CI, CodeRabbit and release checks remain required; no deployment approval is implied.
NO UNRESOLVED DECISIONS
