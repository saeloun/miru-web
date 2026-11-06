# Employee report access verification — 6 November 2026

## DEBUG REPORT

- **Symptom:** A private employee CSV could be returned after the requester or an exported employee lost access during generation, or after its saved report was deleted.
- **Root cause:** The report action authorized only before generating the CSV. Private document actions already used a final actor/workspace check, but reports did not.
- **Fix:** Build the CSV outside locks. Reuse `with_download_workspace` to refresh the actor/CLI context, reauthorize, refind the report in the company scope and verify that every exported employment remains permitted before creating the download audit and preparing the attachment. The service exposes frozen IDs from the same bounded rows it exports.
- **Evidence:** **51 focused examples, 0 failures**; **10 native browser examples, 0 failures**; **5,714 full non-system examples, 0 failures, 59 pending**. Four changed Ruby files pass RuboCop and whitespace checks.
- **Regression tests:** `employee_reports_spec.rb` covers post-generation changes and unchanged CLI success; `payroll_document_cli_revocation_spec.rb` verifies durable CLI revocation outside the enclosing test transaction.
- **Related:** Sonam [#2461](https://github.com/saeloun/miru-web/issues/2461); existing private PAN, salary-slip and tax-evidence download guards.
- **Status:** **DONE_WITH_CONCERNS** locally. Production verification and publication remain incomplete.

## What was executed

Seven new negative request cases failed against the original action with HTTP 200: cookie workspace, admin role, actor employment, target employment, target role, deleted report and CLI role invalidation during real CSV generation. Each hook confirmed that the synthetic bank value was in the generated CSV before changing access. The corrected action returns JSON 403/404, withholds that value, and creates no download audit.

The additional CLI workspace regression first proves an unchanged CLI export succeeds. A second request changes the globally selected workspace after generation and must return 403 without a second audit. The token remains valid for its company. This preserves the existing HR policy requiring the DB-selected workspace, rather than broadening CLI permissions. Its initial expected-success assumption was corrected after reading that policy; reintroducing the original controller only in a separate process then produced **1 example, 1 expected failure** at the denial assertion.

The CLI invalidation case uses the existing deletion-strategy request group, so the lock transaction actually commits. It verifies that a role-invalidated token is revoked, then restores the role and confirms the token still cannot authenticate.

Final checks:

| Selection | Result |
| --- | --- |
| Employee reports, CLI document revocation, report sources and employee records | 51 examples, 0 failures |
| Existing employee-record desktop/mobile browser workflow | 10 examples, 0 failures, 17.43s |
| Full backend excluding `spec/system/**/*` | 5,714 examples, 0 failures, 59 pending, 4m56.8s |
| Four changed Ruby files | RuboCop clean |

The full backend and browser runs used separate owned synthetic PostgreSQL databases. Outbound traffic was denied except localhost. Normal runs loaded no old-controller or mutation helper. No production data, actual email, provider payment or secret refresh was used.

## Browser evidence

The native Brave suite exercised staff information/bank edits, private documents, admin salary and manual payments, saved report edits, actual CSV downloads on desktop/mobile, reminder settings, role/workspace denial and private-state reset. Existing console-error checks passed. The desktop report editor and saved mobile report images were inspected; no layout code changed.

Five synthetic screenshots are local at `/tmp/miru-employee-csv-browser-20261106/`:

- `employee-records-staff.png`
- `employee-records-admin-mobile.png`
- `employee-report-editor-desktop.png`
- `employee-report-saved-mobile.png`
- `employee-report-editor-mobile.png`

They have not been uploaded or committed in this unit. No published screenshot link is claimed. Current personal Brave access remains blocked: browser inventory reports its access host unavailable; native app selection by the installed path reports `cgWindowNotFound`. These local tests do not establish authenticated production behavior.

## Scope and review

The guard validates access before preparing a response. It does not make every HR value or report-definition column a serializable snapshot, or promise that bytes reach the client before any later revocation. The download audit denotes authorized response preparation. CSV generation remains outside the actor lock; final employee-scope validation is one bounded query over the actual exported IDs.

The existing selected-workspace requirement, role rules, CSV formula handling and 2,000-person bound remain unchanged. `EmployeeReportsController` is the only application caller of this generator. Rails 8.1.4's actor reload clears query cache; the target relation is rebuilt for the final check.

Local Qwen completed an advisory response. Unproven suggestions about count comparison and after-action delivery guarantees were not applied. Fresh tools-disabled Claude source consultation returned `NO_FINDINGS`; it is not execution evidence or council approval.

The pre-existing scope guard belonged to another task and was preserved. Functional changes are confined to the report action, generator and two request-spec files; this report is the fifth changed file. No production deployment, DNS/monitoring change, code push, GitHub review reply or claim of SOC 2/HIPAA compliance is made.

## Logs

- `/tmp/miru-employee-csv-revalidation-red-20261106.log`
- `/tmp/miru-employee-csv-cli-workspace-red-20261106.log`
- `/tmp/miru-employee-csv-revalidation-focused-20261106.log`
- `/tmp/miru-employee-csv-browser-final-20261106.log`
- `/tmp/miru-backend-employee-csv-final-20261106.log`

The old-controller helper and source under `/tmp/miru-employee-csv-old-controller-20261106.rb` were used only for the explicit failing probe, never normal test discovery.

## CLAUDE CODE SAYS (consult)

Model: claude-opus-5-5; session `483fc03c-b08c-40c0-8ac2-114447efce74`.

```tool-output
**NO_FINDINGS**

I found no concrete security, correctness, or regression flaw in the supplied diff. I traced these paths:

- **Ordering.** The pre-generation `before_action :authorize_access` still runs. The CSV is built outside any lock. `with_download_workspace` then locks and reloads `current_user` and re-authenticates the CLI token. On an invalid token, the lock block returns `false`, the transaction commits, and `Pundit::NotAuthorizedError` is raised outside it, so the revocation persists. On a valid token, the in-memory workspace is set to the session company and the DB workspace is checked.
- **Reauthorization.** The `authorize_access` call inside the block uses Pundit's memoized `EmployeeRecordPolicy`. That policy holds the same `current_user` object that `with_lock` reloaded in place. `manage?`, `index?` and `staff_roles` all issue fresh queries. `User.kept.exists?(…, current_workspace_id:)` reads the DB value, which is why the CLI case is denied after a global workspace switch without revoking the token. This is the intended existing rule.
- **Report refind.** `reports.find` inside the block raises `RecordNotFound` inside the transaction, so the audit is rolled back and a 404 is returned.
- **Scope check.** `generator.employment_ids` is frozen and comes from the same bounded, `.to_a`-loaded rows that `process` iterates. `report_employments` is rebuilt fresh (new relation, new `Date.current`). Given unique `Employment` rows, `count == size` correctly detects any exported employment that left the authorized scope. An empty report gives `0 == 0`, which allows a header-only CSV and leaks nothing.
- **Audit and response.** Both happen only after every check, inside the lock. Any raise rolls back the audit. The method-level `ArgumentError` rescue does not swallow `Pundit::NotAuthorizedError` or `RecordNotFound`.
- **Tests.**
  - The six cookie cases each mutate state after real generation (asserting the account is present) and check status, JSON media type, absence of the account, and no audit.
  - The CLI workspace case asserts one successful audit, a 403 afterwards, an unrevoked session, and a token that still authenticates.
  - The deletion-strategy case checks that the revocation persists across real commits, including after the role is restored.

**Non-issue noted:** if report columns are edited during generation, the CSV reflects the pre-edit columns. The actor is still re-verified as owner/admin with `manage?` over every exported employment, and the audit stores no column metadata, so nothing is disclosed beyond what the actor is authorized to see. This falls within your stated "not a serializable snapshot" scope.
```

## Final source fingerprints

```text
6001f216de3a2bfb2274426e6ae2cc682d56c46640535ec590eca8a3ace6e793  app/controllers/api/v1/employee_reports_controller.rb
a853f21d20dac4a61c676dbe4a222820c062a60a5c76d3216017699c29b698d1  app/services/employee_reports/download_service.rb
26a6967a4426c1ad94815f505611f665cae1ce30188cf32bff9b76e20a44f2e3  spec/requests/api/v1/employee_reports_spec.rb
1ede273f2d8ed1156f1cb881a50fe040ad7f685280c2af24f039d7620d87b44b  spec/requests/api/v1/payroll_document_cli_revocation_spec.rb
```
