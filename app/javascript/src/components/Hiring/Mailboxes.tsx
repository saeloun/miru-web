import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import Pager from "./Pager";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { Mailbox, MailboxPage } from "./types";

export default function Mailboxes({ companyId }: { companyId: number }) {
  const [data, setData] = useState<MailboxPage | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [drafts, setDrafts] = useState<
    Record<number, { name: string; lock_version: number }>
  >({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      read<MailboxPage>(
        "mailboxes",
        companyId,
        { query, page },
        controller.signal
      )
        .then(result => {
          if (active) setData(result);
        })
        .catch(failure => {
          if (active) setError(failureMessage(failure));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [companyId, query, page, refresh]);

  const discard = (id: number) =>
    setDrafts(previous => {
      const next = { ...previous };
      delete next[id];

      return next;
    });

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data: result } = await Api.post<{
        company_id: number;
        mailbox: Mailbox;
      }>(
        "/hiring/mailboxes",
        {
          hiring_mailbox: { company_id: companyId, name, source_email: email },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;
      setName("");
      setEmail("");
      setPage(1);
      setQuery(result.mailbox.source_email);
      setRefresh(value => value + 1);
      setNotice("Inbox added. Forwarding must be configured separately.");
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const update = async (
    mailbox: Mailbox,
    change: { name?: string; active?: boolean; lock_version: number }
  ) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data: result } = await Api.patch<{
        company_id: number;
        mailbox: Mailbox;
      }>(
        `/hiring/mailboxes/${mailbox.id}`,
        { hiring_mailbox: { company_id: companyId, ...change } },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;

      if (change.name !== undefined) discard(mailbox.id);
      setRefresh(value => value + 1);
      setNotice("Inbox saved.");
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Manage inboxes</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Prepare routes for incoming applications. Forwarding must be
            configured separately by your email administrator. Disabling an
            inbox preserves retained email history.
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/hiring/inbox">Back to inbox</Link>
        </Button>
      </header>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <form
        aria-label="Add inbox"
        onSubmit={create}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <h3 className="font-semibold">Add inbox</h3>
        <fieldset
          disabled={busy}
          className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor="new-inbox-name">Inbox name</Label>
            <Input
              id="new-inbox-name"
              className="h-11"
              required
              maxLength={200}
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-inbox-email">Inbox email</Label>
            <Input
              id="new-inbox-email"
              className="h-11"
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" className="min-h-11">
            Add inbox
          </Button>
        </fieldset>
      </form>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="mailbox-search">Find inboxes</Label>
          <Input
            id="mailbox-search"
            className="h-11"
            maxLength={200}
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={loading || busy}
          onClick={() => setRefresh(value => value + 1)}
        >
          Reload inboxes
        </Button>
        {query && (
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
          >
            Clear search
          </Button>
        )}
      </div>
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading inboxes…
        </p>
      )}
      {data && (
        <>
          {!loading && data.mailboxes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No inboxes match this view.
            </p>
          )}
          <ul aria-label="Configured inboxes" className="space-y-3">
            {data.mailboxes.map(mailbox => {
              const draft = drafts[mailbox.id];
              const dirty = Boolean(draft && draft.name !== mailbox.name);

              return (
                <li
                  key={mailbox.id}
                  data-testid={`mailbox-${mailbox.id}`}
                  className="min-w-0 space-y-3 rounded-lg border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold">
                        {mailbox.name}
                      </h3>
                      <p className="break-all text-sm text-muted-foreground">
                        {mailbox.source_email}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {mailbox.active ? "Enabled for intake" : "Disabled"}
                    </Badge>
                  </div>
                  <form
                    onSubmit={event => {
                      event.preventDefault();
                      if (draft) void update(mailbox, draft);
                    }}
                    className="space-y-3"
                  >
                    <fieldset disabled={busy || loading} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`inbox-name-${mailbox.id}`}>
                          Inbox name
                        </Label>
                        <Input
                          id={`inbox-name-${mailbox.id}`}
                          className="h-11"
                          required
                          maxLength={200}
                          value={draft?.name ?? mailbox.name}
                          onChange={event =>
                            setDrafts(previous => ({
                              ...previous,
                              [mailbox.id]: {
                                name: event.target.value,
                                lock_version:
                                  previous[mailbox.id]?.lock_version ??
                                  mailbox.lock_version,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          variant="outline"
                          className="min-h-11"
                          disabled={!dirty}
                        >
                          Save name
                        </Button>
                        {dirty && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="min-h-11"
                            onClick={() => discard(mailbox.id)}
                          >
                            Discard name edits
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11"
                          disabled={dirty}
                          onClick={() =>
                            void update(mailbox, {
                              active: !mailbox.active,
                              lock_version: mailbox.lock_version,
                            })
                          }
                        >
                          {mailbox.active ? "Disable inbox" : "Enable inbox"}
                        </Button>
                      </div>
                    </fieldset>
                  </form>
                  <details className="text-sm">
                    <summary className="cursor-pointer py-2 font-medium">
                      Relay setup
                    </summary>
                    <p className="my-2 text-muted-foreground">
                      Give this route to your email administrator. Incoming
                      requests require the server’s configured email ingress
                      credential.
                    </p>
                    <code className="block break-all rounded bg-muted p-3">
                      {window.location.origin}
                      {mailbox.ingress_path}
                    </code>
                  </details>
                </li>
              );
            })}
          </ul>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={loading || busy}
          />
        </>
      )}
    </div>
  );
}
