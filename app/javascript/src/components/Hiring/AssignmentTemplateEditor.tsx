import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import Pager from "./Pager";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { AssignmentTemplate } from "./AssignmentLibrary";
import type { Pagination } from "./types";

type TaskPage = {
  company_id: number;
  template: AssignmentTemplate;
  revisions: {
    id: number;
    template_version: number;
    created_at: string;
    snapshot: AssignmentTemplate & { actor_name: string };
  }[];
  pagination: Pagination;
};
const textFields = [
  { key: "instructions", label: "Instructions" },
  { key: "criteria", label: "Assessment criteria" },
  { key: "ai_policy", label: "AI-use policy" },
] as const;

export default function AssignmentTemplateEditor({
  companyId,
  id,
}: {
  companyId: number;
  id: string;
}) {
  const [data, setData] = useState<TaskPage | null>(null);
  const [saved, setSaved] = useState<AssignmentTemplate | null>(null);
  const [draft, setDraft] = useState<AssignmentTemplate | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const mounted = useRef(true);
  const reset = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    read<TaskPage>(
      `assignment_templates/${id}`,
      companyId,
      { page },
      controller.signal
    )
      .then(result => {
        if (!active) return;
        setData(result);
        if (reset.current) {
          setSaved(result.template);
          setDraft(result.template);
          reset.current = false;
        } else {
          // Browsing history must not silently rebase an unsaved edit.
          setSaved(previous => previous || result.template);
          setDraft(previous => previous || result.template);
        }
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, id, page, refresh]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const reload = () => {
    reset.current = true;
    setError("");
    setNotice("");
    setDiscard(false);
    setRefresh(value => value + 1);
  };

  const save = async (action: "save" | "approve" | "archive") => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const path = `/hiring/assignment_templates/${id}`;
    const attributes = {
      company_id: companyId,
      lock_version: draft.lock_version,
    };
    try {
      const { data: result } =
        action === "save"
          ? await Api.patch<{
              company_id: number;
              template: AssignmentTemplate;
            }>(
              path,
              {
                hiring_assignment_template: {
                  ...attributes,
                  title: draft.title,
                  skills: draft.skills,
                  experience: draft.experience,
                  role_id: draft.role?.id || null,
                  details: draft.details,
                },
              },
              quiet
            )
          : await Api.post<{
              company_id: number;
              template: AssignmentTemplate;
            }>(
              `${path}/${action}`,
              { hiring_assignment_template: attributes },
              quiet
            );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;
      setSaved(result.template);
      setDraft(result.template);
      setNotice(
        action === "save"
          ? "Draft saved. Approval is a separate action."
          : action === "approve"
          ? "Version approved for explicit issuance."
          : "Task archived. Existing issued terms are preserved."
      );
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section
      aria-label="Assignment task editor"
      className="max-w-3xl space-y-6"
    >
      <Link
        className="inline-flex min-h-11 items-center underline underline-offset-4"
        to="/hiring/assignment-library"
      >
        Back to assignment library
      </Link>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!draft ? (
        <>
          <p role="status">Loading assignment task…</p>
          {error && (
            <Button onClick={reload} variant="outline">
              Retry
            </Button>
          )}
        </>
      ) : (
        <>
          <div>
            <h2 className="break-words text-lg font-semibold">
              {saved?.title}
            </h2>
            <p className="mt-1 text-sm capitalize">
              {saved?.status} · Version {saved?.lock_version}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Saving creates a draft version. Approval confirms these saved
              instructions, effort and AI-use policy. Issuing work to a
              candidate is a separate action.
            </p>
          </div>
          <form
            onSubmit={event => {
              event.preventDefault();
              save("save");
            }}
            className="space-y-4 rounded-lg border bg-card p-4"
          >
            <fieldset disabled={busy || !data} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task title</Label>
                <Input
                  id="task-title"
                  required
                  maxLength={200}
                  className="h-11"
                  value={draft.title}
                  onChange={event =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
              </div>
              <Picker
                id="task-role"
                label="Task role"
                companyId={companyId}
                kind="roles"
                purpose="intake"
                emptyLabel="Any role"
                value={
                  draft.role && { id: draft.role.id, label: draft.role.title }
                }
                change={role =>
                  setDraft({
                    ...draft,
                    role: role && {
                      id: role.id,
                      title: role.label,
                      status: "open",
                    },
                  })
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {(["skills", "experience"] as const).map(key => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`task-${key}`}>
                      {key === "skills" ? "Skills" : "Experience"}
                    </Label>
                    <Input
                      id={`task-${key}`}
                      maxLength={500}
                      className="h-11"
                      value={draft[key]}
                      onChange={event =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="task-effort">Expected effort (minutes)</Label>
                  <Input
                    id="task-effort"
                    type="number"
                    min={1}
                    max={10080}
                    step={1}
                    className="h-11"
                    value={draft.details.expected_minutes ?? ""}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          expected_minutes: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-method">Submission method</Label>
                  <select
                    id="task-method"
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                    value={draft.details.submission_method || ""}
                    onChange={event =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          submission_method: (event.target.value ||
                            undefined) as AssignmentTemplate["details"]["submission_method"],
                        },
                      })
                    }
                  >
                    <option value="">Choose a method</option>
                    <option value="repository">Repository</option>
                    <option value="files">Files</option>
                    <option value="repository_or_files">
                      Repository or files
                    </option>
                  </select>
                </div>
              </div>
              {textFields.map(({ key, label }) => (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={`task-${key}`}>{label}</Label>
                  <Textarea
                    id={`task-${key}`}
                    maxLength={10000}
                    rows={4}
                    value={draft.details[key] || ""}
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
              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="min-h-11" disabled={!dirty}>
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={dirty || saved?.status !== "draft"}
                  onClick={() => save("approve")}
                >
                  Approve saved version
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={dirty || saved?.status === "archived"}
                  onClick={() => save("archive")}
                >
                  Archive saved task
                </Button>
              </div>
            </fieldset>
            {notice && (
              <p role="status" className="text-sm">
                {notice}
              </p>
            )}
          </form>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => (dirty ? setDiscard(true) : reload())}
            >
              Reload saved task
            </Button>
            {discard && (
              <div role="alert" className="space-y-3 rounded-lg border p-4">
                <p>Discard your unsaved changes and load the saved task?</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setDiscard(false)}>
                    Keep editing
                  </Button>
                  <Button onClick={reload}>Discard draft and reload</Button>
                </div>
              </div>
            )}
          </div>
          <section
            aria-label="Task revision history"
            className="space-y-4 rounded-lg border bg-card p-4"
          >
            <h3 className="font-semibold">Task revision history</h3>
            {!data ? (
              <p role="status">Loading revisions…</p>
            ) : (
              <>
                {data.revisions.map(revision => (
                  <details
                    key={revision.id}
                    className="space-y-3 border-b pb-3"
                  >
                    <summary className="cursor-pointer py-3">
                      Version {revision.template_version} ·{" "}
                      {revision.snapshot.status}
                    </summary>
                    <p className="break-words text-sm">
                      {revision.snapshot.actor_name} ·{" "}
                      {new Date(revision.created_at).toLocaleString("en-GB", {
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </p>
                    <p className="break-words text-sm">
                      {revision.snapshot.title} ·{" "}
                      {revision.snapshot.role?.title || "Any role"} ·{" "}
                      {revision.snapshot.skills} ·{" "}
                      {revision.snapshot.experience}
                    </p>
                    <p className="text-sm">
                      {revision.snapshot.details.expected_minutes
                        ? `${revision.snapshot.details.expected_minutes} minutes`
                        : "Effort not set"}{" "}
                      ·{" "}
                      {revision.snapshot.details.submission_method?.replaceAll(
                        "_",
                        " "
                      ) || "Method not set"}
                    </p>
                    {textFields.map(({ key, label }) => (
                      <div key={key}>
                        <h4 className="text-sm font-medium">{label}</h4>
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {revision.snapshot.details[key] || "Not set"}
                        </p>
                      </div>
                    ))}
                  </details>
                ))}
                <Pager
                  pagination={data.pagination}
                  change={setPage}
                  disabled={busy}
                />
              </>
            )}
          </section>
        </>
      )}
    </section>
  );
}
