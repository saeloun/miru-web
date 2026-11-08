import React, { useCallback, useEffect, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import {
  accessDenied,
  failureMessage,
  quiet,
  read,
  verifyWorkspace,
} from "./api";

type Review = {
  company_id: number;
  application_version: number;
  retention: {
    private_records: number;
    source_emails: number;
    attachments: number;
    blocked_reason: string | null;
  };
};

export default function ApplicationRetention({
  companyId,
  applicationId,
  applicationVersion,
  onDenied,
  onDeleted,
}: {
  companyId: number;
  applicationId: number;
  applicationVersion: number;
  onDenied: (failure: unknown) => void;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const path = `applications/${applicationId}/retention`;
  const failed = useCallback(
    (failure: unknown) => {
      setReview(null);
      setConfirmed(false);
      setError(failureMessage(failure));
      if (accessDenied(failure)) onDenied(failure);
    },
    [onDenied]
  );

  useEffect(() => {
    setReview(null);
    setConfirmed(false);
    setError("");
    if (!expanded) return;
    let active = true;
    const controller = new window.AbortController();
    read<Review>(path, companyId, {}, controller.signal)
      .then(result => {
        if (active) setReview(result);
      })
      .catch(failure => {
        if (active) failed(failure);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [expanded, companyId, path, applicationVersion, refresh, failed]);

  const remove = async () => {
    if (!review || !confirmed || busy || review.retention.blocked_reason) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.delete<{
        company_id: number;
        deleted: boolean;
      }>(`/hiring/${path}`, {
        ...quiet,
        data: {
          hiring_retention: {
            company_id: companyId,
            application_version: review.application_version,
            confirmation: true,
          },
        },
      });
      verifyWorkspace(data, companyId);
      if (data.deleted !== true) {
        throw new Error("Deletion could not be verified.");
      }
      onDeleted();
    } catch (failure) {
      failed(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Hiring data deletion"
      className="space-y-3 rounded-lg border p-4"
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={busy}
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? "Hide deletion review" : "Review hiring data deletion"}
      </Button>
      {expanded && (
        <>
          <h3 className="font-semibold">Delete private hiring data</h3>
          <p>
            Deletion is permanent. This application's private records, links and
            unused uploads are removed. Pending onboarding invitations are
            cancelled. Employee, payroll and legal documents are preserved.
            Shared mail is kept while another application needs it. Private file
            cleanup runs in the background.
          </p>
          {error && (
            <p role="alert">
              {error} Reload the review to check current state before trying
              again.
            </p>
          )}
          {!review && !error && <p role="status">Reviewing hiring data…</p>}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setRefresh(value => value + 1)}
          >
            Reload deletion review
          </Button>
          {review && (
            <>
              <p>
                {review.retention.private_records} private records ·{" "}
                {review.retention.source_emails} source emails ·{" "}
                {review.retention.attachments} file attachments
              </p>
              {review.retention.blocked_reason && (
                <p role="alert">{review.retention.blocked_reason}</p>
              )}
              <label className="flex min-h-11 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  disabled={busy || Boolean(review.retention.blocked_reason)}
                  checked={confirmed}
                  onChange={event => setConfirmed(event.target.checked)}
                />
                I understand this permanently deletes this application's private
                hiring data
              </label>
              <Button
                type="button"
                variant="destructive"
                className="h-auto min-h-11 whitespace-normal"
                disabled={
                  busy || !confirmed || Boolean(review.retention.blocked_reason)
                }
                onClick={() => void remove()}
              >
                Permanently delete hiring data
              </Button>
            </>
          )}
        </>
      )}
    </section>
  );
}
