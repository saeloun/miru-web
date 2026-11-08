# Invitations before booking — Task 6 increment

Local implementation for [Sonam's ATS request](https://github.com/saeloun/miru-web/issues/2463). Admins can send an approved invitation to arrange a time before a meeting exists. This reuses the existing template, message history, queue, delivery and uncertainty-review workflow. Task 6 remains incomplete: internal Admin notifications and feedback prompts/overdue reminders are still required.

## Behavior

- Only a planned round in the interview stage without an active scheduled booking can prepare an unbooked invitation. Saving a round sends nothing. The candidate receives the approved invitation wording, round title, duration, interviewer names, preparation and configured HTTPS booking links. The footer explicitly says no interview time is confirmed; with no links, it gives a reply-to-hiring-team fallback. No date, time, zone, meeting link or feedback deadline is invented.
- Candidate content excludes private Admin notes, assessment criteria/questions, panel expertise/availability and compensation grants. Current panel IDs, employment IDs and profile versions must match the saved round snapshot. A changed profile requires saving the round again before sending its updated link.
- The same candidate-message panel works for a booking or an unbooked round. The round panel offers only invitations; confirmation/reschedule/cancellation remain in booking history. Choosing the context depends on route parameters, never a supplied `booking_id` query parameter. Denied access clears the whole application using the existing parent-denial path.
- Previews retain their original recipient and application/round/settings/inbox versions; booking version is explicitly null. First creation returns 201. Identical accepted intent recovers its original result with 200, including after a later round change or booking, but still requires current Admin access. Changed intent conflicts rather than silently adopting new details.
- A saved round revision has its own invitation operation. Sending updated details requires another explicit preview/confirmation. Older queued invitations are marked not sent with `interview_changed` only when the replacement is confirmed. Row locks and a second unresolved-delivery check cover a claim observed after loading the old queued rows. Older sending or unresolved-uncertain messages block a new invitation. Evidence and a stopped-worker confirmation precede a separate replacement action; old attempts/content remain unchanged.
- History includes earlier revisions and labels them separately from current details. Old-revision retries cannot send new round content. Updating the round refreshes the read-only history while retaining any unsent preview for explicit discard. A newly recorded booking or changed profile invalidates a queued unbooked invitation before delivery; context is checked again after constructing the mail.

## Verification

All records are synthetic in isolated local PostgreSQL databases. Native headless Brave runs with CSRF enabled and a localhost-only network sandbox. Delivery cases construct the actual mailer with its test transport; no real candidate email, live calendar account, production or financial operation was used.

- **15 new API cases** cover private history without a booking, public-only content, null booking state, historical recovery, absent-link fallback, stale/forged intent, immutable revision histories, in-flight/unknown predecessors, evidenced non-acceptance, a controlled claim change between query and lock, current profile identity/version, later booking, roles/cross-application isolation, rollback refusal, SQL invitation-only event constraints and query-parameter context selection.
- **Three additional delivery cases** prove one unbooked mail after duplicate worker execution, refusal after a booking is created, and a profile-version recheck after mail construction. Combined new/booked/legacy acknowledgement and form cases: **85 examples, zero failures**. These counts overlap.
- Five new native journeys cover public invitation/queue, stale preview, actual round editing and superseded queued mail, unknown-delivery evidence before revised details, and whole-application clearing after employment ends. All fourteen hiring browser files pass **83 examples, zero failures**, after the route guard.
- Final full non-system backend after the routing guard: **5,847 examples, zero failures, 59 pending**. Pending payroll contracts remain unimplemented.
- Required Vite and forced test builds, three-file frontend ESLint and ten-file RuboCop pass; the service/controller Reek check has zero warnings. TypeScript has the same **329 diagnostics**, with zero added/removed entries after normalizing source coordinates. Generic release readiness remains a separate gate.
- Both migrations pass up/down/up on a newly created disposable database. The event constraint is added without immediate validation and validated in the next migration. The existing unique operation index remains unchanged. A populated-history API test proves rollback refuses before DDL. The harness removed only its own database.

The first missing-route test was RED. A missing-link case reproduced a misleading links-below instruction before the reply-only fallback fix. A deliberate round-version dependency removal failed on stale history after a real UI round edit; restoring it passes the native cases. Initial native failures also included a helper incorrectly assuming the open pane collapsed; those are fixture corrections. The routing regression reproduced an unbooked confirmation preview returning 200 before the path-only guard returned 422. The controlled claim test is not proof of two concurrent SMTP workers.

## Decisions and costs

1. Reuse the current outbox with one unbooked invitation operation per saved round revision. Cost: even a harmless saved round change can create a distinct explicitly confirmed operation; history and uncertain-send checks remain mandatory.
2. Invalidate obsolete queued invitations only at replacement confirmation and block sending/unknown predecessors. Cost: operators must resolve uncertainty before sending updated details; Miru does not guess whether SMTP accepted the original.
3. Use saved public round details and current profile identity/version. Cost: editing a booking link requires saving the round again; no live calendar availability is inferred.
4. Refresh history by context version while preserving preview drafts. Cost: users must explicitly discard an obsolete preview; historical message bodies are never rebased.

## Browser evidence and release limits

| Surface | Actual synthetic capture |
| --- | --- |
| Approved invitation without a time | [Mobile preview](unbooked-invitations-20261107/unbooked-invitation-preview-mobile.png) |
| Queued without creating a meeting | [Current round invitation](unbooked-invitations-20261107/unbooked-invitation-queued-mobile.png) |
| Stale preview | [Explicit discard required](unbooked-invitations-20261107/unbooked-invitation-stale-mobile.png) |
| Changed round | [New and invalidated earlier snapshots](unbooked-invitations-20261107/unbooked-invitation-revised-desktop.png) |
| Unknown earlier delivery | [Recorded evidence and separate revised invitation](unbooked-invitations-20261107/unbooked-invitation-reviewed-mobile.png) |
| Employment ended | [Whole candidate page cleared](unbooked-invitations-20261107/unbooked-invitation-revoked-mobile.png) |

Full-page Admin images contain synthetic Admin panels outside the candidate preview. The six images were visually inspected and have a [checksum manifest](unbooked-invitations-20261107/SHA256SUMS). Images are local artifacts, not hosted PR attachments. Current-head council reviews, publication, CI and deployment remain separate gates. This does not complete Task 6 or close #2463.
