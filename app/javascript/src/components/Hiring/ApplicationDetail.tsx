import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { failureMessage, read } from "./api";
import {
  receiptLabel,
  stageLabel,
  type ApplicationDetail as Detail,
} from "./types";

export default function ApplicationDetail({
  companyId,
  id,
}: {
  companyId: number;
  id: string;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<Detail>(
      `applications/${encodeURIComponent(id)}`,
      companyId,
      { page },
      controller.signal
    )
      .then(result => {
        if (active) setData(result);
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, id, page, retry]);

  if (error) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => setRetry(retry + 1)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return <p role="status">Loading candidate history…</p>;
  const application = data.application;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="min-h-11">
        <Link to="/hiring">All applications</Link>
      </Button>
      <section className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold">
              {application.candidate.full_name}
            </h2>
            <p className="mt-1 break-all text-muted-foreground">
              {application.candidate.email}
            </p>
          </div>
          <Badge variant="secondary">{stageLabel(application.stage)}</Badge>
        </div>
        <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="mt-1">{application.role?.title || "No role yet"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Hiring owner</dt>
            <dd className="mt-1">
              {application.owner?.full_name || "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Received</dt>
            <dd className="mt-1 tabular-nums">
              {receiptLabel(application.received_at, data.time_zone)}
              <br />
              {data.time_zone}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source</dt>
            <dd className="mt-1">{stageLabel(application.source)} intake</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Submitted name</dt>
            <dd className="mt-1 break-words">{application.submitted_name}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t pt-5">
          <h3 className="text-sm font-semibold">Internal notes</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {application.notes || "No notes recorded."}
          </p>
        </div>
      </section>
      <section
        className="rounded-lg border bg-card p-4 sm:p-6"
        aria-labelledby="application-history-title"
      >
        <h3 id="application-history-title" className="font-semibold">
          Application history
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.history.length}
          {data.pagination.has_more ? "+" : ""}{" "}
          {data.history.length === 1 ? "application" : "applications"}
          {page > 1 ? " on this page" : ""}. Separate submissions retain their
          original details.
        </p>
        <ul className="mt-4 divide-y">
          {data.history.map(item => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div className="min-w-0 text-sm">
                <p className="break-words font-medium">{item.submitted_name}</p>
                <p className="mt-1 text-muted-foreground">
                  {item.role?.title || "No role yet"} · {stageLabel(item.stage)}
                </p>
                <p className="mt-1 tabular-nums text-muted-foreground">
                  {receiptLabel(item.received_at, data.time_zone)}
                </p>
              </div>
              <Button asChild variant="outline" className="min-h-11">
                <Link to={`/hiring/applications/${item.id}`}>
                  Open application {item.id}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="min-h-11"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={!data.pagination.has_more}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
