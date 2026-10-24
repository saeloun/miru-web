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
## Developer-experience review

Target: this authoring unit's internal REST API and its actual Miru callers. Product type: API/Service. Persona: a Miru Rails/React contributor working in an already configured checkout. Mode: DX TRIAGE, chosen under the user's urgent shipping/fix-all instruction; no public SDK, provider purchase, new onboarding SLO or broader API-protocol migration is introduced. Routine review choices are the agent's implementation judgment under standing authorization, not fabricated user answers. All eight passes were evaluated.

### Developer perspective and clock

I'm a Miru contributor adding agreement authoring to the existing application. I already have its runtime, database and authentication setup; that prerequisite is not a measured fresh-start journey. I open the agreement API helpers and request examples because I need a working payload before studying every editor extension. I want a private template, an independent party copy and a real draft PDF, without setting up another signing account.

I can run the existing request examples and inspect the returned document, fields and lock version. If my typed value is wrong, I need the accepted format, not an echo of confidential content. When a save conflicts, I preserve my edits and reconcile the saved version. When creation's response fails, I check the archive before repeating a request that may already have succeeded. If PDF rendering fails, I need a reference and a bounded retry instruction; I should never paste rendered contract HTML into an error ticket.

This is a source-grounded simulated perspective, not a user study. Fresh-developer reading/install time remains unmeasured. The retained clock starts after standard Miru setup and ends at an understood template/copy/export result; no replacement clock or new latency guarantee was approved. Automated example durations below are not human onboarding measurements.

### Competitive reference

Aside is unavailable; primary web documentation was used. Comparisons establish interface choices, not equivalent timing, cost, licensing or provider selection.

| Tool | Documented start -> result | Time evidence | Relevant choice / source |
| --- | --- | --- | --- |
| Miru | Configured contributor checkout -> private template/copy and DRAFT PDF | Human time unknown; actual API/browser examples pass | Existing auth/Api wrapper, copied values and optimistic lock; docs/agreements.md |
| DocuSeal | API key -> authenticated API record requests | Documentation inspected; no timed onboarding or provider call | Explicit key header and request examples; https://www.docuseal.com/docs/api |
| Documenso | API key/configured PDF -> envelope/document signing workflow | Documentation inspected; no timed onboarding or provider call | API version and staged first-call guide; https://docs.documenso.com/docs/developers/getting-started/first-api-call |

First useful result: the existing request/system examples produce an encrypted master, an independent draft and actual PDF bytes. That existing vehicle is retained; no new playground or hosted account is needed for this unit. Competitive TTHW rank is unknown because the boundaries/results differ.

### Journey and first-time roleplay

In TRIAGE, the Install and Hello World stages are the detailed journey; other stages are assessed in the eight passes below.

| Stage | Contributor action | Evidence / disposition |
| --- | --- | --- |
| Install | Use existing Miru setup, locked dependencies and local migration | No separate provider credential; current setup requirements stated in docs/agreements.md |
| Hello World | Run the linked API examples, then exercise the editor/copy/export | Exact two-file example command passed32/0 [measured: docs/qa/agreement-editor-2462/README.md:7]; real browser/PDF evidence linked |

Illustrative roleplay, not observed human timing: T+0:00 open the contributor reference; T+0:30 locate the existing request example and required JSON root; T+1:00 inspect company/lock-version and field/value types; T+2:00 run the example in the configured test database; T+3:00 inspect the saved copy/PDF and the documented error recovery. Predicted confusion about field formats, PDF references and ambiguous creation has been checked against source and failing-before/passing-after tests, then fixed. No fresh-install time or guaranteed completion time is inferred.

### Pass1 — Getting started:7/10 ->8/10

The existing application setup is a prerequisite, not a new zero-install product. The new contributor reference gives the dependency/migration path, encryption/browser constraints and an executable pair of API example files. That exact command passes32/0 [measured: docs/qa/agreement-editor-2462/README.md:7]. No card, sales contact or signing-provider account is required for draft authoring. No new onboarding defect remains in this unit; fresh-machine setup and human TTHW are unmeasured.

### Pass2 — Interface design:8/10 ->8/10

