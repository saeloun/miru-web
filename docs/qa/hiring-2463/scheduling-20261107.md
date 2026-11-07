# Manual interview scheduling — Task 6 increment

Local manual-booking increment for [Sonam's ATS request](https://github.com/saeloun/miru-web/issues/2463). The subsequent [calendar import increment](calendar-20261107.md) adds provider import; Task 6 remains incomplete because feedback submission, candidate communications and reminder delivery are still pending. This increment does not send email or change an external calendar.

## Behavior and boundaries

- Admins record a meeting in the candidate's IANA time zone. UTC start/end and the explicit feedback deadline are stored with encrypted round and panel snapshots. The configured round duration determines the end; no feedback deadline policy is invented.
- Nonexistent DST times are rejected. Ambiguous times require an explicit valid UTC offset, including half-hour transitions. Invalid dates, encodings, zones, URLs and parameter types fail without writing a booking.
- Rescheduling creates a new immutable booking, retains the original and requires a reason. Cancellation, no-show and stale-version checks retain history. A no-show can be recorded only after the scheduled start. Invalid replacements roll back the cancellation.
- Reassigning the panel, changing round terms, ending a round or leaving interview closes its booking. Changing compensation access alone does not cancel it. Current panel employment and handover grants are rechecked before recording a booking.
- Assigned staff receive only the booking time, candidate zone, deadline and public instructions. Cancelled meetings hide their link and instructions; private Admin reasons, request details and snapshots remain excluded. Tenant foreign keys, role/workspace checks and no-store responses protect both surfaces.
- The Admin booking history loads on request. Unsaved stale drafts require an explicit discard before reloading. Mobile layouts and the affected pages' console errors are covered by actual Brave browser tests.

## Verification

All checks used synthetic fixtures and localhost-only network access; no live Google connection, candidate mail or production data was used.

- Full backend before the final revoked-grant guard: **5,754 examples, zero failures, 59 pending**. After that guard, the related hiring suite passed **257 examples, zero failures**. Its new regression first reproduced an incorrectly accepted booking after grant revocation; the guard fixed it. The replacement-panel test also proves the old interviewer loses handover access.
- All eleven hiring browser files passed **59 examples, zero failures**. The four scheduling examples additionally passed after restoring the full-page screenshot helper. Four actual images were visually inspected; temporary blank viewport captures were replaced.
- Time parser: **8 examples, zero failures**. Booking requests: **13 examples** are included in the final related suite. Coverage includes idempotency, rollback, stale versions, tenant FK enforcement, DST, no-show timing and private staff projections.
- Required Vite and forced test-asset builds passed. Changed frontend files passed ESLint; changed Ruby files passed RuboCop, and the affected domain classes passed Reek. Repository-wide TypeScript still reports **329 errors**, with none in the new booking/interview files; this is not a clean release gate.
- A separate empty database passed schema load, migration up/down/up and was then removed. No populated database was rolled back. Unrelated PostgreSQL schema cast-normalization changes were removed from the diff.
- After commit `d7d08d192`, all 20 source fingerprints and four screenshot hashes matched. The four scheduling browser scenarios passed again after the final grant guard. A stable-tree generic gstack run passed lint/build but remained **NOT_READY**: TypeScript fails and its pregate detects no Ruby runner for 103 selected files. An earlier run changed during documentation/commit work and is excluded from certification.

## Calendar authorization prerequisite

Calendar authorization is now bound to the Miru user who completed OAuth. Both existing calendar-read routes reject missing, legacy unowned or another user's saved authorization before calling Google. A declined authorization clears the earlier connection; responses are private/no-store, and successful calendar listing sets the connected flag only after the provider read succeeds.

The **11 calendar request examples pass**, including real Google SDK token exchange/calendar/event parsing against synthetic HTTP responses, read-only scope, user switching directly into either read route, legacy-token rejection and declined authorization cleanup. The combined hiring/calendar suite passes **268 examples, zero failures**. Two changed Ruby files pass RuboCop. The first valid ownership regressions failed before the guard; a separate declined-authorization regression reproduced a retained earlier token and passes after shared cleanup. Initial synthetic HTTP URL/header fixture errors are excluded from RED evidence.

This verifies the authorization prerequisite, not calendar import or a live Google account. Existing calendar users must reconnect once because old tokens have no trustworthy owner binding. Inferring ownership from the profile's connected flag would preserve the cross-user exposure.

## Browser evidence

| Surface | Actual synthetic Brave capture |
| --- | --- |
| Manual mobile booking | [Candidate zone, UTC and deadline](scheduling-20261107/booking-mobile.png) |
| Reschedule and cancellation | [Both original and replacement retained](scheduling-20261107/booking-cancelled-mobile.png) |
| DST overlap | [Explicit New York UTC offset](scheduling-20261107/booking-dst-overlap.png) |
| Staff handover | [Cancelled link and private reason omitted](scheduling-20261107/booking-handover-cancelled.png) |

These images are local repository artifacts, not uploaded PR attachment URLs. Current-head CI, council reviews, publishing and deployment are separate unfinished checks.
