# Hiring intake verification

This record covers private intake, email acknowledgements and candidate forms from [Sonam's ATS issue](https://github.com/saeloun/miru-web/issues/2463). The sections below retain each milestone's evidence. Assessments, interviews, offers, retention controls and onboarding remain in the [implementation plan](../../superpowers/plans/2026-10-25-applicant-tracking.md).

## Verified locally on 25 October 2026

- 28 focused backend and existing permission-policy examples pass. They cover normalized tenant-specific identity, immutable/encrypted submission details and notes, idempotent retries, conflict recovery, filtering/pagination/timezone boundaries, owner/role validity, active access, CSRF and database uniqueness/tenant constraints.
- Eight system examples pass in the installed Brave executable. They cover manual intake/history, mobile validation recovery, employee denial, closed-role filtering, draft preservation, picker pagination/keyboard focus, delayed role saves during filtering and recovery after a committed POST loses its response.
- The picker focus regression was reproduced locally after CI caught it. Selection and Escape now restore the trigger explicitly; outside clicks retain their destination. The focused flow passed five consecutive repetitions while retaining the original assertion.
- Native Enter coverage also exercises Retry, Load more and clearing a selection. Footer controls sit outside the command list's Enter handler; loading/retrying returns focus to the search input. The keyboard probes explicitly focus controls and send browser key events, because Cuprite's element `send_keys` can click before typing.
- Migration rollback and reapply pass on the empty, isolated test database. No existing table is changed.
- Changed Ruby and frontend files pass RuboCop, ESLint and Prettier checks; the required Vite command and a forced build pass. Existing dependency directive/chunk-size and Prettier configuration warnings remain.
- Additional Playwright CLI passes used Brave and a real synthetic local login: create application with role, owner and note, inspect its saved history, resize to 375px, check page overflow, verify a role edit survives a full reload, and exercise native keyboard pagination, clearing and focus restoration. There were no console errors or warnings in those passes.

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
| Picker keyboard focus | [Escape restores the trigger after the final page](picker-keyboard-focus-desktop.png) |
| Picker keyboard pagination | [Enter loads options without selecting a role](picker-keyboard-pagination-desktop.png) |
| Lost application response | [Open the already saved application](application-recovery-action-desktop.png), [recovered original](recovered-application-desktop.png) |
| Additional Playwright pass | [Light desktop](playwright-detail-desktop-light.png), [light mobile](playwright-detail-mobile-light.png) |

CI, deployed browser behavior and production mail configuration are separate release gates; local verification does not establish them.

## Email intake and acknowledgements

This record covers local verification of Task 2. Production deployment, external mailbox connection and current-head CI require separate evidence. The remaining applicant-tracking milestones stay required.

| Check | Current evidence |
| --- | --- |
| Targeted backend and company lifecycle | 210 examples, 0 failures |
| Hiring browser flows | 19 actual Brave examples, 0 failures |
| Frontend | Required Vite build and changed JavaScript lint/format checks pass |
| Ruby | Changed Ruby lint passes |
| Real relay, queue and SMTP | Duplicate authenticated intake, separate workers, provider evidence review and approved retry verified locally |

Backend coverage includes bounded authenticated RFC822 intake, private retained source and downloads, MIME/date/conflict review, tenant identity and concurrency, approval/revocation, reviewed applicant linking, stale versions, CSRF, permission/recipient changes, queue interruption, SMTP ambiguity and late results. Evidence and message bodies stay out of audit changes and request traces. Conservative parser limits can hold separator-heavy text for review; the source remains retained.

Real loopback Mail/Net::SMTP checks reproduced DATA acceptance followed by QUIT replies 451, 500, 535 or 550. Every such exception now leaves delivery unknown and prevents retry without reconciliation; an SMTP authentication exception also lacks a reliable protocol phase. Disabled delivery never appears accepted. Company teardown with reconciled retries removes its records without purging another tenant's shared source, including after native transport deletion. The email application's detail page displays its actual intake source.

Communication settings support incomplete drafts, an explicit nullable client count, saved preview and explicit approval. The preview and queued snapshot share the server renderer. Editing revokes approval; approval alone does not acknowledge the old backlog.

Inbox management supports active routes, preserved drafts, stale-save recovery, paginated search, retained uploads and review/link/dismiss workflows. Forwarded applicant fields start blank. A pending receipt can request processing against its retained source after native transport deletion; HTTP acceptance is labelled as a request until the actual outcome is reloaded.

One acknowledgement root owns immutable numbered attempts. A new retry confirms the current recipient and approved wording/version and leaves older snapshots unchanged. Unknown delivery requires an evidenced operator report; non-acceptance also requires confirmation that the original worker cannot resume. Recording a review does not send an email or invent an SMTP acceptance timestamp. A later provider result remains separate and can block a queued retry. Incorrect external confirmation can still duplicate email; SMTP cannot guarantee exactly-once delivery after ambiguity.

The attempt migration passed up/down/up on the owned empty-message database. A rollback with recorded attempt/review history is refused before destructive DDL. Tenant/application root references and unique root/attempt identities are enforced in the database. Optional encrypted review evidence remains nil until recorded.

A fresh real integration again sent duplicate authenticated requests through the relay controller, persisted SolidQueue work and booted separate workers. Mailpit captured one acknowledgement. A loopback SMTP server then rejected a second application's first attempt with 550 before accepting message data; Miru conservatively retained an unknown result. After that worker exited, a fresh process recorded the observed non-acceptance evidence without queuing mail, approved revised wording, and separately queued a new attempt that was accepted once. Totals were two applications/receipts/roots, three attempts and two accepted messages, one per applicant; the original snapshot stayed unchanged. No external email was delivered. An earlier combined harness hit a Rails runner execution-context error; request ingestion and follow-up were separated into fresh processes.

Existing-profile Playwright checks established real synthetic login with cookie CSRF enabled, saved settings/revocation, blank forwarded identity fields, verified-recipient queuing, keyboard activation and 375px layouts without horizontal overflow or captured console warnings/errors. The manual upload helper lacked an extension permission and its download watcher produced no saved-path proof; isolated Brave system checks instead verified the upload and actual byte-equal source/attachment downloads. No browser permissions changed. The attempt-history pass also verified required worker confirmation, stale-review rejection with evidence preserved, explicit reload, recording a review without another attempt and a separate action queuing attempt 3. Those UI states used synthetic fixtures and test-only queue/mail adapters; the real SMTP proof above is separate.

| Surface | Screenshots |
| --- | --- |
| Captured SMTP acknowledgement | [Desktop](16-acknowledgement-desktop.jpg), [mobile](17-acknowledgement-mobile.jpg) |
| Communication settings | [Approved desktop](communications-approved-desktop.png), [edited mobile draft](communications-draft-mobile.png) |
| Existing-profile settings checks | [Approved desktop](communications-playwright-approved-desktop.jpg), [mobile draft](communications-playwright-draft-mobile.jpg) |
| Inbox and review | [Inbox management](inbox-management-desktop.png), [reviewed mobile](inbox-reviewed-mobile.png) |
| Email application provenance | [Linked detail on mobile](email-application-detail-mobile.png) |
| Existing-profile receipt checks | [Desktop review](inbox-playwright-review-desktop.jpg), [verified recipient](inbox-playwright-reviewed-mobile.jpg) |
| First acknowledgement | [Approved preview](recovery-approved-preview-desktop.jpg), [queued status](recovery-queued-desktop.jpg), [system queued view](inbox-queued-existing-desktop.png) |
| Retained-source recovery | [Processing requested](recovery-pending-mobile.jpg), [reloaded outcome](recovery-reviewed-mobile.jpg) |
| Retried acknowledgement | [Original and current wording](attempt-retry-preview-desktop.jpg), [retained desktop snapshots](attempt-history-desktop.jpg), [mobile system check](inbox-attempt-history-mobile.png) |
| Unknown-delivery review | [Required confirmation](inbox-unknown-review-mobile.png), [stale evidence preserved](inbox-stale-delivery-review-mobile.png) |
| Recorded review and separate retry | [Mobile Playwright pass](attempt-reviewed-history-mobile.jpg) |
| Actual SMTP retry | [Captured message and recipients](attempt-smtp-capture-desktop.jpg) |

An earlier cookie/CSRF positive check returned 401 once. Isolation and subsequent wider reruns passed; its cause remains unproven. Authentication protections were not relaxed.

A broad 4650-example run overlapped source changes and used an obsolete SMTP expectation, so its single failure and mixed inputs do not establish current full-suite status. Exact frozen-source checks and CI are reported separately; no broad pass is inferred from the focused results above.

Operator setup, delivery-state meanings and the current retention limit are documented in [Hiring email intake](../../hiring-email.md). Local evidence does not replace independent review, publication checks or current CI.

## Private candidate forms

Local verification on 26 October 2026 covers Task 3, including the admin settings and application review screens. The full ATS plan and release gates remain required; these results do not establish deployment or current-head CI.

- 179 focused hiring backend examples pass, including 21 private-form request examples. Coverage includes configuration approval, immutable encrypted snapshots, capability expiry/revocation, CSRF, typed answers, private uploads, stale/submitted upload refusal, byte-integrity checks, tenant foreign keys, restricted-field projections, acknowledgement links and shared-resume workspace teardown. Format-suffixed requests and understated content lengths are rejected before parsing.
- All 26 hiring system examples pass in Brave. The new flows cover configuration and stale-draft recovery, private-link creation/replacement/revocation, submitted-answer review, exact-byte resume download and the complete synthetic acknowledgement-to-form-to-resume-to-submission journey. Optional choices, including a false yes/no answer, and compensation can be cleared. Lost upload responses preserve unsent drafts through refresh; an already accepted submission is reconciled to its read-only answers.
- A further review reproduced same-file retry failure after a temporary upload rejection. The input now clears after capturing its File; the test verifies no initial attachment, an empty input, retrying that exact PDF, lost-response recovery and final submission. The existing-profile file chooser could not upload because its extension lacks file-URL access. No permission was changed; the isolated Brave upload and retry checks pass.
- Separate existing-profile Brave checks verify the setup link, mobile saving and approval, keyboard toggling/cancellation, replacement confirmation, revocation and rejected reopening. A long custom label fits at 375px without horizontal overflow; the capability fragment is removed, and no console warnings or errors were captured during the successful checks. One automation checkbox action did not toggle after resizing; keyboard activation worked. No browser permissions were changed.
- Browser review found an incorrect setup route; a valid failing browser assertion preceded its one-line fix. The first test used the wrong heading level and is excluded from regression proof. Review also reproduced restricted resume metadata leaking through the default projection; the corrected projection hides the filename and size while preserving authorized Admin access.
- Fresh native Brave mobile checks confirm that errors and submission confirmation receive focus and remain visible without overflow. Refresh preserves the entered name, work summary and invalid amount; a corrected or cleared optional amount can then be submitted. A textarea value-attribute check was unsuitable; the actual submitted DOM confirmed its retained text.
- The required Vite build, test asset build, all eight changed frontend files' ESLint and format checks pass. A broader frozen snapshot passed 4690 examples with zero failures and 80 existing pending examples before the later review fixes; it is historical evidence, not the final candidate's broad pass. Current-head CI and final review remain separate gates.

A further existing-profile submission succeeded, but its CDP network buffer contained no request events and reported truncation. That attempt remains invalid network evidence. The current system journey instead requires positive open/upload/submit request observations and verifies local HTTP origins, no analytics/replay requests and no capability token in request URLs. Brakeman completed without scan errors and reported two weak warnings in unchanged `pg_searchable.rb` and `signature_request_reviews_controller.rb`; this is not a clean security-review approval.

A fresh native source review identified lost-upload recovery and untracked raw email bytes after rollback. Both were reproduced before fixing. Cleanup follows the full transaction and preserves reused/shared objects; four new checks cover direct and enclosing admin rollback, interrupted storage upload and shared-source preservation. A browser locator was updated to target the new contextual ARIA label. Another first-load run timed out because formatting after the test build caused an on-request Vite rebuild; its first page took 11.6 seconds versus 17 ms for the next. No timeout or retry policy was changed. The unchanged rerun and final combined browser run pass.

Manual QA used a separate guarded synthetic database, test jobs and disabled mail delivery. No real candidate or employment data was used. Old Task 2 screenshots are preserved; the new captures below record local Task 3 verification. Publication, current-head CI and deployment status are reported separately on the PR.

| Surface | Evidence |
| --- | --- |
| Submitted answers and private resume | [Desktop Brave review](candidate-admin-review-playwright-desktop.jpg) |
| Form configuration | [375px full configuration](candidate-form-settings-playwright-mobile.jpg), [approval controls](candidate-form-settings-playwright-mobile-approval.jpg) |
| Long custom question | [375px candidate form](candidate-form-long-label-playwright-mobile.jpg) |
| Visible validation and confirmation | [Focused mobile error](candidate-validation-focused-mobile.jpg), [focused read-only confirmation](candidate-submission-confirmed-mobile.jpg) |
| Submitted form | [Desktop](candidate-submitted-playwright-desktop.jpg), [mobile after draft refresh](candidate-refreshed-submission-mobile.jpg) |
| Upload retry and complete application | [Same PDF after temporary failure and refresh](candidate-resume-retry-mobile.png), [submitted mobile form with private resume](candidate-submitted-mobile.png) |