Plural resources, expected JSON roots, explicit workspace/lock version, independent copies, typed string/boolean values and bounded lookup/pagination match the existing callers. Both create callers share one small recovery helper. Network/server errors no longer instruct users to blindly repeat an uncertain creation: they check Templates/Drafts first. The browser fixture really creates a record before returning500, then finds it through the archive with no automatic duplicate [measured: spec/system/responsive/agreements_spec.rb:141]. This is reconciliation, not an exactly-once guarantee. No new endpoint, SDK, token flow or permission bypass was added for this review.

### Pass3 — Errors and debugging:4/10 ->8/10

Two caps were identified and resolved:

- CAP4:pdf_navigation:redaction — a synthetic Ferrum navigation failure passed a rendered data URL into error reporting. This is a reproduced potential-exposure path, not a claim that production data leaked. The shared PDF service now removes the URL and chained cause while retaining the status-error family and Ruby stack. Existing callers were searched before the root fix; invoice, bulk-download and analytics regressions pass.
- CAP6:field_value:fix and CAP6:pdf_export:recovery — typed-value failures lacked correction guidance, and renderer failures lacked a safe, useful recovery response. Field errors now give format guidance without values; only validated definitions reach value checks. The agreement PDF error is a private503 RFC9457 problem with stable code/doc anchor, request reference, retry-once/escalation and no successful-download audit. Bounded JSON error blobs are decoded for the UI; a successful retry clears the alert and downloads real PDF bytes. Uncertain creation recovery is also explicit.

| Error path / class | what | fix | recovery | code | context | trace | redaction | channel | Remaining cap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Typed value / pre-write validation | pass | pass: format guidance | N/A: rejected before write | legacy HTTP422/reference | N/A: usage | N/A: usage | pass | inherited JSON envelope | none |
| Stale version/workspace / pre-write conflict | pass | pass: reload/reconcile | pass: edits not applied | legacy HTTP409/reference | pass | N/A: expected conflict | pass | inherited JSON envelope | none |
| Tracked DOCX / pre-persistence validation | pass | pass: accept/reject revisions | pass: existing document unchanged | legacy HTTP422/reference | pass | N/A: expected import rejection | pass | inherited JSON envelope | none |
| PDF renderer / unexpected dependency failure | pass | pass: retry once then administrator/reference | pass: none; bounded retry | pass: agreement_pdf_unavailable + doc anchor | pass: operation/reference; sanitized server class | pass: request reference | pass: URL/cause/report tests | pass: HTTP503 problem JSON | none |

The legacy validation/auth envelopes are not RFC9457 objects and do not contain new per-error machine codes. This baseline limitation is explicit; no global RFC/SDK compliance is claimed. It does not introduce a missing safe fix, unsafe recovery, false success, secret disclosure or terminal wait in this scoped triage. Existing API conventions remain intact; the new renderer problem retains the existing errors string. Unexpected non-renderer exceptions retain the application's existing error path rather than being hidden by a broad rescue.

### Pass4 — Documentation:6/10 ->8/10

docs/agreements.md now links actual runnable examples, routes, types, roots, workspace/version behavior, manual creation reconciliation, privacy constraints, PDF reference/escalation and release/rollback checks. The registry output matches its named routes. Commands and current behavior were verified; no copied competitor prose or invented provider workflow is included.

### Pass5 — Upgrade/migration:8/10 ->8/10

No new migration or dependency was added by DX fixes. The original new-table migration, encrypted storage and independent copy contract remain. Keys must stay stable and rollback must retain populated tables. The shared status-error sanitization preserves the base error family; no application rescue depends on its URL-bearing subclasses. Exact-head CI/private integration remains mandatory. No new breaking-change/codemod policy is needed.

### Pass6 — Environment/tooling:8/10 ->8/10

Current local Rails/Brave examples, real PDF bytes, Vite and focused lint pass. The shared PDF regression command reports98 examples, zero failures and one compression-specific pending assertion [measured: docs/qa/agreement-editor-2462/README.md:7]. Whole-project TypeScript is not green with no proven clean baseline; no unrelated-failure or all-platform claim is made. Linux fonts, production encryption and deployed images/browser behavior remain release checks.

### Pass7 — Community/ecosystem:8/10 ->8/10

The existing MIT repository, GitHub issues/PRs, contributor conventions and typed first-party callers remain the extension/support path (LICENSE:1; AGENTS.md:1). This internal feature does not require a new plugin ecosystem, SDK language family or external provider plan. No community-response SLA or monitored channel is invented.

### Pass8 — Measurement/feedback:8/10 ->8/10

