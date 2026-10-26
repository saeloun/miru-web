/* global BeforeUnloadEvent */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getCsrfToken } from "utils/authHeaders";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import PortalField from "./PortalField";
import { type FormAnswer, type FormField } from "./types";

type Assignment = {
  title: string;
  role: string | null;
  candidate_note: string | null;
  due_at: string;
  lock_version: number;
  details: {
    instructions: string;
    criteria: string;
    expected_minutes: number;
    submission_method: "repository" | "files" | "repository_or_files";
    ai_policy: string;
  };
  submission: {
    answers: Record<string, FormAnswer>;
    submitted_at: string | null;
    lock_version: number;
    files: { id: number; filename: string; byte_size: number }[];
  };
};

function AssessmentPortal({ token }: { token: string }) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, FormAnswer>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);
  const submittedSummary = useRef<HTMLElement>(null);
  const request = useCallback(
    async (
      action: string,
      body: object | FormData = {},
      signal?: InstanceType<typeof window.AbortController>["signal"]
    ) => {
      const upload = body instanceof window.FormData;
      const response = await window.fetch(`/hiring-assignment/${action}`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal,
        headers: {
          "X-CSRF-Token": getCsrfToken(),
          ...(upload ? {} : { "Content-Type": "application/json" }),
        },
        body: upload
          ? body
          : JSON.stringify({ hiring_assessment: { token, ...body } }),
      });
      if (!response.ok) {
        if (response.status === 410) {
          setUnavailable(true);
          setAssignment(null);
          setAnswers({});
          setDirty(false);
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.errors === "string"
            ? data.errors
            : "The assignment request failed. Please try again."
        );
      }

      return response;
    },
    [token]
  );

  useEffect(() => {
    const controller = new window.AbortController();
    request("open", {}, controller.signal)
      .then(response => response.json())
      .then(data => {
        if (!controller.signal.aborted) {
          setAssignment(data.assignment);
          setAnswers(data.assignment.submission.answers);
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) setError(failure.message);
      });

    return () => controller.abort();
  }, [request]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);

    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  useEffect(() => {
    if (error) errorSummary.current?.focus();
    else if (assignment?.submission.submitted_at) {
      submittedSummary.current?.focus();
    }
  }, [error, assignment?.submission.submitted_at]);

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next: Assignment = (await (await request("open")).json())
        .assignment;
      if (!assignment || next.submission.submitted_at) {
        setAnswers(next.submission.answers);
        setDirty(false);
      }
      setAssignment(next);
      setError("");
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const versions = () => ({
    assignment_version: assignment?.lock_version,
    submission_version: assignment?.submission.lock_version,
  });

  const mutate = async (action: string, body: object | FormData) => {
    if (!assignment || busy) return;
    setBusy(true);
    setError("");
    try {
      const next: Assignment = (await (await request(action, body)).json())
        .assignment;
      setAssignment(next);
      if (next.submission.submitted_at) {
        setAnswers(next.submission.answers);
        setDirty(false);
      }
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = (file: File) => {
    if (!assignment || busy) return;

    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError("Upload a file between 1 byte and 5 MiB.");

      return;
    }
    const body = new window.FormData();
    body.append("hiring_assessment[token]", token);
    Object.entries(versions()).forEach(([key, value]) =>
      body.append(`hiring_assessment[${key}]`, String(value))
    );
    body.append("hiring_assessment[file]", file);
    void mutate("files", body);
  };

  const downloadFile = async (
    file: Assignment["submission"]["files"][number]
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await request("files/download", {
        attachment_id: file.id,
      });
      const url = window.URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setError("");
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const fields: FormField[] = [
    {
      id: "repository_url",
      label: "Repository URL",
      type: "url",
      required: assignment?.details.submission_method === "repository",
      sensitive: false,
    },
    {
      id: "setup",
      label: "Setup instructions",
      type: "textarea",
      required: true,
      sensitive: false,
    },
    {
      id: "approach",
      label: "Approach and explanation",
      type: "textarea",
      required: true,
      sensitive: false,
    },
    {
      id: "own_contribution",
      label: "Your own contribution",
      type: "textarea",
      required: true,
      sensitive: false,
    },
    {
      id: "ai_used",
      label: "Did you use AI tools?",
      type: "checkbox",
      required: true,
      sensitive: false,
    },
    ...(answers.ai_used === true
      ? [
          {
            id: "ai_tools",
            label: "AI tools used",
            type: "textarea" as const,
            required: true,
            sensitive: false,
          },
          {
            id: "ai_how",
            label: "How you used AI",
            type: "textarea" as const,
            required: true,
            sensitive: false,
          },
          {
            id: "ai_parts",
            label: "Parts assisted by AI",
            type: "textarea" as const,
            required: true,
            sensitive: false,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Miru · Private assignment
        </p>
        <h1 className="break-words text-2xl font-semibold">
          {assignment?.title || "Assignment"}
        </h1>
        {assignment?.role && (
          <p className="break-words text-sm">{assignment.role}</p>
        )}
      </header>
      {error && (
        <div
          ref={errorSummary}
          role="alert"
          tabIndex={-1}
          className="rounded-lg border border-destructive p-4 text-sm"
        >
          <p>{error}</p>
          {!unavailable && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 min-h-11"
              disabled={busy}
              onClick={() => void refresh()}
            >
              Refresh assignment
            </Button>
          )}
        </div>
      )}
      {!assignment && !error && <p role="status">Loading assignment…</p>}
      {assignment && (
        <>
          <section
            aria-label="Assignment instructions"
            className="space-y-4 rounded-lg border bg-card p-4"
          >
            <p className="text-sm">
              Expected effort: {assignment.details.expected_minutes} minutes.
              Due {new Date(assignment.due_at).toLocaleString()}.
            </p>
            {[
              ["Instructions", assignment.details.instructions],
              ["Assessment criteria", assignment.details.criteria],
              ["AI policy", assignment.details.ai_policy],
              ["Instructions from the hiring team", assignment.candidate_note],
            ]
              .filter(([, text]) => text)
              .map(([label, text]) => (
                <div key={label}>
                  <h2 className="mb-1 font-semibold">{label}</h2>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {text}
                  </p>
                </div>
              ))}
            <p className="text-sm">
              {assignment.details.submission_method === "repository"
                ? "Provide a repository URL."
                : assignment.details.submission_method === "files"
                ? "Upload your submission files."
                : "Provide a repository URL, upload files, or both."}
            </p>
          </section>
          {assignment.submission.submitted_at && (
            <section
              ref={submittedSummary}
              role="status"
              tabIndex={-1}
              className="space-y-2 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Assignment submitted</h2>
              <p className="text-sm">
                Your work is saved for review. The hiring team will confirm the
                next step.
              </p>
            </section>
          )}
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              void mutate("submit", { ...versions(), answers });
            }}
          >
            <fieldset
              disabled={busy || Boolean(assignment.submission.submitted_at)}
              className="min-w-0 space-y-5"
            >
              <legend className="mb-3 text-sm text-muted-foreground">
                Fields marked required must be completed.
              </legend>
              {fields.map(field => (
                <PortalField
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  required={field.required}
                  change={value => {
                    setAnswers(previous => {
                      const next = { ...previous, [field.id]: value };
                      if (field.id === "ai_used" && value !== true) {
                        delete next.ai_tools;
                        delete next.ai_how;
                        delete next.ai_parts;
                      }

                      return next;
                    });
                    setDirty(true);
                  }}
                />
              ))}
              <div className="space-y-2">
                <Label htmlFor="assessment-file">Submission file</Label>
                <Input
                  id="assessment-file"
                  type="file"
                  required={
                    assignment.details.submission_method === "files" &&
                    !assignment.submission.files.length
                  }
                  onChange={event => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (file) uploadFile(file);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Up to five private files, 5 MiB each and 20 MiB total. Uploads
                  save immediately; your written answers save when you submit.
                </p>
              </div>
            </fieldset>
            {!assignment.submission.submitted_at && (
              <Button type="submit" className="min-h-11" disabled={busy}>
                {busy ? "Saving…" : "Submit assignment"}
              </Button>
            )}
          </form>
          {!!assignment.submission.files.length && (
            <section
              aria-label="Uploaded files"
              className="space-y-3 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Uploaded files</h2>
              {assignment.submission.files.map(file => (
                <div key={file.id} className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 max-w-full whitespace-normal break-all"
                    disabled={busy}
                    onClick={() => void downloadFile(file)}
                  >
                    Download {file.filename}
                  </Button>
                  {!assignment.submission.submitted_at && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 max-w-full whitespace-normal break-all"
                      disabled={busy}
                      onClick={() =>
                        void mutate("files/remove", {
                          ...versions(),
                          attachment_id: file.id,
                        })
                      }
                    >
                      Remove {file.filename}
                    </Button>
                  )}
                </div>
              ))}
            </section>
          )}
          <p className="text-xs text-muted-foreground">
            Keep your original link private. It stops working after the deadline
            or when the hiring team closes or replaces the assignment.
            Unsubmitted written answers stay in this page only.
          </p>
        </>
      )}
    </div>
  );
}

export function mountAssessmentPortal(root: HTMLElement, token: string) {
  createRoot(root).render(<AssessmentPortal token={token} />);
}
