# Integrated release CI fixes

Follow-up to published candidate `b35b465b1` in [PR #2493](https://github.com/saeloun/miru-web/pull/2493). That candidate passed 6,127 local backend examples (59 pending) and 199 native Brave examples, but its first remote checks exposed three distinct failures.

## Fixes

- **Security audit:** Rails 8.1.4 was affected by the [21 issues fixed in the official 8.1.4.1 security release](https://rubyonrails.org/2026/11/4/Rails-8.0.5.2-and-8.1.4.1-have-been-released). The minimum is now `~> 8.1.4.1`; only the 13 Rails-family gems changed version. The existing locked sanitizer meets the new Action View constraint. The configured image processor remains vips; no unrelated image dependency, JavaScript package or workflow changed. Bundle install/check, application boot and the original `bundler-audit check --update` pass with no vulnerabilities found.
- **Reek:** 14 warnings across nine model/service files are resolved by extracting cohesive validation, transition, invitation and deletion steps. Existing company/application/user locks, validation order, replay responses, audit context, cleanup transaction and after-commit enqueue remain in place. No quality threshold, exclude or suppression was added. The exact repository-wide Reek command now reports zero warnings.
- **CodeQL test fixtures:** seven Google endpoint stubs now anchor and escape their hostname/path patterns. Three nested synthetic bank fixtures reuse a Faker-backed FactoryBot trait, with exact parsed CSV-cell assertions and existing full-body denial checks retained. The model's encrypted JSON persistence and its existing raw-column/audit encryption regression remain unchanged. These fixture findings were not proof of a production plaintext leak. No query was suppressed or dismissed; the next remote scan must establish clearance.

## Verification

Focused patched-Rails runs pass: root invitation/onboarding/concurrency/pipeline/retention **101**, related hiring model/service/request **195**, fixture/calendar/report/CLI **52**, existing raw-column/audit encryption **one**, and mail/storage/session compatibility **67** examples. Counts overlap and must not be summed. Changed-file Rubocop and whitespace checks pass. Full-application Brakeman reports **zero warnings and zero errors**.

The final patched-Rails repeats pass **6,127 non-system backend examples, zero failures, 59 pending** (5 minutes 46 seconds), and **199 native Brave examples, zero failures** (7 minutes 1 second). The pending contracts remain incomplete. No frontend source or dependency changed; the compiled UI and published screenshot bytes remain the original checkpoint's, with the updated server exercised by the browser repeat.

The version guidance was updated and read back at [dependency-security.md:19](../../ai/dependency-security.md#L19) and [Docker setup:11](../../contributing-guide/setup/docker.md#L11), also line 62. Other dependency instructions, approved audit exceptions and workflow gates were preserved.

The old committed engineering/design/devex reports retain their original `b35b465b1` checkpoint. Fresh whole-branch reviews of this follow-up are being recorded separately, including dependency/source fingerprints and exact final-commit binding. No old clean entry authorizes a changed commit.

Source identity: [follow-up manifest](ci-security-source-SHA256SUMS-20261108.txt). Logs are retained locally as `/tmp/miru-2493-rails-patched-whole-backend-20261108.log`, `/tmp/miru-2493-rails-patched-browser-20261108.log`, `/tmp/miru-2493-reek-full-green-20261108.log` and `/tmp/miru-pr2493-rails-security-audit-raw-green-20261108.log`.

All 25 published synthetic screenshot URLs at the original candidate returned HTTP 200 and matched their recorded bytes; the follow-up changes no frontend source or screenshot. The production origin/image, private configuration parity, real provider accounts/transfers, monitoring, backup recovery and compliance remain separate unverified release requirements. No production action was taken here.