Reproducible example commands, synthetic fixtures, browser/PDF evidence and raw measurement files are available for a later live audit. Human onboarding time and comparable peer rank remain unknown. Existing test/export timings do not substitute for the retained clock. No analytics collection, scheduled review, automated latency release threshold or new ongoing human process was added.

## DX implementation tasks

- [x] T1: correct typed values using format guidance and trusted definitions; service/model/request evidence.
- [x] T2: sanitize navigation data URLs at the shared PDF boundary; root redaction/cleanup test plus existing caller regressions.
- [x] T3: return a private renderer problem/reference, decode bounded PDF error blobs and support clean retry; API/privacy and real browser/download evidence.
- [x] T4: reconcile ambiguous creates through the archive before retry; shared helper with two actual callers and persisted-record browser fixture.
- [x] T5: provide the contributor route/example/error/upgrade reference; exact example command and route registry verification.

All tasks implement existing safe authoring, privacy and recovery requirements under the user's fix/review/ship authorization. No new user answers, product guarantees or deferred in-scope fixes are fabricated. No TODO proposed. Scope outside this PR remains approval/comments/sharing/signing/addenda/immutable completed artifacts and remaining payroll/tax/ATS work; the original goal and issue stay open.

## DX Review Scorecard

| Dimension | Before | After | Evidence limit |
| --- | --- | --- | --- |
| Getting started | 7 | 8 | Configured contributor path; human onboarding unmeasured |
| API/CLI/SDK | 8 | 8 | Internal callers; no public SDK launched |
| Error messages | 4 | 8 | Caps fixed; legacy non-problem envelopes retained explicitly |
| Documentation | 6 | 8 | Commands/routes verified |
| Upgrade path | 8 | 8 | Production rollout remains unproven |
| Developer environment | 8 | 8 | Local evidence; global TypeScript/Linux limits retained |
| Community | 8 | 8 | Existing project channels; no new SLA |
| Measurement | 8 | 8 | Reproducible evidence; no invented human benchmark |

Overall uses the lowest dimension conservatively:4->8. Product: API/Service. Mode: DX TRIAGE. Persona: Miru Rails/React contributor. TTHW current: unmeasured human journey; target: retain existing configured-contributor workflow, no new SLO; competitive tier: not comparable. Scores are review judgments. Useful first result exists through API examples and the real editor/copy/export path. Unresolved decisions:0; open implementation tasks:0.

Checklist: locked dependencies/local migration and meaningful example output are documented; internal route/types are discoverable; safe format/export/create recovery is verified; first-party wrapper/auth is reused; draft workflow needs no provider purchase; original migration/rollback and actual platform verification are retained. One-command fresh-machine installation, new telemetry, SDK languages, global RFC9457 migration and new support commitments are not claimed. They are not secretly added as requirements to the existing internal feature.

### Outside voice and final evidence

Current-host preflight returned under_current_harness. Codex outside execution was not launched. The required native fallback needs Plan, TaskStop and background Bash; those tools are not offered here. No general-purpose substitute was launched and no external/native outside-completion credit is claimed for DX. Missing coverage is recorded as unavailable, not clear. The earlier independent whole-branch review and native design assessment remain separate evidence.

Final agreement/middleware/browser command:155/0 [measured: docs/qa/agreement-editor-2462/README.md:7]. Separate shared PDF regressions:98 examples, zero failures, one pending; documented API example:32/0 [measured: docs/qa/agreement-editor-2462/README.md:7]. Required Vite build, current JS formatting/lint and seven-file Ruby lint pass. Screenshots of PDF and ambiguous-create recovery were captured in Brave and viewed. No fresh-machine, physical screen-reader/keyboard, global typecheck, full CI or production verification is implied.

