# Actual signing and archive checks

Local synthetic QA on 25 October 2026. Completion/archive checks used Miru `7678d9818b40f2d98dd8edbf440c3da52649ae6b`; expiry/rejection used `c4d2362b2b3b81573865c9d24e6d0966de59f8b5`. Tested provider image: `sha256:4be09d51a2ae0a4462f4a7dc1f593475cc797ae089705134caaa6199acabb7c9`. Brave, a separate Miru database, persistent Solid Queue worker, local Documenso/PostgreSQL and Mailpit were used. Every recipient and document is fictional; no external signature email was sent.

## Completed flows

| Case | Observed result |
| --- | --- |
| Main agreement, SOW and addendum | Two PDFs, three source pages, six signature fields, two signers, one reviewer and CC. Separate anonymous sessions completed the three actionable recipients with their own email codes. |
| Partial completion | After each signer completed, provider status remained PENDING and Miru exposed no archive. The pre-completion download returned 404. CC status carried no signature requirement. |
| Verification and recovery | The first automatic final sync rejected a legitimate eight-page audit whose font dictionaries produced 1.8 MiB of qpdf JSON. A regression reproduced it. A bounded 4 MiB allowance fixed it; CPU, time, memory and other output limits remain. The normal status button then queued real worker jobs and saved all four files before marking Signed. |
| Fresh automatic completion | A second request used cropped pages rotated 90°/270°, all nine field types, another signature on page two, and read-only Unicode text. All eleven fields completed; the actual final callback and worker archived three files automatically. All five callbacks were processed and no queue job failed. |
| Field values | Date `25/10/2026` with Asia/Kolkata and `dd/MM/yyyy`; name, email, initials, `1234.50`, selected checkbox, dropdown, ₹ text and Marathi text survived provider readback and final PDF text extraction. |
| Read-only protection | A valid direct field-change request received 400 with the provider's read-only error. The original value remained unchanged. Earlier malformed probe requests were excluded from this check. |
| Callback authentication/replay | Missing credential returned 401. Sending the same constructed, correctly bound event twice returned 202/202 with one additional worker job. The archive retained the same keys/hashes, four attachments and one creation audit. |
| Actual downloads | Seven editor download buttons and the linked consultant-profile button produced files with the exact archived SHA-256 hashes. Native PDF checks passed on eleven retained provider/UI artifacts, including full-file service seals on every signed PDF. |
| Expiry | A separate request's controlled fixture deadline elapsed. The anonymous mobile link refused signing. The provider's real scheduled sweep emitted RECIPIENT_EXPIRED, and the actual callback worker changed Miru to Expired, cleared the next reminder and exposed no archive. No manual status refresh was used. |
| Rejection | Another anonymous recipient rejected a fresh request with a synthetic reason. The provider returned 200 and showed Document Rejected. All three actual callbacks were processed; Miru became Declined with provider status REJECTED and no archive. |

The expiry fixture changed only its uniquely matched synthetic recipient's deadline in the isolated provider database. The provider's own 15-minute expiry sweep ran at 01:00 UTC; Miru's resulting state was checked at 01:00:34 UTC. Queue checks found no failed jobs. This exercises the real callback path without waiting for the default 90-day signing window.

The first signing flow rejected missing/wrong codes with 401 and accepted the correct code with 200. Its original code widget emitted a CSP error. The final source-built image uses the existing ordinary input, keeps six-digit validation and autocomplete, and completed the second flow's mobile code screen with zero CSP or browser errors. Its empty-code submission stayed disabled.

The first native Brave signing attempt also exposed canvas hit detection failing under privacy-protected pixel reads. The [current upstream-source patch](documenso-signing-compatibility.patch) adds named DOM controls that reuse the provider's field handlers, supports keyboard activation, labels the signature editor, fixes duration formatting and removes the problematic code widget. No browser privacy setting, licence flag, paid plan or CSP rule was changed.

