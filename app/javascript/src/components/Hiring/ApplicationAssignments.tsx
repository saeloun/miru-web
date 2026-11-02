import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import Pager from "./Pager";
import AssessmentWork, { downloadAssessmentFile } from "./AssessmentWork";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { AssignmentTemplate } from "./AssignmentLibrary";
import type { AdminAssessment, AssessmentPage } from "./assessmentTypes";
import {
  stageLabel,
  type Application,
  type ApplicationChange,
  type Choice,
} from "./types";

type Draft = {
  applicationVersion: number;
  assignmentId: number | null;
  assignmentVersion: number | null;
  reviewId: number | null;
  requestKey: string;
  template: Choice | null;
  task: AssignmentTemplate | null;
  reviewer: Choice | null;
  deadline: string;
  note: string;
  reason: string;
  action: string;
};
const emptyDraft = (data: AssessmentPage): Draft => {
  const current = data.assignments.find(
    record => record.id === data.active_assignment_id
  );

  return {
    applicationVersion: data.application_version,
    assignmentId: data.active_assignment_id,
    assignmentVersion: current?.lock_version ?? null,
    reviewId: current?.current_review_id ?? null,
    requestKey: window.crypto.randomUUID(),
    template: null,
    task: null,
    reviewer: null,
    deadline: "",
    note: "",
    reason: "",
    action: "",
  };
};

