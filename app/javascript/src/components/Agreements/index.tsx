import React, { lazy, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Api from "apis/api";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { endpoint, failureMessage, quiet } from "./api";
import { emptyDocument, type Party, type Summary } from "./types";
import "./editor.css";

const Editor = lazy(() => import("./Editor"));

const Generate = ({
  template,
  companyId,
  close,
}: {
  template: Summary;
  companyId: number | string;
  close: () => void;
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [parties, setParties] = useState<Party[] | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [title, setTitle] = useState(template.title);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    let active = true;
    setParties(null);
    setError("");
    const timer = setTimeout(() => {
      Api.get("/agreements/parties", {
        ...quiet,
        params: { kind: template.kind, query, page },
      })
        .then(({ data }) => {
          if (active) {
            setParties(data.parties);
            setPages(data.pagination.pages);
            setError("");
          }
        })
        .catch(failure => {
          if (active) setError(failureMessage(failure));
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, page, template.kind, refresh]);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!party || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.post(
        "/agreements",
        {
          agreement: {
            company_id: companyId,
            agreement_template_id: template.id,
            title,
            [template.kind === "client" ? "client_id" : "employment_id"]:
              party.id,
          },
        },
        quiet
      );
      if (mounted.current) navigate(`/agreements/drafts/${data.agreement.id}`);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && !busy && close()}>
      <DialogContent className="agreement-controls">
        <DialogHeader>
          <DialogTitle>Generate draft</DialogTitle>
          <DialogDescription>
            Copy this master for a {template.kind}. Identity fields are
            prefilled from the current profile; payment terms must be entered
            explicitly.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={generate}>
          <div>
            <Label htmlFor="draft-title">Draft title</Label>
            <Input
              id="draft-title"
              required
              maxLength={200}
              value={title}
              onChange={event => setTitle(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="party-search">Find counterparty</Label>
            <Input
              id="party-search"
              maxLength={100}
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
                setParty(null);
              }}
            />
          </div>
          {!parties && !error && <p role="status">Loading counterparties…</p>}
          {parties?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No matching {template.kind === "client" ? "clients" : "staff"}.
              Try another search or update their profile first.
            </p>
          )}
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {parties?.map(item => (
              <label
                className="flex items-start gap-2 rounded-md border border-border p-3"
                key={item.id}
              >
                <input
                  name="counterparty"
                  type="radio"
                  value={item.id}
                  checked={party?.id === item.id}
                  onChange={() => {
                    setParty(item);
                    setTitle(`${template.title} — ${item.name}`.slice(0, 200));
                  }}
                />
                <span className="min-w-0 break-words text-sm">
                  {item.name}
                  <span className="block text-xs text-muted-foreground">
                    {item.email}
                    {item.employee_id ? ` · ${item.employee_id}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || !parties}
                onClick={() => {
                  setPage(value => value - 1);
                  setParty(null);
                }}
              >
                Previous counterparties
              </Button>
              <span className="text-sm">
                {page}/{pages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= pages || !parties}
                onClick={() => {
                  setPage(value => value + 1);
                  setParty(null);
                }}
              >
                Next counterparties
              </Button>
            </div>
          )}
          {error && (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {!parties && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRefresh(value => value + 1)}
                >
                  Retry search
                </Button>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!party || busy}>
              {busy ? "Generating…" : "Generate draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Workspace = ({ companyId }: { companyId: number | string }) => {
  const navigate = useNavigate();
  const [type, setType] = useState("templates");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [records, setRecords] = useState<Summary[] | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("consultant");
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState<Summary | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    let active = true;
    setRecords(null);
    setError("");
    Api.get(endpoint(type), { ...quiet, params: { page } })
      .then(({ data }) => {
        if (active) {
          setRecords(
            data[type === "templates" ? "agreement_templates" : "agreements"]
          );
          setPages(data.pagination.pages);
        }
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
    };
  }, [type, page, refresh]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.post(
        "/agreement_templates",
        {
          agreement_template: {
            company_id: companyId,
            title,
            kind,
            document: emptyDocument,
            fields: [],
          },
        },
        quiet
      );
      if (mounted.current) {
        navigate(`/agreements/templates/${data.agreement_template.id}`);
      }
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="agreement-controls mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agreements</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create editable client and consultant masters, then generate
            independent drafts. Review, approval and signing are not available
            yet.
          </p>
        </div>
        <Button
          onClick={() => {
            setTitle("");
            setError("");
            setCreating(true);
          }}
        >
          New template
        </Button>
      </div>
      <div className="flex gap-2" aria-label="Agreement archives">
        {["templates", "drafts"].map(tab => (
          <Button
            key={tab}
            variant={type === tab ? "default" : "outline"}
            aria-pressed={type === tab}
            onClick={() => {
              setType(tab);
              setPage(1);
            }}
          >
            {tab === "templates" ? "Templates" : "Drafts"}
          </Button>
        ))}
      </div>
      {error && !creating && (
        <div role="alert">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => setRefresh(value => value + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      {!records && !error && <p role="status">Loading agreements…</p>}
      {records?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          {type === "templates"
            ? "No templates yet. Start a blank master or import Word from the editor."
            : "No drafts yet. Generate a copy from a template."}
        </div>
      )}
      <div className="space-y-3">
        {records?.map(record => (
          <article
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            key={record.id}
          >
            <div className="min-w-0">
              <Link
                className="break-words font-medium text-primary underline"
                to={`/agreements/${type}/${record.id}`}
              >
                {record.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {record.kind} · {type === "templates" ? "Master" : "Draft"} ·
                Updated {new Date(record.updated_at).toLocaleString()}
              </p>
            </div>
            {type === "templates" && (
              <Button
                size="sm"
                variant="outline"
                className="max-w-full"
                aria-label={`Generate ${record.title}`}
                onClick={() => setTemplate(record)}
              >
                Generate draft
              </Button>
            )}
          </article>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={page <= 1 || !records}
            onClick={() => setPage(value => value - 1)}
          >
            Previous page
          </Button>
          <span className="text-sm">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= pages || !records}
            onClick={() => setPage(value => value + 1)}
          >
            Next page
          </Button>
        </div>
      )}
      <Dialog open={creating} onOpenChange={open => !busy && setCreating(open)}>
        <DialogContent className="agreement-controls">
          <DialogHeader>
            <DialogTitle>New agreement template</DialogTitle>
            <DialogDescription>
              Start a blank master. Import a supported Word document or edit its
              full body and fields.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={create}>
            <div>
              <Label htmlFor="template-title">Template title</Label>
              <Input
                id="template-title"
                value={title}
                required
                maxLength={200}
                onChange={event => setTitle(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="template-kind">Agreement kind</Label>
              <select
                className="agreement-select"
                id="template-kind"
                value={kind}
                onChange={event => setKind(event.target.value)}
              >
                <option value="consultant">Consultant</option>
                <option value="client">Client</option>
              </select>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {template && (
        <Generate
          template={template}
          companyId={companyId}
          close={() => setTemplate(null)}
        />
      )}
    </div>
  );
};

const Agreements = () => {
  const { company } = useUserContext();
  const { recordType, recordId } = useParams();
  if (!company?.id) {
    return (
      <p role="status" className="p-6">
        Loading workspace…
      </p>
    );
  }

  if (
    recordType &&
    (!["templates", "drafts"].includes(recordType) ||
      !recordId ||
      !/^\d+$/.test(recordId))
  ) {
    return (
      <p role="alert" className="p-6">
        Agreement not found.
      </p>
    );
  }

  return recordId ? (
    <Editor
      key={`${company.id}-${recordType}-${recordId}`}
      companyId={company.id}
      type={recordType!}
      id={recordId}
    />
  ) : (
    <Workspace key={company.id} companyId={company.id} />
  );
};

export default Agreements;
