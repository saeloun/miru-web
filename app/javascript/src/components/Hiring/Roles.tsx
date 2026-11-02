import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { Role, RolePage } from "./types";

function RoleEditor({
  role,
  draft,
  change,
  busy,
  error,
  save,
}: {
  role: Role;
  draft: Role;
  change: (draft: Role) => void;
  busy: boolean;
  error: string;
  save: (draft: Role) => void;
}) {
  const { title, status } = draft;

  return (
    <li className="py-4">
      <form
        onSubmit={event => {
          event.preventDefault();
          if (!busy) save(draft);
        }}
        className="space-y-3"
      >
        <fieldset
          disabled={busy}
          className="grid items-end gap-3 sm:grid-cols-[1fr_9rem_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor={`role-title-${role.id}`}>
              Role title #{role.id}
            </Label>
            <Input
              id={`role-title-${role.id}`}
              className="h-11"
              required
              maxLength={200}
              value={title}
              onChange={event =>
                change({ ...draft, title: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`role-status-${role.id}`}>Status</Label>
            <select
              id={`role-status-${role.id}`}
              value={status}
              onChange={event =>
                change({
                  ...draft,
                  status: event.target.value as Role["status"],
                })
              }
              className="h-11 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Button
            type="submit"
            variant="outline"
            className="min-h-11"
            disabled={busy || (title === role.title && status === role.status)}
          >
            Save role
          </Button>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </li>
  );
}

export default function Roles({ companyId }: { companyId: number }) {
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RolePage | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Role>>({});
  const [updates, setUpdates] = useState<
    Record<number, { busy: boolean; error: string }>
  >({});
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [notice, setNotice] = useState("");
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
    const timer = setTimeout(
      () =>
        read<RolePage>("roles", companyId, { query, page }, controller.signal)
          .then(result => {
            if (active) setData(result);
          })
          .catch(failure => {
            if (active) setError(failureMessage(failure));
          }),
      200
    );

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [companyId, query, page, refresh]);

  const save = async (draft: Role) => {
    if (updates[draft.id]?.busy) return;
    setUpdates(previous => ({
      ...previous,
      [draft.id]: { busy: true, error: "" },
    }));
    setNotice("");
    try {
      const { data: result } = await Api.patch<{
        company_id: number;
        role: Role;
      }>(
        `/hiring/roles/${draft.id}`,
        {
          role: {
            company_id: companyId,
            title: draft.title,
            status: draft.status,
            lock_version: draft.lock_version,
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;

      setDrafts(previous => {
        const remaining = { ...previous };
        delete remaining[draft.id];

        return remaining;
      });
      setRefresh(value => value + 1);
      setNotice("Role saved.");
      setUpdates(previous => ({
        ...previous,
        [draft.id]: { busy: false, error: "" },
      }));
    } catch (failure) {
      if (mounted.current) {
        setUpdates(previous => ({
          ...previous,
          [draft.id]: { busy: false, error: failureMessage(failure) },
        }));
      }
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setCreateError("");
    setNotice("");
    try {
      const { data: result } = await Api.post<{
        company_id: number;
        role: Role;
      }>("/hiring/roles", { role: { company_id: companyId, title } }, quiet);
      verifyWorkspace(result, companyId);
      if (mounted.current) {
        setTitle("");
        setNotice(`Role added: ${result.role.title}`);
        setPage(1);
        setRefresh(value => value + 1);
      }
    } catch (failure) {
      if (mounted.current) {
        setCreateError(
          `${failureMessage(
            failure
          )} Review the roles below before adding again.`
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section
      className="max-w-3xl space-y-6"
      aria-labelledby="hiring-roles-title"
    >
      <div>
        <h2 id="hiring-roles-title" className="text-lg font-semibold">
          Hiring roles
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open roles can receive applications. Closing a role preserves its
          candidate history.
        </p>
      </div>
      <form
        onSubmit={create}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <div className="space-y-2">
          <Label htmlFor="new-role-title">Role title</Label>
          <Input
            id="new-role-title"
            className="h-11"
            required
            maxLength={200}
            disabled={busy}
            value={title}
            onChange={event => setTitle(event.target.value)}
          />
        </div>
        <Button className="min-h-11" type="submit" disabled={busy}>
          {busy ? "Adding…" : "Add role"}
        </Button>
        {createError && (
          <p role="alert" className="text-sm text-destructive">
            {createError}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
      </form>
      <div className="rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="role-search">Find roles</Label>
          <Input
            id="role-search"
            className="h-11"
            value={query}
            maxLength={200}
            onChange={event => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {error ? (
          <div role="alert" className="mt-4 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setRefresh(refresh + 1)}
            >
              Retry
            </Button>
          </div>
        ) : !data ? (
          <p role="status" className="py-4">
            Loading roles…
          </p>
        ) : (
          <>
            <ul className="divide-y">
              {data.roles.map(role => (
                <RoleEditor
                  key={role.id}
                  role={role}
                  draft={drafts[role.id] || role}
                  busy={updates[role.id]?.busy || false}
                  error={updates[role.id]?.error || ""}
                  change={draft =>
                    setDrafts(previous => ({ ...previous, [role.id]: draft }))
                  }
                  save={save}
                />
              ))}
            </ul>
            {data.roles.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                No matching roles.
              </p>
            )}
            <div className="mt-4 flex gap-3">
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
          </>
        )}
      </div>
    </section>
  );
}
