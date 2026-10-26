import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import FormSettings from "./FormSettings";
import {
  hiringTextFields,
  type HiringSettings,
  type HiringSettingsDetails,
  type HiringSettingsPage,
  type FormSchema,
} from "./types";

export default function Settings({ companyId }: { companyId: number }) {
  const [saved, setSaved] = useState<HiringSettings | null>(null);
  const [draft, setDraft] = useState<HiringSettingsDetails | null>(null);
  const [draftForm, setDraftForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
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
    read<HiringSettingsPage>("settings", companyId, {}, controller.signal)
      .then(result => {
        if (active) {
          setSaved(result.settings);
          setDraft(result.settings.details);
          setDraftForm(result.settings.form);
          setNotice("");
        }
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
  }, [companyId, refresh]);

  const dirty = Boolean(
    saved &&
      draft &&
      draftForm &&
      (JSON.stringify(saved.details) !== JSON.stringify(draft) ||
        JSON.stringify(saved.form) !== JSON.stringify(draftForm))
  );

  const mutate = async (approve: boolean) => {
    if (!saved || !draft || !draftForm || busy || loading) return;
    setBusy(true);
    setError("");
    setNotice("");
    const attributes = {
      company_id: companyId,
      lock_version: saved.lock_version,
    };
    try {
      const { data } = approve
        ? await Api.post<HiringSettingsPage>(
            "/hiring/settings/approve",
            { hiring_setting: attributes },
            quiet
          )
        : await Api.put<HiringSettingsPage>(
            "/hiring/settings",
            {
              hiring_setting: {
                ...attributes,
                details: draft,
                form: {
                  ...draftForm,
                  fields: draftForm.fields.map(field =>
                    field.type === "select"
                      ? {
                          ...field,
                          choices: field.choices
                            ?.map(choice => choice.trim())
                            .filter(Boolean),
                        }
                      : field
                  ),
                },
              },
            },
            quiet
          );
      verifyWorkspace(data, companyId);
      if (!mounted.current) return;

      setSaved(data.settings);
      setDraft(data.settings.details);
      setDraftForm(data.settings.form);
      setNotice(
        approve
          ? "Approved. New applications can receive this acknowledgement and any enabled form link."
          : "Draft saved. Outgoing acknowledgements require approval."
      );
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
          <h2 className="text-xl font-semibold">Hiring communications</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Confirm your company information and engagement terms before
            approving automatic acknowledgements for new applications. Approval
            does not send mail to the existing backlog.
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={busy || loading}
          onClick={() => setRefresh(value => value + 1)}
        >
          {dirty ? "Discard edits and reload" : "Reload saved settings"}
        </Button>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading communication settings…
        </p>
      )}
      {saved && draft && draftForm && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {saved.approved
                ? "Approved for new applications"
                : "Unapproved draft"}
            </Badge>
            {dirty && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>
          <form
            onSubmit={event => {
              event.preventDefault();
              void mutate(false);
            }}
            className="space-y-4 rounded-lg border bg-card p-4 sm:p-5"
          >
            <fieldset
              disabled={busy || loading}
              className="grid min-w-0 gap-4 md:grid-cols-2"
            >
              {hiringTextFields.map(({ key, label }) => (
                <div key={key} className="min-w-0 space-y-2">
                  <Label htmlFor={`hiring-setting-${key}`}>{label}</Label>
                  {key === "acknowledgement_subject" ? (
                    <Input
                      id={`hiring-setting-${key}`}
                      className="h-11"
                      value={draft[key] ?? ""}
                      maxLength={200}
                      onChange={event =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                    />
                  ) : (
                    <Textarea
                      id={`hiring-setting-${key}`}
                      rows={3}
                      value={draft[key] ?? ""}
                      maxLength={5000}
                      onChange={event =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                    />
                  )}
                  {key === "pto" && (
                    <p className="text-xs text-muted-foreground">
                      Use the applicable employee and consultant terms; this
                      text appears in every acknowledgement.
                    </p>
                  )}
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="hiring-client-count">Client count</Label>
                <Input
                  id="hiring-client-count"
                  type="number"
                  min={0}
                  max={1000000}
                  step={1}
                  className="h-11"
                  value={draft.client_count ?? ""}
                  onChange={event =>
                    setDraft({
                      ...draft,
                      client_count:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank until confirmed. Zero is an explicit value.
                </p>
              </div>
              <FormSettings value={draftForm} change={setDraftForm} />
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                className="min-h-11"
                disabled={
                  busy || loading || (!dirty && saved.lock_version !== null)
                }
              >
                Save draft
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={
                  busy || loading || dirty || !saved.complete || saved.approved
                }
                onClick={() => void mutate(true)}
              >
                {draftForm.enabled
                  ? "Approve communications and form"
                  : "Approve acknowledgement"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Saving any change removes the previous approval. Complete all
              fields, save, and review the preview before approving.
            </p>
          </form>
          <section
            aria-label="Saved acknowledgement preview"
            className="min-w-0 space-y-3 rounded-lg border bg-card p-4 sm:p-5"
          >
            <h3 className="font-semibold">Saved acknowledgement preview</h3>
            {dirty ? (
              <p className="text-sm text-muted-foreground">
                Save your edits to preview the saved acknowledgement text.
              </p>
            ) : saved.preview ? (
              <>
                <p className="break-words text-sm">
                  <strong>Subject:</strong> {saved.preview.subject}
                </p>
                <pre
                  data-testid="acknowledgement-preview"
                  className="whitespace-pre-wrap break-words font-sans text-sm leading-6"
                >
                  {saved.preview.body}
                </pre>
                {saved.form.enabled && (
                  <p className="text-sm text-muted-foreground">
                    A private application link is added for each recipient when
                    the acknowledgement is queued.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete all fields and save to preview the acknowledgement.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
