# Interview panels and configurable rounds — Task 5

Local implementation for [Sonam's ATS request](https://github.com/saeloun/miru-web/issues/2463). This is not production or published-head verification. Scheduling, recorded feedback, decisions, offers, onboarding and retention remain Tasks 6–10.

## Behavior

- Owners/admins maintain active staff panel profiles at `/hiring/panel`: expertise, availability and optional HTTPS booking links without embedded credentials. Historical profiles remain readable after membership ends.
- An application's **View interview rounds** opens paginated history on demand. Admins configure a screening call or arbitrary later round, duration, criteria, preparation, feedback questions and panel. They can update/reassign planned rounds, complete/skip/cancel with a reason, or repeat an ended round into a new record. Completed rounds and encrypted events cannot be rewritten.
- Creation uses a request UUID and exact original intent for lost-response retries. Writes validate both application and round versions. Stale drafts keep their original versions until explicit discard; history reads do not rebase them.
- Staff use `/interview-reviews` for their current active assignments. Handover excludes Admin notes, panel permission settings and private form answers. An explicit per-interviewer, per-round grant exposes only current/expected compensation, not other sensitive answers.
- Resume and latest submitted-assessment downloads use private storage, bounded size/hash checks, attachment disposition and sandbox headers. Access and file identity are rechecked after storage reads. Older assessment files outside the handover are unavailable through this route. Submitted code is never fetched or executed.
- Reassignment, ended rounds, inactive membership and moving the application out of interview remove handover access. Denied refreshes/downloads clear loaded staff data; denied Admin profile writes clear the private draft. Company/application deletion includes the new records without deleting staff users.
- This task sends no candidate mail, starts no worker and creates no external meeting. Feedback questions are configured here; feedback records and scheduling are Task 6.

## Verification

All data is synthetic. Native RSpec runs use owned local PostgreSQL databases, isolated headless Brave, real CSRF checks, test job/mail adapters and a localhost-only network sandbox.

| Check | Result |
| --- | --- |
| Final backend suite, excluding system specs | 5,735 examples, 0 failures, 59 pending |
| Related hiring services/models/requests | 236 examples, 0 failures |
| New panel/round request specs | 15 examples, 0 failures |
| All ten hiring browser spec files | 55 examples, 0 failures, including 8 new interview scenarios |
| Changed/new Ruby files | RuboCop: 17 files, no offenses |
| New models, policy and services | Reek: 0 warnings |
| Changed TypeScript/React files | ESLint: no errors or warnings |
| Required `timeout 30 bin/vite build` and forced test build | Both exit 0 |
| Three migrations on an empty database loaded from the previous schema | Up, down, up pass; owned temporary database removed |

The 59 backend pending examples remain explicit backlog, including broader payroll requirements; they are not passes. The repo-wide TypeScript check still reports 329 errors, with no diagnostics naming the new interview files. Generic gstack verification passes lint/build but remains **NOT_READY**: typecheck fails and its pregate cannot detect runners for selected Ruby specs. Native RSpec results above do not change that gate. Exact-head council reviews/publication, CI and deployment remain separate release gates.

Relevant commands, run through the repository runtime with the isolated environment:

```sh
bundle exec rspec --exclude-pattern 'spec/system/**/*_spec.rb'
bundle exec rspec spec/services/hiring spec/requests/api/v1/hiring spec/models/hiring_application_spec.rb spec/requests/hiring_portal_spec.rb spec/requests/hiring_assignments_spec.rb spec/requests/hiring
bundle exec rspec spec/requests/api/v1/hiring/interviews_spec.rb spec/requests/api/v1/hiring/panel_members_spec.rb
bundle exec rspec spec/system/responsive/hiring_interviews_spec.rb spec/system/responsive/hiring_screening_spec.rb spec/system/responsive/hiring_assessment_review_spec.rb spec/system/responsive/hiring_inbox_spec.rb spec/system/responsive/hiring_assignment_library_spec.rb spec/system/responsive/hiring_assessment_portal_spec.rb spec/system/responsive/hiring_intake_spec.rb spec/system/responsive/hiring_application_forms_spec.rb spec/system/responsive/hiring_communications_spec.rb spec/system/responsive/hiring_portal_spec.rb
```

## Regression evidence

- Initial panel and round requests reached missing endpoints. An empty optional panel profile then reproduced a SQL NULL failure; its JSON serialization now retains `{}`. The first compensation fixture omitted required settings, so that fixture error is excluded from privacy RED evidence.
- Queue/resume routes and stage cancellation initially failed. Staff permission metadata and assessment downloads then failed their own checks. A separate historical-file probe returned 200 for an older assessment before the endpoint was restricted to the latest submitted handover. Reassignment and storage-read membership revocation now deny bytes.
- Real Brave reproduced an Admin draft remaining visible after a denied write and a long resume button extending outside the 375px viewport. Both regressions pass after clearing unauthorized state and wrapping the download label. Native downloads match the original PDF and untrusted assessment bytes. Touch targets are checked at 44px and the profile can be opened by keyboard.
- The first broad browser run passed 52/54. The extra eager round-history read exhausted the default three-connection pool in the existing download lock probe: diagnostic metadata showed all three connections busy, two queries blocked on user locks and one checkout waiting. On-demand history removes that initial request; the original lock probe and all 55 final browser cases pass without increasing the pool or weakening authorization.
- The other broad failure clicked the name input while Radix's repositioned popover physically covered it after the navigation grew. Its outside-click probe now uses the visible email input, retaining keyboard, pagination, duplicate-option, focus and dismissal assertions. A zero-example intermediate filter run is excluded from evidence.
- Reek initially flagged two long orchestration methods. Round construction and action application now have named methods inside the same authorization/transaction boundary; related tests and the final full backend run pass.

## Implementation rulings

1. Configure feedback questions now and add feedback records in Task 6, avoiding an unused model. Cost if wrong: the later migration must preserve each round's question snapshot.
2. Continue the existing inline execution choice and retain the whole-branch review in Task 10. Cost if wrong: integration decisions receive independent review later rather than once per task.
3. Add a concurrent unique `(company_id, id)` employment index required by the panel's tenant foreign key. Cost if wrong: another index must be maintained; concurrent construction avoids a blocking build on the existing table.
4. Repeat links follow the existing nullable parent-FK pattern, with application/tenant checks in the model and scoped service; privilege-bearing links retain composite tenant foreign keys. Cost if wrong: direct unscoped SQL could create an invalid repeat pointer, while supported APIs reject it.

## Screenshots

Synthetic local artifacts, not externally hosted PR image URLs:

| Surface | Image |
| --- | --- |
| Interviewer profile, 375px | [Panel](interviews-20261107/panel-mobile.png) |
| Completed immutable round, 375px | [Round history](interviews-20261107/completed-round-mobile.png) |
| Explicit compensation grant and long resume label, 375px | [Private handover](interviews-20261107/handover-compensation-granted.png) |
| Cleared handover after membership revocation | [Revoked access](interviews-20261107/handover-membership-revoked.png) |
| Reassigned panel and explicit permission | [Admin reassignment](interviews-20261107/round-reassigned-desktop.png) |
| Submitted assessment and private file download | [Assessment handover](interviews-20261107/assessment-handover-desktop.png) |
