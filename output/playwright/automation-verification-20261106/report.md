# Automation help verification, 2026-11-06

## DEBUG REPORT

Symptom: Both English and Hindi browser tests expected `miru login --email you@example.com --password password` and failed.

Root cause: Security change `3733fec3a` removed that example. The current Go CLI explicitly rejects `--password` at `tools/miru-cli/cmd/miru/main.go:200`; the automation page correctly advertises the email-only command.

Fix: Update both existing examples to match the exact `<code>` command and reject password flags inside command blocks. Preserve the localized headings and existing invoice-list check. Only the Ruby spec changes; product and CLI source are unchanged.

Evidence: Native Brave/Cuprite with CSRF protection, synthetic users, a dedicated local test database and a localhost-only network sandbox.

- Before: 2 examples, 2 failures at the obsolete command assertions.
- After: 2 examples, 0 failures, exit 0.
- RuboCop: 1 file inspected, no offenses.
- `git diff --check`: passed.
- Both screenshots were visually inspected: [English](automation-english.png), [Hindi](automation-hindi.png).

Regression test: `spec/system/settings/automation_spec.rb` verifies the supported command is present and the removed argument is absent in both locales. It does not authenticate a CLI session or establish provider/production readiness.

Related: The broader general browser rerun was still active when this focused report was written. No full-suite result is inferred from the two-example pass. Existing exact-head release-review requirements remain unsatisfied.

Status: DONE_WITH_CONCERNS. Focused correction verified; broader browser and release checks remain separate.
