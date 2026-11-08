import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Picker from "./Picker";
import Pager from "./Pager";
import { accessDenied, failureMessage, read } from "./api";
import {
  receiptLabel,
  stageLabel,
  type ApplicationPage,
  type Choice,
} from "./types";

type PipelinePage = ApplicationPage & {
  metrics: {
    total_applications: number;
    stage_counts: Record<string, number>;
    stage_conversions: {
      from: string;
      to: string;
      count: number;
      recorded_from_count: number;
      percent: number;
    }[];
    rejection_reasons: Record<string, number>;
    rejected_without_reason: number;
    time_to_hire: {
      count: number;
      average_days: number | null;
      hired_without_timing: number;
    };
  };
  queues: Record<string, number>;
};

const queueLabels: Record<string, string> = {
  pending_reviews: "Pending assessment reviews",
  overdue_assignments: "Overdue assignments",
  upcoming_interviews: "Upcoming interviews",
  missing_feedback: "Missing interview feedback",
  hold_follow_ups: "Hold follow-ups due",
};

const emptyDraft = {
  query: "",
  stage: "",
  experience_min: "",
  experience_max: "",
  from: "",
  to: "",
};
type Filters = Record<string, string | number | undefined>;

export default function Pipeline({ companyId }: { companyId: number }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [role, setRole] = useState<Choice | null>(null);
  const [owner, setOwner] = useState<Choice | null>(null);
  const [interviewer, setInterviewer] = useState<Choice | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [queue, setQueue] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<PipelinePage | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [denied, setDenied] = useState("");

  const failAccess = useCallback((failure: unknown) => {
    setData(null);
    setDenied(failureMessage(failure));
    setStages({});
    setDraft(emptyDraft);
    setRole(null);
    setOwner(null);
    setInterviewer(null);
    setFilters(null);
    setQueue("");
  }, []);

  useEffect(() => {
    if (denied) return;
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    const params =
      filters === null && !queue && page === 1
        ? {}
        : {
            ...filters,
            query: filters?.query ?? "",
            queue: queue || undefined,
            page,
          };

    read<PipelinePage>("pipeline", companyId, params, controller.signal)
      .then(result => {
        if (!active) return;
        setData(result);
        setStages(result.stages);
      })
      .catch(failure => {
        if (!active) return;

        if (accessDenied(failure)) {
          failAccess(failure);
        } else setError(failureMessage(failure));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, filters, queue, page, refresh, denied, failAccess]);

  if (denied) {
    return (
      <p
        role="alert"
        className="rounded-lg border p-4 text-sm text-destructive"
      >
        {denied}
      </p>
    );
  }

  const clear = () => {
    setDraft(emptyDraft);
    setRole(null);
    setOwner(null);
    setInterviewer(null);
    setFilters(null);
    setQueue("");
    setPage(1);
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Hiring pipeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the pipeline and open applications that need attention.
        </p>
      </div>
      <form
        aria-label="Pipeline filters"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-3"
        onSubmit={event => {
          event.preventDefault();
          setFilters({
            query: draft.query,
            stage: draft.stage || undefined,
            role_id: role?.id,
            owner_employment_id: owner?.id,
            interviewer_panel_member_id: interviewer?.id,
            experience_min: draft.experience_min || undefined,
            experience_max: draft.experience_max || undefined,
            from: draft.from || undefined,
            to: draft.to || undefined,
          });
          setPage(1);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="pipeline-query">Find candidates</Label>
          <Input
            id="pipeline-query"
            className="h-11"
            maxLength={200}
            value={draft.query}
            placeholder="Name or email"
            onChange={event =>
              setDraft({ ...draft, query: event.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pipeline-stage">Stage</Label>
          <select
            id="pipeline-stage"
            value={draft.stage}
            onChange={event =>
              setDraft({ ...draft, stage: event.target.value })
            }
            className="h-11 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All stages</option>
            {Object.entries(stages).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Picker
          id="pipeline-role"
          label="Role"
          kind="roles"
          purpose="history"
          companyId={companyId}
          value={role}
          change={setRole}
          emptyLabel="All roles"
          onDenied={failAccess}
        />
        <Picker
          id="pipeline-owner"
          label="Hiring owner"
          kind="owners"
          purpose="history"
          companyId={companyId}
          value={owner}
          change={setOwner}
          emptyLabel="All owners"
          onDenied={failAccess}
        />
        <Picker
          id="pipeline-interviewer"
          label="Interviewer"
          kind="panel_members"
          purpose="history"
          companyId={companyId}
          value={interviewer}
          change={setInterviewer}
          emptyLabel="All interviewers"
          onDenied={failAccess}
        />
        {(["experience_min", "experience_max", "from", "to"] as const).map(
          key => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`pipeline-${key}`}>
                {key === "experience_min"
                  ? "Minimum total experience (years)"
                  : key === "experience_max"
                  ? "Maximum total experience (years)"
                  : key === "from"
                  ? "Received from"
                  : "Received through"}
              </Label>
              <Input
                id={`pipeline-${key}`}
                className="h-11"
                type={key === "from" || key === "to" ? "date" : "number"}
                min={key.startsWith("experience") ? "0" : undefined}
                step={key.startsWith("experience") ? "0.01" : undefined}
                value={draft[key]}
                onChange={event =>
                  setDraft({ ...draft, [key]: event.target.value })
                }
              />
            </div>
          )
        )}
        <div className="flex flex-wrap items-end gap-3">
          <Button type="submit" className="min-h-11">
            Apply filters
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={clear}
          >
            Clear filters
          </Button>
        </div>
      </form>

      {error ? (
        <div role="alert" className="space-y-3 rounded-lg border p-4 text-sm">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setRefresh(refresh + 1)}
          >
            Retry pipeline
          </Button>
        </div>
      ) : !data ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading pipeline…
        </p>
      ) : (
        <>
          <section
            aria-label="Pipeline metrics"
            className="space-y-4 rounded-lg border bg-card p-4"
          >
            <h3 className="font-semibold">
              Filtered pipeline · {data.metrics.total_applications}{" "}
              {data.metrics.total_applications === 1
                ? "application"
                : "applications"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Receipt dates use {data.time_zone}. Counts and queues cover this
              filtered cohort; selecting a queue changes the list below.
            </p>
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(data.metrics.stage_counts).map(
                ([stage, count]) => (
                  <div key={stage} className="flex justify-between gap-3">
                    <dt>{stageLabel(stage)}</dt>
                    <dd className="tabular-nums">{count}</dd>
                  </div>
                )
              )}
            </dl>
            <div className="border-t pt-4 text-sm">
              <p>
                Average time to hire:{" "}
                <strong>
                  {data.metrics.time_to_hire.average_days === null
                    ? "Not available"
                    : `${data.metrics.time_to_hire.average_days} days`}
                </strong>{" "}
                · {data.metrics.time_to_hire.count} applications with recorded
                hire timing.
              </p>
              <p className="mt-1 text-muted-foreground">
                {data.metrics.time_to_hire.hired_without_timing} hired
                applications have no usable recorded hire timing.
              </p>
            </div>
          </section>
          <section aria-label="Hiring queues" className="space-y-3">
            <h3 className="font-semibold">Needs attention</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={queue ? "outline" : "default"}
                className="min-h-11"
                aria-pressed={!queue}
                onClick={() => {
                  setQueue("");
                  setPage(1);
                }}
              >
                All filtered applications
              </Button>
              {Object.entries(queueLabels).map(([key, label]) => (
                <Button
                  key={key}
                  variant={queue === key ? "default" : "outline"}
                  className="min-h-11 max-w-full whitespace-normal text-left"
                  aria-pressed={queue === key}
                  onClick={() => {
                    setQueue(key);
                    setPage(1);
                  }}
                >
                  {label} · {data.queues[key] ?? "Not available"}
                </Button>
              ))}
            </div>
          </section>
          <section
            aria-label="Pipeline applications"
            className="min-w-0 rounded-lg border bg-card"
          >
            <h3 className="border-b p-4 font-semibold">
              {queueLabels[queue] || "Applications"}
            </h3>
            {data.applications.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No matching applications.
              </p>
            ) : (
              <ul className="divide-y">
                {data.applications.map(application => (
                  <li
                    key={application.id}
                    className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        className="inline-flex min-h-11 items-center break-words font-medium text-primary hover:underline"
                        to={`/hiring/applications/${application.id}`}
                      >
                        {application.candidate.full_name}
                      </Link>
                      <p className="break-all text-muted-foreground">
                        {application.candidate.email}
                      </p>
                      <p className="mt-1 break-words">
                        {application.role?.title || "No role yet"} ·{" "}
                        {application.owner?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <div className="space-y-2 text-muted-foreground">
                      <p>{stageLabel(application.stage)}</p>
                      <p>
                        {receiptLabel(application.received_at, data.time_zone)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t p-4">
              <Pager
                pagination={data.pagination}
                change={setPage}
                disabled={false}
              />
            </div>
          </section>
          <section
            aria-label="Recorded conversions"
            className="min-w-0 space-y-3 rounded-lg border bg-card p-4"
          >
            <h3 className="font-semibold">Recorded stage conversions</h3>
            <p className="text-sm text-muted-foreground">
              Each application counts once per transition. Denominators include
              applications with recorded evidence of the starting stage. Missing
              transitions and intermediate stages are not inferred.
            </p>
            {data.metrics.stage_conversions.length === 0 ? (
              <p className="text-sm">
                No recorded stage transitions in this cohort.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.metrics.stage_conversions.map(edge => (
                  <li
                    key={`${edge.from}-${edge.to}`}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <span>
                      {stageLabel(edge.from)} → {stageLabel(edge.to)}
                    </span>
                    <span className="tabular-nums">
                      {edge.count} / {edge.recorded_from_count} · {edge.percent}
                      %
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section
            aria-label="Rejection reasons"
            className="space-y-3 rounded-lg border bg-card p-4"
          >
            <h3 className="font-semibold">Finalized rejection reasons</h3>
            {Object.entries(data.metrics.rejection_reasons).length === 0 ? (
              <p className="text-sm">
                No finalized rejection reasons in this cohort.
              </p>
            ) : (
              <dl className="space-y-2 text-sm">
                {Object.entries(data.metrics.rejection_reasons).map(
                  ([reason, count]) => (
                    <div key={reason} className="flex justify-between gap-4">
                      <dt className="min-w-0 break-words">{reason}</dt>
                      <dd className="tabular-nums">{count}</dd>
                    </div>
                  )
                )}
              </dl>
            )}
            <p className="text-sm text-muted-foreground">
              {data.metrics.rejected_without_reason} rejected applications have
              no recorded finalized reason.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
