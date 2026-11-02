# Generic Document Signing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins upload individual documents, place recipient fields, review an exact revision and obtain privately archived signed copies, without requiring templates or a counterparty profile.

**Architecture:** Add `SignatureRequest` and `SignatureRequestRevision` for uploaded signing packages. Keep the existing structured `Agreement` drafts separate: their mandatory parties and inline rich-text fields are different contracts, and neither is needed for uploads. Reuse the current membership/policy, private Active Storage, optimistic-lock, no-store and metadata-audit patterns. Use Documenso's community envelope API behind server-owned credentials; its pending-edit/download behavior is not trusted as a Miru permission or completion check.

**Tech Stack:** Rails 8.1/RSpec, private Active Storage, Poppler `pdfinfo`/`pdfsig` and qpdf structural validation, existing React/ui primitives, lazy PDF.js (`pdfjs-dist` 6.4.299; registry engine requirement matches Node 24). Native execution continues the existing authoring workflow and standing instruction to choose and continue; no new execution-method menu. Production remains held until the corrected flow is verified.

**Spec:** `docs/superpowers/specs/2026-10-24-generic-document-signing.md`

## Global Constraints

- Individual document uploads are primary; templates and client/employment associations are optional.
- Preserve originals, canonical PDF layout and historical revisions; no rich-text normalization of uploaded PDFs.
- PDF first. State unsupported formats honestly. DOCX conversion requires a separately verified converter.
- No real signature mail, production write or provider purchase during implementation/QA.
- Bound uploads to 10 files, 5 MiB each, 25 MiB combined and 100 source pages; 20 recipients, 100 fields and 128 KiB configuration. Reject encrypted/interactive PDFs with an explicit export-to-flat-PDF recovery message.
- Provider API keys remain server-side. Unconfigured signing must fail visibly without fabricated success.
- Sent revisions and completed bytes remain immutable. Replacing a source invalidates approval and field placement.
- Every nontrivial trust-boundary behavior needs a focused failing test before implementation. Manual edits use apply_patch; retain unrelated work and private-production changes.

## Review Focus

- A small hostile PDF must not monopolize a web/worker process: bound metadata-process time, memory and output; kill/reap it on failure (Task 1).
- A field on a rotated/cropped page must remain inside its displayed page at every zoom; reject missing pages and overflowing rectangles (Tasks 1, 3).
- Two admins saving/replacing/reviewing concurrently must not approve or send stale content; preserve the older reviewed version (Tasks 2, 4).
- A provider timeout must not trigger a second signature email; persist operation state and reconcile or show an explicit uncertain state (Task 5).
- A successful download before completion must never be archived as signed; verify authoritative status, original digests and a valid sealed artifact (Task 6).

### Task 1: Validate PDF sources and page fields

**Files:** create `app/services/signatures/pdf_info.rb`, `configuration.rb`; specs in `spec/services/signatures/`; add Poppler to the existing runtime/test image and CI package lists.
**Interfaces:** `Signatures::PdfInfo.new(path).process` returns `{ "sha256" => String, "pages" => [{ "width" => Numeric, "height" => Numeric, "rotation" => Integer }] }` or raises `InvalidDocument`. `Signatures::Configuration.new(documents:, recipients:, fields:).errors` returns bounded public errors; `ready_errors` adds missing signer/signature and read-only-value checks. Field coordinates are finite percentages, page numbers start at 1 and document/recipient references use stable bounded IDs.

- [x] Write specs for actual two-page PDF metadata; malformed/encrypted/interactive/oversized sources; subprocess failure/timeout/output bounds; typed field validation; missing pages; x=95,width=30; absent recipients; dropdown and signature-value constraints.
- [x] Run focused specs and observe the missing-feature failures.
- [x] Implement the bounded Poppler subprocess and configuration schema, with sanitized failures and complete-rectangle validation.
- [x] Run focused specs and changed-file Ruby lint; verify the parser in the Linux runtime package set.
- [x] Commit the complete source-validation unit.

### Task 2: Store private uploaded packages and revisions

**Files:** additive migration/schema; `app/models/signature_request.rb`, `signature_request_revision.rb`; policy; `app/services/signatures/upload.rb`; `app/controllers/api/v1/signature_requests_controller.rb`; API routes/filtering; model/request specs and factories.
**Interfaces:** request owns company/creator, optional client/employment and current revision; revision owns original attachments, trusted file metadata, encrypted recipients/fields, approval/status/digest and provider operation identity. API create/upload returns `signature_request` metadata/configuration; updates carry `company_id` and integer `lock_version`. Original reads use authenticated request/revision/file-key routes, never public blob URLs.

- [x] Write request/model failures for standalone upload, private storage, active-admin/tenant/workspace access, stale updates, rejected source preservation, revision replacement, approved/sent locks, metadata-only lists/audits and ambiguous create recovery.
- [x] Run RED; implement transactional upload/configuration operations. Source replacement always creates a revision; editing a shared/approved draft forks it and clears approval. Reject edits while sending/pending/completed.
- [x] Run GREEN, existing agreement/profile regressions and migration up/down/up in the owned test database; commit.

