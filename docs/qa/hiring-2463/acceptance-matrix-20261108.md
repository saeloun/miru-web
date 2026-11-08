# Applicant tracking acceptance matrix — 8 November 2026

Source: fresh read of [issue #2463](https://github.com/saeloun/miru-web/issues/2463), still **OPEN**, last updated `2026-10-22T15:08:16Z`; [approved implementation design][design] and the checkpoint reports below. This is an evidence audit, not issue completion or launch approval.

Evidence levels:

- `localverified`: a named synthetic local check/report supports the stated behavior. This does not establish a live integration or production behavior.
- `implementedunverified`: relevant code exists, but the required end-to-end/browser or current-source evidence is incomplete.
- `externalsetupunverified`: deployment, provider configuration, organization policy or owner approval needs live confirmation.
- `missing`: no implementation or adequate acceptance proof was found for the stated requirement.

Snapshot: Task 8 (`7a0620c22`) and Task 9 (`99e63304b`) are committed local checkpoints. The [final functional-gap report](assignment-notes-journey-20261108.md) records approved assignment emails, scoped interviewer notes and one continuous hiring/onboarding/document journey. Combined checks pass **860 related backend** and **160 native Brave** before the final review remedies; the final whole non-system backend repeat passes **6,127 examples with zero failures and 59 pending**, plus seven focused Brave remedy cases. Counts overlap and must not be summed. Pending payroll contracts are not completed features. Exact-head CI and deployment remain separate release gates.

## 1. Application intake and acknowledgement

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Identify applications arriving at hello@, vipul@ and admin@saeloun.com | [Email intake][email-code], authenticated relay and configurable mailbox routes; synthetic relay→persisted queue→separate workers→Mailpit verified in [intake report][email-qa]. Actual forwarding/routes/credentials for all three named inboxes are not verified. | externalsetupunverified |
| Candidate profile retains application email | [Email intake][email-code], retained source; `email_intake_spec.rb`, `receipts_spec.rb`; [report][email-qa]. | localverified |
| Retain attachments, originating mailbox and received date | Private RFC822/attachment downloads, source provenance and byte checks; the same [report][email-qa] and request specs. | localverified |
| Deduplicate a person across mailboxes while preserving applications/history | Company-normalized email identity, receipt/operation uniqueness, multi-mailbox/tenant/race checks in `spec/services/hiring/{intake,email_intake}_spec.rb`; [report][email-qa]. No identity merge across companies. | localverified |
| Admin manually adds a candidate | [Intake][intake-code]; `applications_spec.rb`, `hiring_intake_spec.rb`; [manual report][manual-qa]. | localverified |
| Admin marks an email as an application | Retained upload and explicit review/link/accept controls; `receipts_spec.rb`, `hiring_inbox_spec.rb`; [report][email-qa]. | localverified |
| One acknowledgement operation/application, receipt confirmation and next steps | Approved [acknowledgement][ack-code], frozen numbered attempts; duplicates and actual local transport verified in [report][email-qa]. Ambiguous SMTP requires evidence and a separate retry; exactly-once external delivery is not claimed. | localverified |
| Uncertain classification goes to Admin review | Conservative MIME/classification review, manual identity confirmation and original retained source; `email_intake_spec.rb`, `hiring_inbox_spec.rb`; [report][email-qa]. | localverified |

## 2. Initial email and candidate information

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Editable, Admin-approved introduction and current client count | [Settings][settings-code], [configuration][configure-code], approved renderer; settings/request/browser coverage in [report][email-qa]. The real introduction/count remain launch confirmations below. | localverified |
| Remote work/Pune office wording | Editable `working_arrangements` snapshot, not a hardcoded company fact; [settings][settings-code], [report][email-qa]. Admin must approve actual wording. | localverified |
| 40-hour working week | Editable `working_week`, included in approved email snapshot; same evidence. Exact engagement wording remains a launch confirmation. | localverified |
| Four-hour overlap with relevant US/European team; exact role/project hours | Editable `overlap`, approved snapshot; same evidence. No role/project overlap schedule was verified or invented. | localverified |
| 16 hours PTO/month subject to applicable engagement policy | Editable `pto`, approved snapshot; same evidence. Employee/consultant eligibility and wording remain unconfirmed. | localverified |
| Hiring-process overview | Editable `hiring_process` and acknowledgement text; same evidence. | localverified |
| Secure form link in acknowledgement | Expiring/revocable fragment capability, CSRF exchange and actual acknowledgement→form→resume→submission journey; [form report][forms-qa], `form_acknowledgement_spec.rb`, `hiring_portal_spec.rb`. | localverified |
| Full name, email, phone, location, time zone | [Form schema/validation][form-code]; `form_configuration_spec.rb`, `hiring_portal_spec.rb`; [report][forms-qa]. | localverified |
| Position/area of interest | Form role field and Admin open-role association; same form evidence, screening tests. | localverified |
| Total/relevant experience, skills and work summary | Versioned schema and answers; same form evidence. Missing values remain missing. | localverified |
| LinkedIn profile URL | Validated form field; same form evidence. No remote profile fetching is performed. | localverified |
| Current role/company and not-currently-employed choice | Explicit employment status and optional current fields; same form evidence. | localverified |
| Notice duration and earliest joining date | Notice/availability fields; same form evidence. | localverified |
| Current compensation: amount/currency/monthly-or-annual | Typed sensitive fields; currency/period/optional-clear checks; same form evidence. | localverified |
| Expected compensation: amount/currency/monthly-or-annual | Same field validation and sensitive projection checks; same form evidence. | localverified |
| Resume upload | Private bounded uploads, lost-response/retry and exact-byte authorized downloads; [form report][forms-qa], `hiring_application_forms_spec.rb`, `hiring_portal_spec.rb`. | localverified |
| GitHub/portfolio/project links where available | Optional work-sample URL fields; [form][form-code] and [form report][forms-qa]. | localverified |
| Working-hours/overlap availability | Configurable availability answer; same form evidence. Actual required windows need Admin approval. | localverified |
| Admin edits email/form/required fields without code | Draft/save/approval, versioned field IDs and sensitivity, stale-change checks; `form_configuration_spec.rb`, `hiring_application_forms_spec.rb`; [report][forms-qa]. | localverified |
| Compensation visible only to authorized hiring users | Encrypted sensitive answers and explicit projections; [form report][forms-qa], [interview report][interviews-qa], `interviews_spec.rb`. | localverified |

## 3. Application screening

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Admin reviews resume, responses and application history | [Form report][forms-qa] and [manual intake report][manual-qa]; authorized byte-equal downloads and paginated history. | localverified |
| Assign active hiring owner and open role | [Screening][screening-code], `screenings_spec.rb`, `hiring_screening_spec.rb`; [screening report][screening-qa]. | localverified |
| Shortlist | Same service/specs/report; explicit versioned decision. | localverified |
| Request additional information | Same evidence for an internal Information Pending record. This does not prove an additional-information email delivery flow. | localverified |
| Reject or move directly to interview | Screening and explicit rejection-pending transition; `screenings_spec.rb`, [screening report][screening-qa], later finalized delivery in [decision report][decision-mail-qa]. | localverified |
| Form submission does not automatically issue an assignment | Explicit regression in `spec/services/hiring/assignments_spec.rb` and [assessment report][assessment-domain-qa]. | localverified |

## 4. Coding assignment and review

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Assignment library by role, skill and experience | [Templates][templates-code], `assignment_templates_spec.rb`, `hiring_assignment_library_spec.rb`; [library report][library-qa]. | localverified |
| Issue instructions, criteria, effort, deadline and submission method | Immutable approved revision, explicit zoned deadline and current reviewer; [assignments][assignments-code], `assignments_spec.rb`, `hiring_assessment_review_spec.rb`; [assessment report][assessment-qa]. | localverified |
| Repository link, files, setup instructions and approach explanation | Private candidate portal; `spec/requests/hiring_assignments_spec.rb`, `hiring_assessment_portal_spec.rb`; [domain report][assessment-domain-qa]. | localverified |
| Require own contribution/understanding; not entirely AI-generated | Mandatory own-contribution statement plus designated human review/walkthrough; same assessment evidence. An attestation does not independently prove authorship. Actual assignment AI policy needs Admin confirmation. | localverified |
| Disclose AI use, tools/how used and candidate-completed parts | Explicit boolean preserves false; true requires tools/usage/assisted-parts answers; [domain report][assessment-domain-qa] and portal tests. | localverified |
| Designated reviewer assesses correctness, quality, tests, maintainability, problem solving and understanding | Six rubric dimensions, assignment-bound reviewer access and saved history; [review report][assessment-qa], `spec/requests/hiring_assignments_spec.rb`, `hiring_assessment_review_spec.rb`. | localverified |
| Walkthrough or small follow-up change; no AI-detector score as proof | Clarification requires a walkthrough/follow-up/revision request. No detector/score/remote execution is introduced; [review report][assessment-qa]. | localverified |
| Treat submitted code as untrusted; isolate execution | Opaque private byte-checked downloads; no automatic fetch, extraction or execution; [domain report][assessment-domain-qa]. Any human execution environment remains operator setup and is not certified by these tests. | localverified |
| Reviewer recommends Pass, Fail or Clarification Required | Recorded immutable review, all three recommendations; [review report][assessment-qa], `hiring_assessment_review_spec.rb`. | localverified |
| Admin advances, rejects or requests revised submission | Explicit decision after review; clarification→revision→resubmission→Pass→Admin interview, Fail→pending rejection and cancellation verified in [review report][assessment-qa]. | localverified |

## 5. Interview panel and round configuration

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Panel expertise, availability and calendar booking links | Company-scoped active profiles and safe URLs; `panel_members_spec.rb`, `hiring_interviews_spec.rb`; [report][interviews-qa]. Calendar provider readiness is separate. | localverified |
| Any number of rounds including rounds 1–3 | Paginated arbitrary numbered rounds; [interviews][interviews-code], `interviews_spec.rb`; [report][interviews-qa]. | localverified |
| Type, duration, interviewer/panel and feedback form per round | Issued snapshots of criteria/questions/panel; same evidence, later [feedback report][feedback-qa]. | localverified |
| Add, skip, repeat and reassign | Explicit versioned actions preserve completed rounds and revoke stale grants; same report/browser evidence. | localverified |
| Initial Admin screening call | Supported round configuration and browser case; same evidence. | localverified |

## 6. Interview scheduling and handover

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Interviewer receives candidate name/resume/basic application details | Assigned-staff [handover][handover-code], private authorized downloads; `interviews_spec.rb`, `hiring_interviews_spec.rb`; [report][interviews-qa]. | localverified |
| Role, relevant experience, LinkedIn and work samples | Explicit permitted form projection; same service/spec/report. Sensitive custom fields remain excluded. | localverified |
| Assignment submission and review when present | Latest submitted assessment and saved review in scoped handover; same report and assessment tests. | localverified |
| Previous interview feedback | Earlier-round feedback only for the currently assigned next reviewer; `hiring_feedback_spec.rb`; [feedback report][feedback-qa]. | localverified |
| Relevant hiring notes | Explicit optional encrypted round notes are visible only to assigned interviewers, separate from generic Admin notes and candidate messages. Seven request checks and an actual edit→assigned view→revocation browser journey pass; notes-only edits preserve the meeting. [Proof](assignment-notes-journey-20261108.md). | localverified |
| Round purpose, assessment criteria and feedback form | Round snapshot and feedback request in assigned review; [interview][interviews-qa] and [feedback][feedback-qa] reports. | localverified |
| Candidate invitation: round/interviewer/duration/preparation | Approved [interview communication][interview-mail-code] and explicit preview/confirmation; `interview_messages_spec.rb`, `unbooked_invitations_spec.rb`; [booked][interview-mail-qa] and [unbooked][unbooked-qa] reports. | localverified |
| Assigned interviewer's booking link | Current saved panel link and reply fallback when absent; [unbooked report][unbooked-qa]. Live ownership, availability and provider access are unverified. | localverified |
| Booking/rescheduling/cancellation instructions | Frozen public booking facts and distinct message kinds; [booked message report][interview-mail-qa], `hiring_interview_messages_spec.rb`. | localverified |
| Record calendar meeting details where available | Owned read-only Google Calendar import validates attendees, event version and UTC instants; `calendar_import_spec.rb`, `calendar_bookings_spec.rb`, `hiring_scheduling_spec.rb`; [report][calendar-qa]. Real provider credentials/event import remain unverified. | externalsetupunverified |
| Manual scheduling fallback | Saved candidate-zone booking, reschedule/cancel and stale-version checks; `bookings_spec.rb`, `hiring_scheduling_spec.rb`; [report][scheduling-qa]. | localverified |
| Candidate-zone dates and times | Explicit IANA zone, DST ambiguous/nonexistent-time handling and UTC persistence; `interview_time_spec.rb`; [scheduling][scheduling-qa] and [calendar][calendar-qa] reports. | localverified |

## 7. Interview feedback and progression

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Post-interview prompt and pending reminder | Optional independently approved prompt/overdue operations, activation cutoff excludes old backlog; `feedback_notifications_spec.rb`; [report][feedback-notices-qa]. Live scheduler/provider readiness is separate. | localverified |
| Interview date and attendance | Actual date, attended/no-show and late history; [feedback][feedback-code], `interview_feedback_spec.rb`, `hiring_feedback_spec.rb`; [report][feedback-qa]. | localverified |
| Topics and assessment notes | Required assessment fields and immutable submitted answers; same evidence. | localverified |
| Skills and communication assessment | Explicit rubric fields, no-show does not fabricate answers; same evidence. | localverified |
| Strengths, concerns and supporting examples | Protected saved details and evidence; same evidence. | localverified |
| Pass, Fail, Hold or Additional Round Required | Four recorded recommendations and explicit Admin decisions; same evidence and [decisions][decisions-qa]. A recommendation does not automatically select a new round. | localverified |
| Internal feedback excluded from candidate emails | Explicit public serializers and actual local payload checks; [feedback report][feedback-qa], [interview][interview-mail-qa], [rejection][decision-mail-qa] and [offer][offer-mail-qa] message reports. | localverified |
| Pass notifies Admin of readiness for next stage | Deduplicated `feedback_received` to approving active Admin; [notice report][feedback-notices-qa], `feedback_notifications_spec.rb`. | localverified |
| Admin chooses next round/interviewer and sends booking link | Explicit round creation/panel action plus approved invitation; [interviews][interviews-qa], [unbooked invitations][unbooked-qa]. Verified split journeys, not one continuous full ATS run. | localverified |
| Next interviewer receives details, assignment review and previous feedback | Scoped handover plus previous-round feedback grant; [interviews][interviews-qa], [feedback][feedback-qa]. | localverified |
| Fail moves to Rejection Pending and prepares rejection | Feedback/assessment failure records pending stage; draft preview is separate from sending; [decisions][decisions-qa], [decision communication][decision-mail-qa]. | localverified |
| Rejection sends only after Admin confirms | Immutable finalization, separate preview/queue; `decision_messages_spec.rb`; [actual local SMTP report][decision-mail-qa]. | localverified |
| Configurable automatic rejection after finalized fail | Explicit approved opt-in and activation cutoff, no old backlog; `decision_notifications_spec.rb`; [report][decision-mail-qa]. Actual organization opt-in remains unconfirmed. | localverified |
| Record decision, reason and delivery status | Encrypted immutable decisions and numbered delivery history; [decisions][decisions-qa], [communication][decision-mail-qa]. Queued, accepted and unknown remain distinct. | localverified |
| Hold reason, owner and follow-up date | Explicit owner/date/zone and immutable decision; `decisions_spec.rb`, `hiring_decisions_spec.rb`; [report][decisions-qa]. | localverified |
| Notify Admin when hold follow-up is due | Independently approved due-hold notice, permission/approval/due checks and no backlog; [report][decision-mail-qa], `decision_notifications_spec.rb`. | localverified |

## 8. Selection and onboarding

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Final-round Admin selection | Explicit immutable selected decision, separate from interviewer recommendation; [decisions][decisions-qa], `decisions_spec.rb`. | localverified |
| Approved compensation and proposed joining date | Encrypted preparing terms, versioned approval, currency/period/date validation; [offers][offers-code], `offers_spec.rb`, `hiring_offers_spec.rb`; [report][offers-qa]. No implicit payroll change. | localverified |
| Preparing/Sent/Accepted/Declined/Expired states | Immutable issued terms, private expiring/revocable response and distinct transport delivery; [offers][offers-qa], [approved offer mail][offer-mail-qa]. Offer Sent means issued, not mail delivery. | localverified |
| Admin initiates onboarding after acceptance | Exact accepted-source preview and explicit confirmation, replay/race protection; [onboarding][onboarding-code], `onboarding_spec.rb`, `hiring_onboarding_spec.rb`; [report][onboarding]. | localverified |
| Reuse approved information for employee or consultant profile | Existing profile preserved; new employment via explicit emailed invitation acceptance, salaried/contractor cases and protected source boundaries; [report][onboarding]. | localverified |
| Initiate appropriate agreement workflow | Exact profile prefill, actual PDF uploads, signature-field placement and saved generic draft; [report][onboarding], `hiring_onboarding_spec.rb`. No external envelope send or completed signature is established. | localverified |

## 9. Candidate pipeline and dashboard

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Received → Information Pending → Screening → Assignment Assigned → Assignment Review → Interview → Final Decision → Offer → Hired | [Stage model][application-code], tested transitions in intake/screening/assignment/interview/decision/offer/onboarding reports and the same-candidate continuous journey. Aggregate reporting is committed in Task 9. | localverified |
| On Hold, Rejected, Withdrawn and No-show | Existing stage enumeration; decision, screening and attendance checks in the same reports. Feedback attendance No-show and application stage are distinct recorded facts. | localverified |
| Role/stage/interviewer/experience/application-date filters | [Pipeline][pipeline-code], 13 service/request checks and four Brave journeys, including former interviewers and private POST search; independent Playwright filtering. [Task 9 proof](pipeline-retention-20261108.md). | localverified |
| Pending reviews, overdue assignments, upcoming interviews and missing feedback | Pipeline service queue cases and real paginated/filtered browser queue selection; [Task 9 proof](pipeline-retention-20261108.md). | localverified |
| Search candidate profiles | Existing bounded name/email search and pagination, `applications_spec.rb`, `hiring_intake_spec.rb`; [manual report][manual-qa]. | localverified |
| Review communication history | Receipt/assignment/interview/decision/offer histories and Admin-only notice attempts, explicit evidence and separate retry. Feedback recovery passes 21 backend/six Brave examples; [assignment delivery proof](assignment-notes-journey-20261108.md) adds current assignment history. | localverified |
| Application volumes, stage conversion, rejection reasons and time to hire | Transition-derived metrics cover empty/missing/withdrawn/repeated-round data and stable pagination. Four Brave cases verify the report; missing history is explicit. [Task 9 proof](pipeline-retention-20261108.md). | localverified |

## 10. Permissions, communication and audit controls

| Issue requirement | Evidence and limit | Level |
| --- | --- | --- |
| Admin controls stages/assignments/interviewers/decisions/communications | Active workspace/membership checks and versioned scoped APIs across the reports above; revocation/browser clearing checks. [Policies][policy-code], hiring request specs. | localverified |
| Interviewers see only assigned candidates and necessary assessment data | Scoped reviewer queues, grant revocation and rechecks after private storage reads; [assignment][assessment-qa], [interview][interviews-qa] and [feedback][feedback-qa] reports. | localverified |
| Compensation hidden unless explicitly granted | Per-round interviewer compensation grant; remaining sensitive answers/Admin notes excluded; `interviews_spec.rb`; [report][interviews-qa]. | localverified |
| Candidates access only own forms/submissions/scheduling details | Application-bound expiring/revocable portals and public-only invitation snapshots; [forms][forms-qa], [assessment][assessment-domain-qa], [interview messages][interview-mail-qa]. Live booking-provider access rules remain external setup. | localverified |
| Stage-change/feedback/decision/email audit trail | Immutable encrypted domain events and attempt snapshots, actor/time/IDs; private bodies kept out of ordinary audit logs. Related request/privacy specs and reports above. No external SIEM/monitoring proof. | localverified |
| Editable acknowledgement template | Settings draft/approval and real relay/queue/local SMTP; [report][email-qa]. | localverified |
| Editable assignment email template | Optional approved subject/body, explicit preview/confirmation and existing outbox delivery; issuance itself sends no email. Eligibility/version/recipient checks, uncertainty/evidence/separate retry and exact emailed private link pass 26 backend/four Brave examples. [Proof](assignment-notes-journey-20261108.md). | localverified |
| Editable interview invitation templates | Approved booked/unbooked candidate templates; [booked][interview-mail-qa], [unbooked][unbooked-qa] reports. | localverified |
| Editable reminder templates | Approved reviewer prompt/overdue and hold follow-up templates; [internal notices][feedback-notices-qa], [decision messages][decision-mail-qa]. | localverified |
| Editable rejection and offer templates | Approved preview/confirmation and actual loopback SMTP; [rejection][decision-mail-qa], [offer][offer-mail-qa] reports. | localverified |
| Prevent duplicate operations; flag failed/unknown delivery for Admin | Durable unique roots/attempts; uncertainty never automatically retries. New internal-feedback recovery adds recorded evidence, stopped-worker requirement and separately confirmed retry; 21 backend/six browser cases. Provider evidence must be truthful; external exactly-once delivery is not guaranteed. | localverified |
| Configurable retention/deletion controls | [Retention service][retention-code], settings, job and explicit Admin review/confirmation; 52 focused backend checks and three Brave journeys pass. Automatic deletion is disabled until configured and approved. [Task 9 proof](pipeline-retention-20261108.md). | localverified |
| Deletion removes private content/blobs/capabilities, leaving non-identifying evidence | Actual blob purge, row/source locks, shared mail/other tenants, employee/legal preservation and durable queue rollback are tested. Three Brave journeys and independent Playwright verify deletion/privacy. Backup erasure/compliance remain separate. [Task 9 proof](pipeline-retention-20261108.md). | localverified |

## Admin confirmations required before launch

These are **externalsetupunverified**, even where the editing/approval mechanics are locally verified. Synthetic fixture values, including client count, do not approve real company policy.

| Owner confirmation | Required record |
| --- | --- |
| Company introduction and current client count | Real approved company settings and preview. |
| Remote/Pune arrangements and 40-hour week | Approved engagement-specific wording. |
| Four-hour US/European overlap | Exact windows per role/project and how candidates receive them. |
| 16-hour monthly PTO | Eligible employment/consultant policy and accurate wording. |
| Assignment effort limits/deadlines/AI use | Approved task versions, allowed assistance and review expectations. |
| Interview feedback deadlines | Approved values and operating owner; fixture deadlines are not policy. |
| Rejection/feedback/hold automation | Independent explicit opt-ins, inbox/template approval and activation boundaries. |
| Candidate retention | Approved period, legal hold/employee-record expectations and cleanup operations. |

## Closure evidence and remaining release checks

- **localverified**: one continuous synthetic relay→actual persisted queue/local SMTP→form/resume→assignment/review→interview/feedback→accepted offer→consultant account/password→generic two-PDF field-placement journey. Six finished queue jobs, four local deliveries and five private-download hashes are retained with [screenshots/proof](assignment-notes-journey-20261108.md).
- **localverified**: approved manual assignment email and explicitly scoped interviewer notes, as recorded above. Neither exposes generic Admin notes or automatically sends on issuance.
- **localverified**: integrated Task 9 behavior and source fingerprints. Combined827 backend/154 browser results and three final warning checks are terminal passes; the source manifest is retained with the Task 9 report. This is separate from the missing whole-branch release audit.
- **externalsetupunverified**: all three real mailbox forwards/routes, calendar account/event integration, real sending provider/scheduler and real external agreement signing. No payment or payroll execution was requested or demonstrated.
- **missing**: fresh whole-branch Rails/security/design review, current actionable CodeRabbit disposition, exact-head CI and immutable release-image proof for the final assembled branch. Earlier checkpoint CI does not certify this working tree. Existing baseline TypeScript diagnostics and generic-checker limitations remain explicit in [onboarding evidence][onboarding].
- **externalsetupunverified**: deployment, private-production-difference preservation, live browser verification, operational monitoring, backup recovery and any compliance claim. No issue closure, provider success or production readiness follows from this matrix.

[design]: ../../superpowers/specs/2026-10-25-applicant-tracking-design.md
[manual-qa]: README.md#verified-locally-on-25-october-2026
[email-qa]: README.md#email-intake-and-acknowledgements
[forms-qa]: README.md#private-candidate-forms
[screening-qa]: README.md#screening-increment--task-4-remains-in-progress
[library-qa]: README.md#assignment-library-increment--task-4-remains-in-progress
[assessment-qa]: README.md#task-4-admin-and-designated-reviewer-interfaces
[assessment-domain-qa]: README.md#task-4-assignment-domain-and-candidate-portal-increment
[interviews-qa]: interviews-20261107.md
[scheduling-qa]: scheduling-20261107.md
[calendar-qa]: calendar-20261107.md
[feedback-qa]: feedback-20261107.md
[feedback-notices-qa]: feedback-notifications-20261107.md
[interview-mail-qa]: interview-messages-20261107.md
[unbooked-qa]: unbooked-invitations-20261107.md
[decisions-qa]: decisions-20261107.md
[decision-mail-qa]: decision-messages-20261108.md
[offers-qa]: offers-20261108.md
[offer-mail-qa]: offer-email-20261108.md
[onboarding]: onboarding-20261108.md
[notice-shots]: notice-recovery-20261108/
[intake-code]: ../../../app/services/hiring/intake.rb
[email-code]: ../../../app/services/hiring/email_intake.rb
[ack-code]: ../../../app/services/hiring/acknowledgement.rb
[settings-code]: ../../../app/models/hiring_setting.rb
[configure-code]: ../../../app/services/hiring/configure.rb
[form-code]: ../../../app/services/hiring/form.rb
[screening-code]: ../../../app/services/hiring/screening.rb
[templates-code]: ../../../app/services/hiring/assignment_templates.rb
[assignments-code]: ../../../app/services/hiring/assignments.rb
[interviews-code]: ../../../app/services/hiring/interviews.rb
[handover-code]: ../../../app/services/hiring/interview_handover.rb
[interview-mail-code]: ../../../app/services/hiring/interview_communication.rb
[feedback-code]: ../../../app/services/hiring/feedback_submission.rb
[offers-code]: ../../../app/services/hiring/offers.rb
[onboarding-code]: ../../../app/services/hiring/onboarding.rb
[application-code]: ../../../app/models/hiring_application.rb
[pipeline-code]: ../../../app/services/hiring/pipeline.rb
[retention-code]: ../../../app/services/hiring/retention.rb
[policy-code]: ../../../app/policies/hiring_policy.rb
