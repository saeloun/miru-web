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
