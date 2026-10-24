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
import { failureMessage, quiet, uploadDocuments } from "./api";
import { titleCase, type Summary } from "./types";
import "./signatures.css";

const Editor = lazy(() => import("./Editor"));
type PartyLink = { client_id?: number; employment_id?: number };

function ProfileLink({ change }: { change: (link: PartyLink) => void }) {
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [parties, setParties] = useState<
    { id: number; name: string; email: string }[]
  >([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!kind) return;
    const controller = new window.AbortController();
    const timer = setTimeout(() => {
      Api.get("/agreements/parties", {
        ...quiet,
        signal: controller.signal,
        params: { kind, query },
      })
        .then(({ data }) => {
          setParties(data.parties);
          setError("");
        })
        .catch(failure => {
          if (!controller.signal.aborted) setError(failureMessage(failure));
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, query, refresh]);

  return (
    <div className="space-y-2">
      <Label htmlFor="signing-link">Link to a profile (optional)</Label>
      <select
        id="signing-link"
        className="signatures-select"
        value={kind}
        onChange={event => {
          setKind(event.target.value);
          setSelected("");
          setParties([]);
          change({});
        }}
      >
        <option value="">Standalone document</option>
        <option value="client">Client</option>
        <option value="consultant">Consultant</option>
      </select>
      {kind && (
        <>
          <Label htmlFor="signing-party-search">Find profile</Label>
          <Input
            id="signing-party-search"
            maxLength={100}
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setSelected("");
              change({});
            }}
          />
          <Label htmlFor="signing-party">Linked profile</Label>
          <select
            id="signing-party"
            className="signatures-select"
            value={selected}
            required
            onChange={event => {
              setSelected(event.target.value);
              change(
                event.target.value
                  ? {
                      [kind === "client" ? "client_id" : "employment_id"]:
                        Number(event.target.value),
                    }
                  : {}
              );
            }}
          >
            <option value="">Choose a profile</option>
            {parties.map(party => (
              <option key={party.id} value={party.id}>
                {party.name} — {party.email}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Search by name or email to narrow the first 30 matches.
          </p>
          {error && (
            <div role="alert">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefresh(value => value + 1)}
              >
                Retry profiles
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Workspace({ companyId }: { companyId: number | string }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Summary[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [party, setParty] = useState<PartyLink>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(window.crypto.randomUUID());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new window.AbortController();
    setRecords(null);
    setError("");
    Api.get("/signature_requests", {
      ...quiet,
      signal: controller.signal,
      params: { page },
    })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setRecords(data.signature_requests);
          setPages(data.pagination.pages);
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) setError(failureMessage(failure));
      });

    return () => controller.abort();
  }, [page, refresh]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !files.length) return;

    if (
      files.length > 10 ||
      files.some(file => file.size > 5 * 1024 * 1024) ||
      files.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024
    ) {
      setError("Upload 1–10 PDFs, at most 5 MiB each and 25 MiB combined.");

      return;
    }

    if (files.some(file => !/\.pdf$/i.test(file.name))) {
      setError("Export your document as a PDF before uploading.");

      return;
    }
    setBusy(true);
    setError("");
    try {
      const record = await uploadDocuments(files, {
        company_id: companyId,
        title,
        creation_key: key.current,
        ...party,
      });
      if (mounted.current) navigate(`/agreements/documents/${record.id}`);
    } catch (failure) {
      if (mounted.current) {
        setError(
          `${failureMessage(
            failure
          )} Your selected files are retained; retry uses the same upload reference.`
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="signature-workspace space-y-5 p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Agreements</h1>
          <p className="text-sm text-muted-foreground">
            Upload PDFs, place recipient fields and retain each version.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/agreements/authoring"
            className="text-sm text-primary underline"
          >
            Templates and authored drafts
          </Link>
          <Button
            onClick={() => {
              setTitle("");
              setFiles([]);
              setParty({});
              key.current = window.crypto.randomUUID();
              setError("");
              setCreating(true);
            }}
          >
            Upload documents
          </Button>
        </div>
      </div>
      {error && !creating && (
        <div role="alert">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            onClick={() => setRefresh(value => value + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      {!records && !error && <p role="status">Loading documents…</p>}
      {records?.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          Upload an agreement, addendum or any other supported document. No
          template or client profile is required.
        </p>
      )}
      <div className="space-y-3">
        {records?.map(record => (
          <article
            key={record.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <Link
              className="break-words font-medium text-primary underline"
              to={`/agreements/documents/${record.id}`}
            >
              {record.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {titleCase(record.status)} · Version {record.revision_number} ·
              Updated {new Date(record.updated_at).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || !records}
            onClick={() => setPage(value => value - 1)}
          >
            Previous page
          </Button>
          <span>
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
      <Dialog
        open={creating}
        onOpenChange={open => {
          if (!busy) setCreating(open);
        }}
      >
        <DialogContent className="signature-workspace max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload documents</DialogTitle>
            <DialogDescription>
              Upload flat, unlocked PDFs: up to 10 files, 5 MiB each, 25 MiB and
              100 pages combined. For Google Docs or Word, export to PDF first.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              <div>
                <Label htmlFor="upload-signing-title">Document title</Label>
                <Input
                  id="upload-signing-title"
                  required
                  maxLength={200}
                  value={title}
                  onChange={event => {
                    setTitle(event.target.value);
                    key.current = window.crypto.randomUUID();
                  }}
                />
              </div>
              <div>
                <Label htmlFor="upload-signing-files">PDF documents</Label>
                <Input
                  id="upload-signing-files"
                  type="file"
                  multiple
                  required
                  accept=".pdf,application/pdf"
                  onChange={event => {
                    setFiles(Array.from(event.target.files || []));
                    key.current = window.crypto.randomUUID();
                  }}
                />
              </div>
              <ProfileLink
                change={link => {
                  setParty(link);
                  key.current = window.crypto.randomUUID();
                }}
              />
            </fieldset>
            {error && (
              <p role="alert" className="text-destructive">
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
              <Button type="submit" disabled={busy || !files.length}>
                {busy ? "Uploading…" : "Create signing draft"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DocumentSignatures() {
  const { company } = useUserContext();
  const { requestId } = useParams();
  if (!company?.id) {
    return (
      <p role="status" className="p-6">
        Loading workspace…
      </p>
    );
  }

  if (requestId && !/^\d{1,18}$/.test(requestId)) {
    return (
      <p role="alert" className="p-6">
        Document not found.
      </p>
    );
  }

  return requestId ? (
    <Editor
      key={`${String(company.id)}-${requestId}`}
      id={requestId}
      companyId={company.id}
    />
  ) : (
    <Workspace key={company.id} companyId={company.id} />
  );
}
