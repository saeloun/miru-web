# Signing service dependency and runtime checks

Local synthetic QA, 25 October 2026. Source base: [Documenso 8707e33](https://github.com/documenso/documenso/tree/8707e33c124e4b1a68dde92d5e05178c9aabd0be). Tested Linux arm64 image: `sha256:9309cef4bf702348b3bcc96b4e1625e9d2312f4e87cf546847f7d41602994306`, Node 24.22.1 and Alpine 3.23.7. Production commissioning remains on hold.

## Changes and proof

- Updated compatible dependencies, including Nodemailer 10.2.1, sharp 0.35.5, body-parser, follow-redirects, undici and nested Zod 4. See the [mail release](https://github.com/nodemailer/nodemailer/releases/tag/v10.2.1) and [sharp advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). MailChannels now uses Nodemailer's parsed addresses/envelope and current callback types. A real local custom-HTTP transport check covers grouped recipients, CC/BCC, replies, headers, content and failures.
- Backported the [upstream constrained-collection fix](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd) to both module formats of Zod 3.25.76 and bundled `zod/v4`. The unpatched capped 20,000-element array produced 20,001 issues. All four installed-runtime variants now produce one issue and parse zero elements. Checks cover async parsing, sets/maps where supported, custom messages, nested paths, preprocessing, leading rewrites and valid unbounded collections. The package version remains scanner-visible.
- Pinned `qs` 6.16.0 and repaired its lockfile with npm 12.2.1: npm 11's lock-only install had retained 6.14.2 despite the override. The final image's actual installed version and comma/null-array serialization were checked; changing the manifest alone was not counted as a repair.
- Updated `deepmerge-ts` and `ts-deepmerge` to 8.0.0 and deduplicated Typography's old selector parser to the patched 6.1.5. The branding sanitizer retains 7.1.6. Actual Prisma-resolved CommonJS and ESM cyclic merges, reserved prototype methods and a 12,000-class selector pass five build/runtime guards, including the real OpenAPI schema consumer.
- The first dependency-upgraded image built but failed actual startup: `@anatine/zod-openapi` 1.14.2 still called the removed default export. The added consumer check reproduced the failure; the patch switches its 21 calls to the named `merge` export. Actual patch-package installation, the complete corrected source build and startup passed. Both served OpenAPI contracts are unchanged: v1 has 13 paths and v2 has 89.
- Removed npm/npx and their bundled tooling from the runtime after installation/client generation. Startup invokes installed Prisma directly, exits on migration failure and runs the server with `exec`. An isolated refused database connection returned P1001/exit 1 before server startup. Normal migration/startup and `/api/health` returned 200.
- Retained the upstream seven-day package-age configuration. One-off package-specific exceptions accepted the explicitly verified October 22 mail release and October 19 selector-parser backport. Exact package tarball SHA-512 values matched the registry and pack metadata; no persistent age-policy change or new peer-dependency bypass was added.

The [security patch](documenso-security-hardening.patch) and [signing compatibility patch](documenso-signing-compatibility.patch) apply separately to the pinned base; both passed `git apply --check --cached`. Apply both before building `docker/Dockerfile`. The security patch includes patch-package and assert-based build checks. The complete image build, TypeScript checks and final-runtime Zod checks passed. Preserve upstream licences and package notices with the corresponding source.

## Remaining scanner findings

Trivy 0.76.1's official release checksum was verified. Its current vulnerability database scanned an export of the exact image with no ignore file or suppression:

| Scope | High | Medium |
| --- | ---: | ---: |
| Alpine packages | 0 | 0 |
| Node packages | 1 | 1 |

The two remaining Node findings are Zod 3.25.76 and `postcss-selector-parser` 6.1.5. npm 12.2.1 audit of the exact corrected image reports three high/four moderate metadata entries, including transitive dependants of those two packages. These counts do not represent seven independent vulnerabilities; no findings were suppressed.

Zod retains its package version after the tested four-entrypoint source backport described above. For the parser, the [maintainer advisory explicitly lists 6.1.5 and 7.1.6 as patched](https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf); the scanner catalog lists only 7.1.6. The installed parser guard checks the patched version and preserves the complete selector AST/string. Both findings remain visible in the receipts. No zero-vulnerability or production-security claim is made.

## Actual workflow after rebuilding

A new request on Miru `43fc084c9` completed against the corrected image above: upload, approval, durable send, anonymous 375px signing, local email verification and automatic callback/job archival. All three signing POSTs returned 200, with zero page/CSP errors. The three UI downloads matched their manifest hashes; native checks verified the complete-file service seal on the two-page signed PDF and parsed the one-page certificate and three-page audit. All six rendered pages were inspected. See the [completed archive](actual-upgraded-provider-archive.png).

Three historical editor downloads retained their hashes after the upgrade. The new signed source page keeps the signature inside the original block; Poppler emitted five font warnings across the six rendered pages. Only the fictional source page and Miru archive screenshot are published; certificate/audit QR pages stay in the private QA artifacts.

The initial v2 contract fetch was truncated while the local Docker VM had only 90 MiB free. Removing eight exact owned, unshared build-cache records restored 2.8 GiB; the same endpoint then returned its unchanged full contract. No application data, volume or running image was removed. This is local resource-recovery evidence, not a production capacity test.

A pending fictional request survived the provider image change and completed with an anonymous mobile signer and a real local email code. Code request and final signing returned 200/200, with zero page errors and zero CSP errors. Actual callbacks and the persistent Miru worker archived all three files automatically, with no status-refresh operation or failed queue job.

All UI downloads matched their immutable manifest hashes. Native PDF checks verified the complete-file service seal on the two-page signed PDF, the one-page separate certificate and the three-page audit. All six rendered pages were inspected; original text and the typed signature remained readable and inside their fields. Poppler emitted Type 3 glyph bounding-box warnings during rasterization; the result is not described as warning-free.

A separate fresh request exercised recovery through a controlled 25-second pause of only the local provider, with an independent automatic restoration guard. Cancellation failed in `preparing` with `provider_unavailable`, preserved the lock and enabled safe retry. A normal UI retry then confirmed provider/Miru CANCELLED, with one failed preparation and one confirmed cancellation, zero archived files and zero failed queue jobs. An initial 18-second wait expired before the polling update; authoritative reads and the visibly enabled control subsequently established recovery.

See the [actual workflow report and inspected screenshots](actual-signing-and-archive.md). Recipients are fictional and SMTP is Mailpit. Production TLS/storage/SMTP, backup/restore, public certificate trust and production deployment remain unverified.
