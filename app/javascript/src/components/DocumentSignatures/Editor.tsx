import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useBeforeUnload, useBlocker } from "react-router-dom";
import Api from "apis/api";
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
import {
  download,
  endpoint,
  failureMessage,
  originalBytes,
  originalPath,
  quiet,
  uploadDocuments,
} from "./api";
import type { Field, SigningRequest } from "./types";
import Fields from "./Fields";
import Recipients from "./Recipients";
import PdfPages from "./PdfPages";

export default function Editor({
  id,
  companyId,
}: {
  id: string;
  companyId: string | number;
}) {
  const [record, setRecord] = useState<SigningRequest | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    recipients: [] as SigningRequest["revision"]["recipients"],
    fields: [] as Field[],
  });
  const [saved, setSaved] = useState("");
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState({ document: "", page: 1 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState<
    "reload" | "replace" | "version" | null
  >(null);
  const [version, setVersion] = useState("");
  const mounted = useRef(true);
  const dirty = Boolean(record) && JSON.stringify(draft) !== saved;
  const blocker = useBlocker(dirty || busy);
  useBeforeUnload(
    useCallback(
      event => {
        if (dirty || busy) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty, busy]
    )
  );

  const reset = (value: SigningRequest) => {
    const next = {
      title: value.revision.title,
      recipients: value.revision.recipients,
      fields: value.revision.fields,
    };
    setRecord(value);
    setDraft(next);
    setSaved(JSON.stringify(next));
    setConflict(false);
    setError("");
    setSelected(value.revision.fields[0]?.id || "");
    setPreview({ document: value.revision.documents[0].key, page: 1 });
  };

  useEffect(() => {
    mounted.current = true;
    const controller = new window.AbortController();
    Api.get(endpoint(id), { ...quiet, signal: controller.signal })
      .then(({ data }) => {
        if (mounted.current) reset(data.signature_request);
      })
      .catch(failure => {
        if (mounted.current) setError(failureMessage(failure));
      });

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [id]);

  const load = async (revision?: string) => {
    setBusy(true);
    try {
      const { data } = await Api.get(
        endpoint(id) + (revision ? `/revisions/${revision}` : ""),
        quiet
      );
      if (mounted.current) reset(data.signature_request);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!record || busy || conflict) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.patch(
        endpoint(id),
        {
          signature_request: {
            company_id: companyId,
            lock_version: record.lock_version,
            ...draft,
          },
        },
        quiet
      );
      if (mounted.current) reset(data.signature_request);
    } catch (failure: any) {
      if (mounted.current) {
        setError(failureMessage(failure));
        setConflict(failure?.response?.status === 409);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const replace = async () => {
    if (!record || !files.length || busy) return;
    setConfirm(null);
    setBusy(true);
    setError("");
    try {
      const value = await uploadDocuments(
        files,
        { company_id: companyId, lock_version: record.lock_version },
        record.id
      );
      if (mounted.current) {
        reset(value);
        setFiles([]);
        setNotice(
          "Place fields again on the new source. Earlier versions remain in history."
        );
      }
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const select = (field: Field) => {
    setSelected(field.id);
    setPreview({ document: field.document_id, page: field.page });
  };

  const change = (field: Field, patch: Partial<Field>) => {
    const next = { ...field, ...patch };
    setDraft(value => ({
      ...value,
      fields: value.fields.map(item =>
        item.id === field.id ? { ...item, ...patch } : item
      ),
    }));
    if ("page" in patch || "document_id" in patch) {
      setPreview({ document: next.document_id, page: next.page });
    }
  };

  if (!record) {
    return (
      <div className="p-6">
        {error ? (
          <div role="alert">
            <p>{error}</p>
            <Button onClick={() => void load()}>Retry</Button>
          </div>
        ) : (
          <p role="status">Loading signing draft…</p>
        )}
      </div>
    );
  }
  const historical = record.revision.id !== record.current_revision_id;
  const editable =
    !historical &&
    [
      "draft",
      "under_review",
      "changes_requested",
      "approved",
      "cancelled",
    ].includes(record.revision.status);
  const documents = record.revision.documents;

  return (
    <div className="signature-workspace space-y-5 p-4 lg:p-6">
      <Link to="/agreements" className="text-primary underline">
        All documents
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {historical ? "Historical version" : "Prepare document for signing"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Version {record.revision.number} ·{" "}
            {record.revision.status.replace(/_/g, " ")}
          </p>
        </div>
        <div>
          <Label htmlFor="document-version">Document version</Label>
          <select
            id="document-version"
            className="signatures-select"
            value={record.revision.id}
            disabled={busy}
            onChange={event => {
              if (dirty) {
                setVersion(event.target.value);
                setConfirm("version");
              } else void load(event.target.value);
            }}
          >
            {record.revisions.map(revision => (
              <option key={revision.id} value={revision.id}>
                Version {revision.number}
              </option>
            ))}
          </select>
        </div>
      </div>
      {historical && (
        <p className="rounded-md border border-border p-3 text-sm">
          This historical version is read-only. Select the latest version to
          continue editing.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">{error}</p>
          {conflict && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirm("reload")}
            >
              Reload latest
            </Button>
          )}
        </div>
      )}
      <form onSubmit={save} className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <Label htmlFor="signing-title">Document title</Label>
            <Input
              id="signing-title"
              value={draft.title}
              required
              maxLength={200}
              disabled={busy || !editable}
              onChange={event =>
                setDraft(value => ({ ...value, title: event.target.value }))
              }
            />
          </div>
          {editable && (
            <Button type="submit" disabled={busy || !dirty || conflict}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          )}
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {busy ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
        </p>
        <div className="signature-layout">
          <PdfPages
            requestId={record.id}
            revisionId={record.revision.id}
            documents={documents}
            fields={draft.fields}
            selected={selected}
            preview={preview}
            setPreview={setPreview}
            select={select}
            change={change}
            editable={editable && !busy}
          />
          <fieldset disabled={busy} className="min-w-0 space-y-5">
            <Recipients
              recipients={draft.recipients}
              fields={draft.fields}
              editable={editable}
              change={recipients =>
                setDraft(value => ({ ...value, recipients }))
              }
            />
            <Fields
              documents={documents}
              fields={draft.fields}
              recipients={draft.recipients}
              selected={selected}
              select={select}
              change={change}
              editable={editable}
              remove={field => {
                setDraft(value => ({
                  ...value,
                  fields: value.fields.filter(item => item.id !== field.id),
                }));
                setSelected("");
              }}
              add={() => {
                const field: Field = {
                  id: window.crypto.randomUUID(),
                  document_id: preview.document || documents[0].key,
                  recipient_id: draft.recipients.find(
                    person => person.role === "signer"
                  )!.id,
                  page: preview.page,
                  type: "signature",
                  label: `Signature ${draft.fields.length + 1}`,
                  required: true,
                  read_only: false,
                  x: 10,
                  y: 70,
                  width: 30,
                  height: 8,
                };

                setDraft(value => ({
                  ...value,
                  fields: [...value.fields, field],
                }));
                select(field);
              }}
            />
          </fieldset>
        </div>
      </form>
      <section aria-label="Original documents" className="space-y-2">
        <h2 className="font-semibold">Original documents</h2>
        {documents.map(document => (
          <Button
            key={document.key}
            type="button"
            variant="outline"
            className="mr-2 max-w-full break-all"
            onClick={async () => {
              try {
                download(
                  new Blob(
                    [
                      await originalBytes(
                        originalPath(
                          record.id,
                          record.revision.id,
                          document.key
                        )
                      ),
                    ],
                    { type: "application/pdf" }
                  ),
                  document.filename
                );
              } catch (failure) {
                if (mounted.current) setError(failureMessage(failure));
              }
            }}
          >
            Download original: {document.filename}
          </Button>
        ))}
      </section>
      {editable && (
        <section
          aria-label="Replace sources"
          className="space-y-2 rounded-lg border border-border p-4"
        >
          <h2 className="font-semibold">Upload a revised source</h2>
          <p className="text-sm text-muted-foreground">
            Export updated documents as flat, unlocked PDFs. Replacing sources
            clears field placement and approval; earlier versions are retained.
          </p>
          <Label htmlFor="replacement-pdfs">Replacement PDFs</Label>
          <Input
            id="replacement-pdfs"
            type="file"
            multiple
            accept=".pdf,application/pdf"
            disabled={busy}
            onChange={event => setFiles(Array.from(event.target.files || []))}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy || dirty || !files.length}
            onClick={() => setConfirm("replace")}
          >
            Replace sources
          </Button>
          {dirty && (
            <p className="text-sm text-muted-foreground">
              Save your edits before replacing the source.
            </p>
          )}
        </section>
      )}
      <Dialog
        open={Boolean(confirm) || blocker.state === "blocked"}
        onOpenChange={open => {
          if (!open && !busy) {
            setConfirm(null);
            if (blocker.state === "blocked") blocker.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "replace"
                ? "Replace source documents?"
                : "Unsaved changes"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "replace"
                ? "This creates a new version and clears all field placements and approval. Your previous version remains available."
                : "Reloading or leaving discards your unsaved edits. Keep editing to preserve them."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setConfirm(null);
                if (blocker.state === "blocked") blocker.reset();
              }}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm === "replace") {
                  void replace();

                  return;
                }

                if (confirm) {
                  const target = confirm === "version" ? version : undefined;
                  setConfirm(null);
                  void load(target);
                } else if (blocker.state === "blocked") blocker.proceed();
              }}
            >
              {confirm === "replace"
                ? "Replace and clear fields"
                : confirm
                ? "Discard and reload"
                : "Discard and leave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
