# Project-member regression coverage, 2026-11-06

Production source is unchanged from `1607b1a32`. The only test change is `spec/system/projects/add_team_member_spec.rb`; fingerprints are in `SHA256SUMS`.

## DEBUG REPORT

Symptom: The project-member system spec expected Save Members to be disabled for an empty project and failed consistently in the observed run.

Root cause: The assertion predates `5500aa54bf1769fc5d718547d84e65f75d8a9fcd` (June 12, fix #2359), which intentionally removed the empty-members disabling rule so the last member can be removed. The parent already closes an unchanged form without issuing a mutation. Restoring that disabling rule would regress last-member removal.

Fix: Replace the obsolete assertion with actual outcomes. An unchanged empty team closes without a project-member API request, checked through native browser network traffic. Removing one member preserves the other; removing the final member persists an empty team and reopening shows no rate rows. Keep the existing hourly-rate edit check.

Evidence:

- Original native Brave run: `bundle exec rspec spec/system/projects/add_team_member_spec.rb`, 3 examples, 1 failure at the disabled-button assertion.
- Initial corrected file: 3 examples, 0 failures.
- Final `bundle exec rspec spec/system/projects` after preserving both partial and final removal assertions: 15 examples, 0 failures, exit 0.
- RuboCop for the changed spec: 1 file inspected, no offenses.
- `git diff --check`: pass.
- Separate full backend run: `bundle exec rspec --exclude-pattern 'spec/system/**/*_spec.rb' --fail-fast`, 5,690 examples, 0 failures, 64 pending, exit 0. Production/backend source was unchanged during this run. Pending payroll acceptance examples are unfinished requirements, not passes.

Regression test: The existing first two examples in `spec/system/projects/add_team_member_spec.rb` now cover the unchanged empty team and persisted partial/final removal boundaries. Native Brave/Cuprite uses the app's real local API and database; no production seam or API mock was added. The dedicated local test database and localhost-only network sandbox prevent external requests.

Value: protects=unchanged empty teams avoid writes and last-member removal persists; fails_when=empty teams are disabled, no-op starts mutating, or removal leaves stale members; why_new=old expectation conflicted with fix #2359 and never saved the last removal; seam=none; no_claim=live provider or production acceptance.

Qwen was consulted read-only. Its suggestion to disable the form after removing the last member was rejected against the explicit #2359 contract; source history and native tests determined the result.

Related: The general non-responsive browser run stopped at 142 examples with one failure in `InvoiceEditorSystemHelpers#find_invoice_line_item_row`: a Cuprite node became obsolete between locating a field and finding its ancestor. This report does not diagnose that separate failure as a product bug or a flake, and does not claim the full browser suite passed. Signed-in production browser verification remains unavailable because the browser-control host returned no connected browsers.

Status: DONE_WITH_CONCERNS. Project test correction verified; broader browser completion, release council reviews, publication and production verification remain open. No product behavior or JavaScript source was changed.

## Inspected screenshots

- [Initially empty team](project-members-empty.png)
- [Empty team reopened after both removals](project-members-removed.png)
