# Approved offer email — Task 8 in progress

This adds the editable offer-email workflow required by [Sonam's ATS issue #2463](https://github.com/saeloun/miru-web/issues/2463), following the [private-offer checkpoint](offers-20261108.md). Explicit accepted-offer onboarding into an employee/consultant profile and generic agreement upload/signing remains unfinished; Task 8 stays unchecked. No production delivery is established by this report.

## Behavior

- Admin edits the offer subject/body in existing communication settings and explicitly approves the configuration. Old settings remain valid with these optional fields absent; sending requires both approved fields and an enabled company reply inbox.
- An issued, live, unanswered offer can receive a manually previewed and confirmed email through the existing encrypted outbox. Issuing an offer still sends no email automatically. Offer Sent means the terms were issued; email history separately shows queueing, transport acceptance, failure or unknown delivery.
- Candidate email contains approved wording, the submitted candidate name and its private fragment link. It does not automatically include compensation, selection reasons, assessments or internal notes. The URL comes from configured mailer options, not request Host; forced SSL produces HTTPS. The confirmed intent includes the URL's SHA256 digest, preventing a silent link change between preview, queueing and delivery.
- Current offer/source/selection, application/offer versions, approved setting, queue actor, inbox and recipient are rechecked. Acceptance, decline, expiry, revocation or source changes block unsent work. An already issued company offer can be emailed by another currently authorized Admin after its original issuer leaves the role.
- Exact root intent can recover the original operation after a lost response, including after acceptance; it never queues another email. Answered/unavailable offers expose delivery history and evidence review while disabling composition/retry. Unknown delivery requires provider/local evidence and confirmation that the original worker cannot resume before a separate explicit retry.
- The shared candidate-message UI/controller/queue/reconciliation behavior is reused. Scoped offer-mail denial clears the whole candidate page, including compensation and sibling notes. Historical snapshots stay encrypted and immutable.

## Verification

- All hiring services/requests and schedule checks: **414 examples, 0 failures**. The offer-email API/delivery scope passes **23/0**, overlapping the full run. It covers approval, URL configuration and request-host isolation, immutable root recovery, route identity, foreign/staff/revoked access, template/inbox changes, malformed wording, expiry/revocation/response/source/selection guards, separate queue-actor authority, alternate Admin after issuer departure, and unknown-delivery recovery.
- All 19 native hiring Brave files pass: **111 examples, 0 failures**, including five new offer-email journeys. CSRF is enabled and console errors are checked. The journeys cover settings save/approve, desktop/mobile preview and delivery, stale wording preservation, evidence review after acceptance, readonly history and full-page denial.
- A real loopback TCP SMTP server captures one DATA command and the RFC message for the intended synthetic recipient. The decoded payload excludes compensation/internal markers. Brave opens the exact URL extracted from that captured message, shows the issued terms and records candidate acceptance. Returning to Admin history shows **Accepted by mail server** and disabled composition. This proves local transport acceptance, not inbox delivery or a production provider integration.
- A controlled late-acceptance probe changes the offer after mail construction but before the final transport check; the email is suppressed. This is a guard-boundary probe, not concurrent SMTP or an atomicity guarantee across PostgreSQL and mail transport.
- Migration up/down/up passes in an owned disposable database loaded from the previous committed schema. Both message constraints are validated; original-operation uniqueness remains valid. Actual SQL rejects an offer-kind/decision-event mismatch. Recorded offer history makes rollback refuse before DDL, with constraint definitions unchanged. The owned database was removed and its absence independently checked.
- Initial API checks failed before the route/template fields existed. A later retryability regression exposed an answered offer being marked retryable; the domain context guard fixes it. The native journey initially failed on its absent offer-message control, then passed after the UI integration. No test or checker was weakened.
- Required development/test Vite builds, frontend lint and fifteen-file Ruby lint pass. TypeScript retains **329 diagnostics**, with zero normalized additions/removals. Twenty source/test/config/schema fingerprints identify the checked files. Eight full-page synthetic captures were visually reviewed and checksummed.

The generic release checker remains a separate gate: the existing TypeScript failures and its unsupported Ruby runner do not replace the explicit RSpec evidence above. Exact-commit reviews, CI and production verification are still required.

## Captures

- [Approved preview](offer-email-20261108/offer-email-preview-desktop.png)
- [SMTP acceptance](offer-email-20261108/offer-email-smtp-accepted-desktop.png)
- [Candidate acceptance from emailed link](offer-email-20261108/offer-email-candidate-accepted-mobile.png)
- [Answered offer history](offer-email-20261108/offer-email-answered-history-mobile.png)
- [Editable approved wording](offer-email-20261108/offer-email-approved-wording-mobile.png)
- [Preserved stale preview](offer-email-20261108/offer-email-stale-preview-mobile.png)
- [Unknown-delivery review after response](offer-email-20261108/offer-email-reviewed-after-response-mobile.png)
- [Permission denial](offer-email-20261108/offer-email-permission-denied-desktop.png)
- [SHA256SUMS](offer-email-20261108/SHA256SUMS)

These are local repository artifacts, not hosted GitHub attachments. No real recipient, external email provider, payment, production data or server configuration changed. Continue with explicit onboarding/profile/agreement handoff, then reporting/retention and the final whole-branch issue/release audit.
