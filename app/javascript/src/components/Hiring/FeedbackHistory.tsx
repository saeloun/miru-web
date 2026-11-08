import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Pager from "./Pager";
import FeedbackDetails from "./FeedbackDetails";
import { accessDenied, failureMessage, read } from "./api";
import type { FeedbackPage } from "./feedbackTypes";

export default function FeedbackHistory({
  companyId,
  path,
  title,
  onDenied,
}: {
  companyId: number;
  path: string;
  title: string;
  onDenied: (failure: unknown) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<FeedbackPage | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!expanded) return;
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<FeedbackPage>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (active) setData(result);
      })
      .catch(failure => {
        if (active) {
          setError(failureMessage(failure));
          if (accessDenied(failure)) {
            setData(null);
            onDenied(failure);
          }
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [expanded, companyId, path, page, refresh]);

  return (
    <section aria-label={title} className="min-w-0 space-y-3">
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-11 whitespace-normal"
        onClick={() => {
          setData(null);
          setExpanded(value => !value);
        }}
      >
        {expanded ? "Hide" : "View"} {title.toLowerCase()}
      </Button>
      {expanded && (
        <>
          <h4 className="font-semibold">{title}</h4>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            onClick={() => setRefresh(value => value + 1)}
          >
            Refresh {title.toLowerCase()}
          </Button>
          {error && <p role="alert">{error}</p>}
          {!data && !error && <p role="status">Loading feedback…</p>}
          {data && (
            <>
              {!data.feedbacks.length && (
                <p>No feedback recorded for this view.</p>
              )}
              {data.feedbacks.map(record => (
                <FeedbackDetails
                  key={record.id}
                  record={record}
                  recovery={{
                    companyId,
                    path: `${path}/${record.id}/messages`,
                    onDenied,
                  }}
                />
              ))}
              <Pager
                pagination={data.pagination}
                change={setPage}
                disabled={false}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
