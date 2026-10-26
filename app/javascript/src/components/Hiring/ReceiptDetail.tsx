import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import Picker from "./Picker";
import AcknowledgementQueue from "./AcknowledgementQueue";
import DeliveryReview from "./DeliveryReview";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import {
  emailStateLabels,
  deliveryStateLabels,
  receiptLabel,
  stageLabel,
  type Choice,
  type ReceiptDetailPage,
} from "./types";

export default function ReceiptDetail({
  companyId,
  id,
}: {
  companyId: number;
  id: string;
}) {
  const [data, setData] = useState<ReceiptDetailPage | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState<Choice | null>(null);
  const [acknowledge, setAcknowledge] = useState(false);
  const [processingRequested, setProcessingRequested] = useState(false);
  const [deliveryDraftDirty, setDeliveryDraftDirty] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    setError("");
    read<ReceiptDetailPage>(
      `receipts/${encodeURIComponent(id)}`,
      companyId,
      {},
      controller.signal
    )
      .then(result => {
        if (!active) return;
        setData(result);
        setName("");
        setEmail("");
        setAcknowledge(false);
        setNotice("");
        setProcessingRequested(false);
        setDeliveryDraftDirty(false);
        setApplication(
          result.application
            ? {
                id: result.application.id,
                label: result.application.candidate.full_name,
              }
            : null
        );
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, id, refresh]);

  const review = async (dismiss: boolean) => {
    if (!data || busy || loading) return;
    setBusy(true);
    setError("");
    setNotice("");
    const identity = {
      company_id: companyId,
      lock_version: data.receipt.lock_version,
    };
    try {
      const { data: result } = await Api.post<ReceiptDetailPage>(
        `/hiring/receipts/${data.receipt.id}/${dismiss ? "dismiss" : "accept"}`,
        {
          hiring_receipt: dismiss
            ? identity
            : {
                ...identity,
                full_name: name,
                email,
                application_id: application?.id || null,
                acknowledge,
              },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;
      setData(result);
      setName("");
      setEmail("");
      setAcknowledge(false);
      setApplication(
        result.application
          ? {
              id: result.application.id,
              label: result.application.candidate.full_name,
            }
          : null
      );

      setNotice(
        dismiss
          ? "Email dismissed. The original source remains retained."
          : acknowledge && result.messages.length === 0
          ? "Email added or linked. No acknowledgement was queued; check communication approval, inbox availability and application status."
          : "Email added or linked. Review acknowledgement status below."
      );
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const download = async (path: string, filename: string) => {
    if (downloadBusy) return;
    setDownloadBusy(true);
    setError("");
    try {
      const { data: blob } = await Api.get(
        `/hiring/receipts/${encodeURIComponent(id)}/${path}`,
        { ...quiet, params: { company_id: companyId }, responseType: "blob" }
      );
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (mounted.current) {
        setError(
          "The retained file could not be downloaded. Reload or ask an administrator to check private storage."
        );
      }
    } finally {
      if (mounted.current) setDownloadBusy(false);
    }
  };

  const retryProcessing = async () => {
    if (!data || busy || loading || processingRequested) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data: result } = await Api.post<ReceiptDetailPage>(
        `/hiring/receipts/${data.receipt.id}/reprocess`,
        {
          hiring_receipt: {
            company_id: companyId,
            lock_version: data.receipt.lock_version,
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;
      setData(result);
      setProcessingRequested(true);
      setNotice(
        "Processing requested. Reload email to check the actual outcome."
      );
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const dirty = Boolean(
    deliveryDraftDirty ||
      name ||
      email ||
      acknowledge ||
      (application?.id !== data?.application?.id && application !== null)
  );
  const receipt = data?.receipt;
  const latestMessage = data?.messages[data.messages.length - 1];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">Retained email</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/hiring/inbox">Back to inbox</Link>
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy || loading}
            onClick={() => setRefresh(value => value + 1)}
          >
            {dirty ? "Discard review edits and reload" : "Reload email"}
          </Button>
        </div>
      </header>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading retained email…
        </p>
      )}
      {data && receipt && (
        <>
          <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 break-words font-semibold">
                {receipt.subject || "Email awaiting processing"}
              </h3>
              <Badge variant="secondary">
                {emailStateLabels[receipt.state]}
              </Badge>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Source inbox</dt>
                <dd className="break-all">
                  {receipt.mailbox.name} · {receipt.mailbox.source_email}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Received</dt>
                <dd>
                  {receiptLabel(receipt.received_at, data.time_zone)} (
                  {data.time_zone})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Original sender</dt>
                <dd className="break-words">
                  {receipt.full_name || "Not identified"}
                </dd>
                <dd className="break-all">
                  {receipt.email || "Inspect the original email"}
                </dd>
              </div>
              {receipt.original_date && (
                <div>
                  <dt className="text-muted-foreground">
                    Reported message date
                  </dt>
                  <dd>{receiptLabel(receipt.original_date, data.time_zone)}</dd>
                </div>
              )}
              {receipt.reviewed_at && (
                <div>
                  <dt className="text-muted-foreground">Reviewed</dt>
                  <dd>
                    {receipt.reviewed_by?.name || "Reviewer unavailable"} ·{" "}
                    {receiptLabel(receipt.reviewed_at, data.time_zone)}
                  </dd>
                </div>
              )}
            </dl>
            {receipt.review_reason && (
              <p className="text-sm text-muted-foreground">
                Review needed: {stageLabel(receipt.review_reason)}
              </p>
            )}
            {receipt.state === "pending" && (
              <div className="space-y-3">
                <p role="status" className="text-sm text-muted-foreground">
                  The source is retained. If background processing has stalled,
                  request another attempt using this retained email.
                </p>
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={busy || loading || processingRequested}
                  onClick={() => void retryProcessing()}
                >
                  Retry processing
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              className="min-h-11"
              disabled={downloadBusy}
              onClick={() =>
                void download("source", `hiring-email-${receipt.id}.eml`)
              }
            >
              Download original email
            </Button>
          </section>
          <section
            aria-label="Email text and attachments"
            className="min-w-0 space-y-3 rounded-lg border bg-card p-4 sm:p-5"
          >
            <h3 className="font-semibold">Email text and attachments</h3>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
              {receipt.text || "No text preview is available."}
            </pre>
            {receipt.text_truncated && (
              <p className="text-sm text-muted-foreground">
                The preview is incomplete. Download the original email to
                inspect the complete source.
              </p>
            )}
            <ul className="space-y-2">
              {receipt.attachments.map(file => (
                <li key={file.index}>
                  <Button
                    variant="outline"
                    className="h-auto min-h-11 max-w-full whitespace-normal break-all text-left"
                    disabled={downloadBusy}
                    onClick={() =>
                      void download(`attachments/${file.index}`, file.filename)
                    }
                  >
                    Download {file.filename}
                  </Button>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Intl.NumberFormat().format(file.bytes)} bytes
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {data.application && (
            <section className="space-y-2 rounded-lg border bg-card p-4">
              <h3 className="font-semibold">Linked application</h3>
              <Link
                className="break-words text-primary underline-offset-4 hover:underline"
                to={`/hiring/applications/${data.application.id}`}
              >
                {data.application.candidate.full_name}
              </Link>
              <p className="break-words text-sm text-muted-foreground">
                {data.application.candidate.email} ·{" "}
                {data.application.role?.title || "No role assigned"} ·{" "}
                {stageLabel(data.application.stage)}
              </p>
            </section>
          )}
          {receipt.state === "review" && (
            <form
              aria-label="Review email"
              onSubmit={event => {
                event.preventDefault();
                void review(false);
              }}
              className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
            >
              <h3 className="font-semibold">Verify the applicant</h3>
              <p className="text-sm text-muted-foreground">
                The original sender may be a forwarder. Verify the applicant’s
                identity from the email and attachments before adding or linking
                an application. This does not make a hiring decision.
              </p>
              <fieldset disabled={busy || loading} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="review-name">Verified applicant name</Label>
                    <Input
                      id="review-name"
                      className="h-11"
                      required
                      maxLength={200}
                      value={name}
                      onChange={event => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review-email">
                      Verified applicant email
                    </Label>
                    <Input
                      id="review-email"
                      className="h-11"
                      required
                      type="email"
                      maxLength={254}
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                    />
                  </div>
                </div>
                <Picker
                  id="review-application"
                  label="Existing application"
                  kind="applications"
                  purpose="history"
                  companyId={companyId}
                  value={application}
                  change={setApplication}
                  emptyLabel={
                    data.application
                      ? "Keep the linked application"
                      : "Create a new application"
                  }
                />
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={acknowledge}
                    onChange={event => setAcknowledge(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>
                    Queue an approved acknowledgement to the verified applicant.
                    This requires approved communication settings, an enabled
                    inbox and an open application.
                  </span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" className="min-h-11">
                    Add or link application
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => void review(true)}
                  >
                    Dismiss email
                  </Button>
                </div>
              </fieldset>
            </form>
          )}
          <section
            aria-label="Acknowledgement history"
            className="space-y-3 rounded-lg border bg-card p-4 sm:p-5"
          >
            <h3 className="font-semibold">Acknowledgement history</h3>
            {latestMessage && (
              <p className="text-sm font-medium">
                Latest attempt {latestMessage.attempt_number}:{" "}
                {deliveryStateLabels[latestMessage.state]}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Sent means acceptance by the mail server. An unknown outcome
              requires review before another attempt.
            </p>
            {data.messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No acknowledgement has been queued for this application.
              </p>
            )}
            {data.messages.map(message => (
              <article
                key={message.id}
                data-testid={`hiring-attempt-${message.id}`}
                className="space-y-2 border-t pt-3"
              >
                <h4 className="font-semibold">
                  Attempt {message.attempt_number}
                </h4>
                <Badge variant="secondary">
                  {deliveryStateLabels[message.state]}
                </Badge>
                <p className="break-all text-sm">To: {message.content.to}</p>
                <p className="break-all text-sm">
                  Reply to: {message.content.reply_to}
                </p>
                <p className="break-words text-sm">
                  Subject: {message.content.subject}
                </p>
                {message.error_code && (
                  <p className="text-sm text-muted-foreground">
                    {stageLabel(message.error_code)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Queued by{" "}
                  {message.queued_by?.name ||
                    (message.automatic
                      ? "automatic intake"
                      : "former user")}{" "}
                  · Approved settings version {message.approved_setting_version}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {receiptLabel(message.created_at, data.time_zone)}
                  {message.enqueued_at
                    ? ` · Enqueued ${receiptLabel(
                        message.enqueued_at,
                        data.time_zone
                      )}`
                    : ""}
                  {message.started_at
                    ? ` · Started ${receiptLabel(
                        message.started_at,
                        data.time_zone
                      )}`
                    : ""}
                  {message.sent_at
                    ? ` · Accepted ${receiptLabel(
                        message.sent_at,
                        data.time_zone
                      )}`
                    : ""}
                </p>
                <details className="text-sm">
                  <summary className="cursor-pointer py-2 font-medium">
                    Message snapshot
                  </summary>
                  <pre className="whitespace-pre-wrap break-words font-sans leading-6">
                    {message.content.body}
                  </pre>
                </details>
                {message.resolution && (
                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      Operator reported: {stageLabel(message.resolution)}
                    </p>
                    <p className="text-muted-foreground">
                      {message.resolved_by?.name || "Reviewer unavailable"} ·{" "}
                      {message.resolved_at &&
                        receiptLabel(message.resolved_at, data.time_zone)}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      {message.resolution_details?.evidence}
                    </p>
                    {message.resolution_details?.worker_stopped && (
                      <p>Operator confirmed the original worker has stopped.</p>
                    )}
                    {((message.state === "sent" &&
                      message.resolution === "not_accepted") ||
                      (message.state === "failed" &&
                        message.resolution === "accepted")) && (
                      <p className="text-destructive">
                        Miru’s later mail-server result conflicts with this
                        operator report. Investigate before taking further
                        action.
                      </p>
                    )}
                  </div>
                )}
                {message.state === "uncertain" && !message.resolution && (
                  <DeliveryReview
                    key={`${refresh}:${message.id}`}
                    companyId={companyId}
                    receiptId={receipt.id}
                    message={message}
                    onDirtyChange={setDeliveryDraftDirty}
                    onSaved={result => {
                      setData(result);
                      setDeliveryDraftDirty(false);
                      setNotice(
                        "Delivery review recorded. This did not send an email."
                      );
                    }}
                  />
                )}
                <details className="text-sm">
                  <summary className="cursor-pointer py-2 font-medium">
                    Attempt activity
                  </summary>
                  <ol className="space-y-2 py-2">
                    {message.events.map(event => {
                      const state = Array.isArray(event.changes.state)
                        ? event.changes.state[1]
                        : event.changes.state;

                      return (
                        <li key={event.id} className="break-words">
                          {state
                            ? stageLabel(state)
                            : event.changes.resolution
                            ? "Delivery review recorded"
                            : stageLabel(event.action)}{" "}
                          ·{" "}
                          {event.actor?.name ||
                            (event.actor_id ? "Former user" : "System")}{" "}
                          · {receiptLabel(event.created_at, data.time_zone)}
                        </li>
                      );
                    })}
                  </ol>
                </details>
              </article>
            ))}
          </section>
          {receipt.state === "accepted" &&
            data.application &&
            (data.messages.length === 0 || latestMessage?.retryable) && (
              <AcknowledgementQueue
                key={`${refresh}:${latestMessage?.id || "first"}`}
                companyId={companyId}
                data={data}
                retryMessage={latestMessage}
                onQueued={result => {
                  setData(result);
                  setNotice(
                    "Acknowledgement attempt recorded. Review delivery status below."
                  );
                }}
              />
            )}
        </>
      )}
    </div>
  );
}