### Task 3: Make upload and field placement the primary UI

**Files:** `app/javascript/src/components/DocumentSignatures/{index,Editor,PdfPages,api,types}.tsx/ts`, scoped styles; router/navigation/locale; focused browser specs.
**Interfaces:** authenticated Task 2 API; lazily render original PDF pages with PDF.js. Store field rectangles as percentages against the displayed page; fields select explicit recipient IDs. Drag/resize has labelled keyboard-editable page/position/size controls. Retain existing draft authoring as secondary navigation.

- [x] Write browser failures for upload without a template/party, repeated signature blocks, recipients and typed fields, zoom/mobile placement, upload/configuration failures, stale-save recovery, replacement remapping and keyboard access.
- [x] Run RED; implement using existing ui primitives and pointer capture, with no drag library. Cancel PDF renders and pending reads on document/workspace changes; preserve unsaved work on errors.
- [x] Run GREEN, `rtk mise exec -- timeout 30 bin/vite build`, focused JS lint and real Brave/console checks; capture synthetic evidence; commit.

### Task 4: Review and approve a specific version

**Files:** revision-bound review invitations/comments and migration; `Signatures` review APIs/policies; invitation mailer; frontend review/approval controls; request/mailer/browser specs.
**Interfaces:** reviewer invitations carry expiring, revocable capabilities only for one revision and email. Keep link credentials out of server paths/logs. Comments are encrypted and version-bound. Admin approval records actor/time and the exact file/recipient/field digest; a later edit cannot reuse it.

- [x] Write RED for scoped reviewer access/comments, expiry/revocation, changes requested, compensation/privacy, stale approval and replaced-source invalidation.
- [x] Implement the reviewer page and manual approval record without substituting a signature; render and check local-only mail previews.
- [x] Run focused GREEN/browser/build checks and commit.

### Task 5: Send, cancel and track with Documenso

**Files:** company-scoped encrypted signing connection/configuration; `app/services/signatures/documenso_client.rb`, send/cancel/reminder jobs; admin API/UI; service/job/request specs.
**Interfaces:** trusted server-configured provider origin; per-company credentials. Create one DOCUMENT envelope with the approved PDFs/recipient/field snapshot, persist the returned ID before distribution and bind a stable external operation ID. The API has no exact external-ID filter: ambiguous create outcomes must remain explicit and require authoritative reconciliation, never blind resending.

- [x] Write RED for the real multipart contract, bounded/sanitized HTTP responses, denied arbitrary origins, missing credentials, stale approval, revoked membership, crash/timeout recovery, duplicate jobs and cancel/send races.
- [x] Implement durable states and reconciliation; verify the provider original bytes/configuration before distributing. API callbacks/browser events cannot manufacture completion. Add visible sending/pending/uncertain/error and per-recipient states.
- [x] Run GREEN plus a local live provider send/cancel case using only fictional recipients/local SMTP, then commit.

### Task 6: Reconcile completion and publish immutable artifacts

**Files:** provider webhook controller; sync/artifact services/jobs; `pdfsig` verification; signed downloads, profile links and archive UI; service/request/browser specs and QA docs.
**Interfaces:** configured nonempty webhook shared secret, constant-time verification, bound connection/envelope IDs and idempotent state transitions. Fetch authoritative provider state. Require all required signers complete, original SHA-256 matches, unchanged expected signing configuration and valid whole-document cryptographic seals under the configured service-certificate trust policy. Preserve artifacts privately before exposing signed downloads; keep failed archival distinguishable from provider completion.

- [x] Write RED for missing/replayed/reordered/foreign callbacks, wrong originals/fields, pending unsigned-download fallback, invalid/truncated/tampered artifacts, retention/download isolation and profile authorization.
- [x] Implement GREEN; run the complete Miru upload→place→review→approve→two-signers→archive journey, including replacement, cancellation, rejection/expiry and addenda in the owned local provider stack.
- [ ] Finish actual PDF/font/layout, mobile/keyboard, performance and failure QA; required Vite build; focused and related suites; one fresh review of the corrected runtime branch; address actionable CodeRabbit feedback; exact-head CI.
- [ ] Recalibrate PR title/body around implemented behavior with synthetic screenshots/PDFs. Integrate private production differences, verify the immutable image and deploy only when this corrected workflow meets release checks. Keep #2462 open until all requested review/signing/profile controls have evidence.

## Self-review

All spec sections map to Tasks 1–6. Provider feasibility is prior evidence, not an implementation pass. The plan preserves the larger Sonam/payroll goal and does not redefine completion around uploads alone. Native execution is retained; no additional whole-branch review of the superseded authoring unit is required.