REALITY: premise-table pass Internal API and actual first-party callers inspected; no fabricated onboarding or approval premise docs/agreements.md:1
REALITY: already-done pass Fresh origin/develop fetch still has no agreement authoring equivalent 778afd114
REALITY: surface-check pass Named routes and example command verified against registry and actual run docs/agreements.md:9
REALITY: binding-decisions pass Original full-body/draft scope and standing authorization retained; no new product boundary docs/superpowers/specs/2026-10-24-agreement-editor-design.md:7
REALITY: numbers pass Runtime/test numbers have receipts; human onboarding and peer rank remain unmeasured docs/qa/agreement-editor-2462/README.md:7
REALITY: deferred-asks pass Remaining issue review/signing/onboarding/addenda requirements stay open docs/superpowers/specs/2026-10-24-agreement-editor-design.md:7
REALITY: pr-count pass One coherent authoring PR; no extra SDK/platform wave docs/superpowers/plans/2026-10-24-agreement-editor.md:62
REALITY: prior-art pass Existing Rails/Api/PDF infrastructure reused; primary peer docs are interface reference only docs/agreements.md:21
REALITY: contract-assumptions pass Preserve legacy errors string/auth and exact workspace/version contracts docs/agreements.md:21
REALITY: dependency-fallback pass Draft authoring/export works without a signing provider; no fabricated signature value docs/agreements.md:3
REALITY: obligation-tiers pass Must-ship checks retained; original issue requirements explicitly remain later work docs/agreements.md:70

## Engineering and design follow-up after DX fixes

All affected engineering stages were rechecked: field values now use only validated definitions; PDF status errors are sanitized at the shared owner while cleanup and other error classes remain; agreement failures preserve privacy/cache/authorization and compatible errors text; Blob parsing is bounded and JSON-only with safe fallback; both create callers share recovery guidance without automatic retries. The actual caller search and shared regressions cover the broader PDF change. Current core155/0 and shared98/0/1pending are the evidence above. No new architecture/code/test/performance issue remains after the fixes; no silent critical gap or new provider dependency is introduced.

Design follow-up rechecked the two recovery states: existing alert/dialog patterns display the reference or archive instruction, error state clears on successful PDF retry, and the document remains intact. New screenshots are readable; existing mobile layout/control/role coverage passes in the current core run. Earlier unchanged seven-pass design evidence is reused; no new layout, new design decision, human approval or physical-device claim is made. These follow-ups must be logged at the final committed head, not assumed from earlier hashes.

## CI follow-up review

Public PR2475 at c7c14cdd3 exposed nine new Reek warnings and an inherited docs package advisory. The validator/importer now separates existing parsing responsibilities into focused private methods without disabling detectors or changing supported input. Review compared every extracted branch to its prior caller: package check order, trusted child validation, numbering overrides/starts, text marks and split placeholders, list counters, table spans, recursion and rejection/cleanup boundaries remain. A temporary stray return from extraction failed five focused tests and was removed before commit. Current focused validator/importer57/0 and combined155/0 pass [measured: docs/qa/agreement-editor-2462/README.md:7]; the final pluck idiom was checked by the focused run. Full CI Reek0warnings and focused RuboCop pass. No new behavior-specific tests mirror these extractions; existing substantive Word fixtures cover them.

The docs serialize-javascript pin changes7.0.5->7.1.3. Running the remaining mobile audit then exposed active undici advisories, so its CLI pin changes6.28.1->6.29.1. Both lockfile changes are limited to those packages. Primary advisories and exact build/audit limits are recorded in QA evidence. Root/docs audits pass; mobile exits0 with its pre-existing ignored advisory retained. Frozen installs, docs production build, mobile TypeScript check and web export pass. No new audit exception, runtime feature or mobile UI change was added; native device builds remain unverified.

Engineering follow-up reviewed the extraction diff and existing rejection/formatting tests; dependency changes use patched versions in the same major and their actual build consumers pass. Design evidence is reused unchanged: no UI or rendering contract changed, and the current combined browser run rechecks authoring/import/export/recovery. DX follow-up checks contributor references still point to valid definitions and preserves the established failure contracts. No new product decision or unresolved implementation finding remains in this follow-up. Exact-head logs must identify evidence reuse; remote CI, CodeRabbit and deployment remain pending rather than receiving clean credit from local checks.

## CodeRabbit and Linux PDF follow-up

The first four actionable comments were verified against the code and fixed. Preview replacement calls strict setContent before mutating fields/values, catches failure inside the dialog and removes the redundant current assignment; a real Brave regression then cancels, edits and saves to prove original definitions remain. The importer normalizes root-declared mc:Ignorable formatting only inside native rPr/pPr and rejects substantive text/native Word descendants or foreign nodes outside properties. The shared text_slice boundary now omits zero-length ranges, fixing adjacent placeholders without duplicating guards at callers. Content-Length metadata allows complete bounded reads to preserve known stream encoding before Rails raw_post; partial UTF-8/UTF-16 chunks remain byte-exact, with no position/seek requirement added to Rack inputs. Reviewed all named callers and preserved the private webhook raw-body bypass for later integration.

