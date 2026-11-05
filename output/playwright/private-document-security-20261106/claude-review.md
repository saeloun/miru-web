# Bounded Claude source review

Model reported: `claude-opus-5-5`. Fresh source-only invocation with tools disabled. This is advisory static review, not a council review, test run, or production check.

## CLAUDE CODE SAYS (review)

```tool-output
No P1 or P2 findings. Three P3 items are below, two of which depend on `rails_helper` and employee-records spec content that weren't supplied. This is static review of the supplied source only; I ran nothing.

**Transaction and rollback (`authenticable.rb:73-96`)**
- A failed CLI re-authentication exits the `with_lock` block with `next false`. The block returns normally, so the transaction commits and `revoke!` (`cli_session.rb:37,46`) persists. The `NotAuthorizedError` is raised only after the commit (`:81`).
- Policy or attachment failures inside the block (`yield`) raise inside the transaction. The only rollback is the sliding `last_used_at`/`expires_at` update, which is harmless.
- `CliSession.authenticate` filters on `active`, so re-adding the role cannot revive a revoked session.
- This depends on nothing in `Api::V1::ApplicationController` wrapping actions in an outer transaction. That file wasn't supplied.

**CLI virtual workspace**
- `with_lock` reloads the user, which resets `current_workspace_id` to the persisted value. `refresh_cli_workspace` then re-applies the session company and clears the dirty state, so `lock!` will not reject the record for unsaved changes.
- After that, the `current_workspace_id == current_company.id` check at `:76` is always true for CLI requests. The CLI binding comes only from `session.company_id == current_company.id` at `:90`, which matches the stated design.
- `SalarySlipPolicy` reads only the in-memory `current_workspace_id`, so a CLI download in company B works while the browser default is A.
- `PayrollRunPolicy#active_member?` (`payroll_run_policy.rb:47`) and `EmployeeRecordPolicy#index?` (`employee_record_policy.rb:8`) still require the persisted workspace, so those restrictions are unchanged.
- Storage reads (`blob.download`) happen before the lock in all three controllers. Inside the lock there are only DB queries, the audit insert and `send_data`.

**Findings**

- **[P3] `spec/requests/api/v1/payroll_document_cli_revocation_spec.rb:12-13`**: The spec sets the global `DatabaseCleaner.strategy = :deletion` and never restores it.
  - If `rails_helper` sets the strategy only in `before(:suite)`, every later example in a random-order run switches to deletion. That slows the suite and changes isolation for unrelated specs.
  - The test only proves a real commit if `config.use_transactional_fixtures` is false. Otherwise the request shares the test transaction, and a revocation that would be rolled back in production would still appear as `revoked_at` here.
  - Please confirm both settings in `rails_helper`, or restore the strategy in an `after`/`around` hook.

- **[P3] `app/controllers/api/v1/employee_records_controller.rb:74`**: The employee-document lock moved from `authorize_access` to `with_download_workspace`, but no employee-records spec is in the diff.
  - The only visible coverage of this path is the CLI revocation (negative) case.
  - Nothing visible shows a successful CLI employee-document download through the new helper.
  - Nothing visible re-verifies browser-session workspace, role or attachment changes during the storage download for this endpoint.
  - These may already exist from `7d4ef5ce2`, but I can't confirm that from the supplied material.

- **[P3] `app/controllers/concerns/authenticable.rb:87` and `spec/requests/api/v1/payroll_document_cli_revocation_spec.rb:11`**: The diff adds code comments, which your no-comments rule forbids. Remove them before committing.
```

## Host assessment and follow-up

- Database isolation concern resolved by source inspection: `spec/support/database_cleaner.rb:10-15` resets strategy before every example; `spec/rails_helper.rb:59` disables transactional fixtures. The controller around actions only switch locale. The three durable-revocation request tests pass on real commits.
- Existing `employee_records_spec.rb` covers workspace, role, actor/target employment and attachment changes during actual storage reads. Its successful exact-byte download test now also exercises an employee CLI token and verifies the second download audit. Employee-record plus durable-revocation request specs: 25 examples, 0 failures after that addition.
- The suggested blanket removal of comments is rejected: applicable instructions permit concise comments explaining why. These two comments explain the transaction and test-isolation requirements.

No production source changed after this review. The employee-record positive CLI assertion is the only later code/test change; eight-file RuboCop and the affected 25 request examples passed afterward.
