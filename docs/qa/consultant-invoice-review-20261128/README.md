# Consultant invoice review screenshots

Captured on 28 November 2026 in anonymous Brave against an isolated local test app with synthetic people, documents and bank evidence. The test clock is fixed to 5 December 2026. These are not production screenshots or evidence of a real payment.

The app inputs match UI commit `68e5a8a206597aea17f886faf39d3f72b370374c`. The corresponding run passed 22 browser examples with console-error and private-download assertions. PDF contents in these UI cases use the existing synthetic renderer fixture; real PDF rendering is verified separately.

| Screenshot | State |
| --- | --- |
| [Own save](own-save-fields-disabled-1440.png) | The submitting form's fields are disabled while its request is pending. |
| [Own draft after 503](own-draft-retained-after-503-1440.png) | A failed refresh preserves the consultant's draft and blocks submission pending a successful read. |
| [Sibling draft after 503](sibling-draft-retained-after-503-1440.png) | Another consultant's draft remains available after a failed manager refresh. |
| [Entity change](own-entity-binding-reset-1440.png) | Changing the approved contracting entity clears the previous entity's draft. |
| [Remittance history, desktop](remittance-history-1440.png) | Replacement bank evidence retains earlier documents. |
| [Remittance history, mobile](remittance-history-375.png) | The same evidence history at a 375-pixel viewport. |
