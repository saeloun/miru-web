# Hiring intake verification

This is Task 1 of [Sonam's ATS issue](https://github.com/saeloun/miru-web/issues/2463). It adds private manual applications, candidate history and hiring roles. Forwarded email, candidate forms, assessments, interviews, offers, automated communications, retention controls and onboarding remain in the [implementation plan](../../superpowers/plans/2026-10-25-applicant-tracking.md).

## Verified locally on 25 October 2026

- 28 focused backend and existing permission-policy examples pass. They cover normalized tenant-specific identity, immutable/encrypted submission details and notes, idempotent retries, conflict recovery, filtering/pagination/timezone boundaries, owner/role validity, active access, CSRF and database uniqueness/tenant constraints.
- Eight system examples pass in the installed Brave executable. They cover manual intake/history, mobile validation recovery, employee denial, closed-role filtering, draft preservation, picker pagination/keyboard focus, delayed role saves during filtering and recovery after a committed POST loses its response.
- Migration rollback and reapply pass on the empty, isolated test database. No existing table is changed.
- Changed Ruby and frontend files pass RuboCop, ESLint and Prettier checks; the required Vite command and a forced build pass. Existing dependency directive/chunk-size and Prettier configuration warnings remain.
- Additional Playwright CLI passes used Brave and a real synthetic local login: create application with role, owner and note, inspect its saved history, resize to 375px, check page overflow, and edit a role and verify it survives a full reload. There were no console errors or warnings in those passes.

The system specs enable cookie CSRF protection. The existing system driver disables browser web security, so these specs do not establish CSP behavior. All records are synthetic and email/job delivery uses the test adapters. No candidate communication or production change was made.

## Reproduce

Use the repository's local setup, an isolated test database and the installed Brave executable. Run backend and system checks sequentially against that database.

```sh
RAILS_ENV=test rtk mise exec -- bin/vite build --mode test
RAILS_ENV=test rtk mise exec -- bundle exec rspec spec/services/hiring/intake_spec.rb spec/requests/api/v1/hiring spec/models/hiring_application_spec.rb spec/policies/employee_record_policy_spec.rb
RAILS_ENV=test CI=true MIRU_QA_SCREENSHOTS=1 FERRUM_BROWSER_PATH='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' rtk mise exec -- bundle exec rspec spec/system/responsive/hiring_intake_spec.rb
rtk mise exec -- timeout 30 bin/vite build
```

Set `DATABASE_URL` to the isolated database before running these commands. The screenshots are raw browser captures; none uses production personnel or documents. Internal notes and search bodies are filtered from request parameters, and browser searches send text in POST bodies.

## Screenshots

| Surface | Evidence |
| --- | --- |
| Intake form | [Desktop](manual-intake-form-desktop.png), [375px mobile](manual-intake-form-mobile.png) |
| Candidate history | [Desktop](manual-intake-desktop.png), [375px mobile](manual-intake-mobile.png) |
| Roles and preserved drafts | [Roles](roles-desktop.png), [drafts after another role is saved and added](preserved-role-drafts-desktop.png) |
| Search recovery and pipeline | [Invalid range recovery](filter-recovery-mobile.png), [mobile pipeline](pipeline-mobile.png) |
| Delayed role save | [Save completes after its row is filtered away](asynchronous-role-save-desktop.png) |
| Lost application response | [Open the already saved application](application-recovery-action-desktop.png), [recovered original](recovered-application-desktop.png) |
| Additional Playwright pass | [Light desktop](playwright-detail-desktop-light.png), [light mobile](playwright-detail-mobile-light.png) |

CI, deployed browser behavior and production mail configuration are separate release gates; local verification does not establish them.
