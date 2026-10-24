import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useBeforeUnload, useBlocker } from "react-router-dom";
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/core";
import Api, { BEFORE_WORKSPACE_CHANGE } from "apis/api";
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
import DocumentEditor from "./DocumentEditor";
import Fields from "./Fields";
import {
  download,
  downloadPdf,
  endpoint,
  failureMessage,
  quiet,
  recordKey,
} from "./api";
import type { Contract, Field, Preview, Values } from "./types";

const LoadedEditor = ({
  record,
  type,
  reload,
}: {
  record: Contract;
  type: string;
  reload: () => void;
}) => {
  const isDraft = type === "drafts";
  const [title, setTitle] = useState(record.title);
  const [fields, setFields] = useState(record.fields);
  const [values, setValues] = useState<Values>(record.field_values || {});
  const [status, setStatus] = useState("All changes saved");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [workspaceWarning, setWorkspaceWarning] = useState(false);
  const editor = useRef<TiptapEditor | null>(null);
  const current = useRef({
    title: record.title,
    document: record.document,
    fields: record.fields,
    field_values: record.field_values || {},
  });
  const version = useRef(record.lock_version);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const saving = useRef(false);
  const stopped = useRef(false);
  const conflicting = useRef(false);
  const active = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retired = useRef(
    new Map<string, { field: Field; value: Values[string] }>()
  );
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const dirty = status !== "All changes saved";
  const blocker = useBlocker(dirty || busy);

  useBeforeUnload(
    useCallback(event => {
      if (revision.current !== savedRevision.current || saving.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }, [])
  );

  const schedule = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saveRef.current();
    }, 800);
  };

  const change = useCallback((patch: Partial<typeof current.current>) => {
    current.current = { ...current.current, ...patch };
    revision.current += 1;
    if (!conflicting.current) stopped.current = false;
    setStatus("Unsaved changes");
    schedule();
  }, []);

  saveRef.current = async () => {
    if (
      !active.current ||
      saving.current ||
      stopped.current ||
      revision.current === savedRevision.current
    ) {
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    const savingRevision = revision.current;
    const snapshot = current.current;
    saving.current = true;
    setBusy(true);
    setStatus("Saving…");
    setError("");
    try {
      const attributes = isDraft
        ? snapshot
        : {
            title: snapshot.title,
            document: snapshot.document,
            fields: snapshot.fields,
          };

      const { data } = await Api.patch(
        `${endpoint(type)}/${record.id}`,
        {
          [recordKey(type)]: {
            ...attributes,
            company_id: record.company_id,
            lock_version: version.current,
          },
        },
        quiet
      );
      if (!active.current) return;
      version.current = data[recordKey(type)].lock_version;
      savedRevision.current = savingRevision;
      setStatus(
        revision.current === savingRevision
          ? "All changes saved"
          : "Unsaved changes"
      );
    } catch (failure: any) {
      if (!active.current) return;
      stopped.current = true;
      conflicting.current = failure?.response?.status === 409;
      setConflict(conflicting.current);
      setStatus("Unsaved changes");
      setError(failureMessage(failure));
    } finally {
      saving.current = false;
      if (active.current) {
        setBusy(false);
        if (!stopped.current && revision.current !== savedRevision.current) {
          schedule();
        }
      }
    }
  };

  useEffect(
    () => () => {
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  useEffect(() => {
    const guard = event => {
      if (revision.current !== savedRevision.current || saving.current) {
        event.preventDefault();
        setWorkspaceWarning(true);
      }
    };
    window.addEventListener(BEFORE_WORKSPACE_CHANGE, guard);

    return () => window.removeEventListener(BEFORE_WORKSPACE_CHANGE, guard);
  }, []);

  const bodyChanged = useCallback(
    (document: JSONContent) => {
      const restored: Field[] = [];
      const restoredValues: Values = {};
      const visit = (node: JSONContent) => {
        if (
          node.type === "mergeField" &&
          !current.current.fields.some(
            field => field.key === node.attrs?.key
          ) &&
          !restored.some(field => field.key === node.attrs?.key)
        ) {
          const previous = retired.current.get(node.attrs?.key);
          if (previous) {
            restored.push(previous.field);
            if (previous.value != null) {
              restoredValues[previous.field.key] = previous.value;
            }
          }
        }
        node.content?.forEach(visit);
      };
      visit(document);
      if (restored.length) {
        const fields = [...current.current.fields, ...restored];
        const field_values = {
          ...current.current.field_values,
          ...restoredValues,
        };
        setFields(fields);
        setValues(field_values);
        change({ document, fields, field_values });
      } else change({ document });
    },
    [change]
  );

  const removeField = (key: string) => {
    const instance = editor.current;
    const field = current.current.fields.find(field => field.key === key);
    if (!instance || !field) return;
    retired.current.set(key, {
      field,
      value: current.current.field_values[key],
    });
    const fields = current.current.fields.filter(field => field.key !== key);
    const field_values = { ...current.current.field_values };
    delete field_values[key];
    setFields(fields);
    setValues(field_values);
    change({ fields, field_values });
    const placements: { from: number; to: number }[] = [];
    instance.state.doc.descendants((node, position) => {
      if (node.type.name === "mergeField" && node.attrs.key === key) {
        placements.push({ from: position, to: position + node.nodeSize });
      }
    });
    const transaction = instance.state.tr;
    placements
      .reverse()
      .forEach(({ from, to }) => transaction.delete(from, to));
    if (placements.length) instance.view.dispatch(transaction);
  };

  const importWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Choose a DOCX document of at most 5 MiB.");

      return;
    }
    setImporting(true);
    setError("");
    const form = new FormData();
    form.append("agreement_template[company_id]", String(record.company_id));
    form.append(
      "agreement_template[fields]",
      JSON.stringify(current.current.fields)
    );
    form.append("agreement_template[file]", file);
    try {
      const { data } = await Api.post("/agreement_templates/import", form, {
        ...quiet,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (active.current) setPreview(data.preview);
    } catch (failure) {
      if (active.current) setError(failureMessage(failure));
    } finally {
      if (active.current) setImporting(false);
    }
  };

  const replaceFromPreview = () => {
    if (!preview || !editor.current) return;
    const field_values = Object.fromEntries(
      Object.entries(current.current.field_values).filter(([key]) =>
        preview.fields.some(field => field.key === key)
      )
    );
    setFields(preview.fields);
    setValues(field_values);
    current.current = {
      ...current.current,
      fields: preview.fields,
      field_values,
    };

    editor.current.commands.setContent(preview.document, {
      emitUpdate: false,
      errorOnInvalidContent: true,
    });

    change({
      document: editor.current.getJSON(),
      fields: preview.fields,
      field_values,
    });
    setPreview(null);
  };

  const fieldPanel = (
    <Fields
      fields={fields}
      values={values}
      isDraft={isDraft}
      onChange={next => {
        setFields(next);
        change({ fields: next });
      }}
      onValue={(key, value) => {
        const next = { ...current.current.field_values, [key]: value };
        setValues(next);
        change({ field_values: next });
      }}
      onInsert={key => {
        editor.current
          ?.chain()
          .focus()
          .insertContent({ type: "mergeField", attrs: { key } })
          .run();
        setFieldsOpen(false);
      }}
      onRemove={removeField}
    />
  );

  const missing = fields.filter(
    field =>
      field.required &&
      (values[field.key] == null ||
        (typeof values[field.key] === "string" &&
          !String(values[field.key]).trim()))
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <Link to="/agreements" className="text-sm text-primary underline">
        All agreements
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="w-full min-w-0 space-y-2 sm:flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isDraft ? "Draft agreement" : "Agreement template"} · {record.kind}
          </p>
          <Label htmlFor="document-title">Document title</Label>
          <Input
            id="document-title"
            value={title}
            maxLength={200}
            onChange={event => {
              setTitle(event.target.value);
              change({ title: event.target.value });
            }}
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button
            variant="outline"
            disabled={busy || conflict || !dirty}
            onClick={() => {
              stopped.current = false;
              void saveRef.current();
            }}
          >
            Save now
          </Button>
          {isDraft && (
            <Button
              disabled={dirty || busy || exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await downloadPdf(record.id);
                } catch (failure) {
                  setError(failureMessage(failure));
                } finally {
                  if (active.current) setExporting(false);
                }
              }}
            >
              {exporting ? "Preparing PDF…" : "Download draft PDF"}
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {isDraft
          ? "This copy has its own clauses, fields and values. Master or profile changes do not alter it."
          : "Reusable master. Generated drafts keep their own editable copies."}{" "}
        Review, approval and signing are not available in this draft editor.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {status}
          {isDraft && missing > 0
            ? ` · ${missing} required fields missing`
            : ""}
        </p>
        <div className="max-w-full text-sm">
          <Label htmlFor="word-import">Import Word document</Label>
          <input
            className="block max-w-full text-sm"
            id="word-import"
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={importing || busy}
            onChange={importWord}
          />
          {importing && <span role="status">Checking Word document…</span>}
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="space-y-2 rounded-md border border-destructive p-3 text-sm"
        >
          <p>{error}</p>
          {dirty && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                download(
                  new Blob(
                    [
                      JSON.stringify(
                        {
                          id: record.id,
                          company_id: record.company_id,
                          lock_version: version.current,
                          ...current.current,
                        },
                        null,
                        2
                      ),
                    ],
                    { type: "application/json" }
                  ),
                  `agreement-${record.id}-recovery.json`
                )
              }
            >
              Download recovery copy
            </Button>
          )}
          {conflict && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmReload(true)}
            >
              Reload saved version
            </Button>
          )}
        </div>
      )}
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <DocumentEditor
          document={record.document}
          fields={fields}
          values={values}
          onReady={instance => {
            editor.current = instance;
          }}
          onChange={bodyChanged}
          onError={setError}
        />
        {!fieldsOpen && <div className="hidden xl:block">{fieldPanel}</div>}
      </div>
      <Button
        className="fixed bottom-4 right-4 z-30 shadow-lg xl:hidden"
        aria-expanded={fieldsOpen}
        aria-haspopup="dialog"
        onClick={() => setFieldsOpen(true)}
      >
        Fields ({fields.length})
      </Button>
      <Dialog open={fieldsOpen} onOpenChange={setFieldsOpen}>
        <DialogContent
          onCloseAutoFocus={event => {
            event.preventDefault();
            editor.current?.commands.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Document fields</DialogTitle>
            <DialogDescription>
              Configure fields and insert them at the last cursor position in
              the contract.
            </DialogDescription>
          </DialogHeader>
          {fieldsOpen && fieldPanel}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={open => !open && setPreview(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Word import</DialogTitle>
            <DialogDescription>
              Replacing applies this preview to the current body and field
              definitions. Existing clauses will be replaced; nothing is changed
              until you confirm.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {preview.warnings.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <p className="text-sm">
                {preview.fields.length} fields · Review the imported clauses and
                formatting below.
              </p>
              <DocumentEditor
                document={preview.document}
                fields={preview.fields}
                values={{}}
                readOnly
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Cancel import
                </Button>
                <Button onClick={replaceFromPreview}>
                  Replace body and fields
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={workspaceWarning} onOpenChange={setWorkspaceWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              Save your edits or leave the editor before changing workspaces.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setWorkspaceWarning(false)}>
            Keep editing
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmReload} onOpenChange={setConfirmReload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard local edits?</DialogTitle>
            <DialogDescription>
              Download a recovery copy first if you need these edits. Reloading
              restores the saved document.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setConfirmReload(false)}>
            Keep editing
          </Button>
          <Button variant="destructive" onClick={reload}>
            Discard local edits and reload
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={open => {
          if (!open && blocker.state === "blocked") blocker.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              {busy
                ? "A save is in progress. Wait for it to finish before leaving."
                : "Stay to save or download a recovery copy. Leaving discards any edits that have not been saved."}
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="outline"
            onClick={() => {
              if (blocker.state === "blocked") blocker.reset();
            }}
          >
            Keep editing
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              if (blocker.state === "blocked") blocker.proceed();
            }}
          >
            {dirty ? "Discard edits and leave" : "Leave editor"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Editor = ({
  companyId,
  type,
  id,
}: {
  companyId: number | string;
  type: string;
  id: string;
}) => {
  const [record, setRecord] = useState<Contract | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setRecord(null);
    setError("");
    Api.get(`${endpoint(type)}/${id}`, quiet)
      .then(({ data }) => {
        if (active) setRecord(data[recordKey(type)]);
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
    };
  }, [companyId, type, id, refresh]);
  if (error) {
    return (
      <div role="alert" className="space-y-3 p-6">
        <p>{error}</p>
        <Button onClick={() => setRefresh(value => value + 1)}>Retry</Button>
        <Link to="/agreements">All agreements</Link>
      </div>
    );
  }

  if (!record) {
    return (
      <p role="status" className="p-6">
        Loading agreement…
      </p>
    );
  }

  if (String(record.company_id) !== String(companyId)) {
    return (
      <p role="alert" className="p-6">
        Workspace changed. Reload before editing.
      </p>
    );
  }

  return (
    <LoadedEditor
      key={`${record.id}-${refresh}`}
      record={record}
      type={type}
      reload={() => setRefresh(value => value + 1)}
    />
  );
};

export default Editor;