export default function ApplicationAssignments({
  companyId,
  application,
  changed,
}: {
  companyId: number;
  application: Application;
  changed: (attributes: ApplicationChange) => void;
}) {
  const [data, setData] = useState<AssessmentPage | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const mounted = useRef(true);
  const taskRequest = useRef<InstanceType<
    typeof window.AbortController
  > | null>(null);
  const feedback = useRef<HTMLParagraphElement>(null);
  const path = `applications/${application.id}/assignments`;
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      taskRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (error || notice) feedback.current?.focus();
  }, [error, notice]);

  useEffect(() => {
    if (data && data.application_version < application.lock_version) {
      setRefresh(value => value + 1);
    }
  }, [application.lock_version, data?.application_version]);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    read<AssessmentPage>(path, companyId, { page }, controller.signal)
      .then(result => {
        if (!active) return;
        setData(result);
        if (!dirtyRef.current) setDraft(emptyDraft(result));
        changed({
          stage: result.application_stage,
          lock_version: result.application_version,
        });
        setError("");
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
  }, [companyId, path, page, refresh, changed]);

  const update = (values: Partial<Draft>) => {
    dirtyRef.current = true;
    setDirty(true);
    setDraft(current => current && { ...current, ...values });
    setNotice("");
  };

  const selectTemplate = async (choice: Choice | null) => {
    taskRequest.current?.abort();
    update({ template: choice, task: null });
    setTaskLoading(false);
    if (!choice) return;
    const controller = new window.AbortController();
    taskRequest.current = controller;
    setTaskLoading(true);
    try {
      const result = await read<{
        company_id: number;
        template: AssignmentTemplate;
      }>(`assignment_templates/${choice.id}`, companyId, {}, controller.signal);
      if (!controller.signal.aborted) {
        setDraft(current =>
          current?.template?.id === choice.id
            ? { ...current, task: result.template }
            : current
        );
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(failureMessage(failure));
    } finally {
      if (!controller.signal.aborted) setTaskLoading(false);
    }
  };

  const reload = (discard = false) => {
    if (discard) {
      taskRequest.current?.abort();
      setTaskLoading(false);
      dirtyRef.current = false;
      setDirty(false);
      setDraft(null);
    }
    setRefresh(value => value + 1);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || !draft || busy || loading || taskLoading) return;
    const issue = draft.assignmentId === null;
    const needsTask = issue || draft.action === "revise";
    if (
      needsTask &&
      (!draft.task ||
        draft.task.status !== "approved" ||
        !draft.reviewer ||
        !draft.deadline)
    ) {
      setError(
        "Choose an approved task, an active reviewer and a submission deadline."
      );

      return;
    }

    if (!issue && (!draft.action || !draft.reason.trim())) {
      setError("Choose an assignment action and record your reason.");

      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const attributes: Record<string, unknown> = {
        company_id: companyId,
        application_version: draft.applicationVersion,
      };
      if (needsTask) {
        const due = new Date(draft.deadline);
        if (!Number.isFinite(due.getTime())) {
          throw new Error("Invalid deadline");
        }

        Object.assign(attributes, {
          template_id: draft.task!.id,
          template_version: draft.task!.lock_version,
          reviewer_employment_id: draft.reviewer!.id,
          due_at: due.toISOString(),
          request_key: draft.requestKey,
          candidate_note: draft.note,
        });
      }

      if (!issue) {
        Object.assign(attributes, {
          assignment_version: draft.assignmentVersion,
          reason: draft.reason,
        });
      }

      if (draft.action === "reassign") {
        attributes.reviewer_employment_id = draft.reviewer?.id ?? null;
      } else if (!issue) {
        Object.assign(attributes, {
          action: draft.action,
          review_id: draft.reviewId,
        });
      }

      const endpoint = issue
        ? path
        : `${path}/${draft.assignmentId}/${
            draft.action === "reassign" ? "reassign" : "decision"
          }`;

      const response = await Api.post<{
        company_id: number;
        assignment: AdminAssessment;
      }>(`/hiring/${endpoint}`, { hiring_assignment: attributes }, quiet);
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      dirtyRef.current = false;
      setDirty(false);
      setDraft(null);
      setData(null);
      setPage(1);
      changed({
        stage: response.data.assignment.application_stage,
        lock_version: response.data.assignment.application_version,
      });

      setNotice(
        issue
          ? "Assignment link created. No email was sent."
          : "Assignment decision saved."
      );
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const download = async (
    assignment: AdminAssessment,
    id: number,
    filename: string
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadAssessmentFile(
        `${path}/${assignment.id}/files/${id}`,
        companyId,
        filename
      );
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const issuing = draft?.assignmentId === null;
  const needsTask = issuing || draft?.action === "revise";
  const current = data?.assignments.find(
    record => record.id === draft?.assignmentId
  );

  const editing =
    data &&
    draft &&
    (issuing ? data.can_issue || dirty : current && !current.ended_at);

  const sameContext =
    data && draft && data.active_assignment_id === draft.assignmentId;

  return (
    <section
      aria-label="Assignments"
      className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Assignments</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Issue approved work explicitly. Reviews recommend; Admin decides the
            next step.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy || loading}
            onClick={() => reload()}
          >
            Reload saved state
          </Button>
          {dirty && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={busy || loading}
              onClick={() => reload(true)}
            >
              Discard draft and reload
            </Button>
          )}
        </div>
      </div>
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
      {loading && (
        <p role="status" className="text-sm">
          Loading assignments…
        </p>
      )}
      {dirty && (
        <p className="text-sm text-muted-foreground">
          Reload keeps your unsaved draft. Discard the draft to start from the
          latest saved state.
        </p>
      )}
      {data && draft && !sameContext && (
        <p role="status" className="text-sm">
          The active assignment changed. Review the saved history, retry your
          original issue request if needed, or discard the draft before a new
          decision.
        </p>
      )}
      {data &&
        draft &&
        draft.assignmentId === null &&
        data.assignments.some(
          record => record.request_key === draft.requestKey
        ) && (
          <p role="status" className="text-sm">
            An assignment was saved for this request. Its link is in the saved
            history below.
          </p>
        )}
      {editing && draft && (
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={busy || loading} className="min-w-0 space-y-4">
            <legend className="mb-3 font-medium">
              {issuing
                ? "Issue an assignment"
                : `Decision for assignment #${draft.assignmentId}`}
            </legend>
            {!issuing && (
              <div className="space-y-2">
                <Label htmlFor="assessment-action">Assignment action</Label>
                <select
                  id="assessment-action"
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  required
                  value={draft.action}
                  onChange={event => update({ action: event.target.value })}
                >
                  <option value="">Choose an action</option>
                  <option value="reassign">Reassign reviewer</option>
                  <option value="revise">Request revised work</option>
                  <option
                    value="advance"
                    disabled={!current?.current_review_id}
                  >
                    Advance to interview
                  </option>
                  <option value="reject" disabled={!current?.current_review_id}>
                    Prepare rejection
                  </option>
                  <option value="cancel">Cancel assignment</option>
                </select>
              </div>
            )}
            {needsTask && (
              <>
                <Picker
                  id="assessment-template"
                  label="Approved assignment task"
                  companyId={companyId}
                  kind="assignment_templates"
                  purpose="intake"
                  value={draft.template}
                  change={choice => void selectTemplate(choice)}
                  emptyLabel="Choose an approved task"
                />
                {taskLoading && <p role="status">Loading approved task…</p>}
                {draft.task && (
                  <div className="space-y-2 rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      Approved task version {draft.task.lock_version} ·{" "}
                      {draft.task.details.expected_minutes} minutes
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      {draft.task.details.instructions}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      Criteria: {draft.task.details.criteria}
                    </p>
                    <p>
                      Submission method:{" "}
                      {stageLabel(draft.task.details.submission_method || "")}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      AI policy: {draft.task.details.ai_policy}
                    </p>
                    {draft.task.status !== "approved" && (
                      <p role="alert" className="text-destructive">
                        This task is no longer approved. Choose a current
                        approved task.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {(needsTask || draft.action === "reassign") && (
              <Picker
                id="assessment-reviewer"
                label="Designated reviewer"
                companyId={companyId}
                kind="owners"
                purpose="intake"
                value={draft.reviewer}
                change={reviewer => update({ reviewer })}
                emptyLabel="Choose active staff"
              />
            )}
            {needsTask && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="assessment-deadline">
                    Submission deadline
                  </Label>
                  <Input
                    id="assessment-deadline"
                    type="datetime-local"
                    required
                    value={draft.deadline}
                    onChange={event => update({ deadline: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your browser time zone:{" "}
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}. Revising
                    work creates a new link and preserves the previous
                    submission.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessment-note">
                    Candidate instructions
                  </Label>
                  <Textarea
                    id="assessment-note"
                    maxLength={10000}
                    required={draft.action === "revise"}
                    value={draft.note}
                    onChange={event => update({ note: event.target.value })}
                  />
                </div>
              </>
            )}
            {!issuing && (
              <div className="space-y-2">
                <Label htmlFor="assessment-reason">Decision reason</Label>
                <Textarea
                  id="assessment-reason"
                  required
                  maxLength={10000}
                  value={draft.reason}
                  onChange={event => update({ reason: event.target.value })}
                />
              </div>
            )}
            <Button
              type="submit"
              className="min-h-11"
              disabled={taskLoading || (!issuing && !sameContext)}
            >
              {busy
                ? "Saving…"
                : issuing
                ? "Issue assignment link"
                : "Save assignment decision"}
            </Button>
          </fieldset>
        </form>
      )}
      {data &&
        !editing &&
        !loading &&
        !data.active_assignment_id &&
        !data.can_issue && (
          <p className="text-sm text-muted-foreground">
            Reopen this application before issuing an assignment.
          </p>
        )}
      {data?.active_assignment_id &&
        !data.assignments.some(
          record => record.id === data.active_assignment_id
        ) && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setPage(1)}
          >
            View current assignment
          </Button>
        )}
      {data && (
        <div className="space-y-4">
          <h4 className="font-medium">Saved assignment history</h4>
          {!data.assignments.length && (
            <p className="text-sm text-muted-foreground">
              No assignment has been issued.
            </p>
          )}
          {data.assignments.map(record => (
            <details
              key={record.id}
              open={record.id === data.active_assignment_id}
              className="min-w-0 rounded-lg border p-4"
            >
              <summary className="min-h-11 cursor-pointer break-words py-3 font-medium">
                {record.title} · {stageLabel(record.status)} · #{record.id}
              </summary>
              <div className="mt-3 space-y-4">
                <p className="text-sm">
                  Reviewer:{" "}
                  {record.reviewer?.full_name || "Reviewer no longer available"}
                </p>
                {record.url && (
                  <a
                    className="inline-flex min-h-11 items-center text-sm text-primary underline"
                    href={record.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open candidate assignment
                  </a>
                )}
                {!record.ended_at && !record.url && (
                  <p className="text-sm">
                    Candidate link unavailable. Review the deadline or issue
                    revised work.
                  </p>
                )}
                {record.previous_assignment_id && (
                  <p className="text-sm">
                    Revision of assignment #{record.previous_assignment_id}.
                    Earlier work is preserved below.
                  </p>
                )}
                <AssessmentWork
                  assessment={record}
                  busy={busy}
                  download={(id, filename) =>
                    void download(record, id, filename)
                  }
                />
                <details className="rounded-lg border p-3">
                  <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
                    Decision history
                  </summary>
                  <ol className="space-y-3 text-sm">
                    {record.events.map(event => (
                      <li key={event.id}>
                        <p>
                          {stageLabel(event.action)} ·{" "}
                          {new Date(event.created_at).toLocaleString()} ·{" "}
                          {event.details.actor_name}
                        </p>
                        {event.details.reason && (
                          <p className="whitespace-pre-wrap break-words">
                            {event.details.reason}
                          </p>
                        )}
                        {event.action === "reassigned" && (
                          <p>
                            {event.details.before} → {event.details.after}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              </div>
            </details>
          ))}
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={busy || loading}
          />
        </div>
      )}
    </section>
  );
}
