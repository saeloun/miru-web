# Invoice calendar dates — 2026-11-04

The admin invoice preview interpreted company-formatted dates with the browser's generic Date parser. Day-first dates disappeared or changed month/day; ISO line-item dates moved back one day in western timezones. The invoice list and editor shared the UTC parsing problem.

The shared response now adds ISO date-only companions while retaining the existing formatted fields. The invoice service prefers the canonical fields, and preview/list/editor use the installed Day.js local calendar parser. No date column, stored invoice, shared DTO type or dependency changes.

## Verification

- Corrected baseline: 6 real Brave examples, 4 failures, 2 passes. Day-first preview failed in both timezones; month-first and year-first line-item dates failed in America/Los_Angeles.
- Focused API run: 10 examples passed, including all three legacy response formats plus canonical date-only fields.
- Related API show/edit/index/create/update run: 62 examples passed.
- Focused Brave run: all 6 combinations of DD-MM-YYYY, MM-DD-YYYY and YYYY-MM-DD with Asia/Kolkata and America/Los_Angeles passed. Each checks list dates, preview issue/due/line-item dates, existing calendar trigger labels and a real CSRF-protected reference edit. Console error and exception watchers remained empty. This does not exercise picking new calendar days.
- A subsequent 6-example run also passed explicit issue/due/line-item request and database date assertions after saving the unrelated reference edit.
- Required `rtk mise exec -- timeout 30 bin/vite build` and forced `RAILS_ENV=test` asset build passed. ESLint, Prettier and RuboCop passed for the changed files.
- Local Qwen returned no findings on the supplied bounded source description. This is advisory, not council approval.
- Fresh native Claude reviewed the supplied diff and browser regression, finding no concrete production-code bug. Its line-item persistence test gap was addressed and its calendar-picking coverage claim corrected. It also identified untested overdue counting and the existing legacy fallback ambiguity; no claim of strict legacy parsing, full coverage or council approval is made.
- The broader invoice browser run completed with 94 examples and 7 failures: one unpaid fixture expecting Pro analytics, three filter-copy assertions expecting `invoices` instead of `invoice(s)`, two summary assertions expecting `OUTSTANDING` instead of `UNPAID`, and a pagination fixture below the current 100-row page size. These need separate verification and correction; this report does not claim a green full run.

The browser uses synthetic local fixtures on a separately owned native PostgreSQL test database. External network access is denied by the test process sandbox. Docker was unavailable; no production database, bank, provider grant or real message was used.

## Screenshots

All six native-before and six after screenshots were inspected. The before images come from the corrected baseline; earlier fixture-invalid attempts are not release evidence.

| Preference / browser timezone | Before | After |
| --- | --- | --- |
| DD-MM / Kolkata | [Before](native-before/DD-MM-YYYY-Asia-Kolkata-preview.png) | [After](after/DD-MM-YYYY-Asia-Kolkata-preview.png) |
| DD-MM / Los Angeles | [Before](native-before/DD-MM-YYYY-America-Los_Angeles-preview.png) | [After](after/DD-MM-YYYY-America-Los_Angeles-preview.png) |
| MM-DD / Kolkata | [Before](native-before/MM-DD-YYYY-Asia-Kolkata-preview.png) | [After](after/MM-DD-YYYY-Asia-Kolkata-preview.png) |
| MM-DD / Los Angeles | [Before](native-before/MM-DD-YYYY-America-Los_Angeles-preview.png) | [After](after/MM-DD-YYYY-America-Los_Angeles-preview.png) |
| YYYY-MM-DD / Kolkata | [Before](native-before/YYYY-MM-DD-Asia-Kolkata-preview.png) | [After](after/YYYY-MM-DD-Asia-Kolkata-preview.png) |
| YYYY-MM-DD / Los Angeles | [Before](native-before/YYYY-MM-DD-America-Los_Angeles-preview.png) | [After](after/YYYY-MM-DD-America-Los_Angeles-preview.png) |

## Limits

This is focused native-browser QA, not a completed gstack exploratory scoring run. Production acceptance, current-head CI, real Razorpay OAuth and the engineering/design/DX council gate remain unverified. Historical data is not rewritten; new SPA assets need the additive API fields to interpret company-formatted detail dates reliably during rollout.
