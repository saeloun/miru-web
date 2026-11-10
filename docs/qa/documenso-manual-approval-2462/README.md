# Synthetic document approval and signing evidence

These original screenshots show isolated private QA source `aac16b12d2fa341edd7ef84a2844f9522f19a309`, containing the same ReviewPanel correction. They are not production captures. Both reviewers inspected them for visible credentials; only fictional `.invalid` identities and clearly marked synthetic PDFs appear. No images were edited.

- `miru-draft-1440.png`: two uploaded PDFs, three editable required fields and email-code recipient verification.
- `miru-approved-1440.png`: the same version approved with long synthetic evidence.
- `private-archive-1440.png` and `private-archive-375.png`: two signed PDFs, certificate and audit-file controls on desktop and settled mobile layouts.

The real self-hosted provider journey completed approval, email-code signing, manual reconciliation and private archival. Both signed PDFs passed full-file CMS verification against the trusted QA seal and independent Poppler verification. All four downloaded files matched their recorded sizes and SHA256s on desktop and settled mobile; anonymous downloads returned401. The QA API key was revoked and owned processes/forwards closed. A test seal is not a legal-certification claim.

The overall QA charter remains **BLOCKED**, with earlier setup failures retained, an immediate-resize mobile click targeting the wrong file not causally resolved, and authenticated download-header verification incomplete. Screenshots prove UI states; cryptographic checks are separate recorded evidence. No production deployment, fully green charter or whole-app security claim follows.

Focused regression verification separately reproduced React185 with long synchronous input before the fix. Short and normal-keyboard controls passed before the fix. The corrected affected signing suite passed21 examples with zero console errors, and development/test Vite builds passed. The runtime correction only keys dirty notifications to the existing Boolean state; authentication, approval digests, provider calls and cleanup semantics are unchanged.
