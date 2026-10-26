import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import Pager from "./Pager";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import {
  receiptLabel,
  stageLabel,
  type Application,
  type CandidateFormsPage,
  type CandidateFormReview,
  type FormAnswer,
} from "./types";

function answerText(value: FormAnswer | undefined) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  ) {
    return "Not provided";
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) return value.join("\n");

  if (typeof value === "object") {
    return `${value.amount} ${value.currency} · ${stageLabel(value.period)}`;
  }

  return value;
}

export default function ApplicationForms({
  companyId,
  applicationId,
  timeZone,
  changed,
}: {
  companyId: number;
  applicationId: number;
  timeZone: string;
  changed: (attributes: Pick<Application, "stage" | "lock_version">) => void;
}) {
  const [data, setData] = useState<CandidateFormsPage | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState<{ id: number; url: string } | null>(null);
  const [action, setAction] = useState<
    { kind: "replace" } | { kind: "revoke"; id: number } | null
  >(null);
  const linkInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const path = `applications/${applicationId}/forms`;
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
    read<CandidateFormsPage>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (!active) return;
        setData(result);
        setLink(current =>
          current?.id === result.active_access_id ? current : null
        );

        changed({
          stage: result.application_stage,
          lock_version: result.application_lock_version,
        });
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
  }, [path, companyId, page, refresh, changed]);

  const mutate = async (revokeId?: number) => {
    if (!data || busy || loading) return;
    setBusy(true);
    setError("");
    setNotice("");
    const attributes = {
      company_id: companyId,
      lock_version: data.application_lock_version,
    };
    try {
      const result = revokeId
        ? await Api.delete(`/hiring/${path}/${revokeId}`, {
            ...quiet,
            data: { hiring_form: attributes },
          })
        : await Api.post(
            `/hiring/${path}`,
            {
              hiring_form: {
                ...attributes,
                approved_setting_version: data.approved_setting_version,
              },
            },
            quiet
          );
      verifyWorkspace(result.data, companyId);
      if (!mounted.current) return;
      setLink(
        revokeId
          ? null
          : { id: result.data.form_access.id, url: result.data.form_access.url }
      );

      setNotice(
        revokeId
          ? "Private link revoked."
          : "Private link created. Copy it before leaving this page; no email was sent."
      );
      setPage(1);
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) {
        setError(failureMessage(failure));
        setLink(null);
      }
    } finally {
      if (mounted.current) {
        setBusy(false);
        setAction(null);
      }
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await window.navigator.clipboard.writeText(link.url);
      if (mounted.current) setNotice("Private link copied.");
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
      setNotice("Link selected. Use your keyboard or copy menu to copy it.");
    }
  };

  const download = async (form: CandidateFormReview) => {
    if (!form.resume || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data: blob } = await Api.get(
        `/hiring/${path}/${form.access_id}/resume`,
        {
          ...quiet,
          params: { company_id: companyId },
          responseType: "blob",
        }
      );
      if (!mounted.current) return;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = form.resume.filename;
      anchor.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch {
      if (mounted.current) {
        setError(
          "The resume could not be downloaded. Refresh forms and retry, or ask an administrator to check private storage."
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const closed =
    data && ["hired", "rejected", "withdrawn"].includes(data.application_stage);
  const disabled = busy || loading || Boolean(error);

  return (
    <section
      aria-label="Candidate forms"
      className="min-w-0 space-y-4 rounded-lg border bg-card p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 className="font-semibold">Candidate forms</h3>
          <p className="text-sm text-muted-foreground">
            Request information through a private link. Creating a link does not
            send email.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={busy || loading}
          onClick={() => setRefresh(value => value + 1)}
        >
          Refresh forms
        </Button>
      </header>
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
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
          Loading form history…
        </p>
      )}
      {data && (
        <>
          {closed ? (
            <p className="text-sm text-muted-foreground">
              Reopen the application before requesting another form.
            </p>
          ) : data.approved_setting_version === null ? (
            <p className="text-sm text-muted-foreground">
              <Link
                to="/hiring/communications"
                className="text-primary underline"
              >
                Enable and approve the candidate form
              </Link>{" "}
              before creating a link.
            </p>
          ) : null}
          <Button
            type="button"
            className="min-h-11"
            disabled={
              disabled ||
              Boolean(closed) ||
              data.approved_setting_version === null
            }
            onClick={() =>
              data.active_access_id
                ? setAction({ kind: "replace" })
                : void mutate()
            }
          >
            {data.active_access_id
              ? "Replace active link"
              : "Create private form link"}
          </Button>
          {link && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="candidate-private-link">Private form link</Label>
              <Input
                id="candidate-private-link"
                ref={linkInput}
                readOnly
                value={link.url}
                data-sentry-mask="true"
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={busy}
                onClick={() => void copy()}
              >
                Copy private link
              </Button>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can open this application form. Keep it
                private.
              </p>
            </div>
          )}
          {!data.forms.length && !loading && (
            <p className="text-sm text-muted-foreground">
              No candidate form has been requested.
            </p>
          )}
          <div className="space-y-4">
            {data.forms.map(form => {
              const expired = Date.parse(form.expires_at) <= Date.now();
              const status = form.revoked_at
                ? "Revoked"
                : expired
                ? "Expired"
                : closed
                ? "Unavailable"
                : "Active link";

              return (
                <article
                  key={form.id}
                  className="min-w-0 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {form.submitted_at
                          ? "Submitted"
                          : "Awaiting submission"}
                      </Badge>
                      <Badge variant="outline">{status}</Badge>
                    </div>
                    {!form.revoked_at && !expired && (
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={disabled}
                        onClick={() =>
                          setAction({ kind: "revoke", id: form.access_id })
                        }
                      >
                        Revoke link
                      </Button>
                    )}
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    Requested {receiptLabel(form.issued_at, timeZone)} · Form
                    version {form.approved_setting_version}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {form.submitted_at
                      ? `Submitted ${receiptLabel(form.submitted_at, timeZone)}`
                      : `Link expires ${receiptLabel(
                          form.expires_at,
                          timeZone
                        )}`}{" "}
                    · {timeZone}
                  </p>
                  {form.submitted_at && (
                    <details>
                      <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">
                        View submitted answers
                      </summary>
                      <p className="my-3 text-xs text-muted-foreground">
                        Restricted answers are shown only to authorized hiring
                        administrators. Submitted contact details do not replace
                        the verified candidate profile.
                      </p>
                      <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
                        {form.fields
                          .filter(field => field.type !== "file")
                          .map(field => (
                            <div key={field.id} className="min-w-0">
                              <dt className="break-words text-muted-foreground">
                                {field.label}
                                {field.sensitive && (
                                  <span className="ml-2 text-xs">
                                    Restricted
                                  </span>
                                )}
                              </dt>
                              <dd className="mt-1 whitespace-pre-wrap break-words tabular-nums">
                                {answerText(form.answers[field.id])}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    </details>
                  )}
                  {form.resume && (
                    <div className="space-y-2">
                      <p className="break-all text-sm">
                        Resume: {form.resume.filename}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        disabled={busy}
                        onClick={() => void download(form)}
                      >
                        Download resume
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={busy || loading}
          />
        </>
      )}
      <Dialog
        open={Boolean(action)}
        onOpenChange={open => {
          if (!open && !busy) setAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.kind === "revoke"
                ? "Revoke this candidate link?"
                : "Replace the active link?"}
            </DialogTitle>
            <DialogDescription>
              {action?.kind === "revoke"
                ? "The candidate will no longer be able to open this link. Their submitted answers and resume remain available to authorized hiring administrators."
                : "The previous link will stop working. A new form uses the currently approved questions; previous submissions remain in history. No email is sent."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={busy}
              onClick={() =>
                void mutate(action?.kind === "revoke" ? action.id : undefined)
              }
            >
              {busy
                ? "Saving…"
                : action?.kind === "revoke"
                ? "Revoke link"
                : "Replace link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
