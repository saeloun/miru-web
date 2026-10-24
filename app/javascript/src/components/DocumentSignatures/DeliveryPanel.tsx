import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { endpoint, failureMessage, quiet } from "./api";
import { authenticationLabels, type SigningRequest } from "./types";

type Connection = {
  id: number | null;
  configured: boolean;
  server_configured: boolean;
};
const operationMessages = {
  send: "Send queued",
  cancel: "Cancellation requested",
  remind: "Reminder queued",
  refresh: "Status check queued",
};

const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, first => first.toUpperCase());

export default function DeliveryPanel({
  record,
  companyId,
  busy,
  disabled,
  onRecordChange,
  onBusyChange,
  reload,
}: {
  record: SigningRequest;
  companyId: string | number;
  busy: boolean;
  disabled: boolean;
  onRecordChange: (value: SigningRequest) => void;
  onBusyChange: (value: boolean) => void;
  reload: () => void;
}) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectionCheck, setConnectionCheck] = useState(0);
  const [changingConnection, setChangingConnection] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [candidate, setCandidate] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"send" | "cancel" | null>(null);
  const mounted = useRef(true);
  const revision = record.revision;
  const delivery = revision.delivery;
  const activeOperation = delivery.operations.find(operation =>
    ["queued", "running", "waiting"].includes(operation.state)
  );
  const historical = revision.id !== record.current_revision_id;
  const blocked =
    busy || disabled || historical || record.company_id !== Number(companyId);

  const active = ["sending", "send_uncertain", "awaiting_signatures"].includes(
    revision.status
  );

  const pending =
    revision.status === "awaiting_signatures" &&
    delivery.provider_status === "PENDING";

  const cooldown = Boolean(
    delivery.last_reminder_at &&
      Date.now() - Date.parse(delivery.last_reminder_at) < 86400000
  );

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (historical) return;
    const controller = new window.AbortController();
    Api.get("/signature_connection", { ...quiet, signal: controller.signal })
      .then(({ data }) => setConnection(data.signature_connection))
      .catch(failure => {
        if (!controller.signal.aborted) setError(failureMessage(failure));
      });

    return () => controller.abort();
  }, [companyId, historical, connectionCheck]);

  useEffect(() => {
    if (historical || !active || busy) return;
    const controller = new window.AbortController();
    let loading = false;
    const timer = window.setInterval(async () => {
      if (loading) return;
      loading = true;
      try {
        const { data } = await Api.get(endpoint(record.id), {
          ...quiet,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          if (data.signature_request.revision.id === revision.id) {
            onRecordChange(data.signature_request);
          } else {
            setError(
              "This document changed. Reload the latest version before continuing."
            );
          }
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failureMessage(failure));
      } finally {
        loading = false;
      }
    }, 10000);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [
    record.id,
    revision.id,
    companyId,
    historical,
    active,
    busy,
    onRecordChange,
  ]);

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (blocked || !connection?.server_configured) return;
    onBusyChange(true);
    setError("");
    try {
      const { data } = await Api.post(
        "/signature_connection",
        {
          signature_connection: {
            company_id: companyId,
            previous_id: connection.id,
            api_key: apiKey,
          },
        },
        quiet
      );
      if (mounted.current) {
        setConnection(data.signature_connection);
        setChangingConnection(false);
      }
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) {
        setApiKey("");
        onBusyChange(false);
      }
    }
  };

  const change = async (
    kind: "send" | "cancel" | "remind" | "refresh",
    providerId?: string
  ) => {
    if (blocked) return;
    onBusyChange(true);
    setError("");
    try {
      const { data } = await Api.post(
        `${endpoint(record.id)}/operations`,
        {
          signature_request: {
            company_id: companyId,
            lock_version: record.lock_version,
            revision_id: revision.id,
            content_digest: revision.content_digest,
            kind,
            ...(providerId ? { provider_envelope_id: providerId } : {}),
          },
        },
        quiet
      );
      if (mounted.current) {
        onRecordChange(data.signature_request);
        setConfirm(null);
        setCandidate("");
        if (data.operation.error_message) {
          setError(data.operation.error_message);
        }
      }
    } catch (failure) {
      if (mounted.current) {
        setConfirm(null);
        setError(failureMessage(failure));
      }
    } finally {
      if (mounted.current) onBusyChange(false);
    }
  };

  return (
    <section
      aria-label="Signing delivery"
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <h2 className="font-semibold">Signing delivery</h2>
      {activeOperation && (
        <p role="status">{operationMessages[activeOperation.kind]}</p>
      )}
      {error && (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={reload}
          >
            Reload latest version
          </Button>
          {!historical && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setConnectionCheck(value => value + 1)}
            >
              Check connection
            </Button>
          )}
        </div>
      )}
      {!historical && (
        <>
          {!connection ? (
            <p>Checking company signing connection…</p>
          ) : (
            <>
              {connection.configured && (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm">Company signing connected</p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={blocked}
                    onClick={() => setChangingConnection(!changingConnection)}
                  >
                    Change signing connection
                  </Button>
                </div>
              )}
              {!connection.server_configured && (
                <p>
                  Signing is unavailable until your administrator configures the
                  signing provider for this workspace.
                </p>
              )}
              {connection.server_configured &&
                (!connection.configured || changingConnection) && (
                  <form onSubmit={connect} className="space-y-2">
                    <Label htmlFor="signing-api-key">Signing API key</Label>
                    <Input
                      id="signing-api-key"
                      type="password"
                      autoComplete="off"
                      required
                      maxLength={4096}
                      value={apiKey}
                      disabled={blocked}
                      onChange={event => setApiKey(event.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Connect this company’s Documenso account. New requests use
                      this connection; existing requests retain their original
                      connection.
                    </p>
                    <Button type="submit" disabled={blocked || !apiKey.trim()}>
                      {connection.id
                        ? "Replace signing connection"
                        : "Connect signing"}
                    </Button>
                  </form>
                )}
            </>
          )}
          {disabled && (
            <p className="text-sm">
              Save document changes and review text before using delivery
              controls.
            </p>
          )}
          {!delivery.operation_id && (
            <>
              <p className="text-sm">
                Approve this exact version before sending. Sending locks its
                PDFs, recipients, verification methods and fields.
              </p>
              <Button
                type="button"
                disabled={
                  blocked ||
                  revision.status !== "approved" ||
                  !connection?.configured
                }
                onClick={() => setConfirm("send")}
              >
                Send for signature
              </Button>
            </>
          )}
          {delivery.operation_id && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={blocked}
                onClick={() => void change("refresh")}
              >
                Check signing status
              </Button>
              {active && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={blocked || Boolean(delivery.cancel_requested_at)}
                  onClick={() => setConfirm("cancel")}
                >
                  Cancel signature request
                </Button>
              )}
              {pending && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    blocked || cooldown || Boolean(delivery.cancel_requested_at)
                  }
                  onClick={() => void change("remind")}
                >
                  Remind pending recipients
                </Button>
              )}
            </div>
          )}
        </>
      )}
      {delivery.operation_id && (
        <>
          <p className="text-sm">
            Provider status:{" "}
            {delivery.provider_status
              ? label(delivery.provider_status)
              : "Not confirmed"}
            . Last checked:{" "}
            {delivery.provider_checked_at
              ? new Date(delivery.provider_checked_at).toLocaleString()
              : "Not yet checked"}
            .
          </p>
          {delivery.provider_status === "COMPLETED" &&
            revision.status !== "signed" && (
              <p>
                Provider completion is recorded. Verified signed files are not
                yet available in Miru.
              </p>
            )}
          {delivery.cancel_requested_at && revision.status !== "cancelled" && (
            <p>Sending remains locked until cancellation is confirmed.</p>
          )}
          {active &&
            !delivery.provider_envelope_id &&
            delivery.operations.some(
              operation =>
                operation.kind === "send" &&
                operation.phase === "creating" &&
                (revision.status === "send_uncertain" ||
                  ["failed", "uncertain"].includes(operation.state) ||
                  Date.now() - Date.parse(operation.created_at) > 120000)
            ) && (
              <div className="space-y-2">
                <p>
                  Creation may already have reached the provider. Do not create
                  another request. If you can find the exact request in
                  Documenso, enter its envelope ID so Miru can verify it.
                </p>
                {!historical && (
                  <form
                    onSubmit={event => {
                      event.preventDefault();
                      void change("refresh", candidate);
                    }}
                    className="space-y-2"
                  >
                    <Label htmlFor="provider-envelope-id">
                      Provider envelope ID
                    </Label>
                    <Input
                      id="provider-envelope-id"
                      required
                      maxLength={200}
                      value={candidate}
                      disabled={blocked}
                      onChange={event => setCandidate(event.target.value)}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={blocked || !candidate.trim()}
                    >
                      Reconcile provider request
                    </Button>
                  </form>
                )}
              </div>
            )}
          <ul
            aria-label="Recipient delivery status"
            className="space-y-2 text-sm"
          >
            {revision.recipients.map(person => {
              const status = delivery.recipient_statuses.find(
                item => item.recipient_id === person.id
              );

              return (
                <li
                  key={person.id}
                  className="break-words rounded-md border border-border p-2"
                >
                  <span className="font-medium">{person.name}</span> ·{" "}
                  {person.email} ·{" "}
                  {person.role === "cc"
                    ? "Copy recipient (no signature required)"
                    : status?.signing_status === "SIGNED"
                    ? person.role === "reviewer"
                      ? "Approved"
                      : "Signed"
                    : person.role === "reviewer" &&
                      status?.signing_status === "NOT_SIGNED"
                    ? active
                      ? "Awaiting approval"
                      : "Not approved"
                    : status
                    ? label(status.signing_status)
                    : "Not confirmed"}
                  {status && person.role !== "cc" && (
                    <p>
                      Provider email: {label(status.send_status)} ·{" "}
                      {label(status.read_status)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted-foreground">
            Provider email status does not confirm mailbox delivery. Pending
            recipients receive up to three automatic reminders, three days
            apart. Manual reminders are limited to one per 24 hours.
          </p>
          {delivery.next_reminder_at && (
            <p className="text-sm">
              Next automatic reminder:{" "}
              {new Date(delivery.next_reminder_at).toLocaleString()} (
              {delivery.automatic_reminders_count} of 3 attempts used).
            </p>
          )}
          <ol aria-label="Delivery history" className="space-y-2 text-sm">
            {delivery.operations.map(operation => (
              <li key={operation.id} className="break-words">
                {label(operation.kind)} · {label(operation.state)} ·{" "}
                {label(operation.phase)} ·{" "}
                {new Date(operation.created_at).toLocaleString()}
                {operation.error_message && (
                  <p className="text-destructive">{operation.error_message}</p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
      <Dialog
        open={Boolean(confirm)}
        onOpenChange={open => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {confirm === "send"
                ? `Send approved version ${revision.number}`
                : "Cancel signature request?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "send"
                ? "Send the approved PDFs and fields to these recipients. Sending locks this version."
                : "Cancellation must be confirmed by the provider before this version can be changed. Completed signatures cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {confirm === "send" && (
            <div className="space-y-3 text-sm">
              <p className="break-words font-semibold">{revision.title}</p>
              <ul>
                {revision.documents.map(document => (
                  <li key={document.key} className="break-words">
                    {document.filename} · {document.pages.length} pages
                  </li>
                ))}
              </ul>
              <ul>
                {revision.recipients.map(person => (
                  <li key={person.id} className="break-words">
                    {person.name} · {person.email} · {person.role} ·{" "}
                    {
                      authenticationLabels[
                        person.authentication || "email_link"
                      ]
                    }
                  </li>
                ))}
              </ul>
              <p>
                Pending recipients receive up to three automatic reminders,
                three days apart. Manual reminders are limited to one per 24
                hours.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Keep reviewing
            </Button>
            <Button
              type="button"
              disabled={blocked}
              onClick={() => {
                if (confirm) void change(confirm);
              }}
            >
              {confirm === "send"
                ? "Send signature emails"
                : "Request cancellation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
