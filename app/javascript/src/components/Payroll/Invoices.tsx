/* global AbortController, AbortSignal, HTMLFormElement, crypto */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";
import { useUserContext } from "context/UserContext";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { exactAmount } from "./amount";
import {
  consultantInvoicesApi,
  saveInvoicePdf,
  type ConsultantInvoice,
  type InvoiceFacts,
  type Preparation,
  type RunInvoices,
} from "components/Profile/ConsultantInvoices/api";

export const invoiceError = (error: unknown): string =>
  axios.isAxiosError(error) && typeof error.response?.data?.errors === "string"
    ? error.response.data.errors
    : "The invoice could not be updated. Refresh its status and try again.";
const stateLabels: Record<string, string> = {
  waiting_credit: "Waiting for full credit",
  blocked: "Review required",
  queued: "Queued",
  generating: "Preparing PDF",
  failed: "Failed",
  completed: "Document available",
  sending: "Sending",
  sent: "Sent",
  uncertain: "Delivery outcome unknown",
};

const reasons: Record<string, string> = {
  unsupported_generated_document:
    "This GST billing status needs an existing invoice and manual document review. Miru cannot generate its required document.",
  consent_required:
    "The consultant must authorize future invoice generation in their profile.",
  consent_changed:
    "Authorization changed during preparation. Check the current grant before retrying.",
  waiting_credit:
    "All required transfers and any credit review must be completed first.",
  reviewer_unavailable:
    "A current authorized reviewer must review a fresh preparation.",
  numbering_review_required:
    "Review the invoice financial year and number for the current India issue date.",
  number_conflict:
    "This issuer number is already used. Review the original invoice or choose the correct new number.",
  accounts_destination_review_required:
    "Review and confirm the fixed accounts destination.",
  render_unavailable:
    "PDF preparation failed. Credit remains recorded; retry after the renderer or storage issue is resolved.",
  preparation_changed:
    "A newer preparation was recorded. Refresh before continuing.",
  frozen_source_unavailable:
    "The approved identity or source could not be verified. Accounts must review it.",
  payroll_disabled:
    "Invoice generation is disabled in this workspace. Issued documents remain in private history.",
  transport_unknown:
    "Check the accounts mailbox and mail provider before resolving this attempt.",
  interrupted:
    "Confirm the stopped worker and delivery outcome before any retry.",
};
export const invoiceReason = (code: string | null) =>
  code
    ? reasons[code] ||
      "Accounts must review the recorded issue before continuing."
    : "";

type FormProps = {
  companyId: string;
  runId: string;
  employmentId: string;
  revisionDigest: string;
  entityName: string;
  financialYear: string;
  accountsEmail: string;
  preparation: Preparation | null;
  canReview?: boolean;
  canConfigure?: boolean;
  generationSupported?: boolean;
  own?: boolean;
  issueDate?: string;
  supplementalBinding?: Record<string, string> | null;
  onSaved: () => void;
};

