# Hiring email intake

Active workspace owners and admins can manage hiring inboxes, retain email files, review applicants, record screening decisions, maintain an assignment library and approve acknowledgements and private candidate forms. Assignment issuance/submission/review, interviews, offers and retention remain later milestones of the applicant-tracking plan.

## Configure an inbox

Open **Hiring → Email inbox → Manage inboxes** and add the mailbox name and source email address. Miru creates a dedicated routing path. The path does not configure forwarding at your email provider.

A trusted relay must send the original RFC822 message to `POST https://your-miru.example/hiring/inbound/<routing-key>` with `Content-Type: message/rfc822`. The endpoint uses HTTP Basic authentication with username `actionmailbox` and the deployment's `RAILS_INBOUND_EMAIL_PASSWORD`. Store the password in the relay's secret configuration; do not put it in URLs, documents or request logs. Miru's other Action Mailbox ingress routes are disabled.

The selected Action Mailbox storage service, or the default Active Storage service when no mailbox service is selected, must be private. Public storage is refused. Keep the existing default background-job queue and its recurring recovery schedule running. Verify actual external forwarding, credentials, private storage and outbound mail on the deployment before describing the inbox as connected.

An admin can also upload an original `.eml` file through **Email inbox**. The limit is 20 MB. Uploading retains the source and queues processing; it does not confirm that processing finished. New applications identified after communication approval may receive the approved acknowledgement.

## Review retained email

Miru retains each source inbox receipt while deduplicating application identity within the workspace. A duplicate delivery or inbox copy does not create another acknowledgement operation. Unverified forwards, conflicting message contents and parser-limit cases need review. A reported message date does not replace the observed receipt time.

For forwarded messages, verified applicant fields start blank. Inspect the source and attachments, then confirm the applicant's name and email before adding or linking an application. An existing application must match the verified email; linking preserves its candidate profile. Acknowledging a manually reviewed applicant is opt-in. Dismissal retains the source and reviewer history.

Original emails and attachments are untrusted downloads. Miru serves them as private attachments and does not execute submitted code, open links or extract archives. The bounded text preview may be incomplete; use the original download when inspecting the complete source.

If a receipt remains pending, **Retry processing** requests another job against its retained source, including when the original transport record has been removed. The request does not override reviewed, accepted or dismissed receipts. Reload to see the actual outcome. A queue failure is reported rather than presented as completed processing.

## Approve communication wording

In **Communication settings**, save the company introduction, client count, working arrangements, working week, overlap, PTO, hiring process and acknowledgement subject/body. Missing client count remains unknown; an explicit 0 is valid. Drafts can be incomplete, but approval requires complete settings and an active owner/admin approver.

Review the saved preview and explicitly approve its version. Editing the wording revokes approval. Approval alone does not send acknowledgements to the previous backlog. For an accepted receipt with no acknowledgement, the explicit queue action shows the current recipient, original reply address, approved wording and version before requesting a send.

## Configure and request a candidate form

Candidate forms start disabled. In **Communication settings → Candidate application form**, enable forms, edit question labels and requiredness, and add custom questions as needed. Custom answers support short or long text, email, URL, number, date, choices and yes/no. Mark private questions restricted; compensation is always restricted. Save and review the configuration, then explicitly approve communications and the form. Any change removes the shared approval. Already issued forms retain their original questions and introduction.

Approved new acknowledgements include a recipient-specific private link. On an application's **Candidate forms** panel, **Create private form link** creates a link for copying; it does not email the candidate. Copy it before leaving the page. Replacing an active link requires confirmation and stops the previous link. **Revoke link** stops access while preserving submitted answers and the resume for authorized hiring administrators. Links expire after 14 days and stop working when the application is hired, rejected or withdrawn.

Anyone holding a link can access that application form; share it privately. The URL token uses a fragment, which the standalone form removes before loading its application. Requests use cookie CSRF protection and do not expose internal notes, feedback or other applications. The candidate page does not load the authenticated app's analytics or replay entrypoint.

Candidates may provide exact compensation amounts with a currency and monthly or annual period. Missing compensation remains missing. Optional choices and compensation can be cleared back to unanswered. A candidate who is not currently employed may omit current role, company and compensation. Resume uploads accept private PDF, DOC and DOCX files up to 5 MiB. Uploads save immediately; answers save on submission. Files are untrusted attachments, not scanned or executed by Miru. Submitted answers cannot be edited; request a new form when a correction is needed.

After an interrupted request, **Refresh form** retrieves the current form status while preserving unsent answers. If submission already succeeded, it shows the accepted answers as read-only. Expired or revoked links clear the displayed personal information. Errors and submission confirmation receive focus so they remain visible on long mobile forms.

