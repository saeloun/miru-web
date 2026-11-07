import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import Picker from "./Picker";
import Pager from "./Pager";
import InterviewBookings from "./InterviewBookings";
import FeedbackHistory from "./FeedbackHistory";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import {
  stageLabel,
  type Application,
  type ApplicationChange,
  type Choice,
} from "./types";
import type { Interview, InterviewPage, RoundDetails } from "./interviewTypes";

type Draft = {
  record: Interview | null;
  previousId: number | null;
  applicationVersion: number;
  requestKey: string;
  action: "update" | "complete" | "skip" | "cancel";
  details: RoundDetails;
  questions: string;
  panel: { id: number; label: string; compensation: boolean }[];
  reason: string;
};

export default function ApplicationInterviews({
  companyId,
  application,
  changed,
}: {
  companyId: number;
  application: Application;
  changed: (attributes: ApplicationChange) => void;
}) {
  const [data, setData] = useState<InterviewPage | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [bookingRoundId, setBookingRoundId] = useState<number | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const path = `applications/${application.id}/interviews`;
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
    if (data && data.application.lock_version < application.lock_version) {
      setRefresh(value => value + 1);
    }
  }, [application.lock_version, data?.application.lock_version]);

  const failed = (failure: unknown) => {
    if (
      axios.isAxiosError(failure) &&
      [403, 404].includes(failure.response?.status ?? 0)
    ) {
      setData(null);
      setDraft(null);
      setBookingRoundId(null);
    }
    setError(failureMessage(failure));
  };

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    read<InterviewPage>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (active) {
          setData(result);
          changed(result.application);
          setError("");
        }
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
  }, [companyId, path, page, refresh, expanded]);

  const begin = (
    record: Interview | null,
    action: Draft["action"] = "update",
    repeat = false
  ) => {
    setNotice("");
    setError("");
    setChoice(null);
    setDraft({
      record: repeat ? null : record,
      previousId: repeat ? record!.id : null,
      applicationVersion: Math.max(
        application.lock_version,
        data?.application.lock_version ?? 0
      ),
      requestKey: window.crypto.randomUUID(),
      action,
      reason: "",
      details: record
        ? { ...record.details }
        : {
            title: "",
            kind: "",
            duration_minutes: 30,
            criteria: "",
            preparation: "",
            feedback_questions: [],
          },
      questions: record?.details.feedback_questions.join("\n") || "",
      panel:
        record?.panel.map(member => ({
          id: member.panel_member_id,
          label: member.full_name,
          compensation: repeat ? false : member.compensation_access,
        })) || [],
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || busy || loading) return;

    if (draft.action === "update" && !draft.panel.length) {
      setError("Choose at least one active panel member.");

      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const attributes = {
        company_id: companyId,
        application_version: draft.applicationVersion,
        ...(draft.record
          ? {
              interview_version: draft.record.lock_version,
              action: draft.action,
              reason: draft.reason,
            }
          : {
              request_key: draft.requestKey,
              previous_interview_id: draft.previousId,
            }),
        ...(draft.action === "update"
          ? {
              details: {
                ...draft.details,
                feedback_questions: draft.questions
                  .split("\n")
                  .map(value => value.trim())
                  .filter(Boolean),
              },
              panel: draft.panel.map(member => ({
                panel_member_id: member.id,
                compensation_access: member.compensation,
              })),
            }
          : {}),
      };
      const body = { hiring_interview: attributes };
      const response = draft.record
        ? await Api.patch(`/hiring/${path}/${draft.record.id}`, body, quiet)
        : await Api.post(`/hiring/${path}`, body, quiet);
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      changed(response.data.application);
      setDraft(null);
      setNotice(
        draft.action === "update"
          ? "Interview round saved"
          : `Round ${stageLabel(response.data.interview.status).toLowerCase()}`
      );
      setPage(1);
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const closed = ["rejected", "hired", "withdrawn"].includes(application.stage);
  const controlsDisabled =
    busy || loading || !!draft || bookingRoundId !== null;

  if (!expanded) {
    return (
      <section
        aria-label="Interview rounds"
        className="space-y-4 rounded-lg border bg-card p-4 sm:p-6"
      >
        <h3 className="text-lg font-semibold">Interview rounds</h3>
        <p className="text-sm text-muted-foreground">
          Configure calls and later rounds, and manage private interviewer
          handover access.
        </p>
        <Button className="min-h-11" onClick={() => setExpanded(true)}>
          View interview rounds
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-label="Interview rounds"
      className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6"
    >
      <h3 className="text-lg font-semibold">Interview rounds</h3>
      <p className="text-sm text-muted-foreground">
        Configure screening calls and later rounds. Saving assigns private
        handover access; it does not send an invitation or schedule a meeting.
      </p>
      {(error || notice) && (
        <p ref={feedback} tabIndex={-1} role={error ? "alert" : "status"}>
          {error || notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          className="min-h-11"
          disabled={controlsDisabled || closed}
          onClick={() => begin(null)}
        >
          Add interview round
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={busy || bookingRoundId !== null}
          onClick={() => {
            setDraft(null);
            setChoice(null);
            setNotice("");
            setRefresh(value => value + 1);
          }}
        >
          {draft ? "Discard draft and reload rounds" : "Refresh rounds"}
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/hiring/panel">Manage interview panel</Link>
        </Button>
      </div>
      {closed && (
        <p>Reopen the application before adding or changing a round.</p>
      )}
      {draft && (
        <form onSubmit={save} className="space-y-4 rounded-lg border p-4">
          <fieldset disabled={busy || loading} className="min-w-0 space-y-4">
            <legend className="mb-3 font-medium">
              {draft.action === "update"
                ? draft.record
                  ? `Edit round ${draft.record.number}`
                  : "New interview round"
                : `${stageLabel(draft.action)} round ${draft.record?.number}`}
            </legend>
            {draft.action === "update" ? (
              <>
                {(
                  [
                    ["title", "Round title", 200],
                    ["kind", "Round type", 100],
                  ] as const
                ).map(([key, label, maximum]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`round-${key}`}>{label}</Label>
                    <Input
                      className="h-11"
                      id={`round-${key}`}
                      required
                      maxLength={maximum}
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
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="round-duration">Duration (minutes)</Label>
                  <Input
                    id="round-duration"
                    className="h-11"
                    type="number"
                    min={1}
                    max={1440}
                    step={1}
                    required
                    value={draft.details.duration_minutes || ""}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          duration_minutes: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
                {(
                  [
                    ["criteria", "Assessment criteria"],
                    ["preparation", "Candidate preparation"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`round-${key}`}>{label}</Label>
                    <Textarea
                      id={`round-${key}`}
                      required={key === "criteria"}
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
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="round-questions">
                    Feedback questions (one per line)
                  </Label>
                  <Textarea
                    id="round-questions"
                    required
                    maxLength={10020}
                    value={draft.questions}
                    onChange={event =>
                      setDraft({ ...draft, questions: event.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    1–20 questions, up to 500 characters each.
                  </p>
                </div>
                <Picker
                  id="round-panel"
                  label="Add interviewer"
                  companyId={companyId}
                  kind="panel_members"
                  purpose="intake"
                  value={choice}
                  change={value => {
                    setChoice(value);
                    if (
                      value &&
                      !draft.panel.some(member => member.id === value.id)
                    ) {
                      setDraft({
                        ...draft,
                        panel: [
                          ...draft.panel,
                          { ...value, compensation: false },
                        ],
                      });
                    }
                  }}
                  emptyLabel="Choose an active panel member"
                />
                <p className="text-sm text-muted-foreground">
                  Compensation is hidden unless you explicitly grant access to
                  that interviewer for this round. Other private form answers
                  stay hidden.
                </p>
                <ul className="space-y-3">
                  {draft.panel.map(member => (
                    <li
                      key={member.id}
                      className="space-y-3 rounded-lg border p-3"
                    >
                      <p className="break-words font-medium">{member.label}</p>
                      <label className="flex min-h-11 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={member.compensation}
                          onChange={event =>
                            setDraft({
                              ...draft,
                              panel: draft.panel.map(item =>
                                item.id === member.id
                                  ? {
                                      ...item,
                                      compensation: event.target.checked,
                                    }
                                  : item
                              ),
                            })
                          }
                        />
                        Allow compensation access for {member.label}
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 max-w-full whitespace-normal break-all text-left"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            panel: draft.panel.filter(
                              item => item.id !== member.id
                            ),
                          })
                        }
                      >
                        Remove {member.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="round-reason">Reason</Label>
                <Textarea
                  id="round-reason"
                  required
                  maxLength={2000}
                  value={draft.reason}
                  onChange={event =>
                    setDraft({ ...draft, reason: event.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Ending this round removes its handover access. Completed
                  history is retained.
                </p>
              </div>
            )}
            <Button type="submit" className="min-h-11">
              {busy
                ? "Saving…"
                : draft.action === "update"
                ? "Save interview round"
                : `Confirm ${draft.action}`}
            </Button>
          </fieldset>
        </form>
      )}
      {loading && <p role="status">Loading interview rounds…</p>}
      {data && (
        <>
          {!data.interviews.length && <p>No interview rounds yet.</p>}
          <ol className="space-y-4">
            {data.interviews.map(record => (
              <li
                key={record.id}
                className="min-w-0 space-y-3 rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h4 className="min-w-0 break-words font-semibold">
                    Round {record.number} · {record.details.title}
                  </h4>
                  <Badge variant="secondary">{stageLabel(record.status)}</Badge>
                </div>
                <p>
                  {record.details.kind} · {record.details.duration_minutes}{" "}
                  minutes
                </p>
                {record.previous_interview_id && (
                  <p className="text-sm text-muted-foreground">
                    Repeat of an earlier round
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">
                  Criteria: {record.details.criteria}
                </p>
                {record.details.preparation && (
                  <p className="whitespace-pre-wrap break-words">
                    Preparation: {record.details.preparation}
                  </p>
                )}
                <ul className="list-inside list-disc break-words">
                  {record.details.feedback_questions.map(question => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
                <ul className="space-y-1 text-sm">
                  {record.panel.map(member => (
                    <li key={member.panel_member_id} className="break-words">
                      {member.full_name} · Compensation{" "}
                      {member.compensation_access ? "allowed" : "hidden"}
                    </li>
                  ))}
                </ul>
                <FeedbackHistory
                  companyId={companyId}
                  path={`applications/${application.id}/interviews/${record.id}/feedback`}
                  title={`Feedback for round ${record.number}`}
                  onDenied={failed}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="min-h-11"
                    variant="outline"
                    disabled={controlsDisabled}
                    onClick={() => setBookingRoundId(record.id)}
                  >
                    Manage booking for round {record.number}
                  </Button>
                  {record.status === "planned" ? (
                    <>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        disabled={controlsDisabled || closed}
                        onClick={() => begin(record)}
                      >
                        Edit round {record.number}
                      </Button>
                      {(["complete", "skip", "cancel"] as const).map(action => (
                        <Button
                          key={action}
                          variant="outline"
                          className="min-h-11"
                          disabled={controlsDisabled || closed}
                          onClick={() => begin(record, action)}
                        >
                          {stageLabel(action)} round {record.number}
                        </Button>
                      ))}
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={controlsDisabled || closed}
                      onClick={() => begin(record, "update", true)}
                    >
                      Repeat round {record.number}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={controlsDisabled}
          />
        </>
      )}
      {bookingRoundId !== null && (
        <InterviewBookings
          key={`${companyId}:${bookingRoundId}`}
          companyId={companyId}
          applicationId={application.id}
          interviewId={bookingRoundId}
          applicationVersion={application.lock_version}
          changed={changed}
          close={() => setBookingRoundId(null)}
        />
      )}
    </section>
  );
}
