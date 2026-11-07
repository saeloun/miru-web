import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import Pager from "./Pager";
import {
  accessDenied,
  failureMessage,
  quiet,
  read,
  verifyWorkspace,
} from "./api";
import {
  deliveryStateLabels,
  interviewMessageKinds,
  stageLabel,
  type Choice,
  type HiringMessage,
  type Pagination,
} from "./types";

type Content = { to: string; reply_to: string; subject: string; body: string };
type Preview = Content & {
  intent: Record<string, string | number | null>;
  can_queue?: boolean;
};
type Message = Pick<
  HiringMessage,
  | "id"
  | "kind"
  | "state"
  | "error_code"
  | "lock_version"
  | "attempt_number"
  | "original_message_id"
  | "retryable"
  | "resolution"
  | "resolution_details"
  | "sent_at"
> & { content: Content; current_context: boolean; automatic: boolean };
type History = {
  company_id: number;
  messages: Message[];
  pagination: Pagination;
};

export default function CandidateMessages({
  companyId,
  path,
  context,
  onDenied,
}: {
  companyId: number;
  path: string;
  context: {
    kind: "booking" | "round" | "decision";
    number: number;
    version: number;
  };
  onDenied: (failure: unknown) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<History | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [kind, setKind] = useState(
    context.kind === "decision" ? "rejection" : "interview_invitation"
  );
  const [mailbox, setMailbox] = useState<Choice | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [retryOf, setRetryOf] = useState<Message | null>(null);
  const [review, setReview] = useState<Message | null>(null);
  const [outcome, setOutcome] = useState("accepted");
  const [evidence, setEvidence] = useState("");
  const [stopped, setStopped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || notice) status.current?.focus();
  }, [error, notice]);

  const failed = (failure: unknown) => {
    if (!mounted.current) return;

    if (accessDenied(failure)) {
      setData(null);
      setPreview(null);
      setReview(null);
      setRetryOf(null);
      setEvidence("");
      onDenied(failure);
    }
    setError(failureMessage(failure));
  };

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    read<History>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (active) setData(result);
      })
      .catch(failure => {
        if (active) failed(failure);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [expanded, path, companyId, page, refresh, context.version]);

  const loadPreview = async (message: Message | null = null) => {
    if (!mailbox || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data: result } = await Api.post<{
        company_id: number;
        preview: Preview;
      }>(
        `/hiring/${path}/preview`,
        {
          hiring_message: {
            company_id: companyId,
            kind: message?.kind ?? kind,
            mailbox_id: mailbox.id,
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) {
        setPreview(result.preview);
        setRetryOf(message);
      }
    } catch (failure) {
      failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const send = async () => {
    if (!preview || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const suffix = retryOf ? `/${retryOf.id}/retry` : "";
      const attributes = retryOf
        ? { ...preview.intent, message_version: retryOf.lock_version }
        : preview.intent;

      const { data: result } = await Api.post<{ company_id: number }>(
        `/hiring/${path}${suffix}`,
        { hiring_message: attributes },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) {
        setPreview(null);
        setRetryOf(null);
        setPage(1);
        setRefresh(value => value + 1);
        setNotice(
          "Message recorded. Check delivery history; queued does not mean delivered."
        );
      }
    } catch (failure) {
      failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const reconcile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!review || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data: result } = await Api.post<{ company_id: number }>(
        `/hiring/${path}/${review.id}/reconcile`,
        {
          hiring_message: {
            company_id: companyId,
            message_version: review.lock_version,
            outcome,
            evidence,
            worker_stopped: stopped,
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) {
        setReview(null);
        setEvidence("");
        setRefresh(value => value + 1);
        setNotice("Delivery evidence recorded. No new message was sent.");
      }
    } catch (failure) {
      failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const contextLabel = `${context.kind} ${context.number}`;
  const messageKinds =
    context.kind === "decision"
      ? [{ key: "rejection", label: "Rejection" }]
      : interviewMessageKinds;
  const id = `${context.kind}-messages-${context.number}`;

  return (
    <section
      className="min-w-0 space-y-3"
      aria-label={`Candidate messages for ${contextLabel}`}
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={busy}
        onClick={() => {
          setExpanded(value => !value);
          setPreview(null);
          setReview(null);
          setRetryOf(null);
          setEvidence("");
          setData(null);
        }}
      >
        {expanded ? "Hide" : "Candidate messages for"} {contextLabel}
      </Button>
      {expanded && (
        <>
          <h5 className="font-semibold">Candidate messages</h5>
          <p className="text-sm text-muted-foreground">
            Choose an approved template and reply inbox, then confirm the exact
            preview. Internal feedback, decision reasons and cancellation
            reasons are excluded. Review existing delivery history before
            sending.
          </p>
          {context.kind === "round" && (
            <p className="text-sm text-muted-foreground">
              Arrange a time before a booking exists. Use booking history for a
              confirmed meeting, rescheduling or cancellation. After changing
              the round, review its previous invitations before sending updated
              details; resolve unknown deliveries first.
            </p>
          )}
          {(error || notice) && (
            <p
              ref={status}
              tabIndex={-1}
              role={error ? "alert" : "status"}
              className="break-words"
            >
              {error || notice}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setRefresh(value => value + 1)}
          >
            Refresh message history
          </Button>
          {!data && !error && <p role="status">Loading messages…</p>}
          <fieldset
            disabled={busy || Boolean(preview)}
            className="min-w-0 space-y-3"
          >
            <Label htmlFor={`${id}-kind`}>Message type</Label>
            <select
              id={`${id}-kind`}
              value={kind}
              className="h-11 w-full rounded-md border bg-background px-3"
              onChange={event => {
                setKind(event.target.value);
                setRetryOf(null);
              }}
            >
              {messageKinds
                .filter(
                  item =>
                    context.kind !== "round" ||
                    item.key === "interview_invitation"
                )
                .map(item => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
            </select>
            <Picker
              id={`${id}-inbox`}
              label="Reply inbox"
              companyId={companyId}
              kind="mailboxes"
              purpose="intake"
              value={mailbox}
              change={setMailbox}
              emptyLabel="Choose enabled inbox"
            />
            <Button
              type="button"
              disabled={!mailbox || busy || Boolean(preview)}
              onClick={() => void loadPreview()}
            >
              Preview candidate message
            </Button>
          </fieldset>
          {preview && (
            <div className="min-w-0 space-y-3 rounded-lg border p-3">
              <h6 className="font-semibold">
                {retryOf
                  ? `Confirm retry after attempt ${retryOf.attempt_number}`
                  : "Confirm candidate message"}
              </h6>
              <MessageContent content={preview} />
              {preview.can_queue === false && (
                <p>
                  Draft preview only. Finalize this decision and preview again
                  before queueing.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={busy || preview.can_queue === false}
                  onClick={() => void send()}
                >
                  Confirm and queue {retryOf ? "retry" : "message"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setPreview(null);
                    setRetryOf(null);
                    setError("");
                  }}
                >
                  Discard preview
                </Button>
              </div>
            </div>
          )}
          {data && (
            <>
              {!data.messages.length && (
                <p>No messages recorded for this {context.kind}.</p>
              )}
              <ol className="space-y-3">
                {data.messages.map(message => (
                  <li
                    key={message.id}
                    className="min-w-0 space-y-3 rounded-lg border p-3"
                  >
                    <h6 className="font-semibold">
                      {
                        messageKinds.find(item => item.key === message.kind)
                          ?.label
                      }{" "}
                      · Attempt {message.attempt_number}
                      {message.automatic && " · Automatic approved delivery"}
                    </h6>
                    {context.kind === "round" && (
                      <p>
                        {message.current_context
                          ? "Current round details"
                          : "Earlier round details"}
                      </p>
                    )}
                    <p>
                      {deliveryStateLabels[message.state]}
                      {message.error_code &&
                        ` · ${stageLabel(message.error_code)}`}
                    </p>
                    {message.sent_at && (
                      <p>
                        Accepted by mail transport:{" "}
                        <time dateTime={message.sent_at}>
                          {new Date(message.sent_at).toLocaleString()}
                        </time>
                      </p>
                    )}
                    <MessageContent content={message.content} />
                    {message.resolution && (
                      <p className="whitespace-pre-wrap break-words">
                        Verified outcome: {stageLabel(message.resolution)}.{" "}
                        {message.resolution_details?.evidence}
                      </p>
                    )}
                    {message.retryable && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy || !mailbox || Boolean(preview)}
                        onClick={() => void loadPreview(message)}
                      >
                        Preview retry for attempt {message.attempt_number}
                      </Button>
                    )}
                    {message.state === "uncertain" && !message.resolution && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setReview(message);
                          setOutcome("accepted");
                          setEvidence("");
                          setStopped(false);
                        }}
                      >
                        Review unknown attempt {message.attempt_number}
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
              <Pager
                pagination={data.pagination}
                change={setPage}
                disabled={busy}
              />
            </>
          )}
          {review && (
            <form
              onSubmit={reconcile}
              className="space-y-3 rounded-lg border p-3"
            >
              <h6 className="font-semibold">
                Review delivery attempt {review.attempt_number}
              </h6>
              <p className="text-sm">
                Use provider or local capture evidence. Recording a review sends
                nothing; non-acceptance requires confirming the original worker
                cannot resume.
              </p>
              <Label htmlFor={`${id}-outcome`}>Verified delivery outcome</Label>
              <select
                id={`${id}-outcome`}
                className="h-11 w-full rounded-md border bg-background px-3"
                value={outcome}
                disabled={busy}
                onChange={event => setOutcome(event.target.value)}
              >
                <option value="accepted">Accepted by mail transport</option>
                <option value="not_accepted">Not accepted</option>
              </select>
              <Label htmlFor={`${id}-evidence`}>Delivery evidence</Label>
              <Textarea
                id={`${id}-evidence`}
                value={evidence}
                required
                maxLength={2000}
                disabled={busy}
                onChange={event => setEvidence(event.target.value)}
              />
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={stopped}
                  disabled={busy}
                  onChange={event => setStopped(event.target.checked)}
                />
                Original worker has stopped and cannot resume
              </label>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={busy || (outcome === "not_accepted" && !stopped)}
                >
                  Record delivery evidence
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setReview(null)}
                >
                  Cancel review
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}

function MessageContent({ content }: { content: Content }) {
  return (
    <div className="min-w-0 space-y-2 break-words">
      <p>To: {content.to}</p>
      <p>Reply to: {content.reply_to}</p>
      <p className="font-semibold">{content.subject}</p>
      <p className="whitespace-pre-wrap">{content.body}</p>
    </div>
  );
}
