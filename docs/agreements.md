# Agreement authoring for Miru contributors

> Release hold: the template-first authoring unit below does not meet the clarified upload-and-sign workflow. [The revised requirements](superpowers/specs/2026-10-24-generic-document-signing.md) make individual document uploads primary and templates optional. Actual recipient signing remains unfinished; do not deploy this unit as a signing feature.

Owners/admins with an active membership can author private client/consultant templates at `/agreements` and generate independent drafts. The current unit provides editable clauses, fields, DOCX preview import and DRAFT PDF export. Approval, sharing, actual signing and immutable completed artifacts remain unfinished; none of these endpoints sends mail, signs a document or settles a payment.

Use the existing Miru development setup in [CLAUDE.md](../CLAUDE.md). Install the checked-in dependencies with `pnpm install --frozen-lockfile` and `bundle install`, then apply `bin/rails db:migrate` to your local development database. Keep encryption keys stable; do not copy production data or credentials into fixtures. This feature needs no separate signing-provider account.

## Follow a working example

The [request examples](../spec/requests/api/v1/agreement_templates_spec.rb) create and edit actual encrypted templates with ordinary test authentication. [Draft examples](../spec/requests/api/v1/agreements_spec.rb) generate both client and consultant copies, test permissions/conflicts and download real PDF bytes. Run them against your configured local test database:

```sh
RAILS_ENV=test mise exec -- bundle exec rspec \
  spec/requests/api/v1/agreement_templates_spec.rb \
  spec/requests/api/v1/agreements_spec.rb
```

PDF examples require the existing Chromium-compatible renderer; set `BROWSER_PATH` to your installed browser executable when auto-discovery is unavailable. In this workspace, QA uses Brave. The test command mutates only the configured test database; check that database before running it. No fresh-developer onboarding time is claimed from an automated test duration.

## API contract

Use the existing authenticated [Api wrapper](../app/javascript/src/apis/api.ts), which supplies the session and anti-forgery header. Token-authenticated callers follow Miru's existing token flow; do not bypass membership or company checks. The [agreement helpers](../app/javascript/src/components/Agreements/api.ts) preserve errors for local recovery. Field/document/value types are in [types.ts](../app/javascript/src/components/Agreements/types.ts); the authoritative accepted schema is [Agreements::Document](../app/services/agreements/document.rb).

| Route under `/api/v1` | Purpose |
| --- | --- |
| `GET/POST /agreement_templates` | Paginated metadata archive / create master |
| `GET/PATCH /agreement_templates/:id` | Read/edit master |
| `POST /agreement_templates/import` | Multipart DOCX preview, without persistence |
| `GET/POST /agreements` | Paginated metadata archive / generate independent draft |
| `GET/PATCH /agreements/:id` | Read/edit private draft |
| `GET /agreements/parties?kind=client` | Bounded client lookup; use `consultant` for staff lookup |
| `GET /agreements/:id/download` | Download the persisted DRAFT PDF |

JSON writes use the `agreement_template` or `agreement` root and the current `company_id`. Updates must include the integer `lock_version` returned by the latest read/save; never coerce or increment it in the client. For example, a title-only edit sends:

```json
{"agreement_template":{"company_id":42,"lock_version":0,"title":"Consultant master"}}
```

Replace example IDs/version with the selected record's actual workspace and last server version. A `409` means reload/reconcile before saving; do not blindly retry a stale write. Draft generation supplies the source template and exactly one matching company-owned `client_id` or `employment_id`. Identity values are snapshots; compensation/payment values must be explicitly provided. Master/profile updates do not change generated copies.

## Failure and recovery

Existing session/policy errors retain Miru's established envelopes and statuses: authenticate for `401`; ask an authorized administrator for `403`; verify the selected company/record for `404`. A failed create request with no response or a server error has an unknown outcome: inspect the draft/template archive before manually retrying, so a lost response does not create an accidental second copy. The UI directs you to that archive. There is no automatic retry for an ambiguous failed write, and no idempotency guarantee.

| Failure | Safe next action |
| --- | --- |
| `400` malformed root/query/page | Use the expected JSON root, supported kind and positive page number |
| `409` company/version changed | Preserve local recovery, reload the selected workspace/record and reconcile |
| `422` schema/field value | Correct the named field using its format guidance; no invalid value was saved |
| `422` unsupported DOCX | Accept/reject Word revisions or move unsupported legal content into the body; preview before replacing |

Bodies, values, uploads and compensation must stay out of diagnostics. Error guidance identifies the field/constraint without echoing its rejected value. Do not add private text to analytics, audits or exception context.

## PDF unavailable

`503` with `code: agreement_pdf_unavailable` is a handled renderer failure. The response is an RFC9457 problem object with the existing `errors` string retained for Miru clients. Its `instance` contains the request reference; the same ID appears in `X-Request-Id`. The saved draft is unchanged and no successful-download audit is written. Retry the download once; if it fails again, give the reference to an administrator.

Administrators should correlate that reference with the sanitized error report, check renderer/browser availability and the existing `BROWSER_PATH`/`FERRUM_BROWSER_PATH` configuration, repair it, then retry. Reports retain the exception class and Ruby stack, but omit renderer messages/data URLs because those can contain contract text. Unexpected non-renderer exceptions retain the existing application error path; this feature does not replace global error handling.

## Limits and release checks

Documents are bounded to 512 KiB, 20,000 nodes and depth 20; definitions to 100 fields/64 KiB; uploads to 5 MiB with bounded ZIP entries/decompressed parts. The importer normalizes supported formatting and rejects unsupported substantive content; it is not a lossless Word converter or a PDF body editor. Required blanks are allowed only as visibly incomplete drafts; signatures/initials cannot be fabricated through value updates.

See [QA evidence](qa/agreement-editor-2462/README.md) for browser/PDF artifacts, regression commands and measurement limits. Exact-head CI, CodeRabbit, private-production integration, stable encryption, Linux fonts, immutable web/worker image and authenticated live checks still apply before release. Rollback app code without dropping populated agreement tables.
