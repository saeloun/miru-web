# Documenso local validation, 2026-10-24

**DONE_WITH_CONCERNS: provider feasibility only. Miru's upload/field/signing integration is not implemented or deployed. PR #2475 stays a draft.** The [corrected requirements](../../superpowers/specs/2026-10-24-generic-document-signing.md) make individual uploads primary and templates optional. Existing authoring-unit CI/test counts do not verify this workflow.

## Environment and isolation

Live local self-hosted Documenso **2.21.1**, Node 24.22.1, Linux arm64 on Docker 29.5.2. Image pinned to `ghcr.io/documenso/documenso@sha256:41a69062febc915d1508b87be8c5bbe72ecd3c49232ddcd983490f5f7832f053`. PostgreSQL 15, local Mailpit SMTP capture, internal Docker network, localhost-only proxy on ports 3318/3319. No licence key, subscription, production credentials, real contract or external SMTP delivery. The certificate was disposable, self-signed and explicitly named Synthetic QA ONLY.

The account was created through the normal UI and verified using its locally captured email. API probes used a disposable fixture token seeded with the provider's hash algorithm; no licence claims or plan flags were overridden. Token-management and creation dialogs opened without a paywall, but browser control disconnected before completing token creation through the UI. That final UI operation remains unverified.

All documents and recipients are fictional. The user's Google Doc supplied only the structural case: main agreement plus SOW, each with two party signature blocks. Its actual content and identities were not copied. Probe scripts/results and the local audit export are retained under `/tmp/miru-documenso-validation-20261024`; local environment files and recipient links are excluded from this repository. The stack is disposable; its persistent database is retained when stopping containers.

## Observed checks

| Check | Result |
| --- | --- |
| One-off `DOCUMENT` upload, without a template | HTTP 200; two PDFs, three source pages, two signers, 19 positioned signature/name/date/text fields; `templateId` null |
| Anonymous / invalid API token | Both HTTP 401 |
| Invalid bytes uploaded as PDF | HTTP 400 |
| Required text left empty in signing UI | Submission blocked with "Text is required" |
| Different recipients and repeated blocks | Fictional signers independently completed the main agreement, SOW and addendum in Brave |
| First signer completes | Envelope stays PENDING; SIGNED / NOT_SIGNED retained separately |
| Both signers complete | Envelope COMPLETED; both recipients SIGNED with separate timestamps |
| Completion notifications | Exactly one "Signing Complete!" message for each signer and the owner in local Mailpit |
| Original downloads | Both byte-identical to uploaded PDFs |
| Completed artifacts | Two sealed PDFs, one completion certificate, seven-page audit PDF downloaded; source text, SOW and required QA text retained |
| Independent PDF verification | Poppler `pdfsig`: SHA-256, ETSI.CAdES.detached, total document signed, Signature is Valid for both PDFs |
| Tamper detection | Changing a PDF header byte in a separate copy produces Digest Mismatch |
| Completed field edit | HTTP 400 "Envelope already complete"; field position and sealed PDF bytes unchanged |
| Pending cancellation | HTTP 200, authoritative CANCELLED state; no email distribution for this boundary case |
| Persistence | Restarted Postgres and recreated the app container; COMPLETED, both signer statuses and byte-identical sealed PDFs survived |
| Browser result | "Document Signed / Everyone has signed" visible after restart; no errors in captured console checks |

The PDFs were text-extracted and visually rendered. Main output has three pages (two source pages plus signing certificate); addendum has two (one source page plus certificate). Both signatures fit the intended blocks. The separate certificate has one page; a Type 3 glyph bounding-box warning from Poppler did not prevent rendering or legibility. `pdfsig` also emitted a local missing-Firefox-folder diagnostic; its signature results above are explicit. The self-signed certificate issuer is **not trusted**: the test proves integrity, not a publicly trusted identity or jurisdiction-specific legal compliance. Individual recipient identity/consent is represented by the provider's audit evidence; the PDF cryptographic seal belongs to the test service certificate.

## Integration gaps reproduced

| Boundary | Actual behavior | Required Miru guard |
| --- | --- | --- |
| Page does not exist | API stored page 99 against a two-page PDF, HTTP 200 | Check every field against the canonical PDF's actual pages |
| Rectangle exceeds page | API stored x=95%, width=30%, HTTP 200 | Validate the whole rectangle with page rotation/size, including x+width and y+height |
| Sent version lock | Field x changed from 10 to 11 while PENDING, HTTP 200; persisted on readback | Lock Miru's sent revision and recipient/field definitions; bind requests to immutable snapshots. This case had no completed recipient; post-partial-signing edits were not tested |
| Download is not proof of completion | Explicit `version=signed` returned HTTP 200 with the unsigned original while PENDING; byte-identical to `version=original`, no PDF signature | Require authoritative completion, signer states and the expected sealed artifact before publishing a signed download |

Documenso's [webhook verification contract](https://docs.documenso.com/docs/developers/webhooks/verification) sends a shared header secret. It is not a per-body HMAC. Miru must reject empty/missing configuration, use a constant-time comparison, deduplicate/reconcile events and fetch authoritative company-bound state. No webhook delivery/replay test was run here.

The [embedded editor is paid](https://docs.documenso.com/docs/developers/embedding/editor). This candidate requires Miru's own upload/placement screen; no paid embedding was activated or bypassed. [Community licence obligations](https://docs.documenso.com/docs/policies/licenses), hosting, durable keys, email and backups still need deployment assessment.

## Evidence

- Original synthetic inputs: [main agreement and SOW](qa-main.pdf), [addendum](qa-addendum.pdf).
- Completed outputs: [main agreement and SOW](signed-qa-main.pdf), [addendum](signed-qa-addendum.pdf), [certificate](completion-certificate.pdf).
- Rendered output pages below are actual provider PDFs, not a Miru UI mockup.

![Completed synthetic SOW with both fictional signers](signed-sow.png)

![Synthetic completion certificate](certificate.png)

## Coverage limits

This is a local live-provider feasibility probe, not a full Miru or formal timeboxed gstack QA pass. The report uses observations collected before that wrapper was opened; no retrospective charter or clean QA gate is claimed. No Miru runtime code or automated product tests changed. Production/staging, cross-company concurrency, real recipient authentication, OTP, reminders/expiry, webhook retries/reordering, backup restore, DOCX/image conversion, mobile/keyboard/screen-reader behavior and large-document/load performance remain unverified. The test defaulted to UTC; Miru must set the intended timezone explicitly. A single two-file create took 0.179s; that is not a UI, load or production benchmark.

Recommended next unit: implement the corrected Miru upload/placement flow with page-bound validation, revision/approval invalidation, tenant isolation and sent locks; then connect the tested provider contract and verify the entire Miru-to-signed-archive flow. Do not merge/deploy the old authoring image as document signing or close #2462 on this evidence.
