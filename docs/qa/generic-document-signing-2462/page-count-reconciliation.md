# Signed document page-count reconciliation

Follow-up to #2462 and merged PR #2475, based on develop `10e457e1d`.

A valid provider seal did not prevent Miru from accepting a completed PDF with
fewer pages than its approved source. Two regressions reproduced this on the
unchanged service: a truncated document, and a later truncated document after
an earlier file had been staged.

`Signatures::Reconcile#stage` now requires each signed item's parsed page count
to be at least that document's immutable approved source count before creating
its archive blob. Fewer pages use the existing `verification_failed` path. The package stays
unpublished, earlier staged blobs are purged, and no signed-archive audit is
created. Certificate and audit PDFs retain their independent validation. Already
archived revisions are unchanged. Additional pages remain permitted because
Documenso can append certificate and audit pages before sealing.

## Local verification

- Unchanged reconciliation/seal baseline: **24 examples, 0 failures**.
- New regressions before the fix: **2 examples, 2 failures**; reconciliation
  incorrectly returned success in each case.
- Reconciliation/seal checks after the fix: **27 examples, 0 failures**.
- All signing services, signing API requests and the Documenso webhook:
  **187 examples, 0 failures**.
- After adding a physical-storage cleanup assertion, all **23 reconciliation
  examples pass**; the first staged file no longer exists after the second fails.
- RuboCop: three files inspected, no offenses. Reek and direct diff checks pass.

The regressions use real 25-page original PDFs, the existing real two-page sealed
provider output, and native PDF/seal verification. A separate positive case
allows more output pages than source pages. Page counts
and seal results are not stubbed. Provider HTTP is stubbed; records and keys are
synthetic, the database is isolated, and outbound network is denied except
localhost. No external signature email or production request was sent.

## Provider contract and limits

The pinned [item download route](https://github.com/documenso/documenso/blob/8707e33c124e4b1a68dde92d5e05178c9aabd0be/apps/remix/server/api/download/download.ts)
uses the [stored-file handler](https://github.com/documenso/documenso/blob/8707e33c124e4b1a68dde92d5e05178c9aabd0be/apps/remix/server/api/files/files.helpers.ts).
The signed-item API serves stored bytes without appending a certificate during
download. However, the pinned [seal handler](https://github.com/documenso/documenso/blob/8707e33c124e4b1a68dde92d5e05178c9aabd0be/packages/lib/jobs/definitions/internal/seal-document.handler.ts)
can append certificate and audit pages before sealing according to team settings.
An exact-count check would reject legitimate output. Claude's source-only
second opinion raised this compatibility concern; the pinned implementation
confirmed it, so the final guard uses a minimum count. No clean council review
is claimed. The existing actual-provider fixture retains the source's two pages
and a full-file service seal.

Equal or greater page counts do not prove semantic fidelity or detect every
removed page when evidence pages replace it. Existing envelope, original
byte, recipient, field, seal and archive-hash checks remain necessary. A live
provider acceptance run, historical archive audit, Hetzner commissioning and
required release reviews remain outside this local verification.
