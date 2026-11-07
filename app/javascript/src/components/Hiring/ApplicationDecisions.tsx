import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import Pager from "./Pager";
import CandidateMessages from "./CandidateMessages";
import InternalNoticeHistory from "./InternalNoticeHistory";
import {
  accessDenied,
  failureMessage,
  quiet,
  read,
  verifyWorkspace,
} from "./api";
import {
  stageLabel,
  type Application,
  type ApplicationChange,
  type Choice,
  type Pagination,
  type InternalNotice,
} from "./types";

type Details = {
  outcome: string;
  reason: string;
  owner_employment_id: number | null;
  owner_name: string;
  follow_up_on: string | null;
  time_zone: string;
};
type Decision = {
  notifications?: InternalNotice[];
  id: number;
  state: string;
  lock_version: number;
  details: Details;
  finalized_by_name: string | null;
  finalized_at: string | null;
};
type Result = {
  company_id: number;
  application: Application;
  decision: Decision;
};
type History = {
  company_id: number;
  time_zone: string;
  application: Application;
  current_decision_id: number | null;
  decisions: Decision[];
  pagination: Pagination;
};
type Operation = {
  path: string;
  method: "post" | "patch";
  action: "save" | "finalize";
  attributes: Record<string, string | number | null>;
};
const outcomes = [
  ["pass", "Pass / selected for final review"],
  ["reject", "Reject"],
  ["hold", "Hold"],
  ["additional_round_required", "Additional round required"],
];

