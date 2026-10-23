# Editable agreement templates and drafts

Issue #2462 requires reusable consultant/client masters, separately editable generated copies, review, signing and immutable completed records. The user additionally requires full body editing and configurable signer fields with measured performance. PR #2474 only supplies client identity/contact data; the contract upload UI supplies private file retention. Neither is an editor.

## Choice and boundaries

Build a Miru-owned structured rich-text editor using Tiptap's open-source core, with Rails owning confidential content, permissions, copy isolation and PDF output. A paid embedded editor would reduce engineering but impose a provider account and recurring costs; a static PDF field overlay would not meet body editing. This is our implementation choice under the user's standing instruction to choose and continue, not a provider purchase or a claim of user-approved technical details.

This unit delivers master authoring/import, independent client/consultant drafts, document fields and private draft PDFs. Later units deliver version-bound reviews/approvals and signing integration. Drafts must visibly remain drafts; no send/approve/sign controls or statuses pretending those workflows exist. This unit does not close #2462.

## Document contract

Use a bounded JSON document tree compatible with Tiptap: paragraphs, headings, bold/italic/underline/strike, aligned text, ordered/bulleted lists, tables, hard/page breaks and inline field references. Do not persist arbitrary HTML, scripts, URLs, images or executable templates. A server-side schema validates every node, nesting, attribute and field reference before save/export. Maximum document 512 KiB, 20,000 nodes, depth 20; at most 100 fields. Reject unsupported content visibly instead of silently dropping contract text.

Fields have a stable key, label, type (text, date, number, checkbox, dropdown, signature, initials), signer role (admin, counterparty, company_signer), required/read-only flags and dropdown options. Values are typed and separate from formatting. Signature/initial fields are placeholders pending the signing unit; admin editing cannot manufacture a signature. Required blanks may be saved as drafts but are identified in the UI/PDF; no readiness/signing claim follows. Custom fields and built-in identity/compensation fields share this contract.

Full contract editing means editable clauses, paragraphs and tables, plus insertion/removal/configuration of fields. Generated copies retain their own document, field definitions and values. Changes to a master, employment or client never mutate a saved draft. Import DOCX through bounded ZIP/XML parsing with external entity/network access disabled, preserving supported paragraphs/formatting/tables/breaks; reject unsupported constructs rather than claim lossless Word round-trip. A sanitized preview must be available before replacing any editor content.

## Data and access

AgreementTemplate belongs to company and creator; has title, consultant/client kind, encrypted structured document, field definitions and optimistic lock_version. Agreement belongs to company, creator, source template and exactly one company-scoped client or employment; contains independent encrypted document/field values plus copied field definitions and a draft-only status. References restrict deletion; no employee/client cascade purges a contract. Default JSON is empty and never shares mutable state. Audits contain IDs/actions only, never document bodies, values or compensation.

Owner/admin with a current kept employment and company role manages templates/drafts. Do not reuse payroll-plan entitlement or make confidential drafts available to counterparties before review/sharing exists. All lookups scoped by current company. Every write carries company_id and stale lock_version; stale workspace or concurrent edit returns 409 without overwriting. CSRF protection matches existing employee/tax record APIs. No-store responses, filtered request bodies, server-side field/association validation, bounded imports and escaped rendering protect all content boundaries.

## UI, exports and performance

Add an Agreements route in the existing application shell, owner/admin navigation, template/draft lists with explicit loading/error/empty states and pagination. Reuse ui primitives and design tokens. Lazy-load editor assets only on the agreement editor. Isolate Tiptap from surrounding React renders; use ordinary DOM field nodes, not one React component per field. Debounced autosave records the exact saved revision, keeps dirty state on failure, and never overwrites newer edits; conflict UI offers reload/copy recovery. Reopening restores saved content. Warn before discarding unsaved edits or replacing content.

PDF generation is explicit, through existing PdfGeneration services and trusted Rails layout; no generation on each keystroke. Draft PDFs contain a visible DRAFT heading, escaped field values, tables, page breaks and unresolved-field labels. Actual bytes must be extracted/rendered and inspected. UI and PDF use the same document schema; do not substitute a different contract body at export.

Measure synthetic short and 25-page/50+-field contracts at desktop/mobile sizes: cold/warm readiness, typing responsiveness, autosave/recovery and PDF export. Report environment and actual timings; a provider's performance claim is not Miru evidence. Exercise two-editor/stale-save behavior, workspace switching, empty/invalid/oversized import, malformed trees, Unicode/long legal names, XSS payloads and copy isolation. No private production documents, real agreement email or signature request is part of QA.

## Delivery

Focused RED/GREEN specs per task, required Vite build, actual Brave UI/console and rendered PDF evidence, one independent whole-branch review, CodeRabbit findings addressed before merge, exact-head CI. Ship through the existing public/private integration and immutable-image deployment workflow, preserving private production changes. No release or performance claim before its evidence exists. Keep original payroll/profile/agreements/ATS scope open until independently fulfilled.
