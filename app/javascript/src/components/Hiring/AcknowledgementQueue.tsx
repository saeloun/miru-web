import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import {
  type HiringSettings,
  type HiringSettingsPage,
  type HiringMessage,
  type ReceiptDetailPage,
} from "./types";

export default function AcknowledgementQueue({
  companyId,
  data,
  onQueued,
  retryMessage,
}: {
  companyId: number;
  data: ReceiptDetailPage;
  onQueued: (result: ReceiptDetailPage) => void;
  retryMessage?: HiringMessage;
}) {
  const [settings, setSettings] = useState<HiringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const controller = new window.AbortController();
    read<HiringSettingsPage>("settings", companyId, {}, controller.signal)
      .then(result => {
        if (mounted.current) setSettings(result.settings);
      })
      .catch(failure => {
        if (mounted.current) setError(failureMessage(failure));
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [companyId]);

  const recipient = data.application?.candidate.email;
  const closed = ["withdrawn", "rejected", "hired"].includes(
    data.application?.stage || ""
  );

  const queue = async () => {
    if (busy || loading || closed || !settings?.approved || !recipient) return;
    setBusy(true);
    setError("");
    try {
      const { data: result } = await Api.post<ReceiptDetailPage>(
        `/hiring/receipts/${data.receipt.id}/${
          retryMessage ? `messages/${retryMessage.id}/retry` : "acknowledgement"
        }`,
        {
          hiring_message: {
            company_id: companyId,
            lock_version: data.receipt.lock_version,
            approved_setting_version: settings.lock_version,
            recipient,
            ...(retryMessage && {
              message_lock_version: retryMessage.lock_version,
            }),
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) onQueued(result);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section
      aria-label={
        retryMessage ? "Retry acknowledgement" : "Queue acknowledgement"
      }
      className="min-w-0 space-y-3 rounded-lg border bg-card p-4 sm:p-5"
    >
      <h3 className="font-semibold">
        {retryMessage ? "Retry acknowledgement" : "Queue an acknowledgement"}
      </h3>
      {loading && <p role="status">Loading approved wording…</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} Reload email to review the current recipient and wording.
        </p>
      )}
      {!loading && settings?.approved && settings.preview ? (
        <>
          <p className="text-sm text-muted-foreground">
            Confirm this recipient and approved wording before queuing. An
            enabled original inbox and open application are required. Queuing
            does not confirm delivery.
          </p>
          {retryMessage && (
            <p className="text-sm text-muted-foreground">
              This creates attempt {retryMessage.attempt_number + 1}. Earlier
              snapshots and outcomes stay in the history. An incorrect delivery
              review can cause duplicate email.
            </p>
          )}
          <p className="break-all text-sm">To: {recipient}</p>
          <p className="break-all text-sm">
            Reply to: {data.receipt.mailbox.source_email}
          </p>
          <p className="break-words text-sm">
            Subject: {settings.preview.subject}
          </p>
          <p className="text-xs text-muted-foreground">
            Approved settings version {settings.lock_version}
          </p>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
            {settings.preview.body}
          </pre>
          {closed && (
            <p className="text-sm text-muted-foreground">
              Closed applications cannot receive an acknowledgement.
            </p>
          )}
          <Button
            className="min-h-11"
            disabled={busy || closed || Boolean(error)}
            onClick={() => void queue()}
          >
            {busy
              ? "Queuing…"
              : retryMessage
              ? "Queue new attempt"
              : "Queue this acknowledgement"}
          </Button>
        </>
      ) : (
        !loading &&
        !error && (
          <p className="text-sm text-muted-foreground">
            Approve complete wording in{" "}
            <Link
              className="text-primary underline"
              to="/hiring/communications"
            >
              communication settings
            </Link>{" "}
            before queuing an acknowledgement, then reload this email.
          </p>
        )
      )}
    </section>
  );
}
