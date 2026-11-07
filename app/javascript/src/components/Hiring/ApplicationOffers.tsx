import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Pager from "./Pager";
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
  type Pagination,
} from "./types";

export type OfferTerms = {
  engagement: string;
  title: string;
  amount: string;
  currency: string;
  period: string;
  joining_on: string;
  expires_on: string;
  time_zone?: string;
};
type Offer = {
  id: number;
  state: string;
  lock_version: number;
  details: OfferTerms;
  private_path?: string;
  revoked_at: string | null;
};
type History = {
  company_id: number;
  application: Application;
  offers: Offer[];
  pagination: Pagination;
};
type Result = { company_id: number; application: Application; offer: Offer };
type Operation = {
  path: string;
  method: "post" | "patch";
  action: "save" | "issue" | "revoke";
  attributes: Record<string, string | number>;
};
const emptyTerms: OfferTerms = {
  engagement: "",
  title: "",
  amount: "",
  currency: "",
  period: "monthly",
  joining_on: "",
  expires_on: "",
};

const inputs = [
  ["title", "Offer title", "text"],
  ["amount", "Approved compensation amount", "text"],
  ["currency", "Offer currency", "text"],
  ["joining_on", "Proposed joining date", "date"],
  ["expires_on", "Offer expiry date", "date"],
] as const;

