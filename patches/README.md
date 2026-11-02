# Dependency security backports

`pnpm audit` still reports the advisories below. CI preserves the unfiltered JSON
and accepts only these exact versions after checking every installed copy's
package metadata and runtime-file SHA-256 hashes and running exploit regressions.
All active minimatch and deepmerge copies are checked even on a clean report;
fixed minimatch 11.0.3 is attested separately from advisory exceptions.
Unknown advisories, changed severity/version/files, muted findings, inconsistent
totals, missing installs, and audit/network errors fail CI. No CVE is ignored in
the package manifests. These are local remediation attestations, not upstream
fix releases or a claim of zero audit findings.

- [minimatch GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249):
  backport the expansion bound and large-set deduplication bound from MIT
  minimatch 11.0.3 to 10.2.6 in both CJS and ESM bundles. Preserve makeRe and
  RegExp-based set entries required by older callers. Version 3.1.5 is included
  in the advisory database's broad version range but has neither the affected
  level-2 optimizer nor its preprocessing API; its exact source is attested and
  its callable export is tested. It is not replaced with incompatible v11.
- [deepmerge GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4):
  exclude `__proto__` keys unconditionally in the target and source copy loops of
  4.3.1's CJS and UMD bundles, following MIT upstream [PR 274](https://github.com/TehShrike/deepmerge/pull/274).
  This prevents returned-object prototype poisoning with null-prototype targets,
  null nested placeholders, and a malicious target. No upstream fixed release
  exists. Array merge, cloning, symbols and ordinary matching remain checked.
- deepmerge 2.2.1 (web Formik dependency): apply the same unconditional
  `__proto__` exclusion to its CJS, ES and UMD bundles. Formik requires `^2.1.1`,
  and neither `pnpm audit` nor Snyk reports this version, but unpatched 2.2.1 still
  returns an object with a poisoned prototype. Its exact source is attested and
  exploit-tested like the other backports.

Run hoisted mobile installs from `apps/mobile` itself. pnpm 9's `--dir` install
can write a nested patched package into the caller's node_modules on a repeated
install; the security tests reject that incomplete copy rather than ignoring it.

Review owner: Miru maintainers. Revisit on dependency upgrades and new advisories;
remove each attestation when a supported upstream release fixes it while
preserving the required caller API. Do not refresh hashes without reviewing the
source change and rerunning regressions and web/docs/mobile compatibility builds.
