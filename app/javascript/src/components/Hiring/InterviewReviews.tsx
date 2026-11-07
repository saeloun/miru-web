import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import Pager from "./Pager";
import AssessmentWork, { downloadAssessmentFile } from "./AssessmentWork";
import { failureMessage, read } from "./api";
import { answerText, type Pagination } from "./types";
import type { InterviewHandover } from "./interviewTypes";

function Handover({ companyId, id }: { companyId: number; id: string }) {
  const [data, setData] = useState<InterviewHandover | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const path = `interview_reviews/${encodeURIComponent(id)}`;
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error) feedback.current?.focus();
  }, [error]);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    setData(null);
    setError("");
    read<InterviewHandover>(path, companyId, {}, controller.signal)
      .then(result => {
        if (active) setData(result);
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
  }, [companyId, path, refresh]);

  const download = async (endpoint: string, filename: string) => {
    if (busy || loading) return;
    setBusy(true);
    try {
      await downloadAssessmentFile(`${path}/${endpoint}`, companyId, filename);
    } catch (failure) {
      if (mounted.current) {
        setData(null);
        setError(failureMessage(failure));
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-w-0 max-w-4xl space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Interview handover</h1>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/interview-reviews">Assigned interviews</Link>
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={busy || loading}
          onClick={() => setRefresh(value => value + 1)}
        >
          Refresh handover
        </Button>
      </div>
      {error && (
        <p ref={feedback} tabIndex={-1} role="alert">
          {error}
        </p>
      )}
      {loading && <p role="status">Loading private interview handover…</p>}
      {data && (
        <>
          <section
            aria-label="Interview details"
            className="min-w-0 space-y-4 rounded-lg border bg-card p-4"
          >
            <h2 className="break-words text-xl font-semibold">
              {data.handover.candidate.full_name}
            </h2>
            <p className="break-all">{data.handover.candidate.email}</p>
            {data.handover.role && <p>{data.handover.role.title}</p>}
            <h3 className="break-words font-semibold">
              Round {data.interview.number} · {data.interview.details.title}
            </h3>
            <p>
              {data.interview.details.kind} ·{" "}
              {data.interview.details.duration_minutes} minutes
            </p>
            <div>
              <h4 className="font-medium">Assessment criteria</h4>
              <p className="whitespace-pre-wrap break-words">
                {data.interview.details.criteria}
              </p>
            </div>
            {data.interview.details.preparation && (
              <div>
                <h4 className="font-medium">Preparation</h4>
                <p className="whitespace-pre-wrap break-words">
                  {data.interview.details.preparation}
                </p>
              </div>
            )}
            <div>
              <h4 className="font-medium">Feedback questions</h4>
              <ul className="list-inside list-disc break-words">
                {data.interview.details.feedback_questions.map(question => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
            <ul className="space-y-3">
              {data.interview.panel.map((member, index) => (
                <li key={index} className="space-y-1 rounded-lg border p-3">
                  <h4 className="break-words font-medium">
                    {member.full_name}
                  </h4>
                  <p className="whitespace-pre-wrap break-words">
                    {member.details.expertise}
                  </p>
                  <p className="whitespace-pre-wrap break-words">
                    {member.details.availability}
                  </p>
                  {member.details.booking_url && (
                    <a
                      className="inline-flex min-h-11 items-center text-primary underline"
                      href={member.details.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open booking link
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section
            aria-label="Candidate handover"
            className="min-w-0 space-y-4 rounded-lg border bg-card p-4"
          >
            <h2 className="text-lg font-semibold">Candidate information</h2>
            <p className="text-sm text-muted-foreground">
              Only information permitted for this round is shown.
            </p>
            {data.handover.form ? (
              <>
                <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
                  {data.handover.form.fields
                    .filter(field => field.type !== "file")
                    .map(field => (
                      <div key={field.id} className="min-w-0">
                        <dt className="font-medium">{field.label}</dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words">
                          {answerText(data.handover.form?.answers[field.id])}
                        </dd>
                      </div>
                    ))}
                </dl>
                {data.handover.form.resume && (
                  <Button
                    variant="outline"
                    className="h-auto min-h-11 max-w-full whitespace-normal break-all text-left"
                    disabled={busy || loading}
                    onClick={() =>
                      void download(
                        "resume",
                        data.handover.form!.resume!.filename
                      )
                    }
                  >
                    Download resume: {data.handover.form.resume.filename}
                  </Button>
                )}
              </>
            ) : (
              <p>No submitted candidate form.</p>
            )}
          </section>
          {data.handover.assessment && (
            <section
              aria-label="Assessment handover"
              className="min-w-0 space-y-4 rounded-lg border bg-card p-4"
            >
              <h2 className="text-lg font-semibold">Submitted assessment</h2>
              <AssessmentWork
                assessment={data.handover.assessment}
                busy={busy || loading}
                download={(attachmentId, filename) =>
                  void download(
                    `assignments/${
                      data.handover.assessment!.id
                    }/files/${attachmentId}`,
                    filename
                  )
                }
              />
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Interviews({ companyId }: { companyId: number }) {
  const [data, setData] = useState<{
    company_id: number;
    interviews: {
      id: number;
      candidate_name: string;
      title: string;
      kind: string;
      duration_minutes: number;
    }[];
    pagination: Pagination;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<NonNullable<typeof data>>(
      "interview_reviews",
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
    <main className="mx-auto min-w-0 max-w-4xl space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Assigned interviews</h1>
      <p>Open the private handover for your active interview assignments.</p>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => setRefresh(value => value + 1)}
      >
        Refresh interviews
      </Button>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Loading assigned interviews…</p>}
      {data && (
        <>
          {!data.interviews.length && (
            <p>No active interviews assigned to you.</p>
          )}
          <ul className="space-y-3">
            {data.interviews.map(record => (
              <li
                key={record.id}
                className="min-w-0 rounded-lg border bg-card p-4"
              >
                <Link
                  className="inline-flex min-h-11 items-center break-words text-primary underline"
                  to={`/interview-reviews/${record.id}`}
                >
                  {record.candidate_name} · {record.title}
                </Link>
                <p>
                  {record.kind} · {record.duration_minutes} minutes
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
    </main>
  );
}

export default function InterviewReviews() {
  const { company, companyRole } = useUserContext();
  const { interviewId } = useParams();
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
        Interview handover requires an active staff membership.
      </p>
    );
  }
  const companyId = Number(company.id);

  return interviewId ? (
    <Handover
      key={`${companyId}:${interviewId}`}
      companyId={companyId}
      id={interviewId}
    />
  ) : (
    <Interviews key={companyId} companyId={companyId} />
  );
}
