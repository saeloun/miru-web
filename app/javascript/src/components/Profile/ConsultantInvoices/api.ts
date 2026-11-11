/* global AbortSignal */
import http from "apis/api";

export type InvoiceFacts = {
  mode: "generate" | "existing" | "";
  billed_entity: {
    name: string;
    address: string;
    country: string;
    tax_identifier: string;
    tax_reason: string;
  };
  document_kind: string;
  treatment: string;
  treatment_reason: string;
  timing: string;
  financial_year: string;
  series: string;
  number: string;
  existing_invoice_considered: boolean;
  accounts_destination_confirmed: boolean;
  tax_lines: [];
  original_date?: string;
  supplemental_billing_binding?: Record<string, string>;
};
export type Preparation = {
  id: string;
  reviewed: boolean;
  state: string;
  error_code: string | null;
  expected_revision_digest: string;
  facts: InvoiceFacts;
  original_available: boolean;
  accounts_email: string | null;
  payroll_run_id?: string;
  period?: string;
};
export type ConsultantInvoice = {
  id: string;
  employment_id: string;
  payroll_run_id: string;
  consultant_name: string;
  number: string;
  issued_on: string;
  document_on: string;
  service_from: string;
  service_to: string;
  mode: "generate" | "existing";
  status: "Paid";
  credit_under_review: boolean;
  accounts_email: string;
  original_available: boolean;
  email: {
    id: string;
    state: string;
    error_code: string | null;
    sent_at: string | null;
  } | null;
};
export type ConsultantRow = {
  employment_id: string;
  consultant_name: string;
  legal_entity_name: string;
  billing_identity: Record<string, string> | null;
  generation_supported: boolean;
  supplemental_billing_binding: Record<string, string> | null;
  amounts: Record<string, string>;
  preparation: Preparation | null;
  invoice: ConsultantInvoice | null;
  can_configure: boolean;
  can_review: boolean;
};
export type RunInvoices = {
  company_id: string;
  run_id: string;
  revision_digest: string | null;
  issue_date: string;
  financial_year: string;
  accounts_email: string;
  consultants: ConsultantRow[];
};
export type OwnRun = {
  id: string;
  employment_id: string;
  period: string;
  revision_digest: string;
  legal_entity_name: string;
  financial_year: string;
  preparation: Preparation | null;
};
export type OwnInvoices = {
  invoices: ConsultantInvoice[];
  preparations: Preparation[];
  available_runs: OwnRun[];
  accounts_email: string;
  page: number;
  has_more: boolean;
};
export type PreparationCommand = {
  employment_id: string;
  facts: InvoiceFacts;
  expected_revision_digest: string;
  expected_preparation_id: string;
  idempotency_key: string;
  original_pdf?: File;
};
const options = (signal: AbortSignal) => ({
  signal,
  skipErrorToast: true,
  skipSuccessToast: true,
  headers: { "Cache-Control": "no-store" },
});
const runPath = (runId: string) => `/payroll_runs/${runId}/consultant_invoices`;

function preparationBody(
  companyId: string,
  command: PreparationCommand,
  extra: Record<string, string | boolean>
) {
  const body = new FormData();
  body.append("company_id", companyId);
  body.append("invoice_preparation[facts]", JSON.stringify(command.facts));
  Object.entries({
    employment_id: command.employment_id,
    expected_revision_digest: command.expected_revision_digest,
    expected_preparation_id: command.expected_preparation_id,
    idempotency_key: command.idempotency_key,
    ...extra,
  }).forEach(([key, value]) =>
    body.append(`invoice_preparation[${key}]`, String(value))
  );
  if (command.original_pdf) {
    body.append("invoice_preparation[original_pdf]", command.original_pdf);
  }

  return body;
}

export const consultantInvoicesApi = {
  runs: (companyId: string, page: number, signal: AbortSignal) =>
    http.get<{
      runs: {
        id: string;
        period: string;
        can_configure: boolean;
        can_review_others: boolean;
      }[];
      page: number;
      has_more: boolean;
    }>("/payroll_consultant_invoice_runs", {
      ...options(signal),
      params: { company_id: companyId, page },
    }),
  run: (companyId: string, runId: string, signal: AbortSignal) =>
    http.get<{ consultant_invoices: RunInvoices }>(runPath(runId), {
      ...options(signal),
      params: { company_id: companyId },
    }),
  own: (companyId: string, page: number, signal: AbortSignal) =>
    http.get<OwnInvoices>("/consultant_invoices", {
      ...options(signal),
      params: { company_id: companyId, page },
    }),
  prepare: (
    companyId: string,
    runId: string,
    command: PreparationCommand,
    reviewed: boolean,
    signal: AbortSignal
  ) =>
    http.post(
      `${runPath(runId)}/preparations`,
      preparationBody(companyId, command, { reviewed }),
      options(signal)
    ),
  submit: (
    companyId: string,
    runId: string,
    command: PreparationCommand,
    signal: AbortSignal
  ) =>
    http.post(
      "/consultant_invoices",
      preparationBody(companyId, command, { payroll_run_id: runId }),
      options(signal)
    ),
  retryGeneration: (
    companyId: string,
    runId: string,
    employmentId: string,
    preparationId: string,
    signal: AbortSignal
  ) =>
    http.post(
      `${runPath(runId)}/retry_generation`,
      {
        company_id: companyId,
        invoice_retry: {
          employment_id: employmentId,
          expected_preparation_id: preparationId,
        },
      },
      options(signal)
    ),
  delivery: (
    companyId: string,
    runId: string,
    invoiceId: string,
    action: "retry_delivery" | "reconcile_delivery",
    input: Record<string, unknown>,
    signal: AbortSignal
  ) =>
    http.post(
      `${runPath(runId)}/${invoiceId}/${action}`,
      { company_id: companyId, invoice_delivery: input },
      options(signal)
    ),
  pdf: (
    companyId: string,
    invoice: ConsultantInvoice,
    kind: "paid" | "original",
    signal: AbortSignal,
    runId?: string
  ) =>
    http.get<Blob>(
      `${runId ? runPath(runId) : "/consultant_invoices"}/${
        invoice.id
      }/download`,
      {
        ...options(signal),
        params: { company_id: companyId, kind },
        responseType: "blob",
      }
    ),
  original: (
    companyId: string,
    preparationId: string,
    signal: AbortSignal,
    runId?: string
  ) =>
    http.get<Blob>(
      `${
        runId ? runPath(runId) : "/consultant_invoices"
      }/preparations/${preparationId}/original`,
      {
        ...options(signal),
        params: { company_id: companyId },
        responseType: "blob",
      }
    ),
};

export function saveInvoicePdf(bytes: Blob, filename: string) {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