export function InvoiceForm(props: FormProps) {
  const existing = props.preparation?.facts;
  const [mode, setMode] = useState<InvoiceFacts["mode"]>(
    props.own
      ? "existing"
      : existing?.mode === "generate" && !props.generationSupported
      ? ""
      : existing?.mode || ""
  );

  const [entity, setEntity] = useState({
    ...(existing?.billed_entity || {
      name: props.entityName,
      address: "",
      country: "",
      tax_identifier: "",
      tax_reason: "",
    }),
    name: props.entityName,
  });
  const [series, setSeries] = useState(existing?.series || "");
  const [number, setNumber] = useState(existing?.number || "");
  const [year, setYear] = useState(
    existing?.financial_year || props.financialYear
  );
  const [date, setDate] = useState(existing?.original_date || "");
  const [reason, setReason] = useState(existing?.treatment_reason || "");
  const [considered, setConsidered] = useState(false);
  const [destination, setDestination] = useState(false);
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const pending = useRef<{ signature: string; key: string } | undefined>(
    undefined
  );
  const controller = useRef(new AbortController());
  useLayoutEffect(() => {
    const active = new AbortController();
    controller.current = active;

    return () => active.abort();
  }, []);

  const save = async (reviewed: boolean) => {
    if (!form.current?.reportValidity() || busy) return;

    if (mode === "generate" && !props.generationSupported) {
      return setError(reasons.unsupported_generated_document);
    }

    if (reviewed && !destination) {
      return setError("Confirm the fixed accounts destination before review.");
    }

    if (
      mode === "existing" &&
      !file &&
      !props.preparation?.original_available
    ) {
      return setError("Attach the existing original PDF before continuing.");
    }

    const facts: InvoiceFacts = {
      mode,
      billed_entity: { ...entity, name: props.entityName },
      financial_year: year,
      series: mode === "existing" ? "" : series,
      number,
      document_kind: "consultant_invoice",
      treatment: "manual_reviewed",
      treatment_reason: reason,
      timing:
        mode === "generate" ? "post_credit_supported" : "existing_invoice",
      existing_invoice_considered: considered,
      accounts_destination_confirmed: props.own ? false : destination,
      tax_lines: [],
    };
    if (mode === "existing") facts.original_date = date;

    if (reviewed && props.supplementalBinding) {
      facts.supplemental_billing_binding = props.supplementalBinding;
    }

    const signature = JSON.stringify([
      facts,
      reviewed,
      props.preparation?.id,
      props.revisionDigest,
      file?.name,
      file?.size,
      file?.lastModified,
    ]);
    if (pending.current?.signature !== signature) {
      pending.current = { signature, key: crypto.randomUUID() };
    }

    const command = {
      employment_id: props.employmentId,
      facts,
      expected_revision_digest: props.revisionDigest,
      expected_preparation_id: props.preparation?.id || "",
      idempotency_key: pending.current.key,
      original_pdf: file,
    };
    setBusy(true);
    setError("");
    try {
      if (props.own) {
        await consultantInvoicesApi.submit(
          props.companyId,
          props.runId,
          command,
          controller.current.signal
        );
      } else {
        await consultantInvoicesApi.prepare(
          props.companyId,
          props.runId,
          command,
          reviewed,
          controller.current.signal
        );
      }

      if (!controller.current.signal.aborted) props.onSaved();
    } catch (failure) {
      if (!axios.isCancel(failure) && !controller.current.signal.aborted) {
        setError(invoiceError(failure));
      }
    } finally {
      if (!controller.current.signal.aborted) setBusy(false);
    }
  };

  return (
    <form
      ref={form}
      className="space-y-4 rounded-lg border border-border p-4"
      onSubmit={event => {
        event.preventDefault();
        void save(false);
      }}
    >
      <h4 className="font-semibold">
        {props.own
          ? "Submit an existing original for accounts review"
          : "Invoice preparation"}
      </h4>
      {!props.own && (
        <div>
          <Label htmlFor={`mode-${props.employmentId}`}>Invoice choice</Label>
          <select
            id={`mode-${props.employmentId}`}
            className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
            required
            value={mode}
            disabled={busy}
            onChange={event =>
              setMode(event.target.value as InvoiceFacts["mode"])
            }
          >
            <option value="">Choose after checking existing invoices</option>
            <option value="generate" disabled={!props.generationSupported}>
              Generate in Miru
            </option>
            <option value="existing">Link an existing invoice</option>
          </select>
          {!props.generationSupported && (
            <p className="mt-2 text-sm text-muted-foreground">
              Generation is available only for reviewed billing facts declared
              not GST registered. Registered or unresolved GST status requires
              an existing invoice and manual document review. This is a document
              support limit, not a tax exemption determination.
            </p>
          )}
        </div>
      )}
      {mode && (
        <>
          <p className="text-sm text-muted-foreground">
            {mode === "generate"
              ? "This creates a reviewed consultancy invoice without calculating statutory taxes. Link an existing invoice when tax documents or earlier invoice timing are required."
              : "The original PDF, invoice number and date are preserved. After full credit, a separate paid settlement statement is created."}
          </p>
          <div>
            <Label>Contracting entity from approved terms</Label>
            <p className="break-words rounded-md border bg-muted p-2 text-sm">
              {props.entityName}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor={`entity-address-${props.employmentId}`}>
                Billed entity postal address
              </Label>
              <Textarea
                id={`entity-address-${props.employmentId}`}
                required
                maxLength={1000}
                value={entity.address}
                onChange={event =>
                  setEntity({
                    ...entity,
                    name: props.entityName,
                    address: event.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor={`entity-country-${props.employmentId}`}>
                Billed entity country code
              </Label>
              <Input
                id={`entity-country-${props.employmentId}`}
                required
                maxLength={2}
                placeholder="Country code"
                value={entity.country}
                onChange={event =>
                  setEntity({
                    ...entity,
                    country: event.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor={`entity-tax-${props.employmentId}`}>
                Billed entity tax identifier, if applicable
              </Label>
              <Input
                id={`entity-tax-${props.employmentId}`}
                maxLength={1000}
                value={entity.tax_identifier}
                onChange={event =>
                  setEntity({ ...entity, tax_identifier: event.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`entity-tax-reason-${props.employmentId}`}>
                Tax identifier review / not-applicable reason
              </Label>
              <Input
                id={`entity-tax-reason-${props.employmentId}`}
                required={!entity.tax_identifier}
                maxLength={1000}
                value={entity.tax_reason}
                onChange={event =>
                  setEntity({ ...entity, tax_reason: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`year-${props.employmentId}`}>
                Issuer financial year
              </Label>
              <Input
                id={`year-${props.employmentId}`}
                required
                pattern="[0-9]{4}-[0-9]{4}"
                value={year}
                onChange={event => setYear(event.target.value)}
              />
            </div>
            {mode === "generate" && (
              <div>
                <Label htmlFor={`series-${props.employmentId}`}>
                  Reviewed issuer series
                </Label>
                <Input
                  id={`series-${props.employmentId}`}
                  required
                  maxLength={32}
                  value={series}
                  onChange={event => setSeries(event.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor={`number-${props.employmentId}`}>
                {mode === "existing"
                  ? "Original invoice number, exactly as shown"
                  : "Reviewed invoice number within series"}
              </Label>
              <Input
                id={`number-${props.employmentId}`}
                required
                maxLength={64}
                value={number}
                onChange={event => setNumber(event.target.value)}
              />
            </div>
            {mode === "existing" ? (
              <div>
                <Label htmlFor={`original-date-${props.employmentId}`}>
                  Original invoice date
                </Label>
                <Input
                  id={`original-date-${props.employmentId}`}
                  type="date"
                  required
                  value={date}
                  onChange={event => setDate(event.target.value)}
                />
              </div>
            ) : (
              <p className="self-center text-sm text-muted-foreground">
                Issue date is set when generated in Asia/Kolkata. Current issuer
                date: {props.issueDate}.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor={`treatment-${props.employmentId}`}>
              {props.own
                ? "Original invoice treatment / reconciliation notes"
                : "Reviewed document treatment and timing reason"}
            </Label>
            <Textarea
              id={`treatment-${props.employmentId}`}
              required
              maxLength={1000}
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          </div>
          {props.supplementalBinding && (
            <p className="text-sm">
              This older approved run needs a supplemental billing identity
              review. Its original payroll approval remains unchanged.
            </p>
          )}
          {mode === "existing" && (
            <div>
              <Label htmlFor={`original-${props.employmentId}`}>
                Existing original PDF (up to 5 MiB)
              </Label>
              <Input
                id={`original-${props.employmentId}`}
                type="file"
                accept="application/pdf"
                disabled={busy}
                onChange={event => setFile(event.target.files?.[0])}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {file?.name ||
                  (props.preparation?.original_available
                    ? "The submitted original is retained unless you select another file."
                    : "Select the original invoice PDF.")}
              </p>
            </div>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={considered}
              onChange={event => setConsidered(event.target.checked)}
            />
            <span>
              I checked whether an invoice already exists and selected the
              correct document choice.
            </span>
          </label>
          <p className="break-words text-sm">
            Accounts destination: <strong>{props.accountsEmail}</strong>
          </p>
          {!props.own && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={destination}
                onChange={event => setDestination(event.target.checked)}
              />
              <span>
                I reviewed and confirm this fixed accounts destination for this
                invoice.
              </span>
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {(props.own || props.canConfigure) && (
              <Button type="submit" variant="outline" disabled={busy}>
                {busy
                  ? "Saving…"
                  : props.own
                  ? "Submit original for review"
                  : "Save unreviewed preparation"}
              </Button>
            )}
            {!props.own && props.canReview && (
              <Button
                type="button"
                disabled={busy || !destination}
                onClick={() => void save(true)}
              >
                Review preparation
              </Button>
            )}
          </div>
        </>
      )}
    </form>
  );
}

export function InvoiceCard({
  invoice,
  download,
  children,
}: {
  invoice: ConsultantInvoice;
  download: (kind: "paid" | "original") => void;
  children?: React.ReactNode;
}) {
  return (
    <article className="min-w-0 space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="break-words font-semibold">{invoice.number}</h3>
        <span className="rounded bg-emerald-50 px-2 py-1 text-sm text-emerald-800">
          Paid
        </span>
      </div>
      <p className="text-sm">
        {invoice.consultant_name} · {invoice.service_from} to{" "}
        {invoice.service_to}
      </p>
      <p className="text-sm">
        {invoice.mode === "existing" ? "Original invoice date" : "Invoice date"}
        : {invoice.issued_on}
        {invoice.mode === "existing" &&
          ` · Statement generated: ${invoice.document_on}`}
      </p>
      {invoice.credit_under_review && (
        <p
          role="status"
          className="rounded bg-amber-50 p-2 text-sm text-amber-900"
        >
          Credit is under review. The original paid document remains unchanged.
        </p>
      )}
      <p className="break-words text-sm">
        Accounts email:{" "}
        {invoice.email
          ? stateLabels[invoice.email.state] || "Review required"
          : "Not queued"}{" "}
        · {invoice.accounts_email}
      </p>
      {invoice.email?.error_code && (
        <p className="text-sm text-muted-foreground">
          {invoiceReason(invoice.email.error_code)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => download("paid")}
        >
          {invoice.mode === "existing"
            ? "Download paid statement"
            : "Download paid invoice"}
        </Button>
        {invoice.original_available && (
          <Button
            type="button"
            variant="outline"
            onClick={() => download("original")}
          >
            Download original invoice
          </Button>
        )}
      </div>
      {children}
    </article>
  );
}

function DeliveryReconciliation({
  invoice,
  busy,
  reconcile,
}: {
  invoice: ConsultantInvoice;
  busy: boolean;
  reconcile: (
    outcome: "delivered" | "not_delivered",
    evidence: { reference: string; worker_stopped: boolean }
  ) => Promise<void>;
}) {
  const [reference, setReference] = useState("");
  const [stopped, setStopped] = useState(false);

  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-sm">
        Confirm the mailbox/provider outcome and that the old worker has stopped
        before another send.
      </p>
      <Label htmlFor={`delivery-ref-${invoice.id}`}>
        Delivery reconciliation evidence
      </Label>
      <Input
        id={`delivery-ref-${invoice.id}`}
        value={reference}
        maxLength={200}
        onChange={event => setReference(event.target.value)}
      />
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={stopped}
          onChange={event => setStopped(event.target.checked)}
        />
        <span>
          The previous worker is stopped and its delivery outcome has been
          checked.
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {(["delivered", "not_delivered"] as const).map(outcome => (
          <Button
            type="button"
            key={outcome}
            variant="outline"
            disabled={busy || !stopped || !reference.trim()}
            onClick={() =>
              void reconcile(outcome, { reference, worker_stopped: stopped })
            }
          >
            {outcome === "delivered"
              ? "Record confirmed delivery"
              : "Record confirmed non-delivery"}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function PayrollInvoices(props: {
  companyId: string;
  runId: string;
}) {
  const { user } = useUserContext();
  if (props.companyId !== String(user?.current_workspace_id)) {
    return (
      <p role="alert">Consultant invoices are unavailable in this workspace.</p>
    );
  }

  return (
    <ScopedPayrollInvoices
      key={`${props.companyId}:${props.runId}:${user?.id || ""}`}
      {...props}
    />
  );
}

function ScopedPayrollInvoices({
  companyId,
  runId,
}: {
  companyId: string;
  runId: string;
}) {
  const [data, setData] = useState<RunInvoices>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const scope = `${companyId}:${runId}`;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const abort = useRef<AbortController | undefined>(undefined);
  useLayoutEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    setError("");
    setNotice("");
    setData(undefined);
    consultantInvoicesApi
      .run(companyId, runId, controller.signal)
      .then(response => {
        if (!controller.signal.aborted && scopeRef.current === scope) {
          setData(response.data.consultant_invoices);
        }
      })
      .catch(failure => {
        if (!axios.isCancel(failure) && !controller.signal.aborted) {
          const message = invoiceError(failure);
          if (
            axios.isAxiosError(failure) &&
            failure.response?.status === 403 &&
            message === "Invoice preparation waits for payroll approval"
          ) {
            setNotice(message);
          } else {
            setError(message);
          }
        }
      });

    return () => controller.abort();
  }, [scope, companyId, runId, refresh]);

  const act = async (operation: (signal: AbortSignal) => Promise<unknown>) => {
    if (busy || !abort.current) return;
    const controller = abort.current;
    setBusy(true);
    setError("");
    try {
      await operation(controller.signal);
      if (!controller.signal.aborted && scopeRef.current === scope) {
        setRefresh(value => value + 1);
      }
    } catch (failure) {
      if (!axios.isCancel(failure) && !controller.signal.aborted) {
        setError(invoiceError(failure));
      }
    } finally {
      if (scopeRef.current === scope) setBusy(false);
    }
  };

  const download = async (
    invoice: ConsultantInvoice,
    kind: "paid" | "original"
  ) => {
    if (!abort.current) return;
    const controller = abort.current;
    try {
      const response = await consultantInvoicesApi.pdf(
        companyId,
        invoice,
        kind,
        controller.signal,
        runId
      );
      if (!controller.signal.aborted && scopeRef.current === scope) {
        saveInvoicePdf(
          response.data,
          `consultant-invoice-${invoice.id}-${kind}.pdf`
        );
      }
    } catch (failure) {
      if (!axios.isCancel(failure) && !controller.signal.aborted) {
        setError(invoiceError(failure));
      }
    }
  };

  return (
    <section
      className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4"
      aria-label="Consultant invoices"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Consultant invoices</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRefresh(value => value + 1)}
          disabled={busy}
        >
          Refresh invoice status
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Reviewed documents are created after full confirmed credit. Bank payment
        and document email outcomes remain separate.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {!data && !error && !notice && (
        <p role="status">Loading invoice preparation…</p>
      )}
      {data?.consultants.length === 0 && (
        <p className="text-sm">
          No approved consultant lines are available for invoice preparation.
        </p>
      )}
      {data?.consultants.map(row => (
        <article
          key={row.employment_id}
          className="min-w-0 space-y-4 rounded-lg border p-4"
        >
          <h3 className="break-words font-semibold">{row.consultant_name}</h3>
          {row.invoice ? (
            <InvoiceCard
              invoice={row.invoice}
              download={kind => void download(row.invoice!, kind)}
            >
              {row.can_review && row.invoice.email?.state === "failed" && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void act(signal =>
                      consultantInvoicesApi.delivery(
                        companyId,
                        runId,
                        row.invoice!.id,
                        "retry_delivery",
                        { expected_attempt_id: row.invoice!.email!.id },
                        signal
                      )
                    )
                  }
                >
                  Retry same PDF email
                </Button>
              )}
              {row.can_review && row.invoice.email?.state === "uncertain" && (
                <DeliveryReconciliation
                  key={`${row.invoice.id}:${row.invoice.email.id}`}
                  invoice={row.invoice}
                  busy={busy}
                  reconcile={(outcome, evidence) =>
                    act(signal =>
                      consultantInvoicesApi.delivery(
                        companyId,
                        runId,
                        row.invoice!.id,
                        "reconcile_delivery",
                        {
                          expected_attempt_id: row.invoice!.email!.id,
                          outcome,
                          evidence,
                        },
                        signal
                      )
                    )
                  }
                />
              )}
            </InvoiceCard>
          ) : (
            <>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["Consultancy fee", row.amounts.base_minor],
                  ["Reimbursements", row.amounts.reimbursements_minor],
                  ["Approved additions", row.amounts.extras_minor],
                  ["Deductions / withholding", row.amounts.deductions_minor],
                  ["Net INR entitlement", row.amounts.net_minor],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>{exactAmount(value, "INR")}</dd>
                  </div>
                ))}
              </dl>
              {row.billing_identity && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    Approved consultant billing identity
                  </summary>
                  <p className="mt-2 break-words text-sm">
                    {row.billing_identity.legal_name} ·{" "}
                    {[
                      row.billing_identity.address_line_1,
                      row.billing_identity.city,
                      row.billing_identity.state,
                      row.billing_identity.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-sm">
                    PAN:{" "}
                    {row.billing_identity.pan_number ||
                      row.billing_identity.pan_reason}{" "}
                    · GST:{" "}
                    {row.billing_identity.gst_number ||
                      row.billing_identity.gst_reason}
                  </p>
                </details>
              )}
              {row.preparation && (
                <p role="status" className="text-sm">
                  {row.preparation.reviewed
                    ? `Accounts reviewed · ${
                        stateLabels[row.preparation.state] || "Review required"
                      }`
                    : "Unreviewed preparation"}
                  . {invoiceReason(row.preparation.error_code)}
                </p>
              )}
              {row.preparation?.original_available && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const controller = abort.current;
                    if (controller) {
                      void consultantInvoicesApi
                        .original(
                          companyId,
                          row.preparation!.id,
                          controller.signal,
                          runId
                        )
                        .then(response => {
                          if (
                            !controller.signal.aborted &&
                            scopeRef.current === scope
                          ) {
                            saveInvoicePdf(
                              response.data,
                              "consultant-original.pdf"
                            );
                          }
                        })
                        .catch(failure => {
                          if (
                            !axios.isCancel(failure) &&
                            !controller.signal.aborted
                          ) {
                            setError(invoiceError(failure));
                          }
                        });
                    }
                  }}
                >
                  Review submitted original PDF
                </Button>
              )}
              {(row.can_configure || row.can_review) &&
                data.revision_digest && (
                  <InvoiceForm
                    key={`${scope}:${row.employment_id}:${
                      row.preparation?.id || ""
                    }:${data.revision_digest}:${row.generation_supported}`}
                    companyId={companyId}
                    runId={runId}
                    employmentId={row.employment_id}
                    revisionDigest={data.revision_digest}
                    entityName={row.legal_entity_name}
                    financialYear={data.financial_year}
                    accountsEmail={data.accounts_email}
                    issueDate={data.issue_date}
                    preparation={row.preparation}
                    canReview={row.can_review}
                    canConfigure={row.can_configure}
                    generationSupported={row.generation_supported}
                    supplementalBinding={row.supplemental_billing_binding}
                    onSaved={() => setRefresh(value => value + 1)}
                  />
                )}
              {row.can_review &&
                row.preparation &&
                ["failed", "blocked"].includes(row.preparation.state) && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void act(signal =>
                        consultantInvoicesApi.retryGeneration(
                          companyId,
                          runId,
                          row.employment_id,
                          row.preparation!.id,
                          signal
                        )
                      )
                    }
                  >
                    Retry reviewed generation
                  </Button>
                )}
            </>
          )}
        </article>
      ))}
    </section>
  );
}
