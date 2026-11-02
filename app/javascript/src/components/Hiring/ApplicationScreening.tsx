import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import {
  receiptLabel,
  stageLabel,
  type Application,
  type ApplicationChange,
  type Choice,
  type Pagination,
} from "./types";

type Snapshot = {
  stage: string;
  role: { id: number; title: string } | null;
  owner: { id: number; full_name: string } | null;
};
type Screening = {
  id: number;
  action: string;
  from_stage: string;
  to_stage: string;
  created_at: string;
  details: {
    reason: string | null;
    actor_name: string;
    before: Snapshot;
    after: Snapshot;
  };
};
type ScreeningPage = {
  company_id: number;
  application: Application;
  screenings: Screening[];
  pagination: Pagination;
};
const actions: Record<string, string> = {
  update_details: "Save role and owner",
  shortlist: "Shortlist",
  request_information: "Record information request",
  interview: "Move to interview",
  reject: "Prepare rejection",
};

export default function ApplicationScreening({
  companyId,
  application,
  timeZone,
  changed,
}: {
  companyId: number;
  application: Application;
  timeZone: string;
  changed: (attributes: ApplicationChange) => void;
}) {
  const [data, setData] = useState<ScreeningPage | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [role, setRole] = useState<Choice | null>(null);
  const [owner, setOwner] = useState<Choice | null>(null);
  const [action, setAction] = useState("update_details");
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const initialized = useRef(false);
  const path = `applications/${application.id}/screenings`;
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || notice) feedback.current?.focus();
  }, [error, notice]);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    setError("");
    read<ScreeningPage>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (!active) return;
        setData(result);
        setVersion(current => current ?? result.application.lock_version);
        if (!initialized.current) {
          setRole(
            result.application.role && {
              id: result.application.role.id,
              label: result.application.role.title,
            }
          );

          setOwner(
            result.application.owner && {
              id: result.application.owner.id,
              label: result.application.owner.full_name,
            }
          );
          initialized.current = true;
        }

        changed({
          stage: result.application.stage,
          lock_version: result.application.lock_version,
          role: result.application.role,
          owner: result.application.owner,
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || version === null || busy || loading) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await Api.post<{
        company_id: number;
        application: Application;
      }>(
        `/hiring/${path}`,
        {
          screening: {
            company_id: companyId,
            lock_version: version,
            action,
            reason,
            role_id: role?.id ?? null,
            owner_employment_id: owner?.id ?? null,
          },
        },
        quiet
      );
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      const current = response.data.application;
      setVersion(current.lock_version);
      changed({
        stage: current.stage,
        lock_version: current.lock_version,
        role: current.role,
        owner: current.owner,
      });
      setReason("");
      setAction("update_details");
      setNotice("Screening saved. No candidate message was sent.");
      setPage(1);
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const closed = ["hired", "rejected", "withdrawn"].includes(application.stage);

  return (
    <section
      aria-label="Screening"
      className="space-y-5 rounded-lg border bg-card p-4 sm:p-6"
    >
      <div className="space-y-2">
        <h3 className="font-semibold">Screening</h3>
        <p className="text-sm text-muted-foreground">
          Review the application before choosing the next step. Coding
          assignments require a separate action.
        </p>
      </div>
      {(error || notice) && (
        <p
          ref={feedback}
          tabIndex={-1}
          role={error ? "alert" : "status"}
          className={`break-words text-sm ${
            error ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {error || notice}
        </p>
      )}
      <Button
        variant="outline"
        disabled={busy || loading}
        onClick={() => {
          setNotice(
            "Review your unsaved choices against the latest application before saving."
          );
          setVersion(null);
          setRefresh(value => value + 1);
        }}
      >
        Reload screening
      </Button>
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading screening history…
        </p>
      )}
      {closed ? (
        <p className="text-sm text-muted-foreground">
          This application is closed. Its screening history is retained below.
        </p>
      ) : (
        data && (
          <form onSubmit={save} className="space-y-4">
            <fieldset
              disabled={busy || loading || version === null}
              className="grid min-w-0 gap-4 sm:grid-cols-2"
            >
              <legend className="sr-only">Screening decision</legend>
              <Picker
                id="screening-role"
                label="Screening role"
                kind="roles"
                purpose="intake"
                companyId={companyId}
                value={role}
                change={setRole}
                emptyLabel="No role assigned"
              />
              <Picker
                id="screening-owner"
                label="Screening owner"
                kind="owners"
                purpose="intake"
                companyId={companyId}
                value={owner}
                change={setOwner}
                emptyLabel="Unassigned"
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="screening-action">Screening action</Label>
                <select
                  id="screening-action"
                  value={action}
                  onChange={event => setAction(event.target.value)}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(actions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="screening-reason">Screening reason</Label>
                <Textarea
                  id="screening-reason"
                  value={reason}
                  maxLength={10_000}
                  required={["request_information", "reject"].includes(action)}
                  onChange={event => setReason(event.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Internal history only. Information requests and rejection
                  remain unsent until a separate communication action.
                </p>
              </div>
              <Button type="submit" className="min-h-11 sm:col-span-2">
                {busy ? "Saving…" : "Save screening"}
              </Button>
            </fieldset>
          </form>
        )
      )}
      {data && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold">Screening history</h4>
          {!data.screenings.length && (
            <p className="text-sm text-muted-foreground">
              No screening decisions recorded.
            </p>
          )}
          <ol className="divide-y">
            {data.screenings.map(item => (
              <li key={item.id} className="space-y-2 py-3 text-sm">
                <p className="font-medium">
                  {actions[item.action] || stageLabel(item.action)} ·{" "}
                  {stageLabel(item.from_stage)} → {stageLabel(item.to_stage)}
                </p>
                <p className="break-words text-muted-foreground">
                  {item.details.actor_name} ·{" "}
                  {receiptLabel(item.created_at, timeZone)} · {timeZone}
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {item.details.reason || "No reason recorded."}
                </p>
                <p className="break-words text-muted-foreground">
                  Role: {item.details.before.role?.title || "Unassigned"} →{" "}
                  {item.details.after.role?.title || "Unassigned"}
                </p>
                <p className="break-words text-muted-foreground">
                  Owner: {item.details.before.owner?.full_name || "Unassigned"}{" "}
                  → {item.details.after.owner?.full_name || "Unassigned"}
                </p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={loading || busy || page === 1}
              onClick={() => setPage(value => value - 1)}
            >
              Previous screening page
            </Button>
            <Button
              variant="outline"
              disabled={loading || busy || !data.pagination.has_more}
              onClick={() => setPage(value => value + 1)}
            >
              Next screening page
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
