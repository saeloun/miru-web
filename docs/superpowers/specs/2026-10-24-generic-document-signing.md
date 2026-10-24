# Generic document upload and signing

Status: implementation in progress. Private uploads/revisions, PDF field placement and version-bound review/approval are in this branch; provider signing and release checks continue. PR #2475 remains a draft; its previous image must not be deployed. On 2026-10-24 the user clarified that people repeatedly edit their own documents and need to upload any supported document and place fields on it. The user then selected **Validate self-hosted Documenso first**. This supersedes the template-first primary flow in the [authoring design](2026-10-24-agreement-editor-design.md). [Sonam's #2462](https://github.com/saeloun/miru-web/issues/2462) still supplies the review, approval, authenticity, profile and access requirements.

Local provider validation is complete with concerns: [results and synthetic signed PDFs](../../qa/generic-document-signing-2462/README.md). One-off uploads and two-signer completion work on the unlicensed community build. Its API also accepts nonexistent pages, overflowing fields and field changes while pending; its signed-download route returns the unsigned original before completion. Miru must enforce these boundaries before release. No Miru signing integration or production readiness follows from this provider test.

## Primary flow

`Upload document(s) → Add recipients → Place fields → Review/approve this version → Send → Track → Download completed documents and certificate`

An admin starts with an individual document, without creating a template or choosing a client/consultant first. A client or employment association is optional metadata, checked against the current company when supplied. Templates become optional reuse; existing template/draft work must not be deleted or converted into fabricated signed records.

People can continue changing the source in Google Docs or Word, then upload a new revision. Preserve the original file and use an explicitly previewed PDF for page-based signing. Do not normalize a customer's uploaded legal document through the current rich-text DOCX importer: it does not preserve arbitrary Word layout. PDF is the first directly supported signing format. DOCX requires a separately validated conversion path or an explicit instruction to export PDF from the source application; neither a renamed file nor a Google Docs URL is a PDF. Show supported formats and conversion failures honestly. Never claim universal binary-format support.

The privately supplied example contains a main agreement and a Statement of Work, each with two party signature blocks. Reproduce that structure with synthetic content for QA, including separate signature/date/name/title fields at both locations. Keep the actual example, terms and identities out of public fixtures and screenshots. Do not modify the original Google Doc.

PDF processing is bounded to 10 files, 5 MiB each, 25 MiB and 100 source pages combined. Each embedded image must have verifiable dimensions and at most 16 million pixels, matching the preview decoder limit; larger images require a lower-resolution PDF export. Reject unsupported sources visibly rather than accepting a document whose images the preview silently omits. These checks do not establish malware scanning or universal PDF compatibility.

## Fields and recipients

Show the PDF pages as uploaded, including page size and rotation. Place and resize signature, initials, date, name, email, title, text, number, checkbox and dropdown fields on any page. Every field has a stable ID, document revision, page, bounded coordinates, assigned recipient, label and applicable required/read-only/options settings. Keyboard and touch users need an alternative to dragging. Positions must survive zoom and responsive resizing; the signing provider's coordinate convention must be tested against the displayed page.

Validate page existence and the complete rectangle, not just each coordinate independently. Set the intended timezone and date format explicitly. On download, require authoritative COMPLETED state, every required signer completed, expected document identity/digests and an actual sealed artifact; an HTTP 200 or a filename containing "signed" is insufficient.

Support named signers, a company signer, reviewers and copy recipients; do not model every external party as a Miru employee. An admin filling ordinary fields cannot manufacture another person's signature. Required values and signer assignments are checked again before send. A signer sees the whole document but can complete only their own editable fields. The company signatory can default from the issue's configured address, with a visible review step rather than a hidden hard-coded recipient. Keep finance, primary-contact and signatory email addresses distinct.

## Revisions, review and completion

Retain originals, canonical PDFs, field definitions, recipient snapshots and their SHA-256 digests together. A send references the exact approved package, including addenda. Replacing a draft file creates a revision and invalidates its approval; old field coordinates must not silently carry onto a changed layout. Require deliberate remapping/review. Store prior drafts and review comments against their revisions. A designated external reviewer gets scoped access, can request changes and comment; admin responses and approval records remain in the history.

Once sent, lock that version. Changes require cancellation of the pending request and a new version/request; cancellation cannot erase a signature that already completed. Keep signed documents immutable and store subsequent amendments as new agreements/addenda. Final artifacts include the signed PDF(s), provider completion certificate/audit evidence and verified completion state. Attach them to the linked client/consultant profile when applicable, and provide authorized downloads. Track each recipient and Draft, Under Review, Changes Requested, Approved for Signature, Awaiting Signatures, Signed, Declined, Cancelled and Expired states without deriving completion from browser callbacks alone.

