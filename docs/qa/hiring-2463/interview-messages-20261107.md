# Candidate interview messages — Task 6 increment

Local implementation for [Sonam's ATS request](https://github.com/saeloun/miru-web/issues/2463). Admins can preview and explicitly queue invitations, confirmations, reschedules and cancellations for recorded bookings. Task 6 stays incomplete: invitations before a booking exists, internal Admin notifications and feedback prompts/overdue reminders remain required.

## Behavior

- Communication settings have optional subject/body fields for the four candidate message types. Blank templates do not prevent existing acknowledgements; a message needs both fields saved and approved before use. Editing any setting clears the existing shared approval. Booking details are appended from an explicit public projection, rather than interpolating an entire application or handover.
- Candidate content includes the round title, interviewer names, duration, preparation, meeting/booking links and booking/change instructions, with candidate-local timestamps, IANA zone and UTC offset. It excludes internal criteria, questions, feedback, pay grants, panel expertise and cancellation reasons. Cancellation mail omits the former meeting link/preparation and identifies the cancelled time.
- Saving/importing/cancelling a booking sends nothing. Its candidate-message panel requires an enabled reply inbox, an approved preview and a separate queue confirmation. The preview freezes recipient and application/round/booking/settings/inbox versions. A stale confirmation retains the old preview until explicitly discarded; it cannot silently adopt new approved wording.
- A root operation is unique by company, application, kind and immutable booking event key. Exact repeated queue intent returns the original result; changed intent conflicts. Retry attempts retain their original kind/event identity, use a new approved snapshot and preserve all prior content. Only the latest retryable attempt is offered for retry; history is paged at 20.
- The existing durable delivery job/transport is reused. It commits the sending claim before mail I/O and checks approval, actor, recipient, inbox, application, booking versions/state and panel again before sending. Changed contexts fail visibly. Interrupted/ambiguous sends remain uncertain, without blind retry. Evidence and confirmation that the worker cannot resume are required to record non-acceptance; recording evidence sends nothing. Retry is a separate action.
- Original acknowledgements keep their default event identity and delivery behavior. Their reconciliation and interview-message reconciliation share the same model operation, avoiding two versions of the evidence rules. Both paths retain their own authorization and row/version locks.
- A denied scoped child read/write clears the whole loaded application, including sibling panels and candidate history. The denial propagates through message/booking/round controls and screening/assignments/forms. A missing catalogue task remains a local stale-selection error; a catalogue permission denial clears the application too.

## Verification

Synthetic local PostgreSQL and native headless Brave, CSRF enabled, and a localhost-only network sandbox. No real candidate, live provider, external email, production or financial action was used. New delivery tests render the real mailer through its test transport; the existing acknowledgement SMTP regressions run separately in the focused suite. This is not proof of delivery to a real mailbox.

- **10 API examples** cover safe previews, approval/blank templates, all versions, exact queue recovery, immutable identity, reschedules/cancellations, recipient confirmation, strict fields, uncertain review/retry, tenant/role boundaries, template header/type limits, 21-attempt pagination/latest-only retry and rollback refusal with message history.
- **8 delivery examples** verify one frozen email after duplicate worker execution, no private candidate content, refusal after approval/inbox/recipient/application/booking/panel changes, and another context check after constructing mail. Together with legacy acknowledgement/form delivery cases: **67 examples, zero failures**. The final focused API/delivery rerun passes **18/0**.
- Final full backend: **5,829 examples, zero failures, 59 pending**. Subsequent changes only affect frontend/system tests; backend source fingerprints remain unchanged. Pending payroll contracts are not implemented by this increment.
- All thirteen hiring browser files pass: **78 examples, zero failures**, including nine message/approval/denial journeys with console error/exception checks. Screenshot review found cached parent candidate data retained after child denial; a stronger whole-page assertion was RED before propagation. All four focused whole-application denial cases and the expanded full run pass afterward. The initial wrong form-disabled approval-label expectation was a fixture correction, not a security regression.
- Required Vite and forced test builds pass after the final frontend change. All ten changed frontend files pass ESLint and all 14 Ruby files pass RuboCop; the four affected domain/controller files have zero Reek warnings. TypeScript remains at the existing **329 diagnostics**, with zero added/removed entries after normalizing source coordinates.
- The schema migrations pass up/down/up on a newly created disposable database. Constraints are added without a blocking initial validation, validated in the next migration, and the root index is replaced concurrently. Both new constraints and the unique index were checked. The harness removed only its own database. A populated-history test proves both rollback guards refuse before DDL; no recorded message is discarded.

The initial missing-route test was RED. Queue creation initially returned 200 after enqueue reloaded the record; the service now returns an explicit creation result, keeping first creation at 201 and exact recovery at 200. The expired-employment fixture was corrected to the day before resignation, matching the existing inclusive last-working-day policy. Fixture corrections are not claimed as security regressions.

Post-commit browser closure initially missed one booking-control click: preceding application reads returned 200, but no interview-round request started. Its cause is unproven. The helper now checks the current route, waits for screening/assignment controls to settle and verifies the actual round card before opening its booking. Nine targeted cases and a subsequent complete **78-case hiring browser run pass** with those preconditions; no retry loop or longer timeout was added. An incorrect intermediate assertion naming a nonexistent Hide-rounds control was corrected from the source and is excluded from product-regression evidence.

## Decisions and costs

1. Reuse the existing settings approval and outbox rather than create a second template/transport system. Cost: changing an interview template also invalidates the shared acknowledgement approval; queued stale versions require review.
2. One operation per booking/message type, with immutable retry chains. Cost: another send requires an explicit retry or a new booking; confirming a different inbox/body cannot create an accidental second root.
3. Revalidate all captured interview versions before sending. Cost: even an otherwise harmless application/round update can block queued mail; an Admin must review the current preview before retrying.
4. Add versioned public booking facts to approved plain text. Cost: this increment has no arbitrary template expressions, candidate rescheduling endpoint or external calendar write. Unbooked invitations and internal reminders remain tracked in Task 6.
5. Clear the whole candidate view on a scoped child 403/404 rather than leave sibling PII visible. Cost: a missing nested record requires retrying the application; a catalogue-only 404 preserves the unsaved task selection/draft.

## Browser evidence and release limits

| Surface | Actual synthetic capture |
| --- | --- |
| Approved candidate preview | [Mobile](interview-messages-20261107/interview-message-preview-mobile.png) |
| Recorded operation | [Queued history on mobile](interview-messages-20261107/interview-message-queued-mobile.png) |
| Stale approval | [Original preview retained](interview-messages-20261107/interview-message-stale-mobile.png) |
| Employment ended | [Whole application cleared](interview-messages-20261107/interview-message-revoked-mobile.png) |
| Reviewed uncertainty and separate retry | [Both immutable attempts](interview-messages-20261107/interview-message-retry-desktop.png) |
| Template approval | [Editable saved wording](interview-messages-20261107/interview-message-settings-mobile.png) |

Full-page Admin captures include synthetic Admin-only panels outside the candidate email preview. The six images were visually inspected; [checksums](interview-messages-20261107/SHA256SUMS) identify the final captures. These are local artifacts, not hosted PR image attachments. The generic release gate still has the existing TypeScript and Ruby-runner detection failures. Current-head council reviews, publication, CI and deployment remain separate gates. This does not complete Task 6 or close #2463.