export default function ApplicationDecisions({
  companyId,
  application,
  changed,
  onDenied,
}: {
  companyId: number;
  application: Application;
  changed: (attributes: ApplicationChange) => void;
  onDenied: (failure: unknown) => void;
}) {
  const path = `applications/${application.id}/decisions`;
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<History | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [saved, setSaved] = useState<Decision | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [outcome, setOutcome] = useState("pass");
  const [reason, setReason] = useState("");
  const [owner, setOwner] = useState<Choice | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [requestKey, setRequestKey] = useState(() =>
    window.crypto.randomUUID()
  );
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<Operation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const initialized = useRef(false);
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
      setSaved(null);
      setReason("");
      setOwner(null);
      setPending(null);
      onDenied(failure);
    }
    setError(failureMessage(failure));
  };

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<History>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (!active) return;
        setData(result);
        if (!initialized.current) {
          const draft =
            result.decisions.find(
              record =>
                record.id === result.current_decision_id &&
                record.state === "draft"
            ) ?? null;
          setSaved(draft);
          setVersion(result.application.lock_version);
          setOutcome(
            draft?.details.outcome ??
              (result.application.stage === "rejection_pending"
                ? "reject"
                : "pass")
          );
          setReason(draft?.details.reason ?? "");
          setFollowUp(draft?.details.follow_up_on ?? "");
          setOwner(
            draft?.details.owner_employment_id
              ? {
                  id: draft.details.owner_employment_id,
                  label: draft.details.owner_name,
                }
              : null
          );
          initialized.current = true;
        }
      })
      .catch(failure => {
        if (active) failed(failure);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [expanded, path, companyId, page, refresh]);

  const dirty = Boolean(
    saved &&
      (saved.details.outcome !== outcome ||
        saved.details.reason !== reason ||
        (saved.details.owner_employment_id ?? null) !== (owner?.id ?? null) ||
        (saved.details.follow_up_on ?? "") !== followUp)
  );
  const closed = ["rejected", "withdrawn", "hired"].includes(application.stage);

  const send = async (operation: Operation) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setPending(operation);
    try {
      const body = { hiring_decision: operation.attributes };
      const response =
        operation.method === "patch"
          ? await Api.patch<Result>(operation.path, body, quiet)
          : await Api.post<Result>(operation.path, body, quiet);
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      const result = response.data;
      changed(result.application);
      setVersion(result.application.lock_version);
      setSaved(result.decision.state === "draft" ? result.decision : null);
      setPending(null);
      setConfirmed(false);
      setRequestKey(window.crypto.randomUUID());
      if (result.decision.state === "finalized") {
        setOutcome("pass");
        setReason("");
        setOwner(null);
        setFollowUp("");
        setNotice(
          operation.action === "finalize"
            ? "Decision finalized. Review message history for delivery status."
            : "This accepted request is already finalized. Review its history."
        );
      } else {
        setReason(result.decision.details.reason);
        setNotice("Decision draft saved. No stage change or email was made.");
      }
      setRefresh(value => value + 1);
    } catch (failure) {
      if (
        axios.isAxiosError(failure) &&
        failure.response &&
        failure.response.status < 500
      ) {
        setPending(null);
      }
      failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const save = () => {
    if (version === null || pending) return;
    const attributes = {
      company_id: companyId,
      application_version: version,
      outcome,
      reason,
      owner_employment_id: owner?.id ?? null,
      follow_up_on: followUp || null,
    };

    void send(
      saved
        ? {
            path: `/hiring/${path}/${saved.id}`,
            method: "patch",
            action: "save",
            attributes: { ...attributes, decision_version: saved.lock_version },
          }
        : {
            path: `/hiring/${path}`,
            method: "post",
            action: "save",
            attributes: { ...attributes, request_key: requestKey },
          }
    );
  };

  return (
    <section
      aria-label="Hiring decisions"
      className="min-w-0 space-y-4 rounded-lg border bg-card p-4 sm:p-6"
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? "Hide decisions" : "Review decisions"}
      </Button>
      {expanded && (
        <>
          <h3 className="font-semibold">Admin decision</h3>
          <p className="text-sm text-muted-foreground">
            Drafts do not change hiring stages or send mail. Finalized decisions
            are permanent records. Rejection and hold notices run automatically
            only when explicitly enabled and approved in communication settings.
            Internal reasons stay in Miru.
          </p>
          <p ref={status} role={error ? "alert" : "status"} tabIndex={-1}>
            {error || notice}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              initialized.current = false;
              setPending(null);
              setNotice("");
              setConfirmed(false);
              setRequestKey(window.crypto.randomUUID());
              setVersion(null);
              setPage(1);
              setRefresh(value => value + 1);
            }}
          >
            Discard edits and reload decisions
          </Button>
          {!data && !error && <p>Loading decision history…</p>}
          {data && (
            <>
              {closed ? (
                <p>
                  This application is closed. Its decision history is read-only.
                </p>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={event => {
                    event.preventDefault();
                    save();
                  }}
                >
                  <fieldset
                    disabled={busy || Boolean(pending)}
                    className="space-y-4"
                  >
                    <p>
                      {saved
                        ? `Editing draft #${saved.id}`
                        : "New decision draft"}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="decision-outcome">Decision outcome</Label>
                      <select
                        id="decision-outcome"
                        className="h-11 w-full rounded-md border bg-background px-3"
                        value={outcome}
                        onChange={event => {
                          setOutcome(event.target.value);
                          setConfirmed(false);
                          if (event.target.value !== "hold") {
                            setOwner(null);
                            setFollowUp("");
                          }
                        }}
                      >
                        {outcomes.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decision-reason">
                        Internal decision reason
                      </Label>
                      <Textarea
                        id="decision-reason"
                        value={reason}
                        maxLength={5000}
                        onChange={event => {
                          setReason(event.target.value);
                          setConfirmed(false);
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        This reason stays internal and is required before
                        finalization.
                      </p>
                    </div>
                    {outcome === "hold" && (
                      <>
                        <Picker
                          id="decision-hold-owner"
                          label="Hold owner"
                          companyId={companyId}
                          kind="owners"
                          purpose="history"
                          value={owner}
                          change={value => {
                            setOwner(value);
                            setConfirmed(false);
                          }}
                          emptyLabel="Choose active hold owner"
                        />
                        <div className="space-y-2">
                          <Label htmlFor="decision-follow-up">
                            Hold follow-up date
                          </Label>
                          <Input
                            id="decision-follow-up"
                            type="date"
                            value={followUp}
                            onChange={event => {
                              setFollowUp(event.target.value);
                              setConfirmed(false);
                            }}
                          />
                          <p>
                            Follow-up zone:{" "}
                            {saved?.details.time_zone ?? data.time_zone}
                          </p>
                        </div>
                      </>
                    )}
                    <Button
                      type="submit"
                      className="min-h-11"
                      disabled={version === null}
                    >
                      Save decision draft
                    </Button>
                    {saved && (
                      <div className="space-y-3 rounded border p-3">
                        <p>
                          Finalizing a pass, rejection or hold closes active
                          assessments and planned interviews. Completed history
                          is kept. Additional round required returns the
                          application to interviews without scheduling a round.
                        </p>
                        {dirty && <p>Save these changes before finalizing.</p>}
                        <Label className="flex min-h-11 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={confirmed}
                            disabled={dirty}
                            onChange={event =>
                              setConfirmed(event.target.checked)
                            }
                          />
                          I confirm this final decision
                        </Label>
                        <Button
                          type="button"
                          className="min-h-11"
                          disabled={dirty || !confirmed || version === null}
                          onClick={() => {
                            if (version !== null) {
                              void send({
                                path: `/hiring/${path}/${saved.id}/finalize`,
                                method: "post",
                                action: "finalize",
                                attributes: {
                                  company_id: companyId,
                                  application_version: version,
                                  decision_version: saved.lock_version,
                                },
                              });
                            }
                          }}
                        >
                          Finalize saved decision
                        </Button>
                      </div>
                    )}
                  </fieldset>
                </form>
              )}
              {pending && !busy && (
                <div className="space-y-3 rounded border p-3">
                  <p>
                    The response did not confirm whether this request was
                    accepted. Retry the same saved intent or reload its history
                    before changing it.
                  </p>
                  <Button
                    type="button"
                    className="min-h-11"
                    onClick={() => void send(pending)}
                  >
                    Retry unchanged decision request
                  </Button>
                </div>
              )}
              <h4 className="font-semibold">Decision history</h4>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRefresh(value => value + 1)}
              >
                Refresh decision history
              </Button>
              {!data.decisions.length && <p>No decisions recorded.</p>}
              {data.decisions.map(record => (
                <article
                  key={record.id}
                  className="space-y-2 rounded border p-3"
                >
                  <h5 className="font-semibold">
                    Decision #{record.id} · {stageLabel(record.state)} ·{" "}
                    {stageLabel(record.details.outcome)}
                  </h5>
                  <p className="whitespace-pre-wrap break-words">
                    {record.details.reason || "No reason saved"}
                  </p>
                  {record.details.outcome === "hold" && (
                    <p className="break-words">
                      Owner: {record.details.owner_name || "Not assigned"} ·
                      Follow-up: {record.details.follow_up_on || "Not set"} ·{" "}
                      {record.details.time_zone}
                    </p>
                  )}
                  {record.finalized_at && (
                    <p className="break-words">
                      Finalized by {record.finalized_by_name || "Former Admin"}{" "}
                      · {record.finalized_at}
                    </p>
                  )}
                  {record.details.outcome === "reject" && (
                    <CandidateMessages
                      companyId={companyId}
                      path={`${path}/${record.id}/messages`}
                      context={{
                        kind: "decision",
                        number: record.id,
                        version: record.lock_version,
                      }}
                      onDenied={onDenied}
                    />
                  )}
                  {record.details.outcome === "hold" && (
                    <InternalNoticeHistory
                      title="Hold follow-up delivery history"
                      notifications={record.notifications}
                    />
                  )}
                </article>
              ))}
              <Pager
                pagination={data.pagination}
                change={setPage}
                disabled={busy}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
