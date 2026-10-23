# Dependency security maintenance

Updated 23 October 2026. Run all checks from the repository root:

```sh
rtk mise exec -- bundle exec bundler-audit check --update
rtk mise exec -- bundle exec ruby-audit check
rtk mise exec -- bundle exec brakeman -q -w2
rtk mise exec -- pnpm audit
rtk mise exec -- pnpm --dir docs audit
rtk mise exec -- pnpm --dir apps/mobile audit
```

CI runs these checks in the security-audit job. Brakeman was already present; it is
upgraded to 8.1.0. Keep its warnings visible and fix actionable findings.

## Runtimes and package compatibility

- Rails 8.1.4; Ruby 4.0.9 across mise, Gemfile, Docker, and CI.
- Node 24.22.1 LTS across local version files, mise, Docker build arguments, and CI.
  Legacy NodeSource Docker recipes select the Node 24 line and may receive newer patches.
- pnpm 9.15.9; mise uses the npm backend so pnpm runs on the configured Node runtime.
- Go 1.26.10 for the CLI, with the toolchain recorded in go.mod.

Ruby 4.0.9 includes the [regexp compilation fixes](https://www.ruby-lang.org/en/news/2026/10/23/regexp-fixes-for-gitlab-cves/)
underlying GitLab CVE-2026-89078, CVE-2026-93577, CVE-2026-97229, and
CVE-2026-110264. These affect compilation of attacker-controlled patterns;
`Regexp.timeout` does not protect compilation. Ruby 4.0.7 lacks two of these
fixes, even though the Ruby advisory scanner currently reports no findings.

The official `ruby:4.0.9-slim` image was not published at verification time.
All Docker recipes compile the official release archive on Debian trixie,
verify its SHA256, and copy the runtime into a separate image without build
tools. Their smoke checks verify the exact Ruby version, OpenSSL, YAML, zlib, and
YJIT availability. Kamal's build arguments match Ruby 4.0.9 and Node 24.

The existing brace-expansion CommonJS compatibility patches now target 5.0.12.
Mobile keeps React and React DOM at 19.1.0, matching Expo SDK 54 / React Native
0.81.5's embedded renderer. Expo's [compatibility guidance](https://expo.dev/changelog/mitigating-critical-security-vulnerability-in-react-server-components)
requires this pairing; the affected RSC packages are not installed in this app.
Mobile Metro 0.83.3 is patched to use image-size 2.0.3's named export and buffer
API, preserving path-based asset loading. Its compatibility check exercises a
real image buffer, a file path, and the empty-file rejection:

```sh
rtk mise exec -- pnpm --dir docs check:brace-expansion
rtk mise exec -- pnpm --dir apps/mobile check:dependencies
```

## Approved audit exceptions

The user approved ignoring advisories without published fixes on 22 October 2026.
Only the exact CVEs below are ignored through each package.json's
`pnpm.auditConfig.ignoreCves`. Registry failures and other severities still fail CI.
These exceptions acknowledge remaining vulnerabilities; they do not repair them.

| CVE / advisory | Package and affected scope | Reason / removal condition |
| --- | --- | --- |
| [CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 in web, docs, and mobile build tooling | No patched release. Keep glob patterns trusted. Remove the exception when a patched compatible release or replacement is available. |
| [CVE-2026-85393 / GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 through Expo CLI certificate tooling | No patched release. Do not accept untrusted signing material. Remove after a patched release and Expo export verification. |

Review these exceptions by 22 November 2026 and during every dependency update.
Unfiltered registry findings fell from 33 to 1 for web, 40 to 1 for docs, and 37
to 2 for mobile. The remaining four findings are the two CVEs listed above.
The sprintf-js advisory CVE-2026-97058 was withdrawn on 22 October 2026;
its temporary exception was removed after refreshing the registry audit.

The old bundler-audit exception for CVE-2026-38969 was removed: its CVE record
was withdrawn because further investigation found it was not a security issue.
There are no gem-audit or Brakeman suppressions added by this maintenance.
