/* global AbortController, HTMLFormElement, crypto */
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useUserContext } from "context/UserContext";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { saveInvoicePdf } from "components/Profile/ConsultantInvoices/api";
import { label } from "../paymentLabels";
import {
  documentKinds,
  remittanceApi,
  type DocumentKind,
  type RemittancePayment,
  type RemittancePage,
} from "./api";

type Target = { paymentId?: string; invoiceId?: string };
const errorMessage = (error: unknown) =>
  axios.isAxiosError(error) && typeof error.response?.data?.errors === "string"
    ? error.response.data.errors
    : "Remittance evidence is unavailable. Refresh and check workspace access.";

export default function RemittanceDocuments(props: Target) {
  const { company, user } = useUserContext();
  const companyId = String(company?.id || "");
  if (!companyId || companyId !== String(user?.current_workspace_id)) {
    return null;
  }

  return (
    <ScopedDocuments
      key={`${companyId}:${user?.id}:${user?.current_workspace_id}:${
        props.paymentId || ""
      }:${props.invoiceId || ""}`}
      {...props}
      companyId={companyId}
    />
  );
}

function ScopedDocuments({
  companyId,
  paymentId,
  invoiceId,
}: Target & { companyId: string }) {
  const [data, setData] = useState<RemittancePage>();
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController>();
  useLayoutEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const active = new AbortController();
    controller.current = active;
    setLoading(true);
    setError("");
    const filters: Record<string, string> = { page: String(page) };
    if (paymentId) filters.payment_instruction_id = paymentId;

    if (invoiceId) filters.invoice_id = invoiceId;
    remittanceApi
      .list(companyId, filters, active.signal)
      .then(response => {
        if (!active.signal.aborted) setData(response.data);
      })
      .catch(failure => {
        if (!active.signal.aborted && !axios.isCancel(failure)) {
          if (
            axios.isAxiosError(failure) &&
            [401, 403, 404, 409].includes(failure.response?.status || 0)
          ) {
            setData(undefined);
          }
          setError(errorMessage(failure));
        }
      })
      .finally(() => {
        if (!active.signal.aborted) setLoading(false);
      });

    return () => active.abort();
  }, [companyId, paymentId, invoiceId, page, refresh]);
  const currentData = data?.page === page ? data : undefined;
  if (invoiceId && currentData?.payments.length === 0) return null;

  return (
    <section
      className="min-w-0 space-y-3 rounded-lg border p-3"
      aria-label="Bank remittance documents"
    >
      <h3 className="font-semibold">Bank remittance documents</h3>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => setRefresh(value => value + 1)}
      >
        Refresh remittance history
      </Button>
      <p className="text-sm text-muted-foreground">
        Upload bank-issued FIRC, FIRA or inward-remittance advice. Uploads are
        declared evidence, not verification of authenticity. A Mercury receipt
        is not a FIRC. Document receipt does not change payment credit.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading && !error && (
        <p role="status">Loading private remittance history…</p>
      )}
      {currentData?.payments.length === 0 && (
        <p className="text-sm">No submitted Mercury transfers are available.</p>
      )}
      {currentData?.payments.map(payment => (
        <PaymentDocuments
          key={payment.id}
          companyId={companyId}
          payment={payment}
          refresh={() => setRefresh(value => value + 1)}
        />
      ))}
      {currentData && (page > 1 || currentData.has_more) && (
        <nav aria-label="Remittance history pages" className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !currentData.has_more}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </section>
  );
}

