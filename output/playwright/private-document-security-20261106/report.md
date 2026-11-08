# Private document access verification, 2026-11-06

Local candidate: `feature/sonam-release-integration-20261104`, based on `3a2fb3167` plus the source fingerprints in `SHA256SUMS`.

## Change and boundary

Salary slips and tax evidence now recheck the actor, workspace, policy, and attachment after storage returns bytes. Employee documents use the same final workspace check. Storage I/O remains outside the user lock. Missing salary attachments return the existing private 404 instead of an empty successful PDF. Denied downloads do not create successful-download audits.

The shared check restores an authenticated CLI session's virtual workspace after the user reload, without changing the browser's persisted default. Existing narrower tax/employee policies remain in force. When authentication revokes an invalid CLI token, the revocation commits before returning 403; restoring the role cannot reactivate that token.

## Native verification

All commands used the dedicated local `miru_private_downloads_test_20261104_abdd` database. A macOS network sandbox denied external traffic and allowed localhost. Synthetic users and the existing fixture PDF were used. No live email, payroll transfer, or provider request was made.

| Check | Result |
| --- | --- |
| Salary-slip, tax-declaration and employee-record request specs; salary-slip and employee-record policies; CLI model and request specs; salary email job and mailer | 139 examples, 0 failures |
| Salary-slip, tax-declaration and employee-record responsive system specs, native Brave/Cuprite, port 3130 | 23 examples, 0 failures |
| Durable CLI revocation regression after formatting correction | 3 examples, 0 failures |
| Employee-record and durable CLI revocation specs after adding the positive employee CLI assertion | 25 examples, 0 failures |
| RuboCop, all eight changed Ruby files | 8 files inspected, no offenses |
| `git diff --check` | Pass |
| Reek, four changed controllers/concerns | One existing `TaxDeclarationsController#create` statement-count warning; that action is unchanged |

New request coverage exercises real storage downloads while changing roles, employment, workspace, slip publication, and attachment identity. It checks denial, absence of PDF data, and absence of a successful audit. Positive CLI cases retain legitimate access. The three durable-revocation cases deliberately run without the suite's enclosing transaction to expose rollback of authentication side effects.

[Claude's bounded source review](claude-review.md) found no P1/P2 issues. Its lower-priority questions were checked against database cleanup configuration and existing employee-document regressions; the positive employee CLI path was added to the existing successful-download test and passed.

The initial failing cases were reproduced on November 4 before the repairs. This report records fresh November 6 green runs; the old temporary red-run logs are no longer available. These are native test results, not a formal gstack QA pass or an exact-head council review.

## Screenshots

All five captures were visually inspected. They show synthetic employee-record and report flows at desktop/mobile widths. They are UI evidence, not proof of the request-level revocation races.

- [Staff record with masked bank details](employee-records-staff.png)
- [Administrator mobile record](employee-records-admin-mobile.png)
- [Desktop report editor](employee-report-editor-desktop.png)
- [Mobile report editor](employee-report-editor-mobile.png)
- [Saved mobile report](employee-report-saved-mobile.png)

## Release limitations

The broad suite is not claimed green: an earlier run stopped on the project-member modal's Save Members expectation. Current local fixes are unpublished. Razorpay/Mercury production onboarding, live transfers, and deployed document checks remain unverified. The exact-head council review is still required before publication. No claim of complete Indian tax coverage, official Form 16/ITR filing, SOC 2, or HIPAA compliance is made.