Authorized hiring administrators can expand submitted answers, download the private resume and page through previous forms. Submitted contact details do not overwrite the verified candidate profile, and submission does not issue an assessment. Default reviewer data excludes originally restricted, currently restricted and removed questions, including restricted resume metadata. Stale changes require an explicit refresh; settings drafts remain available until discarded.

## Record application screening

The application's **Screening** panel lets an active owner or admin assign an open role and active hiring owner, shortlist, record a request for information, move directly to interview, or prepare a rejection. Existing closed-role or former-owner history is preserved until explicitly changed. Information requests and rejections require a reason. Rejection remains **Rejection pending**; recording a decision does not send an email or issue a coding assignment.

Each decision retains its actor, previous and resulting stage, role/owner snapshots and private reason. History is encrypted, paginated and unavailable to ordinary employees. Submitted candidate identity and original intake details are unchanged. Closed applications cannot be screened again.

If another action changes the application while you edit, saving fails without losing your choices or reason. Use **Reload screening**, review the retained draft against the current application, then save separately. Browsing history pages does not rebase an unsaved decision. Older form-history responses cannot reset a newer displayed stage. A lost save response does not authorize an automatic duplicate decision: reload the retained history first.

Assignment issuance/review and candidate information-request/rejection communications remain required work in the full ATS plan. The screening history in this increment is internal only.

## Maintain the assignment library

Open **Hiring → Assignment library**, enter a task title and choose **Create task draft**. Set its open role (or any role), skills, experience, instructions, assessment criteria, expected effort in whole minutes, submission method and AI-use policy. Incomplete drafts are allowed. **Save draft** saves a new version; **Approve saved version** is a separate action and requires complete terms. This is approval of the task wording, not an assignment or candidate decision.

Any later edit returns the task to draft. **Task revision history** retains the earlier wording, effort, policy, role title, status and actor in encrypted snapshots. **Archive saved task** removes its approved status while keeping that history. Search by title, skills or experience, filter by role/status and page through the library and revisions.

Stale saves retain your draft. **Reload saved task** asks for explicit discard when you have unsaved changes. A failed read can be retried without leaving the editor. Browsing history does not adopt a newer write version for an unsaved edit. After a connection failure during creation, check the library before creating another draft.

This increment does not issue tasks, send candidate messages, accept assignment uploads or grant reviewers access. Those workflows, mandatory contribution/AI disclosures, assessment dimensions and progression controls remain required in Task 4.

## Understand attempts and delivery reviews

| State | Meaning |
| --- | --- |
| Queued | The operation is retained for background delivery; a queue error remains visible. |
| Sending | A worker has claimed the attempt. |
| Accepted by mail server | The mail transport reported acceptance. This does not prove inbox delivery. |
| Not sent | Validation blocked the send or the transport definitively rejected it. |
| Delivery unknown | The process or transport could not establish the result. Miru does not automatically resend. |

Each attempt retains its recipient, reply address, subject/body, approved settings version, requesting actor and observed timestamps. A retry creates a new numbered attempt under the same acknowledgement; it does not replace the original snapshot. Changed approval, recipient, permission, inbox or application status is checked again before SMTP. A later acceptance on an earlier attempt blocks a queued retry.

Before retrying a confirmed failure, fix its cause, review the current approved preview and explicitly queue the new attempt. Closed applications cannot receive an acknowledgement.

For an unknown outcome, inspect provider records and the original job's status. Select a verified outcome and record evidence. Non-acceptance also requires confirming that the original worker has stopped and cannot resume. Missing evidence or an inconclusive provider search is not proof of rejection; leave the outcome unresolved in that case.

Generic SMTP errors also remain unknown: an error while closing the connection can occur after the server accepted the message, and the exception does not retain the protocol phase. This includes an SMTP authentication error. A provider-specific inactive-recipient rejection is a known failure. Verify provider evidence before retrying any unknown result, even when its error code appears to indicate rejection.

Recording a delivery review does not send an email or invent a mail-server acceptance timestamp. Operator reports are labelled separately from Miru's observed result, including a later conflicting result. A recorded review and its evidence are final and cannot be edited in this milestone. An operator-confirmed non-acceptance permits a separate retry request with fresh approval and recipient confirmation. SMTP cannot guarantee exactly-once delivery after an ambiguous failure: an incorrect external confirmation can cause a duplicate email.

Source retention has no automatic expiry policy in this milestone. Review the complete applicant-tracking retention work before broad production use.

Newly uploaded email objects are removed if intake rolls back, including failures inside an enclosing admin transaction. Reused transport objects remain available to their existing receipts.
