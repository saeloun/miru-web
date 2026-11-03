# Private hiring downloads and lock contention

Local follow-up to ATS PR #2479, based on `9bc342547`.

## Change

Hiring form/assessment GET and HEAD requests retain scoped actor/application authorization
without locking the company row. Mutations retain actor → company → application
→ assignment lock ordering, using `FOR NO KEY UPDATE` for company serialization.
That mode permits concurrent key-share references, as documented in
[PostgreSQL's row-lock conflict table](https://www.postgresql.org/docs/16/explicit-locking.html#LOCKING-ROWS).

Admin resumes and admin/reviewer assessment downloads load their scoped attachment
metadata in a short transaction, read bounded private/checksummed storage outside
that transaction, then reauthorize and check that the attachment still matches
before returning bytes. Existing download content types, attachment disposition,
sandbox headers and private/no-store response headers are retained.

## Evidence

- The three browser download checks failed before the fix: an independent
  PostgreSQL connection received `PG::LockNotAvailable` on the company row
  during the storage read. All three passed after the fix, saving files with
  exactly the source fixture's bytes.
- **102 backend examples, 0 failures**: assessment services/HTTP boundaries,
  candidate forms, form configuration and acknowledgement delivery.
- Six of these examples exercise changes during the storage read: an admin's
  workspace changes, a reviewer is reassigned, a draft attachment is removed,
  an administrator's employment ends, or a resume is removed or replaced. No bytes are
  returned to the now-unauthorized requester or from the removed attachment.
- **18 browser examples, 0 failures**: candidate forms, screening and staff
  assessment review. Independent connections probe company-row availability
  while forms/assessment/reviewer index/detail responses render; key-share
  compatibility is checked while form/assignment mutations still hold locks.
- During each private storage download, the independent connection can lock
  the company, requester, application and (where applicable) assignment rows.
- The admin/reviewer browser examples additionally end employment through an
  independent connection during the storage read. Both requests return HTTP 403
  without PDF contents after reauthorization.
- An independent source review identified HEAD lock contention. Two new HEAD
  probes reproduced it before the guard fix. All three controller paths now
  permit HEAD reads without company locks and reject a mismatched workspace
  with HTTP 409 and an empty body.
- Two additional screenshot runs passed at desktop (admin, 1440px) and mobile
  (reviewer, 390px), with exact saved bytes, empty console/exception checks and
  no horizontal overflow: [admin](admin-download.png),
  [reviewer](reviewer-download.png). Both images were opened and inspected.
- RuboCop and Reek passed for the changed production Ruby files.

The review's conditional missing-file error concern was checked against
`Api::V1::Hiring::BaseController`, which already handles both record and storage-file
absence. Authorization uses fresh scoped role/employment queries; the locked
Active Record 8.1.4 implementation's `reload` clears its connection-pool query
cache before the second pass. This source review is separate from the required
exact-commit engineering/design/developer-experience reviews.

All runtime checks used synthetic records, a dedicated local PostgreSQL database,
real headless Brave and an outbound-network sandbox allowing localhost only.
These results do not establish CI, production deployment, provider acceptance,
or completion of the remaining Sonam hiring requirements.