The patch applies to [Documenso source `8707e33`](https://github.com/documenso/documenso/tree/8707e33c124e4b1a68dde92d5e05178c9aabd0be). It includes the earlier countdown change; use this composite patch for the current build. `git apply --check --cached` passed against that clean index, and the complete source image build, including TypeScript checks, passed. Preserve the upstream [licence](https://github.com/documenso/documenso/blob/8707e33c124e4b1a68dde92d5e05178c9aabd0be/LICENSE) and package notices with the source.

Focused validation: **45 PDF/seal/reconciliation examples, zero failures**, then **four real-Brave archive cases, zero failures**. The latter wait for usable card width after viewport resizing. An immediate unsettled mobile capture was excluded and replaced by the settled capture below. Miru's actual download/recovery/profile checks recorded zero browser errors. Expected negative HTTP responses are retained separately from unexpected errors.

The subsequent expiry change passed **57 examples with zero failures**, including five real-Brave cases, reminder deadline races, malformed dates, signed recipients past their deadline, and an archived download four months later after the disposable service certificate expired. Ruby style, Reek, ESLint and normal/test Vite builds passed for that change.

## Inspected evidence

![Verified files and recipient completion in Miru](actual-miru-completed-editor.png)

![Signed documents on desktop](actual-miru-archive-desktop.png)

![Settled mobile archive](actual-miru-archive-mobile.png)

![Mobile email-code screen with no code exposed](actual-email-code-mobile.png)

![Both signatures fit the main agreement](actual-signed-main.png)

![Both signatures fit the addendum](actual-signed-addendum.png)

![Signature placement on the cropped 270-degree page](actual-signed-rotation.png)

![Only the linked document appears on the consultant profile](actual-consultant-archive.png)

![Miru stops reminders for an expired request](actual-miru-expired.png)

![An expired mobile link refuses signing](actual-expired-link.png)

![Miru receives the actual rejection](actual-miru-rejected.png)

![The recipient sees the rejected document](actual-rejected-link.png)

## Rebuilt-provider completion and cancellation recovery

The final rebuilt provider image `sha256:c0801c28ac2dc4bf4e128c992a097dac7ded4422edc5a58ad4f77da490c06a54` ran with Miru backend `09b2cb8d393df5016abaa4ed6fbe1447c7998721`. A pending synthetic request survived the provider upgrade, completed with a mobile signer and a real Mailpit email code, and automatically archived all three files. Code request/final signing returned 200/200 with zero page/CSP errors. All three UI downloads matched the manifest; native checks verified the service seal and all six final pages were inspected. This smoke request assigned one signature field; the earlier rotated request remains the all-nine-field case.

The independent review found that a failed cancellation could not be retried through the UI. The fix derives retryability from the latest cancellation on the server, including when it falls outside the ten-entry displayed history. A browser regression failed first, then passed with history truncation and uncertain-outcome protection. Forty related examples passed; after integrating the latest upstream changes, the whole-branch gate passed **382 examples, zero failures**.

A fresh request then exercised a real provider outage. A guarded 25-second pause caused its first cancellation to fail before mutation, kept editing locked and exposed the enabled retry control. After automatic service restoration, normal UI retry confirmed CANCELLED with one failed preparation and one confirmed cancellation, no archived files and no failed queue jobs. The [security/runtime report](provider-security-checks.md) records scanner findings, source patches, font warnings and probe limits.

![The rebuilt provider completes and archives files automatically](actual-security-image-archive.png)

![The required signature remains inside its approved field](actual-security-signed.png)

![A failed preparation keeps the request locked and allows retry](actual-cancel-retry-enabled.png)

![The normal retry confirms cancellation](actual-cancel-recovered.png)

The final placement polish preserves the visible 24px resize corner and gives it a measured 44×44px hit area at mobile and desktop widths. The old 24px target failed the browser check; three focused placement/drag/resize/page-edge cases then passed with no console errors. Both asset builds and Ruby style checks passed for this polish.

![Mobile placement with the enlarged resize hit area](actual-resize-mobile.png)

## Remaining release checks

The rebuilt image's scan reports zero Alpine findings and two high/three medium Node entries; [remaining findings and reachability limits](provider-security-checks.md) are explicit. The modified Zod version remains scanner-visible despite the tested backport. Production remains on hold.

CodeRabbit, exact-head CI and private release integration remain. The independent whole-branch code review's cancellation finding was fixed and read back. Production HTTPS, provider certificate/storage/SMTP, backup/restore and deployment have not been verified. The certificate used here is a disposable self-signed QA service seal. These checks establish this local workflow and file integrity; they do not establish production operation or public/legal certificate trust.
