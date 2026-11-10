# Synthetic document approval and signing evidence

These original screenshots show isolated private QA source `aac16b12d2fa341edd7ef84a2844f9522f19a309`, containing the same ReviewPanel correction. They are not production captures. Both reviewers inspected them for visible credentials; only fictional `.invalid` identities and clearly marked synthetic PDFs appear. No images were edited.

- `miru-draft-1440.png`: two uploaded PDFs, three editable required fields and email-code recipient verification.
- `miru-approved-1440.png`: the same version approved with long synthetic evidence.
- `private-archive-1440.png` and `private-archive-375.png`: two signed PDFs, certificate and audit-file controls on desktop and settled mobile layouts.

The real self-hosted provider journey completed approval, email-code signing, manual reconciliation and private archival. Both signed PDFs passed full-file CMS verification against the trusted QA seal and independent Poppler verification. All four downloaded files matched their recorded sizes and SHA256s on desktop and settled mobile; anonymous downloads returned 401. The QA API key was revoked and owned processes/forwards closed. A test seal is not a legal-certification claim.

The overall QA charter remains **BLOCKED**, with earlier setup failures retained, an immediate-resize mobile click targeting the wrong file not causally resolved, and authenticated download-header verification incomplete. Screenshots prove UI states; cryptographic checks are separate recorded evidence. No production deployment, fully green charter or whole-app security claim follows.

Focused regression verification separately reproduced React error 185 with long synchronous input before the fix. Short and normal-keyboard controls passed before the fix. The initial corrected signing suite passed 21 examples. After adding independent fresh approval cases at 375px and 1440px, the affected suite passed 22 examples with zero console errors. Development/test Vite builds passed. The runtime correction only keys dirty notifications to the existing Boolean state; authentication, approval digests, provider calls and cleanup semantics are unchanged.

A later negative control ran those same two current approval cases against the old implementation at `2cd6557fd22b9a785c6ed42204067326946667da`: both failed with React error 185 during approval-evidence input, at 375px and 1440px. All 1,970 application files matched the corrected public source except ReviewPanel's Boolean dependency change. The old test assets were rebuilt and bound to their manifest; no assertions, input events or response handlers were modified. The existing cases therefore distinguish the old behavior without a duplicate notification-counter test.