export default function ApplicationOffers({
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
  const path = `applications/${application.id}/offers`;
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<History | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [saved, setSaved] = useState<Offer | null>(null);
  const [terms, setTerms] = useState<OfferTerms>(emptyTerms);
  const [version, setVersion] = useState<number | null>(null);
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
      setTerms(emptyTerms);
      setPending(null);
      onDenied(failure);
    }
    setError(failureMessage(failure));
  };

  useEffect(() => {
    if (!expanded) return;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<History>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setData(result);
        if (!initialized.current && page === 1) {
          const draft =
            result.offers.find(record => record.state === "preparing") ?? null;
          setSaved(draft);
          setTerms(
            draft?.details ?? {
              ...emptyTerms,
              title: result.application.role?.title ?? "",
            }
          );
          setVersion(result.application.lock_version);
          initialized.current = true;
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) failed(failure);
      });

    return () => controller.abort();
  }, [expanded, path, companyId, page, refresh]);

  const dirty = Boolean(
    saved &&
      Object.keys(emptyTerms).some(key => saved.details[key] !== terms[key])
  );

  const activeIssued = data?.offers.some(record =>
    ["sent", "accepted"].includes(record.state)
  );

  const canPrepare =
    page === 1 &&
    !activeIssued &&
    ["final_decision", "offer"].includes(application.stage);

  const send = async (operation: Operation) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setPending(operation);
    try {
      const body = { hiring_offer: operation.attributes };
      const response =
        operation.method === "patch"
          ? await Api.patch<Result>(operation.path, body, quiet)
          : await Api.post<Result>(operation.path, body, quiet);
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      const result = response.data;
      changed(result.application);
      setVersion(result.application.lock_version);
      setSaved(result.offer.state === "preparing" ? result.offer : null);
      setTerms(
        result.offer.state === "preparing" ? result.offer.details : emptyTerms
      );
      setConfirmed(false);
      setPending(null);
      setRequestKey(window.crypto.randomUUID());
      setNotice(
        operation.action === "issue"
          ? "Private offer issued. No email was sent."
          : operation.action === "revoke"
          ? "Private offer link revoked."
          : result.offer.state === "preparing"
          ? "Offer draft saved. No email was sent."
          : "This saved request is already issued. Review its history."
      );
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
    const { time_zone: _zone, ...values } = terms;
    const attributes = {
      ...values,
      company_id: companyId,
      application_version: version,
    };

    void send(
      saved
        ? {
            path: `/hiring/${path}/${saved.id}`,
            method: "patch",
            action: "save",
            attributes: { ...attributes, offer_version: saved.lock_version },
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
      aria-label="Hiring offers"
      className="min-w-0 space-y-4 rounded-lg border bg-card p-4 sm:p-6"
    >
      <Button variant="outline" onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide offers" : "Review offers"}
      </Button>
      {expanded && (
        <>
          <h3 className="font-semibold">Offers</h3>
          <p>
            Approve saved terms before issuing a private offer link. Sent means
            issued through this link; email delivery is separate. Acceptance
            does not create a profile, start payroll or send an agreement.
          </p>
          <p ref={status} role={error ? "alert" : "status"} tabIndex={-1}>
            {error || notice}
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              initialized.current = false;
              setPending(null);
              setConfirmed(false);
              setRequestKey(window.crypto.randomUUID());
              setVersion(null);
              setPage(1);
              setRefresh(value => value + 1);
            }}
          >
            Discard edits and reload offers
          </Button>
          {!data && !error && <p>Loading offer history…</p>}
          {data && (
            <>
              {canPrepare && (
                <form
                  onSubmit={event => {
                    event.preventDefault();
                    save();
                  }}
                  className="space-y-4"
                >
                  <fieldset
                    disabled={busy || Boolean(pending)}
                    className="space-y-4"
                  >
                    <p>
                      {saved
                        ? `Editing offer draft #${saved.id}`
                        : "New offer draft"}
                    </p>
                    <Label htmlFor="offer-engagement">Offer engagement</Label>
                    <select
                      id="offer-engagement"
                      className="h-11 w-full rounded border bg-background px-3"
                      value={terms.engagement}
                      onChange={event => {
                        setTerms({ ...terms, engagement: event.target.value });
                        setConfirmed(false);
                      }}
                    >
                      <option value="">Choose engagement</option>
                      <option value="employee">Employee</option>
                      <option value="consultant">Consultant</option>
                    </select>
                    {inputs.map(([key, label, type]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`offer-${key}`}>{label}</Label>
                        <Input
                          id={`offer-${key}`}
                          type={type}
                          value={terms[key]}
                          maxLength={key === "currency" ? 3 : 200}
                          onChange={event => {
                            setTerms({ ...terms, [key]: event.target.value });
                            setConfirmed(false);
                          }}
                        />
                      </div>
                    ))}
                    <Label htmlFor="offer-period">Compensation period</Label>
                    <select
                      id="offer-period"
                      className="h-11 w-full rounded border bg-background px-3"
                      value={terms.period}
                      onChange={event => {
                        setTerms({ ...terms, period: event.target.value });
                        setConfirmed(false);
                      }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Use a three-letter currency and up to two decimal places.
                      Expiry is at the end of the saved local date; issued terms
                      cannot be edited.
                    </p>
                    <Button type="submit" disabled={version === null}>
                      Save offer draft
                    </Button>
                    {saved && (
                      <div className="space-y-3 rounded border p-3">
                        <p>
                          Saved expiry zone: {saved.details.time_zone}.{" "}
                          {dirty
                            ? "Save your changes before approving."
                            : "Review the saved history below before approval."}
                        </p>
                        <Label className="flex min-h-11 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={confirmed}
                            disabled={dirty}
                            onChange={event =>
                              setConfirmed(event.target.checked)
                            }
                          />
                          I approve these saved terms and the private offer link
                        </Label>
                        <Button
                          type="button"
                          disabled={!confirmed || dirty}
                          onClick={() => {
                            if (version !== null) {
                              void send({
                                path: `/hiring/${path}/${saved.id}/issue`,
                                method: "post",
                                action: "issue",
                                attributes: {
                                  company_id: companyId,
                                  application_version: version,
                                  offer_version: saved.lock_version,
                                },
                              });
                            }
                          }}
                        >
                          Approve and issue private offer
                        </Button>
                      </div>
                    )}
                  </fieldset>
                </form>
              )}
              {!canPrepare && (
                <p>
                  Review the active offer or finalize the current selection
                  before preparing another offer.
                </p>
              )}
              {pending && (
                <div className="space-y-2 rounded border p-3">
                  <p>
                    The request may have been recorded. Retry only this
                    unchanged request or reload its history before starting
                    another.
                  </p>
                  <Button disabled={busy} onClick={() => void send(pending)}>
                    Retry unchanged offer request
                  </Button>
                </div>
              )}
              <h4 className="font-semibold">Offer history</h4>
              {!data.offers.length && <p>No offers recorded.</p>}
              {data.offers.map(record => (
                <article
                  key={record.id}
                  className="space-y-2 rounded border p-3"
                >
                  <h5 className="font-semibold">
                    Offer #{record.id} · {stageLabel(record.state)}
                  </h5>
                  <p className="break-words">
                    {record.details.title} ·{" "}
                    {stageLabel(record.details.engagement)}
                  </p>
                  <p>
                    {record.details.amount} {record.details.currency} /{" "}
                    {record.details.period}
                  </p>
                  <p>
                    Joining: {record.details.joining_on} · Expires:{" "}
                    {record.details.expires_on} ({record.details.time_zone})
                  </p>
                  {record.private_path && (
                    <>
                      <p>
                        <a
                          href={record.private_path}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all underline"
                        >
                          Open private offer {record.id}
                        </a>
                      </p>
                      <Button
                        variant="outline"
                        disabled={busy || Boolean(pending)}
                        onClick={() =>
                          void send({
                            path: `/hiring/${path}/${record.id}/revoke`,
                            method: "post",
                            action: "revoke",
                            attributes: {
                              company_id: companyId,
                              application_version:
                                data.application.lock_version,
                              offer_version: record.lock_version,
                            },
                          })
                        }
                      >
                        Revoke private offer {record.id}
                      </Button>
                    </>
                  )}
                  {record.revoked_at && <p>Private link revoked</p>}
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
