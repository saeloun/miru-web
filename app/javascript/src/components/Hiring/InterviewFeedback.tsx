import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import Pager from "./Pager";
import FeedbackDetails from "./FeedbackDetails";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import { stageLabel } from "./types";
import { bookingTimeLabel } from "./bookingTypes";
import {
  assessmentFields,
  recommendations,
  requiredAssessmentFields,
  type FeedbackContent,
  type FeedbackPage,
  type FeedbackResponse,
} from "./feedbackTypes";

const emptyContent = (questions: number): FeedbackContent => ({
  interview_on: "",
  attendance: "",
  topics: "",
  assessment: "",
  technical_skills: "",
  communication: "",
  strengths: "",
  concerns: "",
  evidence: "",
  recommendation: "",
  answers: Array(questions).fill(""),
});
type Draft = {
  applicationVersion: number;
  interviewVersion: number;
  bookingVersion: number;
  feedbackVersion: number;
  key: string;
  details: FeedbackContent;
};

function FeedbackForm({ companyId, id }: { companyId: number; id: string }) {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const message = useRef<HTMLParagraphElement>(null);
  const path = `interview_feedback/${encodeURIComponent(id)}`;
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || data?.feedback.state === "submitted") message.current?.focus();
  }, [error, data?.feedback.state]);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    setData(null);
    setError("");
    read<FeedbackResponse>(path, companyId, {}, controller.signal)
      .then(result => {
        if (!active) return;
        setData(result);
        setDraft(
          result.feedback.state === "submitted"
            ? null
            : {
                applicationVersion: result.application_version,
                interviewVersion: result.interview_version,
                bookingVersion: result.booking_version,
                feedbackVersion: result.feedback.lock_version,
                key: window.crypto.randomUUID(),
                details: emptyContent(result.round.feedback_questions.length),
              }
        );
      })
      .catch(failure => {
        if (active) {
          setData(null);
          setDraft(null);
          setError(failureMessage(failure));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, path, refresh]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || busy || loading) return;
    setBusy(true);
    setError("");
    try {
      const response = await Api.patch(
        `/hiring/${path}`,
        {
          hiring_feedback: {
            company_id: companyId,
            application_version: draft.applicationVersion,
            interview_version: draft.interviewVersion,
            booking_version: draft.bookingVersion,
            feedback_version: draft.feedbackVersion,
            request_key: draft.key,
            details: draft.details,
          },
        },
        quiet
      );
      verifyWorkspace(response.data, companyId);
      if (mounted.current) {
        setData(response.data);
        setDraft(null);
      }
    } catch (failure) {
      if (mounted.current) {
        setError(failureMessage(failure));
        if (
          axios.isAxiosError(failure) &&
          [403, 404].includes(failure.response?.status ?? 0)
        ) {
          setData(null);
          setDraft(null);
        }
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-w-0 max-w-4xl space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Interview feedback</h1>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/interview-feedback">Pending feedback</Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto min-h-11 whitespace-normal"
          disabled={busy || loading}
          onClick={() => {
            setDraft(null);
            setRefresh(value => value + 1);
          }}
        >
          {draft ? "Discard draft and reload feedback" : "Refresh feedback"}
        </Button>
      </div>
      {(error || data?.feedback.state === "submitted") && (
        <p ref={message} tabIndex={-1} role={error ? "alert" : "status"}>
          {error || "Feedback submitted"}
        </p>
      )}
      {loading && <p role="status">Loading feedback…</p>}
      {data && (
        <>
          <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
            <h2 className="break-words text-xl font-semibold">
              {data.candidate_name}
            </h2>
            <p className="break-words">
              Round {data.round.number} · {data.round.title}
            </p>
            <p className="whitespace-pre-wrap break-words">
              Criteria: {data.round.criteria}
            </p>
            <p className="break-words">
              Scheduled:{" "}
              {bookingTimeLabel(
                data.booking.starts_at,
                data.booking.candidate_time_zone
              )}{" "}
              · {data.booking.candidate_time_zone}
            </p>
            <p className="break-words">
              Feedback due:{" "}
              {bookingTimeLabel(
                data.booking.feedback_due_at,
                data.booking.candidate_time_zone
              )}{" "}
              · {data.booking.candidate_time_zone}
            </p>
            <p className="text-sm text-muted-foreground">
              Internal feedback is shared with assigned interviewers in later
              rounds. Keep Admin-only notes and pay details in their separate
              fields.
            </p>
          </section>
          {!draft && (
            <FeedbackDetails
              record={{
                ...data.feedback,
                booking: data.booking,
                round: data.round,
              }}
            />
          )}
          {draft && (
            <form
              onSubmit={submit}
              className="space-y-4 rounded-lg border bg-card p-4"
            >
              {!data.feedback.can_submit && (
                <p>
                  Feedback opens after the scheduled interview start. Refresh
                  when it is ready.
                </p>
              )}
              <fieldset
                disabled={busy || loading || !data.feedback.can_submit}
                className="min-w-0 space-y-4"
              >
                <legend className="mb-3 font-semibold">
                  Record interview feedback
                </legend>
                <div className="space-y-2">
                  <Label htmlFor="feedback-date">
                    {draft.details.attendance === "no_show"
                      ? "No-show date"
                      : "Actual interview date"}
                  </Label>
                  <Input
                    id="feedback-date"
                    className="h-11"
                    type="date"
                    required
                    value={draft.details.interview_on}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          interview_on: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-attendance">Attendance</Label>
                  <select
                    id="feedback-attendance"
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                    required
                    value={draft.details.attendance}
                    onChange={event => {
                      const clean = draft.details.attendance
                        ? emptyContent(data.round.feedback_questions.length)
                        : draft.details;

                      setDraft({
                        ...draft,
                        details: {
                          ...clean,
                          interview_on: draft.details.interview_on,
                          attendance: event.target.value,
                        },
                      });
                    }}
                  >
                    <option value="">Choose attendance</option>
                    <option value="attended">Attended</option>
                    <option value="no_show">No-show</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Changing attendance resets assessment answers, evidence and
                    recommendation.
                  </p>
                </div>
                {draft.details.attendance === "attended" && (
                  <>
                    {assessmentFields.map(([key, label]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`feedback-${key}`}>{label}</Label>
                        <Textarea
                          id={`feedback-${key}`}
                          required={requiredAssessmentFields.includes(key)}
                          maxLength={5000}
                          value={draft.details[key]}
                          onChange={event =>
                            setDraft({
                              ...draft,
                              details: {
                                ...draft.details,
                                [key]: event.target.value,
                              },
                            })
                          }
                        />
                        {!requiredAssessmentFields.includes(key) && (
                          <p className="text-sm text-muted-foreground">
                            Optional; record only what was assessed.
                          </p>
                        )}
                      </div>
                    ))}
                    {data.round.feedback_questions.map((question, index) => (
                      <div key={question} className="space-y-2">
                        <Label
                          className="break-words"
                          htmlFor={`feedback-question-${index}`}
                        >
                          {question}
                        </Label>
                        <Textarea
                          id={`feedback-question-${index}`}
                          required
                          maxLength={5000}
                          value={draft.details.answers[index]}
                          onChange={event =>
                            setDraft({
                              ...draft,
                              details: {
                                ...draft.details,
                                answers: draft.details.answers.map(
                                  (answer, position) =>
                                    position === index
                                      ? event.target.value
                                      : answer
                                ),
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="feedback-evidence">
                    Evidence and examples
                  </Label>
                  <Textarea
                    id="feedback-evidence"
                    required
                    maxLength={5000}
                    value={draft.details.evidence}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          evidence: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-recommendation">
                    Recommendation
                  </Label>
                  <select
                    id="feedback-recommendation"
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                    required
                    value={draft.details.recommendation}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          recommendation: event.target.value,
                        },
                      })
                    }
                  >
                    <option value="">Choose a recommendation</option>
                    {recommendations.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Submission preserves this review. Admin decides the next
                  stage; submitting does not email the candidate.
                </p>
                <Button type="submit" className="min-h-11">
                  {busy ? "Submitting…" : "Submit feedback"}
                </Button>
              </fieldset>
            </form>
          )}
        </>
      )}
    </main>
  );
}

function PendingFeedback({ companyId }: { companyId: number }) {
  const [data, setData] = useState<FeedbackPage | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<FeedbackPage>(
      "interview_feedback",
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
      <h1 className="text-2xl font-semibold">Interview feedback</h1>
      <p>
        Record your interview feedback, including completed rounds. Past
        deadlines remain open for evidence.
      </p>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => setRefresh(value => value + 1)}
      >
        Refresh pending feedback
      </Button>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Loading pending feedback…</p>}
      {data && (
        <>
          {!data.feedbacks.length && <p>No pending interview feedback.</p>}
          <ul className="space-y-3">
            {data.feedbacks.map(record => (
              <li
                key={record.id}
                className="min-w-0 space-y-3 rounded-lg border bg-card p-4"
              >
                <Link
                  className="inline-flex min-h-11 items-center break-words text-primary underline"
                  to={`/interview-feedback/${record.id}`}
                >
                  Record feedback for {record.candidate_name}
                </Link>
                <p className="break-words">
                  Round {record.round.number} · {record.round.title}
                </p>
                <Badge variant="secondary">{stageLabel(record.state)}</Badge>
                <p className="break-words">
                  Due:{" "}
                  {bookingTimeLabel(
                    record.booking.feedback_due_at,
                    record.booking.candidate_time_zone
                  )}{" "}
                  · {record.booking.candidate_time_zone}
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

export default function InterviewFeedback() {
  const { company, companyRole } = useUserContext();
  const { feedbackId } = useParams();
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
        Feedback requires an active staff membership.
      </p>
    );
  }
  const companyId = Number(company.id);

  return feedbackId ? (
    <FeedbackForm
      key={`${companyId}:${feedbackId}`}
      companyId={companyId}
      id={feedbackId}
    />
  ) : (
    <PendingFeedback key={companyId} companyId={companyId} />
  );
}
