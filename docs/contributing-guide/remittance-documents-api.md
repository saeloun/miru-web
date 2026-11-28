---
id: remittance-documents-api
title: Remittance documents API
---

Retain bank-issued FIRC, FIRA or inward-remittance advice against an accepted
Mercury payment instruction. Evidence can arrive before an invoice exists.
Uploading evidence neither confirms payment credit nor verifies the bank document.
A Mercury receipt is not a FIRC. Miru does not retrieve certificates or send
automatic missing-document reminders.

## Authentication and workspace

Use Miru's authenticated API client and its normal session/CSRF handling. Every
request requires `company_id` as a string matching the user's current workspace.
Missing, numeric or mismatched workspace values return `409`; an organization
name does not substitute for its ID. Responses use `Cache-Control: private, no-store`.

A kept consultant can read their own retained evidence. Active owners/admins and
the run's active assigned accounts reviewer with the bookkeeper role can read
that consultant's evidence. A role alone does not grant access across workspaces.
Uploads additionally require enabled payroll and an accepted payment instruction.
Existing authorized history can remain readable after service ends or payroll is
disabled. Read permission and upload permission are separate.

## Endpoints

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/v1/remittance_documents` | `200` payment summaries and document history |
| `POST` | `/api/v1/remittance_documents` | `201` updated payment summary, including an exact replay |
| `GET` | `/api/v1/remittance_documents/:id/download` | Authenticated attachment bytes |

There is no update/delete endpoint. Correct evidence by appending a new version.

## List and pagination

Supply `company_id` and optionally one of these filters:

- `payment_instruction_id`: one accepted payment instruction the caller may read.
- `invoice_id`: accepted instructions linked to an accessible paid consultant
  invoice, including each split beneficiary. `payment_instruction_id` takes
  precedence if both filters are supplied.
- With neither filter, list only the caller's own kept employments' accepted
  instructions. This is not a workspace-wide accounts report.

`page` defaults to `"1"`. IDs and pages must be positive decimal strings of at
most 19 digits, no greater than `9223372036854775807`; malformed values return
`404`. A valid page beyond the available results is clamped to the last page.
Payments are ordered by descending ID, at most 20 per page. Document versions
within each payment are not separately paginated.

The response is `{ payments: [...], page: 1, has_more: false }`. Each payment has:

| Field | Meaning |
| --- | --- |
| `id`, `period`, `beneficiary` | String instruction ID, `YYYY-MM` period and beneficiary label |
| `credit_state`, `payment_state` | Separate recorded credit and payment states |
| `status` | `missing` or `received`; receipt is not authenticity verification |
| `follow_up_required` | Missing evidence after partial/full/resolved-shortfall credit, excluding blocked, cancelled, failed or reversed transactions |
| `can_upload` | Current upload permission; recheck it before offering an upload |
| `invoice_id` | String invoice ID, or `null` before issuance |
| `documents` | All retained versions, newest ID first |

Each document contains string `id`, `kind`, nullable string
`previous_document_id`, `reason`, ISO-8601 `uploaded_at`, uploader display name
`uploader`, integer `byte_size` and `content_type`. No file bytes, bank account
number or payment amounts are included in this listing.

## Upload and correct evidence

Send multipart form data with string `company_id`, string
`payment_instruction_id` and **all five** nested fields below. Extra nested fields
are rejected; `expected_document_id` must be present even when blank.

| Nested field | Required value |
| --- | --- |
| `remittance_document[kind]` | `firc`, `fira` or `inward_remittance_advice` |
| `remittance_document[reason]` | 1–1,000 characters after trimming; no control characters |
| `remittance_document[expected_document_id]` | `""` for the first document of this kind, otherwise that kind's latest document ID |
| `remittance_document[idempotency_key]` | 1–100 ASCII letters, digits, `_` or `-` |
| `remittance_document[file]` | Nonempty PDF, JPEG or PNG, at most 5 MiB; content is sniffed rather than trusting its filename |

For example, using the existing browser client and synthetic IDs:

```ts
import { remittanceApi } from "components/Payroll/RemittanceDocuments/api";

const controller = new AbortController();
const { data } = await remittanceApi.list(
  "12", { payment_instruction_id: "34" }, controller.signal
);
const head = data.payments[0]?.documents.find(document => document.kind === "firc");
const body = new FormData();
body.append("company_id", "12");
body.append("payment_instruction_id", "34");
body.append("remittance_document[kind]", "firc");
body.append("remittance_document[reason]", "Bank-issued advice for this transfer");
body.append("remittance_document[expected_document_id]", head?.id || "");
body.append("remittance_document[idempotency_key]", crypto.randomUUID());
body.append("remittance_document[file]", selectedFile);
await remittanceApi.upload(body, controller.signal);
```

`selectedFile` must be the user-selected bank document. Keep the chosen key and
exact fields/file bytes for a retry; do not generate another key merely because a
response was lost. Keys are scoped to company and uploader. Reusing a key for a
different command returns `409`. A correction uses a new key and the latest ID
for that **same kind**. Concurrent corrections with a stale ID return `409`;
reload history before preparing another correction. Earlier rows and bytes remain.

Cancel requests when the workspace changes. Discard stale responses rather than
displaying or saving documents under a different workspace.

## Download and errors

Supply `company_id` and `payment_instruction_id` when downloading a document ID
from that instruction's history. The server checks authorization again after
reading the private bytes and returns an attachment with `nosniff`. Do not expose
Active Storage bearer URLs as a substitute for this authenticated endpoint.

| Status | Handling |
| --- | --- |
| `401` / `403` | Restore the session or current permission; never retry with another tenant's IDs |
| `404` | Invalid/inaccessible record or unavailable private bytes; a missing or changed stored file also returns `404` on download |
| `409` | Workspace, history, idempotency or storage conflict; inspect the error and reload the current state before changing the command |
| `422` | Invalid fields/file or failed CSRF validation; correct the request |
| `503` | Server encryption configuration is unavailable; operator correction is required |

Handled validation/conflict responses contain an `errors` message. A missing
`remittance_document` envelope is a malformed request, not an empty upload.
Interrupted writes or failed cleanup can leave unreferenced private storage bytes;
operators must investigate these separately. Document receipt and correction never
replace payment approval, credit confirmation or invoice issuance.