function PaymentDocuments({
  companyId,
  payment,
  refresh,
}: {
  companyId: string;
  payment: RemittancePayment;
  refresh: () => void;
}) {
  const formId = useId();
  const [kind, setKind] = useState<DocumentKind>("firc");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(new AbortController());
  const command = useRef<{ signature: string; key: string }>();
  useLayoutEffect(() => () => active.current.abort(), []);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || busy) return;
    const form = event.currentTarget;
    const head = payment.documents.find(document => document.kind === kind);
    const signature = JSON.stringify([
      kind,
      reason,
      head?.id || "",
      file.name,
      file.size,
      file.lastModified,
    ]);
    if (command.current?.signature !== signature) {
      command.current = { signature, key: crypto.randomUUID() };
    }
    const body = new FormData();
    body.append("company_id", companyId);
    body.append("payment_instruction_id", payment.id);
    Object.entries({
      kind,
      reason,
      expected_document_id: head?.id || "",
      idempotency_key: command.current.key,
    }).forEach(([name, value]) =>
      body.append(`remittance_document[${name}]`, value)
    );
    body.append("remittance_document[file]", file);
    setBusy(true);
    setError("");
    try {
      await remittanceApi.upload(body, active.current.signal);
      if (!active.current.signal.aborted) {
        form.reset();
        setFile(undefined);
        setReason("");
        command.current = undefined;
        refresh();
      }
    } catch (failure) {
      if (!active.current.signal.aborted && !axios.isCancel(failure)) {
        setError(errorMessage(failure));
      }
    } finally {
      if (!active.current.signal.aborted) setBusy(false);
    }
  };

  const download = async (document: RemittancePayment["documents"][number]) => {
    try {
      const response = await remittanceApi.download(
        companyId,
        payment.id,
        document.id,
        active.current.signal
      );

      const suffix =
        { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg" }[
          document.content_type
        ] || "bin";
      if (!active.current.signal.aborted) {
        saveInvoicePdf(
          response.data,
          `${document.kind}-${document.id}.${suffix}`,
          document.content_type
        );
      }
    } catch (failure) {
      if (!active.current.signal.aborted && !axios.isCancel(failure)) {
        setError(errorMessage(failure));
      }
    }
  };

  return (
    <article
      className="min-w-0 space-y-3 border-t pt-3"
      aria-label={`${payment.beneficiary} remittance ${payment.id}`}
    >
      <h4 className="font-medium">
        {payment.period} ·{" "}
        {payment.beneficiary === "spouse" ? "Spouse" : "Consultant"} transfer
      </h4>
      <p className="text-sm">Payment: {label(payment.payment_state)}</p>
      <p className="text-sm">
        {payment.status === "received"
          ? "Bank document received."
          : payment.follow_up_required
          ? "Missing bank document — follow up with the receiving bank."
          : "No bank document uploaded yet."}{" "}
        {payment.invoice_id
          ? `Linked paid invoice #${payment.invoice_id}.`
          : "Invoice not issued yet; evidence remains linked to this transfer."}
      </p>
      {payment.documents.map(document => (
        <div key={document.id} className="space-y-1 text-sm">
          <p>
            {documentKinds[document.kind]} ·{" "}
            {new Date(document.uploaded_at).toLocaleString()} ·{" "}
            {document.uploader}
          </p>
          <p className="break-words">
            {document.reason}
            {document.previous_document_id
              ? " · Correction; earlier evidence retained."
              : ""}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void download(document)}
          >
            Download {documentKinds[document.kind]} #{document.id}
          </Button>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {payment.can_upload && (
        <form onSubmit={event => void submit(event)} className="space-y-3">
          <div>
            <Label htmlFor={`${formId}-kind`}>Bank document type</Label>
            <select
              id={`${formId}-kind`}
              value={kind}
              disabled={busy}
              onChange={event => setKind(event.target.value as DocumentKind)}
              className="w-full rounded-md border bg-background p-2 text-sm"
            >
              {Object.entries(documentKinds).map(([value, title]) => (
                <option key={value} value={value}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor={`${formId}-file`}>
              Bank-issued file (PDF, JPEG or PNG; up to 5 MiB)
            </Label>
            <Input
              id={`${formId}-file`}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              required
              disabled={busy}
              onChange={event => setFile(event.target.files?.[0])}
            />
          </div>
          <div>
            <Label htmlFor={`${formId}-reason`}>
              Document note / correction reason
            </Label>
            <Input
              id={`${formId}-reason`}
              value={reason}
              disabled={busy}
              maxLength={1000}
              required
              onChange={event => setReason(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A new upload of the same type retains and supersedes its previous
            file. Only upload evidence for this transfer; omit unrelated
            personal information.
          </p>
          <Button type="submit" disabled={busy || !file || !reason.trim()}>
            {busy ? "Saving evidence…" : "Save bank document"}
          </Button>
        </form>
      )}
    </article>
  );
}
