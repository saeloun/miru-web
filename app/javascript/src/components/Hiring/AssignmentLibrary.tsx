import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Picker from "./Picker";
import Pager from "./Pager";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { Choice, Pagination, Role } from "./types";

export type AssignmentTemplate = {
  id: number;
  title: string;
  skills: string;
  experience: string;
  role: Pick<Role, "id" | "title" | "status"> | null;
  status: "draft" | "approved" | "archived";
  lock_version: number;
  details: {
    instructions?: string;
    criteria?: string;
    expected_minutes?: number;
    submission_method?: "repository" | "files" | "repository_or_files";
    ai_policy?: string;
  };
};

type LibraryPage = {
  company_id: number;
  templates: Omit<AssignmentTemplate, "details">[];
  pagination: Pagination;
};

export default function AssignmentLibrary({
  companyId,
}: {
  companyId: number;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Choice | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<LibraryPage | null>(null);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
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
    setError("");
    const timer = setTimeout(() => {
      read<LibraryPage>(
        "assignment_templates",
        companyId,
        {
          query,
          page,
          role_id: role?.id,
          status: status || undefined,
        },
        controller.signal
      )
        .then(result => {
          if (active) setData(result);
        })
        .catch(failure => {
          if (active) setError(failureMessage(failure));
        });
    }, 200);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [companyId, query, role?.id, status, page, refresh]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setCreateError("");
    try {
      const { data: result } = await Api.post<{
        company_id: number;
        template: AssignmentTemplate;
      }>(
        "/hiring/assignment_templates",
        {
          hiring_assignment_template: {
            company_id: companyId,
            title,
            details: {},
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) {
        navigate(`/hiring/assignment-library/${result.template.id}`);
      }
    } catch (failure) {
      if (mounted.current) {
        setCreateError(
          `${failureMessage(failure)} Review the library before creating again.`
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section aria-label="Assignment library" className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Assignment library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reusable tasks by role, skills and experience. Approve the saved terms
          before issuing a task to a candidate.
        </p>
      </div>
      <form
        onSubmit={create}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <Label htmlFor="new-assignment-title">New task title</Label>
        <Input
          id="new-assignment-title"
          className="h-11"
          required
          maxLength={200}
          disabled={busy}
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
        <Button type="submit" className="min-h-11" disabled={busy}>
          {busy ? "Creating…" : "Create task draft"}
        </Button>
        {createError && (
          <p role="alert" className="text-sm text-destructive">
            {createError}
          </p>
        )}
      </form>
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assignment-search">
              Find tasks, skills or experience
            </Label>
            <Input
              id="assignment-search"
              className="h-11"
              maxLength={200}
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-status">Task status</Label>
            <select
              id="assignment-status"
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={event => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <Picker
            id="assignment-role-filter"
            label="Task role filter"
            companyId={companyId}
            kind="roles"
            value={role}
            change={value => {
              setRole(value);
              setPage(1);
            }}
            emptyLabel="All roles"
            purpose="history"
          />
        </div>
        {error ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={() => setRefresh(value => value + 1)}
            >
              Retry
            </Button>
          </div>
        ) : !data ? (
          <p role="status">Loading assignment library…</p>
        ) : (
          <>
            <ul className="divide-y">
              {data.templates.map(template => (
                <li key={template.id} className="space-y-1 py-4">
                  <Link
                    className="block break-words py-3 font-medium underline underline-offset-4"
                    to={`/hiring/assignment-library/${template.id}`}
                  >
                    {template.title}
                  </Link>
                  <p className="text-sm capitalize">
                    {template.status} · Version {template.lock_version}
                  </p>
                  <p className="break-words text-sm text-muted-foreground">
                    {template.role?.title || "Any role"} ·{" "}
                    {template.skills || "Skills not set"} ·{" "}
                    {template.experience || "Experience not set"}
                  </p>
                </li>
              ))}
            </ul>
            {data.templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No matching tasks.
              </p>
            )}
            <Pager
              pagination={data.pagination}
              change={setPage}
              disabled={busy}
            />
          </>
        )}
      </div>
    </section>
  );
}
