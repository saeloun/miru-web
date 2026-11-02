/* global BeforeUnloadEvent */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getCsrfToken } from "utils/authHeaders";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import PortalField from "./PortalField";
import { type FormAnswer, type FormField } from "./types";

type CandidateForm = {
  company_name: string;
  introduction: string;
  fields: FormField[];
  expires_at: string;
  answers: Record<string, FormAnswer>;
  submitted_at: string | null;
  lock_version: number;
  resume: { filename: string; byte_size: number } | null;
};

function Portal({ token }: { token: string }) {
  const [form, setForm] = useState<CandidateForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, FormAnswer>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);
  const submissionSummary = useRef<HTMLElement>(null);
  const request = useCallback(
    async (
      action: string,
      body: object | FormData = {},
      signal?: InstanceType<typeof window.AbortController>["signal"]
    ) => {
      const upload = body instanceof window.FormData;
      const response = await window.fetch(`/hiring-form/${action}`, {
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
          : JSON.stringify({ hiring_form: { token, ...body } }),
      });
      if (!response.ok) {
        if (response.status === 410) {
          setUnavailable(true);
          setForm(null);
          setAnswers({});
          setDirty(false);
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.errors === "string"
            ? data.errors
            : "The form request failed. Please try again."
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
          setForm(data.form);
          setAnswers(data.form.answers);
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
    else if (form?.submitted_at) submissionSummary.current?.focus();
  }, [error, form?.submitted_at]);

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await request("open");
      const next = (await response.json()).form;
      setForm(next);
      if (!form || next.submitted_at) {
        setAnswers(next.answers);
        setDirty(false);
      }
      setError("");
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!form || busy) return;
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(
        Object.entries(answers).map(([id, value]) => [
          id,
          Array.isArray(value)
            ? value.map(line => line.trim()).filter(Boolean)
            : value,
        ])
      );

      const response = await request("submit", {
        answers: values,
        lock_version: form.lock_version,
      });
      const data = await response.json();
      setForm(data.form);
      setAnswers(data.form.answers);
      setDirty(false);
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadResume = async (file: File) => {
    if (!form || busy) return;

    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError("Upload a PDF, DOC or DOCX resume up to 5 MiB.");

      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new window.FormData();
      body.append("hiring_form[token]", token);
      body.append("hiring_form[lock_version]", String(form.lock_version));
      body.append("hiring_form[file]", file);
      const response = await request("resume", body);
      setForm((await response.json()).form);
      setDirty(true);
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadResume = async () => {
    if (!form?.resume || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await request("resume/download");
      const url = window.URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = form.resume.filename;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Miru · Private application
        </p>
        <h1 className="text-2xl font-semibold">Application form</h1>
        {form && <p className="break-words text-sm">{form.company_name}</p>}
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
              Refresh form
            </Button>
          )}
        </div>
      )}
      {!form && !error && !unavailable && (
        <p role="status">Loading application…</p>
      )}
      {form && (
        <>
          <section
            aria-label="Company introduction and hiring terms"
            className="rounded-lg border bg-card p-4"
          >
            <h2 className="mb-3 font-semibold">About the company and role</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {form.introduction}
            </p>
          </section>
          {form.submitted_at && (
            <section
              ref={submissionSummary}
              role="status"
              tabIndex={-1}
              className="space-y-2 rounded-lg border p-4"
            >
              <h2 className="font-semibold">Application submitted</h2>
              <p className="text-sm">
                The hiring team will review your information and confirm the
                next step.
              </p>
            </section>
          )}
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset
              disabled={busy || Boolean(form.submitted_at)}
              className="min-w-0 space-y-5"
            >
              <legend className="mb-3 text-sm text-muted-foreground">
                Fields marked required must be completed. Other fields may be
                left blank.
              </legend>
              {form.fields.map(field => {
                const unemployed =
                  answers.employment_status === "Not currently employed" &&
                  [
                    "current_role",
                    "current_company",
                    "current_compensation",
                  ].includes(field.id);
                const required = field.required && !unemployed;
                if (field.type === "file") {
                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`candidate-${field.id}`}>
                        {field.label}
                        {required && " (required)"}
                      </Label>
                      <Input
                        id={`candidate-${field.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        required={required && !form.resume}
                        onChange={event => {
                          const file = event.target.files?.[0];
                          event.currentTarget.value = "";
                          if (file) void uploadResume(file);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC or DOCX, up to 5 MiB. Files are private.
                      </p>
                      {form.resume && (
                        <p className="break-words text-sm">
                          Uploaded: {form.resume.filename}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <PortalField
                    key={field.id}
                    field={field}
                    value={answers[field.id]}
                    required={required}
                    change={value => {
                      setAnswers(previous => ({
                        ...previous,
                        [field.id]: value,
                      }));
                      setDirty(true);
                    }}
                  />
                );
              })}
            </fieldset>
            {!form.submitted_at && (
              <Button type="submit" className="min-h-11" disabled={busy}>
                {busy ? "Saving…" : "Submit application"}
              </Button>
            )}
          </form>
          {form.resume && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 max-w-full whitespace-normal break-all"
              disabled={busy}
              onClick={() => void downloadResume()}
            >
              Download resume
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Keep your original link private. It expires{" "}
            {new Date(form.expires_at).toLocaleString()}. Your answers are sent
            when you submit; uploads are saved immediately.
          </p>
        </>
      )}
    </div>
  );
}

export function mountHiringForm(element: HTMLElement, token: string) {
  createRoot(element).render(<Portal token={token} />);
}
