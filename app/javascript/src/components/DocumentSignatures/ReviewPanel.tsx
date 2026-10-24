import React, { useEffect, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { endpoint, failureMessage, quiet } from "./api";
import ReviewComments from "./ReviewComments";
import type { ReviewSummary, SigningRequest } from "./types";

export default function ReviewPanel({
  record,
  disabled,
  busy,
  companyId,
  onRecordChange,
  onBusyChange,
  onDirtyChange,
  reload,
}: {
  record: SigningRequest;
  disabled: boolean;
  busy: boolean;
  companyId: number | string;
  onRecordChange: (record: SigningRequest) => void;
  onBusyChange: (busy: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  reload: () => void;
}) {
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("manual");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const path = `${endpoint(record.id)}/review`;
  const people = record.revision.recipients.filter(
    person => person.role !== "cc"
  );

  const recipientId = people.some(person => person.id === recipient)
    ? recipient
    : people[0]?.id || "";
  const historical = record.revision.id !== record.current_revision_id;
  const editable =
    !historical &&
    ["draft", "under_review", "changes_requested", "approved"].includes(
      record.revision.status
    );

  useEffect(() => {
    onDirtyChange(Boolean(body.trim() || note.trim()));

    return () => onDirtyChange(false);
  }, [body, note, onDirtyChange]);

  useEffect(() => {
    const controller = new window.AbortController();
    Api.get(path, {
      ...quiet,
      signal: controller.signal,
      params: { revision_id: record.revision.id },
    })
      .then(({ data }) => setReview(data.review))
      .catch(failure => {
        if (!controller.signal.aborted) setError(failureMessage(failure));
      });

    return () => controller.abort();
  }, [path, record.revision.id, record.lock_version]);

  const change = async (
    action: string,
    attributes: object = {},
    remove = false
  ) => {
    onBusyChange(true);
    setError("");
    setNotice("");
    const payload = {
      signature_request: {
        company_id: companyId,
        lock_version: record.lock_version,
        revision_id: record.revision.id,
        content_digest: record.revision.content_digest,
        ...attributes,
      },
    };
    try {
      const { data } = remove
        ? await Api.delete(`${path}/${action}`, { ...quiet, data: payload })
        : await Api.post(`${path}/${action}`, payload, quiet);
      setReview(data.review);
      if (action === "comments") setBody("");

      if (action === "approval") {
        setNote("");
        setConfirmed(false);
      }
      onRecordChange(data.signature_request);
      setNotice(
        action === "invitations"
          ? "Review invitation queued"
          : action === "approval"
          ? "Approval recorded for this version"
          : "Review updated"
      );
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      onBusyChange(false);
    }
  };

  const loadOlder = async () => {
    if (!review) return;
    onBusyChange(true);
    try {
      const { data } = await Api.get(path, {
        ...quiet,
        params: {
          revision_id: record.revision.id,
          before_id: review.older_before_id,
        },
      });

      setReview({
        ...data.review,
        comments: [...data.review.comments, ...review.comments],
      });
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <section
      aria-label="Review and approval"
      className="min-w-0 space-y-4 rounded-lg border border-border p-4"
    >
      <h2 className="font-semibold">Review and approval</h2>
      <p className="text-sm text-muted-foreground">
        Approval covers version {record.revision.number}, including its sources,
        recipients and fields. It is not a signature. Any edit creates a version
        requiring fresh approval.
      </p>
      {disabled && (
        <p className="text-sm">
          Save your document changes before sending invitations or recording
          approval.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">{error}</p>
          <Button type="button" variant="outline" onClick={reload}>
            Reload latest version
          </Button>
        </div>
      )}
      {!review ? (
        <p role="status">Loading review history…</p>
      ) : (
        <>
          {editable && (
            <fieldset disabled={disabled || busy} className="space-y-2">
              <Label htmlFor="review-recipient">Recipient to review</Label>
              <select
                id="review-recipient"
                className="signatures-select"
                value={recipientId}
                onChange={event => setRecipient(event.target.value)}
              >
                {!people.length && (
                  <option value="">Add a signer or reviewer first</option>
                )}
                {people.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.name} — {person.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Emails a private link valid for seven days. Sending a new link
                revokes the previous one for this recipient. Anyone holding the
                link can review this version.
              </p>
              <Button
                type="button"
                disabled={!recipientId}
                onClick={() =>
                  void change("invitations", { recipient_id: recipientId })
                }
              >
                Invite for review
              </Button>
            </fieldset>
          )}
          <ul className="space-y-2">
            {review.invitations.map(invitation => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <div className="min-w-0 break-words">
                  <strong>{invitation.name}</strong> ·{" "}
                  {invitation.decision?.replace(/_/g, " ") || "Awaiting review"}
                  <p className="text-xs text-muted-foreground">
                    Email: {invitation.email_status} · Link:{" "}
                    {invitation.revoked_at
                      ? "Revoked"
                      : new Date(invitation.expires_at) <= new Date()
                      ? "Expired"
                      : "Active"}{" "}
                    · Expires {new Date(invitation.expires_at).toLocaleString()}
                  </p>
                </div>
                {editable && !invitation.revoked_at && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled || busy}
                    onClick={() =>
                      void change(`invitations/${invitation.id}`, {}, true)
                    }
                  >
                    Revoke review link for {invitation.name}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <ReviewComments
            comments={review.comments}
            older={review.older_before_id}
            busy={busy}
            loadOlder={() => void loadOlder()}
          />
          {editable && (
            <fieldset disabled={disabled || busy} className="space-y-2">
              <Label htmlFor="admin-review-comment">Reply to this review</Label>
              <Textarea
                id="admin-review-comment"
                value={body}
                maxLength={4000}
                onChange={event => setBody(event.target.value)}
              />
              <Button
                type="button"
                disabled={!body.trim()}
                onClick={() => void change("comments", { body })}
              >
                Add review comment
              </Button>
            </fieldset>
          )}
          {review.approval.approved_at && (
            <div className="rounded-md border border-border p-3 text-sm">
              <p>
                Approved for signature on{" "}
                {new Date(review.approval.approved_at).toLocaleString()} (
                {review.approval.approval_source === "manual"
                  ? "recorded external approval"
                  : "invited reviews"}
                ).
              </p>
              {review.approval.approval_note && (
                <p className="whitespace-pre-wrap break-words">
                  {review.approval.approval_note}
                </p>
              )}
            </div>
          )}
          {editable && record.revision.status !== "approved" && (
            <fieldset
              disabled={disabled || busy}
              className="space-y-3 border-t border-border pt-4"
            >
              <Label htmlFor="approval-source">Approval source</Label>
              <select
                id="approval-source"
                className="signatures-select"
                value={source}
                onChange={event => setSource(event.target.value)}
              >
                <option value="manual">Recorded external approval</option>
                <option value="reviewers">Invited reviews</option>
              </select>
              {source === "manual" && (
                <>
                  <Label htmlFor="approval-note">Approval evidence</Label>
                  <Textarea
                    id="approval-note"
                    placeholder="Who approved this version, when and where the approval is recorded"
                    value={note}
                    maxLength={4000}
                    onChange={event => setNote(event.target.value)}
                  />
                </>
              )}
              <label className="signature-check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={event => setConfirmed(event.target.checked)}
                />
                I confirm this version is approved for signature
              </label>
              <Button
                type="button"
                disabled={!confirmed || (source === "manual" && !note.trim())}
                onClick={() =>
                  void change("approval", {
                    approval_source: source,
                    approval_note: source === "manual" ? note : undefined,
                  })
                }
              >
                Record approval for signing
              </Button>
            </fieldset>
          )}
        </>
      )}
    </section>
  );
}
