# Signing service dependency and runtime checks

Local synthetic QA, 25 October 2026. Source base: [Documenso 8707e33](https://github.com/documenso/documenso/tree/8707e33c124e4b1a68dde92d5e05178c9aabd0be). Tested Linux arm64 image: `sha256:c0801c28ac2dc4bf4e128c992a097dac7ded4422edc5a58ad4f77da490c06a54`, Node 24.22.1 and Alpine 3.23.7. Production commissioning remains on hold.

## Changes and proof

- Updated compatible dependencies, including Nodemailer 10.2.1, sharp 0.35.5, body-parser, follow-redirects, undici and nested Zod 4. See the [mail release](https://github.com/nodemailer/nodemailer/releases/tag/v10.2.1) and [sharp advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). MailChannels now uses Nodemailer's parsed addresses/envelope and current callback types. A real local custom-HTTP transport check covers grouped recipients, CC/BCC, replies, headers, content and failures.
- Backported the [upstream constrained-collection fix](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd) to both module formats of Zod 3.25.76 and bundled `zod/v4`. The unpatched capped 20,000-element array produced 20,001 issues. All four installed-runtime variants now produce one issue and parse zero elements. Checks cover async parsing, sets/maps where supported, custom messages, nested paths, preprocessing, leading rewrites and valid unbounded collections. The package version remains scanner-visible.
- Pinned `qs` 6.16.0 and repaired its lockfile with npm 12.2.1: npm 11's lock-only install had retained 6.14.2 despite the override. The final image's actual installed version and comma/null-array serialization were checked; changing the manifest alone was not counted as a repair.
- Removed npm/npx and their bundled tooling from the runtime after installation/client generation. Startup invokes installed Prisma directly, exits on migration failure and runs the server with `exec`. An isolated refused database connection returned P1001/exit 1 before server startup. Normal migration/startup and `/api/health` returned 200.
- Retained the upstream seven-day package-age configuration. A one-off lock-resolution exception accepted the explicitly verified October 22 mail release; no persistent age-policy or peer-dependency bypass was added.

The [security patch](documenso-security-hardening.patch) and [signing compatibility patch](documenso-signing-compatibility.patch) apply separately to the pinned base; both passed `git apply --check --cached`. Apply both before building `docker/Dockerfile`. The security patch includes patch-package and assert-based build checks. The complete image build, TypeScript checks and final-runtime Zod checks passed. Preserve upstream licences and package notices with the corresponding source.

## Remaining scanner findings

Trivy 0.76.1's official release checksum was verified. Its current vulnerability database scanned an export of the exact image with no ignore file or suppression:

| Scope | High | Medium |
| --- | ---: | ---: |
| Alpine packages | 0 | 0 |
| Node packages | 2 | 3 |

The Node findings are modified-version Zod, `deepmerge-ts` 7.1.5, two `postcss-selector-parser` instances and `ts-deepmerge`. The production npm audit reports six high/seven moderate metadata entries, including transitive dependants; those are not thirteen independent vulnerabilities.

The locked `deepmerge-ts` caller is `@prisma/config` 6.19.3, retained for trusted startup configuration; no application TypeScript import was found. The `ts-deepmerge` chain supplies the static API V1 contract in [openapi.ts](https://github.com/documenso/documenso/blob/8707e33c124e4b1a68dde92d5e05178c9aabd0be/packages/api/v1/openapi.ts). These observations are reachability evidence, not removal of vulnerable code. PostCSS exposure, including email rendering, still needs assessment or repair before commissioning a public provider. No zero-vulnerability or production-security claim is made.

## Actual workflow after rebuilding

A pending fictional request survived the provider image change and completed with an anonymous mobile signer and a real local email code. Code request and final signing returned 200/200, with zero page errors and zero CSP errors. Actual callbacks and the persistent Miru worker archived all three files automatically, with no status-refresh operation or failed queue job.

All UI downloads matched their immutable manifest hashes. Native PDF checks verified the complete-file service seal on the two-page signed PDF, the one-page separate certificate and the three-page audit. All six rendered pages were inspected; original text and the typed signature remained readable and inside their fields. Poppler emitted Type 3 glyph bounding-box warnings during rasterization; the result is not described as warning-free.

A separate fresh request exercised recovery through a controlled 25-second pause of only the local provider, with an independent automatic restoration guard. Cancellation failed in `preparing` with `provider_unavailable`, preserved the lock and enabled safe retry. A normal UI retry then confirmed provider/Miru CANCELLED, with one failed preparation and one confirmed cancellation, zero archived files and zero failed queue jobs. An initial 18-second wait expired before the polling update; authoritative reads and the visibly enabled control subsequently established recovery.

See the [actual workflow report and inspected screenshots](actual-signing-and-archive.md). Recipients are fictional and SMTP is Mailpit. Production TLS/storage/SMTP, backup/restore, public certificate trust and production deployment remain unverified.
