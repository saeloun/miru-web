import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useUserContext } from "context/UserContext";

import { Button } from "components/ui/button";
import {
  invoiceAuthorizationApi,
  type Authorization,
  type AuthorizationCommand,
} from "./api";

const statusLabels: Record<Authorization["status"], string> = {
  not_granted: "Authorization not granted",
  granted: "Authorization granted",
  withdrawn: "Authorization withdrawn",
  reauthorization_required: "Reauthorization required",
};

export function InvoiceAuthorizationPanel({
  companyId,
  userId,
  companyName,
}: {
  companyId: string;
  userId: string;
  companyName: string;
}) {
  const [controller] = useState(() => new window.AbortController());
  const [data, setData] = useState<Authorization | null>(null);
  const [affirmed, setAffirmed] = useState(false);
  const [pending, setPending] = useState<AuthorizationCommand | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const status = useRef<HTMLParagraphElement>(null);
  const signal = controller.signal;

  const verify = (result: Authorization) => {
    if (
      String(result.company_id) !== companyId ||
      String(result.user_id) !== userId
    ) {
      setData(null);
      setPending(null);
      setAffirmed(false);
      setNeedsRefresh(true);
      throw new Error("workspace");
    }

    return result;
  };

  const failed = (failure: unknown) => {
    if (signal.aborted || !mounted.current) return;

    const response = axios.isAxiosError(failure) ? failure.response : null;
    if (response?.status >= 400 && response.status < 500) {
      setPending(null);
    }

    if (response?.status === 409) setNeedsRefresh(true);

    if ([401, 403, 404].includes(response?.status)) {
      setData(null);
      setPending(null);
      setAffirmed(false);
    }

    setError(
      typeof response?.data?.errors === "string"
        ? response.data.errors
        : "Invoice authorization is unavailable. Refresh to check access and the latest status."
    );
  };

  const load = async (beforeId?: string) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await invoiceAuthorizationApi.read(
        companyId,
        userId,
        signal,
        beforeId
      );
      if (signal.aborted || !mounted.current) return;

      const result = verify(response.data.invoice_authorization);
      if (
        data?.statement.digest !== result.statement.digest ||
        (!pending &&
          (!beforeId || data?.current_event?.id !== result.current_event?.id))
      ) {
        setAffirmed(false);
      }

      setData(current => {
        const receipts = beforeId
          ? [...(current?.history || []), ...result.history]
          : result.history;

        return {
          ...result,
          history: receipts.filter(
            (event, index) =>
              receipts.findIndex(item => item.id === event.id) === index
          ),
        };
      });
      if (!beforeId) {
        setNeedsRefresh(false);
      }
    } catch (failure) {
      failed(failure);
    } finally {
      if (mounted.current && !signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    void load();

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (error || notice) status.current?.focus();
  }, [error, notice]);

  const send = async (command: AuthorizationCommand) => {
    setBusy(true);
    setPending(command);
    setError("");
    setNotice("");
    try {
      const response = await invoiceAuthorizationApi.record(
        companyId,
        userId,
        command,
        signal
      );
      if (signal.aborted || !mounted.current) return;

      const result = verify(response.data.invoice_authorization);
      setData(result);
      setPending(null);
      setAffirmed(false);
      setNeedsRefresh(false);
      setNotice(
        result.recorded_event?.current === false
          ? `Earlier ${command.action} confirmed. The current authorization was not changed.`
          : command.action === "grant"
          ? "Your invoice authorization was recorded."
          : "Your invoice authorization was withdrawn for future invoices."
      );
    } catch (failure) {
      if (signal.aborted || !mounted.current) return;

      failed(failure);
    } finally {
      if (mounted.current && !signal.aborted) setBusy(false);
    }
  };

  const start = (action: AuthorizationCommand["action"]) => {
    if (!data || busy || loading || needsRefresh || pending) return;

    if (action === "grant" && (!affirmed || !data.can_grant)) return;

    if (action === "withdraw" && !data.can_withdraw) return;

    void send({
      action,
      expected_event_id: data.current_event?.id || "",
      statement_digest:
        action === "withdraw"
          ? data.current_event?.statement_digest || data.statement.digest
          : data.statement.digest,
      idempotency_key: window.crypto.randomUUID(),
    });
  };

  return (
    <section aria-label="Invoice authorization" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold">Invoice authorization</h2>
          <p className="break-words text-sm text-muted-foreground">
            {companyName}
            {data?.consultant_name ? ` · ${data.consultant_name}` : ""}
          </p>
        </div>
        <Button
          className="min-h-11"
          disabled={busy || loading}
          type="button"
          variant="outline"
          onClick={() => void load()}
        >
          Refresh authorization
        </Button>
      </div>
      {loading && <p role="status">Loading invoice authorization…</p>}
      {(error || notice) && (
        <p
          ref={status}
          className="break-words text-sm"
          role={error ? "alert" : "status"}
          tabIndex={-1}
        >
          {error || notice}
        </p>
      )}
      {needsRefresh && (
        <p className="text-sm">Refresh authorization before another change.</p>
      )}
      {pending && !busy && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm">
            The previous {pending.action} attempt needs confirmation. Refresh
            checks the latest status; retry confirms the original attempt.
          </p>
          <Button
            className="min-h-11"
            disabled={loading || needsRefresh}
            type="button"
            variant="outline"
            onClick={() => void send(pending)}
          >
            Retry previous {pending.action}
          </Button>
        </div>
      )}
      {data && (
        <>
          <p className="text-sm font-medium" role="status">
            {statusLabels[data.status]}
          </p>
          <div className="space-y-3 rounded-md border border-border p-4">
            <p className="text-sm font-medium">
              Current statement · {data.statement.version}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm">
              {data.statement.text}
            </p>
            {data.can_grant && (
              <form
                className="space-y-3"
                onSubmit={event => {
                  event.preventDefault();
                  start("grant");
                }}
              >
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                  <input
                    checked={affirmed}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    disabled={busy || loading || needsRefresh}
                    type="checkbox"
                    onChange={event => {
                      setAffirmed(event.target.checked);
                      if (pending) setNeedsRefresh(true);
                      setPending(null);
                    }}
                  />
                  I have read and agree to this authorization.
                </label>
                <Button
                  className="min-h-11"
                  disabled={
                    !affirmed || busy || loading || needsRefresh || !!pending
                  }
                  type="submit"
                >
                  Grant invoice authorization
                </Button>
              </form>
            )}
            {data.can_withdraw && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Withdrawal applies to future invoices. Existing invoices and
                  payments remain unchanged.
                </p>
                <Button
                  className="min-h-11"
                  disabled={busy || loading || needsRefresh || !!pending}
                  type="button"
                  variant="outline"
                  onClick={() => start("withdraw")}
                >
                  Withdraw invoice authorization
                </Button>
              </div>
            )}
            {!data.can_grant && !data.can_withdraw && (
              <p className="text-sm text-muted-foreground">
                No authorization changes are available to you here. Only the
                consultant can grant or withdraw their own permission.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Authorization history</h3>
            {data.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No authorization has been recorded for this engagement.
              </p>
            ) : (
              <ol aria-label="Authorization history" className="space-y-3">
                {data.history.map(event => (
                  <li
                    className="min-w-0 space-y-2 rounded-md border border-border p-3 text-sm"
                    data-testid={`authorization-event-${event.id}`}
                    key={event.id}
                  >
                    <p className="font-medium">
                      {event.action === "grant" ? "Granted" : "Withdrawn"}
                      {event.id === data.current_event?.id ? " · Current" : ""}
                    </p>
                    <p className="break-words text-muted-foreground">
                      <time
                        className="tabular-nums"
                        dateTime={event.created_at}
                      >
                        {new Date(event.created_at).toLocaleString()}
                      </time>
                      {` · ${event.statement_version}`}
                    </p>
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2">
                        View saved statement
                      </summary>
                      <p className="whitespace-pre-wrap break-words">
                        {event.statement_text}
                      </p>
                    </details>
                  </li>
                ))}
              </ol>
            )}
            {data.next_before_id && (
              <Button
                className="min-h-11"
                disabled={loading || busy}
                type="button"
                variant="outline"
                onClick={() => void load(data.next_before_id)}
              >
                Load older receipts
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default function InvoiceAuthorizationPage() {
  const { company, user, companyRole } = useUserContext();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const requestedUser = search.get("user_id");
  const userId = requestedUser ?? String(user?.id || "");
  if (
    !company?.id ||
    search.getAll("user_id").length > 1 ||
    String(company.id) !== String(user?.current_workspace_id) ||
    !/^[1-9]\d{0,18}$/.test(userId)
  ) {
    return (
      <p className="p-6 text-sm" role="alert">
        Invoice authorization is unavailable in this workspace.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl p-4 md:p-6">
      <InvoiceAuthorizationPanel
        companyId={String(company.id)}
        companyName={company.name}
        key={`${company.id}:${user.id}:${userId}:${companyRole}`}
        userId={userId}
      />
    </div>
  );
}