Boundary RED 2/2, adjacent-placeholder RED 1/1 and preview RED 1/1 are reproduced defects, not inferred findings. Focused parser/middleware 46/0 and preview 1/0 pass [measured: docs/qa/agreement-editor-2462/README.md:7]. Required Vite, current JS formatting/lint, five-file Ruby lint and full Reek pass. Original 3 comments and incremental 1 comment are the complete observed review findings; new feedback must still be checked after push. No review reply or deferral is assumed authorized.

The release font check found no explicit Indian-script font package in the Docker runtime. Added fonts-noto-core to development/production packages and a production build glyph-coverage assertion. A local aarch64 Debian trixie runtime using that package set rendered the actual Rails template/validated 60-field body offline into 25 tagged A4 pages with embedded Devanagari fonts and final clause/field retained [measured: docs/qa/agreement-editor-2462/README.md:9]. The first/last PNGs were viewed. This is actual Linux rendering evidence, not proof of final amd64 image or live production. No signing-provider dependency was added; this system font is necessary for India document exports.

The combined agreement/middleware/browser suite passes160/0 [measured: docs/qa/agreement-editor-2462/README.md:15]. Screenshot review then found the preview error could sit above the scrolled viewport; a new viewport assertion failed1/1, and sticky action/error placement passes both valid and failed preview cases2/0 [measured: docs/qa/agreement-editor-2462/README.md:7]. A separate1/0 scenario attached Playwright CLI through the owned Brave process's public ws_url, checked the visible error from a fresh snapshot and captured the posted recovery image; the CLI detached afterward [measured: docs/qa/agreement-editor-2462/README.md:7]. Full160 evidence precedes only this final preview-layout change, with these focused follow-ups covering it. Required Vite/lint pass after the layout change. Affected engineering stages reviewed strict state commit order, markup-compatibility trust boundaries, empty-range behavior, bounded-read byte semantics and package/build assertion. Design reviewed the visible inline preview error and successful recovery in Brave; unchanged layout evidence remains reused. DX reviewed correction guidance and the documented Linux limitation. Current score judgments remain eng no unresolved issue, design9 and DX8; exact-head logs must record this affected-stage evidence and reuse, not pretend another independent whole-branch review completed.

## Final build dependency follow-up

The fifth CodeRabbit finding requests explicit fontconfig for fc-list rather than an incidental transitive package. Added that direct runtime dependency and removed the production RUN's trailing ||true, which could otherwise suppress an install or glyph-check failure. rm-rf already tolerates absent Node directories. A negative probe of the actual RUN (replace only its first apt-update command with false) exits1 rather than swallowing failure; the exact explicit Linux package/glyph layer builds successfully [measured: docs/qa/agreement-editor-2462/README.md:11]. Engineering reviewed the dependency and shell failure propagation; unchanged app/parser/auth evidence is reused. No application/UI code or dependency-lock behavior changes; design/DX reuse prior evidence and review the corrected package prerequisite. Public55's14 checks passed, but fresh exact-head CI/review remains required for this final follow-up. No additional full browser run is represented as having occurred for a build-only edit.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO Review | not run | No new product-scope decision | 0 | NOT RUN | Original authoring unit retained |
| Outside Review | Codex preflights / native design assessment | Independent challenge | plan/design/DX phases | EXTERNAL UNAVAILABLE | Native design findings fixed; no DX outside reviewer completed |
| Eng Review | /plan-eng-review + affected-stage follow-ups | Architecture and tests | 3 + CI/CodeRabbit follow-ups | CLEAR; final-head log follows read-back | No new unresolved issue or critical gap after fixes |
| Design Review | /plan-design-review + recovery follow-ups | UI/UX | 2 + preview-error follow-up | CLEAR; final-head log follows read-back | Prior6->9; recovery states verified |
| DX Review | /plan-devex-review + affected-stage follow-ups | Internal developer experience | 1 + CI/CodeRabbit follow-ups | CLEAR; log follows read-back | Overall4->8; caps fixed; zero unresolved decisions |

**OUTSIDE COVERAGE:** External Codex phases unavailable in this host. Native design assessment is in-host only; the missing bounded DX fallback is not a completed review.
**VERDICT:** Engineering, design and internal DX clear for the authoring unit after verified fixes. Exact-head CI, CodeRabbit and production release checks remain required; the full issue/goal is not complete.
NO UNRESOLVED DECISIONS
