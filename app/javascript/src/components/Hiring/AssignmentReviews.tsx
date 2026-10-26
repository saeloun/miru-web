import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Api from "apis/api";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Pager from "./Pager";
import AssessmentWork, { downloadAssessmentFile } from "./AssessmentWork";
import { assessmentDimensions, type Assessment } from "./assessmentTypes";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import { stageLabel, type Pagination } from "./types";

type ReviewDraft = {
  applicationVersion: number;
  assignmentVersion: number;
  submissionId: number | null;
  dimensions: Record<string, string>;
  outcome: string;
  requestKind: string;
  notes: string;
};
const emptyReview = (record: Assessment): ReviewDraft => ({
  applicationVersion: record.application_version,
  assignmentVersion: record.lock_version,
  submissionId: record.submission?.id ?? null,
  dimensions: Object.fromEntries(
    Object.keys(assessmentDimensions).map(key => [key, ""])
  ),
  outcome: "",
  requestKind: "none",
  notes: "",
});

function ReviewDetail({ companyId, id }: { companyId: number; id: string }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const dirtyRef = useRef(false);
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const path = `assignment_reviews/${encodeURIComponent(id)}`;
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || notice) feedback.current?.focus();
  }, [error, notice]);

  const failed = (failure: unknown) => {
    if (
      axios.isAxiosError(failure) &&
      [403, 404].includes(failure.response?.status ?? 0)
    ) {
      setAssessment(null);
      setDraft(null);
      setDirty(false);
      dirtyRef.current = false;
      setError(
        "Review access is unavailable. Only the current designated active staff member can open this assignment."
      );
    } else setError(failureMessage(failure));
  };

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    read<{ company_id: number; assignment: Assessment }>(
      path,
      companyId,
      {},
      controller.signal
    )
      .then(result => {
        if (!active) return;
        setAssessment(result.assignment);
        if (!dirtyRef.current) setDraft(emptyReview(result.assignment));
        setError("");
      })
      .catch(failure => {
        if (active) failed(failure);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, path, refresh]);

  const update = (values: Partial<ReviewDraft>) => {
    dirtyRef.current = true;
    setDirty(true);
    setNotice("");
    setDraft(current => current && { ...current, ...values });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assessment?.submission || !draft || busy || loading) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await Api.post<{
        company_id: number;
        assignment: Assessment;
      }>(
        `/hiring/${path}/reviews`,
        {
          hiring_assignment: {
            company_id: companyId,
            application_version: draft.applicationVersion,
            assignment_version: draft.assignmentVersion,
            submission_id: draft.submissionId,
            dimensions: draft.dimensions,
            outcome: draft.outcome,
            request_kind: draft.requestKind,
            notes: draft.notes,
          },
        },
        quiet
      );
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      setAssessment(response.data.assignment);
      setDraft(emptyReview(response.data.assignment));
      dirtyRef.current = false;
      setDirty(false);
      setNotice("Review recorded. Admin decides the next step.");
    } catch (failure) {
      if (mounted.current) failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const download = async (fileId: number, filename: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadAssessmentFile(
        `${path}/files/${fileId}`,
        companyId,
        filename
      );
    } catch (failure) {
      if (mounted.current) failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-5 p-4 sm:p-6">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-primary underline"
        to="/assignment-reviews"
      >
        All assignment reviews
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Assignment review</h1>
        {assessment && (
          <p className="mt-2 break-words">
            {assessment.candidate_name} · {assessment.title}
          </p>
        )}
      </header>
      {(error || notice) && (
        <p
          ref={feedback}
          role={error ? "alert" : "status"}
          tabIndex={-1}
          className={`break-words text-sm ${error ? "text-destructive" : ""}`}
        >
          {error || notice}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          disabled={busy || loading}
          onClick={() => setRefresh(value => value + 1)}
        >
          Reload saved review
        </Button>
        {dirty && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy || loading}
            onClick={() => {
              dirtyRef.current = false;
              setDirty(false);
              setDraft(null);
              setRefresh(value => value + 1);
            }}
          >
            Discard draft and reload
          </Button>
        )}
      </div>
      {loading && <p role="status">Loading assignment review…</p>}
      {dirty && (
        <p className="text-sm text-muted-foreground">
          Reload keeps your unsaved feedback. Discard the draft before starting
          a new review of the latest saved work.
        </p>
      )}
      {assessment && (
        <AssessmentWork
          assessment={assessment}
          busy={busy || loading}
          download={(fileId, filename) => void download(fileId, filename)}
        />
      )}
      {assessment?.submission && draft && (
        <form
          onSubmit={save}
          className="space-y-5 rounded-lg border bg-card p-4"
        >
          <h2 className="font-semibold">Record assessment feedback</h2>
          <p className="text-sm text-muted-foreground">
            Verify the candidate's own contribution and understanding. A
            walkthrough or small follow-up can help; automated AI-detection
            scores are not proof of authorship.
          </p>
          <fieldset disabled={busy || loading} className="min-w-0 space-y-4">
            <legend className="sr-only">
              Assessment dimensions and recommendation
            </legend>
            {Object.entries(assessmentDimensions).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`assessment-${key}`}>{label}</Label>
                <Textarea
                  id={`assessment-${key}`}
                  required
                  maxLength={5000}
                  value={draft.dimensions[key]}
                  onChange={event =>
                    update({
                      dimensions: {
                        ...draft.dimensions,
                        [key]: event.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="assessment-outcome">Recommendation</Label>
              <select
                id="assessment-outcome"
                required
                className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.outcome}
                onChange={event =>
                  update({ outcome: event.target.value, requestKind: "none" })
                }
              >
                <option value="">Choose a recommendation</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="clarification_required">
                  Clarification Required
                </option>
              </select>
            </div>
            {draft.outcome === "clarification_required" && (
              <div className="space-y-2">
                <Label htmlFor="assessment-follow-up">Follow-up request</Label>
                <select
                  id="assessment-follow-up"
                  required
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  value={draft.requestKind === "none" ? "" : draft.requestKind}
                  onChange={event =>
                    update({ requestKind: event.target.value })
                  }
                >
                  <option value="">Choose a follow-up</option>
                  <option value="walkthrough">Walkthrough</option>
                  <option value="follow_up">Follow-up change</option>
                  <option value="revised_submission">Revised submission</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="assessment-review-notes">Review notes</Label>
              <Textarea
                id="assessment-review-notes"
                maxLength={10000}
                required={draft.outcome === "clarification_required"}
                value={draft.notes}
                onChange={event => update({ notes: event.target.value })}
              />
            </div>
            <Button type="submit" className="min-h-11">
              {busy ? "Saving…" : "Record assessment review"}
            </Button>
          </fieldset>
        </form>
      )}
    </div>
  );
}

function ReviewList({ companyId }: { companyId: number }) {
  const [data, setData] = useState<{
    company_id: number;
    assignments: Pick<
      Assessment,
      "id" | "title" | "candidate_name" | "role" | "status" | "due_at"
    >[];
    pagination: Pagination;
  } | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<NonNullable<typeof data>>(
      "assignment_reviews",
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
  }, [companyId, page, refresh]);

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Assignment reviews</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Active assignments designated to you. Hiring administration and
          compensation remain restricted.
        </p>
      </header>
      {error && (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setRefresh(value => value + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      {!data && !error && <p role="status">Loading assignment reviews…</p>}
      {data && (
        <>
          <ul className="divide-y rounded-lg border bg-card">
            {!data.assignments.length && (
              <li className="p-4 text-sm text-muted-foreground">
                No active assignments are designated to you.
              </li>
            )}
            {data.assignments.map(record => (
              <li key={record.id} className="min-w-0 space-y-1 p-4">
                <Link
                  className="inline-flex min-h-11 items-center break-words font-medium text-primary underline"
                  to={`/assignment-reviews/${record.id}`}
                >
                  {record.candidate_name} · {record.title}
                </Link>
                <p className="break-words text-sm">
                  {record.role || "No role specified"} ·{" "}
                  {stageLabel(record.status)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Candidate deadline: {new Date(record.due_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={false}
          />
        </>
      )}
    </div>
  );
}

export default function AssignmentReviews() {
  const { company, companyRole } = useUserContext();
  const { assignmentId } = useParams();
  if (!company) {
    return (
      <p role="status" className="p-6">
        Loading workspace…
      </p>
    );
  }

  if (
    !["owner", "admin", "manager", "employee", "book_keeper"].includes(
      companyRole
    )
  ) {
    return (
      <p role="alert" className="p-6">
        Assignment reviews require an active staff membership.
      </p>
    );
  }

  return assignmentId ? (
    <ReviewDetail
      key={`${company.id}:${assignmentId}`}
      companyId={company.id}
      id={assignmentId}
    />
  ) : (
    <ReviewList key={company.id} companyId={company.id} />
  );
}