## Access, delivery and recovery

Reuse company-scoped policies, active membership checks, private Active Storage, MIME detection, upload bounds, workspace binding, optimistic locking, no-store responses and metadata-only audits. Existing employee contract uploads are private retention, not proof of signing. New generic documents must not inherit the existing model's mandatory client-or-employment constraint. Reject unauthorized downloads, field edits, recipient changes and cross-company provider IDs. Keep documents, values, credentials and signing links out of logs and public storage routes.

Send, cancellation and reminder jobs need durable operation identity and reconciliation after ambiguous provider timeouts. A retry must not issue duplicate signature requests. Authenticate provider callbacks using its documented mechanism, deduplicate events, reject stale transitions and confirm authoritative provider state before finalizing artifacts. Validate downloaded artifact sources and limits; do not fetch arbitrary callback URLs. Store the completed bytes privately before reporting an archive download as available. Cover expired links, signer rejection, cancellation, bounced mail and conversion/provider failures with visible recoverable states. No signature email to real people is part of validation.

Documenso documents a shared `X-Documenso-Secret` header, not a per-body HMAC. Require a configured nonempty secret, compare in constant time and reject missing/mismatched credentials. A verified callback is a trigger to fetch trusted provider state, not permission to accept arbitrary IDs, transitions or download URLs. Never give the provider API key to the browser. [Verification contract](https://docs.documenso.com/docs/developers/webhooks/verification).

## Provider validation and selection

| Option | Fit and limitation |
| --- | --- |
| Miru field placement + self-hosted Documenso | Preferred validation candidate. Its envelope API accepts one-off PDFs, recipients and page fields. Community API access and exact supported operations must be proven on the pinned local build. Its embedded editor is paid, so this approach uses a Miru-owned field screen. |
| Dropbox Sign embedded requesting | Existing-account alternative. Requires the account/API entitlement, credentials and production app approval; none is established by the current PR. |
| Self-hosted DocuSeal | Has a document builder and API, but the official Pro list includes embedded builder and PDF/DOCX creation APIs. Do not treat those capabilities as free merely because core self-hosting is free. |

Validate Documenso in an isolated local deployment with synthetic PDFs, a local SMTP capture and a disposable test certificate. No production connection, paid plan, actual contract or real signature request. Check upload without a template, field coordinates on multiple pages/documents, two separate signers, required-field enforcement, partial/final status, final PDF and audit output, cancellation/expiry, webhook authentication, restart persistence and licensing boundaries. Record actual pass/fail/not-tested results with the exact image/version; documentation claims are not test passes.

Self-hosting still requires persistent database/storage, backups/restore, a signing certificate and key protection, SMTP, background jobs, HTTPS and tenant isolation. Assess licence obligations before distribution/deployment. A local self-signed test certificate does not establish a publicly trusted signer identity or compliance with every jurisdiction/agreement type. Do not invent cryptographic signing inside Miru.

Primary sources checked 2026-10-24: [Documenso envelope API](https://docs.documenso.com/docs/developers/getting-started/first-api-call), [envelope migration](https://docs.documenso.com/docs/developers/api/migrate-to-envelopes), [community edition](https://docs.documenso.com/docs/policies/community-edition), [licences](https://docs.documenso.com/docs/policies/licenses), [paid embedded editor](https://docs.documenso.com/docs/developers/embedding/editor), [self-hosting/certificate requirements](https://docs.documenso.com/docs/self-hosting), [Dropbox Sign production approval](https://developers.hellosign.com/docs/walkthroughs/embedded-signing), [DocuSeal capabilities and Pro boundary](https://www.docuseal.com/on-premises).

## Change surface and release acceptance

The implementation reaches `Agreement` and its database constraints, original/revision attachments, policies, `AgreementsController` and `AgreementAuthoring`, provider/background-job/callback boundaries, agreement archive/editor/API types/routes/navigation, profile document links and request/model/service/browser specs. Reuse the existing renderer, API/error components and private attachment patterns where they fit; do not expose the draft PDF as a completed signed artifact. Preserve existing template drafts and private production differences.

Release requires a real upload-to-completed-artifact test, synthetic screenshots/PDF evidence, focused access/revision/recovery regressions, mandatory Vite build, real Brave UI/console checks, current reviews/CI and exact deployed-image verification. Specifically demonstrate the main-agreement-plus-SOW case, fresh source revision with moved signature blocks, different recipients on the same page, addenda, mobile/keyboard placement, malformed/oversized/unsupported uploads, cross-company denials and duplicate/reordered delivery events. Keep #2462 open until its review, signing, immutability and profile requirements are delivered. Old authoring-unit test counts are not evidence for this corrected workflow.
