import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import {
  billingIdentityApi,
  type BillingFacts,
  type BillingIdentity,
  type BillingReview,
  type EvidenceKind,
  type ReviewCommand,
  type SubmissionCommand,
} from "./api";

const labels = {
  missing: "Billing identity not submitted",
  submitted: "Awaiting accounts review",
  approved: "Accounts reviewed",
  needs_information: "More information required",
  rejected: "Submission rejected",
};

const blankFacts: BillingFacts = {
  legal_name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "IN",
  pan_status: "",
  pan_number: "",
  pan_reason: "",
  gst_status: "",
  gst_number: "",
  gst_scheme: "",
  gst_reason: "",
};

const fields: [keyof BillingFacts, string][] = [
  ["legal_name", "Legal name"],
  ["address_line_1", "Billing address line 1"],
  ["address_line_2", "Billing address line 2 (optional)"],
  ["city", "City"],
  ["state", "State or region"],
  ["postal_code", "Postal code"],
];
type Draft = {
  facts: BillingFacts;
  baseId: string;
  files: Partial<Record<EvidenceKind, File>>;
  reuse: Record<EvidenceKind, boolean>;
};
const selectClass =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring";

export function BillingIdentityPanel({
  companyId,
  userId,
  companyName,
}: {
  companyId: string;
  userId: string;
  companyName: string;
}) {
  const [controller] = useState(() => new window.AbortController());
  const [data, setData] = useState<BillingIdentity | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState<
    SubmissionCommand | ReviewCommand | null
  >(null);
  const [decision, setDecision] = useState<BillingReview["decision"] | "">("");
  const [reason, setReason] = useState("");
  const [manual, setManual] = useState(false);
  const [missingPan, setMissingPan] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const evidenceInputs = useRef<
    Partial<Record<EvidenceKind, HTMLInputElement>>
  >({});
  const signal = controller.signal;
  const selected = data?.selected_submission;
  const selectedCurrent =
    !!selected && selected.id === data?.current_submission?.id;
  const selectedReview = data?.review_history[0];

  const verify = (value: BillingIdentity) => {
    if (
      String(value.company_id) !== companyId ||
      String(value.user_id) !== userId
    ) {
      throw new Error("workspace");
    }

    return value;
  };

  const failed = async (failure: unknown) => {
    if (signal.aborted || !mounted.current) return;

    const response = axios.isAxiosError(failure) ? failure.response : null;
    let body = response?.data;
    if (body instanceof Blob) {
      try {
        body = JSON.parse(await body.text());
      } catch {
        body = null;
      }
    }

    if (signal.aborted || !mounted.current) return;

    if (response?.status >= 400 && response.status < 500) setPending(null);

    if (response?.status === 409) setNeedsRefresh(true);

    if (!response || [401, 403, 404].includes(response.status)) {
      if (
        response ||
        (failure instanceof Error && failure.message === "workspace")
      ) {
        setData(null);
        setDraft(null);
        setPending(null);
        setReveal(false);
      }
    }

    setError(
      typeof body?.errors === "string"
        ? body.errors
        : "Billing identity is unavailable. Refresh to check access and the latest version."
    );
  };

  const resetReview = () => {
    setDecision("");
    setReason("");
    setManual(false);
    setMissingPan(false);
  };

  const load = async (
    query: {
      submission_id?: string;
      before_id?: string;
      review_before_id?: string;
    } = {}
  ) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await billingIdentityApi.read(
        companyId,
        userId,
        signal,
        query
      );
      if (signal.aborted || !mounted.current) return;

      const result = verify(response.data.billing_identity);
      setData(current => {
        const history = query.before_id
          ? [...(current?.history || []), ...result.history]
          : result.history;

        const reviews = query.review_before_id
          ? [...(current?.review_history || []), ...result.review_history]
          : result.review_history;

        return {
          ...result,
          history: history.filter(
            (item, index) =>
              history.findIndex(other => other.id === item.id) === index
          ),
          review_history: reviews.filter(
            (item, index) =>
              reviews.findIndex(other => other.id === item.id) === index
          ),
        };
      });
      setReveal(false);
      if (!query.before_id && !query.review_before_id) {
        resetReview();
        setNeedsRefresh(false);
      }
    } catch (failure) {
      await failed(failure);
    } finally {
      if (!signal.aborted && mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (error || notice) feedback.current?.focus();
  }, [error, notice]);

  const startDraft = () => {
    setDraft({
      facts: { ...(data?.current_submission?.facts || blankFacts) },
      baseId: data?.current_submission?.id || "",
      files: {},
      reuse: { pan: false, gst: false },
    });
    setPending(null);
    setError("");
    setNotice("");
    setReveal(false);
  };

  const changeFact = (key: keyof BillingFacts, value: string) => {
    setDraft(
      current =>
        current && {
          ...current,
          facts: { ...current.facts, [key]: value },
          files: {
            pan:
              key === "pan_status" && value !== "provided"
                ? undefined
                : current.files.pan,
            gst:
              key === "gst_status" && value !== "registered"
                ? undefined
                : current.files.gst,
          },
          reuse: {
            pan: key.startsWith("pan_") ? false : current.reuse.pan,
            gst:
              key.startsWith("gst_") || key.startsWith("pan_")
                ? false
                : current.reuse.gst,
          },
        }
    );
    setPending(null);
  };

  const reusable = (kind: EvidenceKind) => {
    const previous = data?.current_submission;
    if (
      !draft ||
      !previous ||
      draft.baseId !== previous.id ||
      !previous.evidence.some(file => file.kind === kind)
    ) {
      return false;
    }

    const same = (key: keyof BillingFacts) =>
      draft.facts[key] === previous.facts[key];

    return kind === "pan"
      ? same("pan_status") && same("pan_number")
      : same("gst_status") && same("gst_number") && same("gst_scheme");
  };

  const send = async (command: SubmissionCommand | ReviewCommand) => {
    setBusy(true);
    setPending(command);
    setError("");
    setNotice("");
    try {
      const response =
        command.kind === "submission"
          ? await billingIdentityApi.submit(companyId, userId, command, signal)
          : await billingIdentityApi.review(companyId, userId, command, signal);
      if (signal.aborted || !mounted.current) return;

      const result = verify(response.data.billing_identity);
      setData(result);
      setPending(null);
      setNeedsRefresh(false);
      setReveal(false);
      resetReview();
      if (command.kind === "submission") setDraft(null);
      const receipt =
        command.kind === "submission"
          ? result.recorded_submission
          : result.recorded_review;

      setNotice(
        receipt?.current === false
          ? "Earlier receipt confirmed. The current billing identity and review were not changed."
          : command.kind === "submission"
          ? "Billing identity submitted for accounts review."
          : "Accounts review recorded for this version."
      );
    } catch (failure) {
      await failed(failure);
    } finally {
      if (!signal.aborted && mounted.current) setBusy(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    const facts = { ...draft.facts };
    if (facts.pan_status !== "provided") facts.pan_number = "";
    else facts.pan_reason = "";

    if (facts.gst_status !== "registered") {
      facts.gst_number = "";
      facts.gst_scheme = "";
    }

    void send({
      kind: "submission",
      expected_submission_id: draft.baseId,
      idempotency_key: window.crypto.randomUUID(),
      facts,
      reuse_pan_evidence: facts.pan_status === "provided" && draft.reuse.pan,
      reuse_gst_evidence: facts.gst_status === "registered" && draft.reuse.gst,
      pan_evidence:
        facts.pan_status === "provided" ? draft.files.pan : undefined,
      gst_evidence:
        facts.gst_status === "registered" ? draft.files.gst : undefined,
    });
  };

  const review = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCurrent || !decision) return;

    void send({
      kind: "review",
      submission_id: selected.id,
      expected_review_id: data.current_review?.id || "",
      decision,
      reason,
      manual_tax_reviewed: decision === "approved" && manual,
      missing_pan_acknowledged: decision === "approved" && missingPan,
      idempotency_key: window.crypto.randomUUID(),
    });
  };

  const download = async (kind: EvidenceKind) => {
    if (!selected) return;

    setBusy(true);
    setError("");
    try {
      const response = await billingIdentityApi.evidence(
        companyId,
        userId,
        selected.id,
        kind,
        signal
      );
      if (signal.aborted || !mounted.current) return;

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      const contentType = selected.evidence.find(
        file => file.kind === kind
      )?.content_type;
      link.href = url;
      link.download = `${kind}-evidence.${
        contentType === "image/png"
          ? "png"
          : contentType === "image/jpeg"
          ? "jpg"
          : "pdf"
      }`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      await failed(failure);
    } finally {
      if (!signal.aborted && mounted.current) setBusy(false);
    }
  };

  const approvalBlocked =
    decision === "approved" &&
    (!data?.can_approve ||
      !manual ||
      (selected?.facts.pan_status === "not_available" && !missingPan));
  const disabled = busy || loading || needsRefresh;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Consultant billing identity</h1>
        <p className="text-sm text-muted-foreground">
          {companyName}
          {data && ` · ${data.consultant_name}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Declared billing facts and human accounts review. This is not
          government verification or invoice authorization.
        </p>
        <Link
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
          to={`/settings/invoice-authorization?user_id=${userId}`}
        >
          Invoice authorization
        </Link>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={busy || loading}
          type="button"
          variant="outline"
          onClick={() => void load()}
        >
          Refresh billing identity
        </Button>
        {data?.can_submit && (
          <Button disabled={disabled} type="button" onClick={startDraft}>
            {data.current_submission
              ? "Revise billing identity"
              : "Add billing identity"}
          </Button>
        )}
      </div>
      {loading && <p role="status">Loading billing identity…</p>}
      {(error || notice) && (
        <p
          className="break-words rounded-md border border-border p-3 text-sm"
          ref={feedback}
          role={error ? "alert" : "status"}
          tabIndex={-1}
        >
          {error || notice}
        </p>
      )}
      {needsRefresh && (
        <p className="text-sm">
          The source changed. Refresh before making another change.
        </p>
      )}
      {pending && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm">
            The previous {pending.kind} attempt needs confirmation. Refresh
            checks current state; retry sends the original command and selected
            files.
          </p>
          <Button
            disabled={disabled}
            type="button"
            variant="outline"
            onClick={() => void send(pending)}
          >
            Retry previous {pending.kind}
          </Button>
        </div>
      )}
      {data && (
        <p className="font-medium" role="status">
          {labels[data.status]}
        </p>
      )}
      {draft && (
        <form
          className="space-y-5 rounded-xl border border-border bg-card p-4"
          onSubmit={submit}
        >
          <h2 className="text-lg font-semibold">
            {draft.baseId ? "Revise declared facts" : "Declare billing facts"}
          </h2>
          <p className="text-sm text-muted-foreground">
            A submitted version is retained. Correct it by submitting a new
            version.
          </p>
          <fieldset className="grid gap-4 sm:grid-cols-2" disabled={disabled}>
            <legend className="mb-3 font-medium">
              Legal name and Indian billing address
            </legend>
            {fields.map(([key, label]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  maxLength={key === "postal_code" ? 6 : 200}
                  pattern={key === "postal_code" ? "[0-9]{6}" : undefined}
                  inputMode={key === "postal_code" ? "numeric" : undefined}
                  required={key !== "address_line_2"}
                  value={draft.facts[key]}
                  onChange={event => changeFact(key, event.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="billing-country">Country</Label>
              <Input id="billing-country" readOnly value="India" />
            </div>
          </fieldset>
          <fieldset className="space-y-4" disabled={disabled}>
            <legend className="font-medium">PAN facts</legend>
            <Label htmlFor="pan_status">PAN status</Label>
            <select
              className={selectClass}
              id="pan_status"
              required
              value={draft.facts.pan_status}
              onChange={event => changeFact("pan_status", event.target.value)}
            >
              <option value="">Choose PAN status</option>
              <option value="provided">PAN provided</option>
              <option value="not_available">PAN not available</option>
            </select>
            {draft.facts.pan_status === "provided" && (
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN number</Label>
                <Input
                  id="pan_number"
                  autoComplete="off"
                  maxLength={10}
                  required
                  value={draft.facts.pan_number}
                  onChange={event =>
                    changeFact("pan_number", event.target.value)
                  }
                />
              </div>
            )}
            {draft.facts.pan_status === "not_available" && (
              <div className="space-y-2">
                <Label htmlFor="pan_reason">PAN explanation</Label>
                <Textarea
                  id="pan_reason"
                  maxLength={2000}
                  required={draft.facts.pan_status === "not_available"}
                  value={draft.facts.pan_reason}
                  onChange={event =>
                    changeFact("pan_reason", event.target.value)
                  }
                />
              </div>
            )}
          </fieldset>
          <fieldset className="space-y-4" disabled={disabled}>
            <legend className="font-medium">GST facts</legend>
            <Label htmlFor="gst_status">GST status</Label>
            <select
              className={selectClass}
              id="gst_status"
              required
              value={draft.facts.gst_status}
              onChange={event => changeFact("gst_status", event.target.value)}
            >
              <option value="">Choose GST status</option>
              <option value="registered">GST registered</option>
              <option value="not_registered">Not GST registered</option>
              <option value="needs_review">GST status needs review</option>
            </select>
            {draft.facts.gst_status === "registered" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST number</Label>
                  <Input
                    id="gst_number"
                    autoComplete="off"
                    maxLength={15}
                    required
                    value={draft.facts.gst_number}
                    onChange={event =>
                      changeFact("gst_number", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_scheme">GST scheme</Label>
                  <select
                    className={selectClass}
                    id="gst_scheme"
                    required
                    value={draft.facts.gst_scheme}
                    onChange={event =>
                      changeFact("gst_scheme", event.target.value)
                    }
                  >
                    <option value="">Choose GST scheme</option>
                    <option value="regular">Regular</option>
                    <option value="composition">Composition</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="gst_reason">GST explanation</Label>
              <Textarea
                id="gst_reason"
                maxLength={2000}
                required={
                  draft.facts.gst_status !== "registered" ||
                  draft.facts.gst_scheme === "other"
                }
                value={draft.facts.gst_reason}
                onChange={event => changeFact("gst_reason", event.target.value)}
              />
            </div>
          </fieldset>
          <fieldset className="space-y-4" disabled={disabled}>
            <legend className="font-medium">Private evidence</legend>
            <p className="text-sm text-muted-foreground">
              One PDF, JPEG or PNG per kind, up to 5 MiB each. Selected files
              stay in this draft until you leave or reload the page.
            </p>
            {(["pan", "gst"] as EvidenceKind[])
              .filter(kind =>
                kind === "pan"
                  ? draft.facts.pan_status === "provided"
                  : draft.facts.gst_status === "registered"
              )
              .map(kind => (
                <div className="space-y-2" key={kind}>
                  <Label htmlFor={`${kind}_evidence`}>
                    {kind.toUpperCase()} evidence
                  </Label>
                  <Input
                    accept="application/pdf,image/jpeg,image/png"
                    id={`${kind}_evidence`}
                    type="file"
                    ref={element => {
                      evidenceInputs.current[kind] = element;
                    }}
                    onChange={event => {
                      const file = event.target.files?.[0];
                      setDraft(
                        current =>
                          current && {
                            ...current,
                            files: { ...current.files, [kind]: file },
                            reuse: { ...current.reuse, [kind]: false },
                          }
                      );
                      setPending(null);
                    }}
                  />
                  {draft.files[kind] && (
                    <div className="space-y-2">
                      <p className="break-words text-sm">
                        Selected {kind.toUpperCase()} file:{" "}
                        {draft.files[kind].name}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (evidenceInputs.current[kind]) {
                            evidenceInputs.current[kind].value = "";
                          }

                          setDraft(
                            current =>
                              current && {
                                ...current,
                                files: { ...current.files, [kind]: undefined },
                              }
                          );
                          setPending(null);
                        }}
                      >
                        Remove {kind.toUpperCase()} file
                      </Button>
                    </div>
                  )}
                  {reusable(kind) && (
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        checked={draft.reuse[kind]}
                        type="checkbox"
                        onChange={event => {
                          const checked = event.target.checked;
                          if (evidenceInputs.current[kind]) {
                            evidenceInputs.current[kind].value = "";
                          }

                          setDraft(
                            current =>
                              current && {
                                ...current,
                                reuse: { ...current.reuse, [kind]: checked },
                                files: { ...current.files, [kind]: undefined },
                              }
                          );
                          setPending(null);
                        }}
                      />
                      Reuse {kind.toUpperCase()} evidence from version{" "}
                      {draft.baseId}
                    </label>
                  )}
                </div>
              ))}
          </fieldset>
          {draft.baseId !== (data?.current_submission?.id || "") && (
            <div className="space-y-3">
              <p role="alert">
                A newer submission exists. Revise from the current version
                before sending a new command; the original attempt can still be
                retried.
              </p>
              <p className="text-sm text-muted-foreground">
                Using the current predecessor keeps your visible edits and
                selected new files. Evidence reuse must be selected again.
              </p>
              <Button
                disabled={disabled}
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft(
                    current =>
                      current && {
                        ...current,
                        baseId: data?.current_submission?.id || "",
                        reuse: { pan: false, gst: false },
                      }
                  );
                  setPending(null);
                }}
              >
                Use current version as predecessor
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={
                disabled ||
                !data?.can_submit ||
                !!pending ||
                draft.baseId !== (data?.current_submission?.id || "")
              }
              type="submit"
            >
              Submit billing identity
            </Button>
            <Button
              disabled={busy}
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(null);
                setPending(null);
              }}
            >
              Cancel draft
            </Button>
          </div>
        </form>
      )}
      {selected && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">
            Submission {selected.id}
            {selectedCurrent ? " · Current version" : " · Earlier version"}
          </h2>
          <p className="text-sm text-muted-foreground">
            <time>{new Date(selected.created_at).toLocaleString()}</time>
            {selectedReview && ` · ${labels[selectedReview.decision]}`}
          </p>
          <dl className="grid gap-4 sm:grid-cols-2">
            {Object.entries(reveal ? selected.facts : selected.masked_facts)
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="break-words whitespace-pre-wrap">{value}</dd>
                </div>
              ))}
          </dl>
          <Button
            disabled={disabled}
            type="button"
            variant="outline"
            onClick={() => setReveal(value => !value)}
          >
            {reveal ? "Hide tax identifiers" : "Show tax identifiers"}
          </Button>
          <div className="flex flex-wrap gap-3">
            {selected.evidence.map(file => (
              <Button
                disabled={busy || loading}
                key={file.kind}
                type="button"
                variant="outline"
                onClick={() => void download(file.kind)}
              >
                Download {file.kind.toUpperCase()} evidence
              </Button>
            ))}
          </div>
          {selectedCurrent && data.can_review && (
            <form
              className="space-y-4 border-t border-border pt-4"
              onSubmit={review}
            >
              <h3 className="font-medium">
                Accounts review of submission {selected.id}
              </h3>
              <p className="text-sm text-muted-foreground">
                Review these exact declared facts and private evidence. A
                rejected or needs-information decision replaces the current
                approval for new payment work.
              </p>
              <div className="space-y-2">
                <Label htmlFor="billing-decision">Review decision</Label>
                <select
                  className={selectClass}
                  disabled={disabled}
                  id="billing-decision"
                  required
                  value={decision}
                  onChange={event => {
                    setDecision(
                      event.target.value as BillingReview["decision"]
                    );
                    setManual(false);
                    setMissingPan(false);
                    setPending(null);
                  }}
                >
                  <option value="">Choose decision</option>
                  <option disabled={!data.can_approve} value="approved">
                    Approve declared identity
                  </option>
                  <option value="needs_information">
                    Request more information
                  </option>
                  <option value="rejected">Reject declared identity</option>
                </select>
              </div>
              {!data.can_approve && (
                <p className="text-sm">
                  Approval is unavailable. Resolve GST uncertainty or check
                  current payroll access; an existing approval can still be
                  returned for review when permitted.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="billing-review-reason">
                  Accounts review reason
                </Label>
                <Textarea
                  disabled={disabled}
                  id="billing-review-reason"
                  maxLength={2000}
                  required
                  value={reason}
                  onChange={event => {
                    setReason(event.target.value);
                    setPending(null);
                  }}
                />
              </div>
              {decision === "approved" && (
                <>
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      checked={manual}
                      disabled={disabled}
                      type="checkbox"
                      onChange={event => {
                        setManual(event.target.checked);
                        setPending(null);
                      }}
                    />
                    I reviewed the tax treatment manually
                  </label>
                  {selected.facts.pan_status === "not_available" && (
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        checked={missingPan}
                        disabled={disabled}
                        type="checkbox"
                        onChange={event => {
                          setMissingPan(event.target.checked);
                          setPending(null);
                        }}
                      />
                      I reviewed the missing PAN and recorded its manual
                      treatment in the reason
                    </label>
                  )}
                </>
              )}
              <Button
                disabled={
                  disabled ||
                  !decision ||
                  !reason.trim() ||
                  approvalBlocked ||
                  !!pending
                }
                type="submit"
              >
                Record accounts review
              </Button>
            </form>
          )}
          <h3 className="font-medium">Review receipts for this version</h3>
          {!data.review_history.length && (
            <p className="text-sm">No accounts review recorded.</p>
          )}
          <ol className="space-y-3">
            {data.review_history.map(item => (
              <li className="rounded-md border border-border p-3" key={item.id}>
                <p className="font-medium">{labels[item.decision]}</p>
                <p className="break-words whitespace-pre-wrap text-sm">
                  {item.reason}
                </p>
                <time className="text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
          {data.next_review_before_id && (
            <Button
              disabled={disabled}
              type="button"
              variant="outline"
              onClick={() =>
                void load({
                  submission_id: selected.id,
                  review_before_id: data.next_review_before_id,
                })
              }
            >
              Load older reviews
            </Button>
          )}
        </section>
      )}
      {data && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Submission history</h2>
          {!data.history.length && (
            <p className="text-sm">No submitted versions.</p>
          )}
          <ol className="space-y-2">
            {data.history.map(item => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                key={item.id}
              >
                <p className="text-sm">
                  Version {item.id}
                  {item.current ? " · Current" : ""} ·{" "}
                  <time>{new Date(item.created_at).toLocaleString()}</time>
                  {item.latest_review &&
                    ` · ${labels[item.latest_review.decision]}`}
                </p>
                <Button
                  disabled={disabled}
                  type="button"
                  variant="outline"
                  onClick={() => void load({ submission_id: item.id })}
                >
                  View version {item.id}
                </Button>
              </li>
            ))}
          </ol>
          {data.next_before_id && (
            <Button
              disabled={disabled}
              type="button"
              variant="outline"
              onClick={() => void load({ before_id: data.next_before_id })}
            >
              Load older submissions
            </Button>
          )}
        </section>
      )}
    </section>
  );
}

/** Rejects links for a different workspace before fetching private billing facts. */
export default function BillingIdentityPage() {
  const { company, user, companyRole } = useUserContext();
  const search = new URLSearchParams(useLocation().search);
  const userId = search.get("user_id") ?? String(user?.id || "");
  const linkedCompany = search.get("company_id");
  if (
    !company?.id ||
    (linkedCompany !== null && linkedCompany !== String(company.id)) ||
    String(company.id) !== String(user?.current_workspace_id) ||
    search.getAll("user_id").length > 1 ||
    !/^[1-9]\d{0,18}$/.test(userId)
  ) {
    return (
      <p className="p-6 text-sm" role="alert">
        Billing identity is unavailable in this workspace.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl p-4 md:p-6">
      <BillingIdentityPanel
        companyId={String(company.id)}
        companyName={company.name}
        key={`${company.id}:${user.id}:${userId}:${companyRole}`}
        userId={userId}
      />
    </div>
  );
}
