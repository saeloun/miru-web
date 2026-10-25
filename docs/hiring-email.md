# Hiring email intake

Active workspace owners and admins can manage hiring inboxes, retain email files, review applicants and approve acknowledgements. This is the email-intake milestone of the applicant-tracking plan; candidate forms, assessments, interviews, offers and retention remain later work.

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
