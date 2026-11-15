/* global AbortSignal */
import http from "apis/api";

export const documentKinds = {
  firc: "FIRC",
  fira: "FIRA",
  inward_remittance_advice: "Inward-remittance advice",
};
export type DocumentKind = keyof typeof documentKinds;
export type RemittanceDocument = {
  id: string;
  kind: DocumentKind;
  previous_document_id: string | null;
  reason: string;
  uploaded_at: string;
  uploader: string;
  byte_size: number;
  content_type: string;
};
export type RemittancePayment = {
  id: string;
  period: string;
  beneficiary: string;
  credit_state: string;
  payment_state: string;
  status: "missing" | "received";
  follow_up_required: boolean;
  can_upload: boolean;
  invoice_id: string | null;
  documents: RemittanceDocument[];
};
export type RemittancePage = {
  payments: RemittancePayment[];
  page: number;
  has_more: boolean;
};
const options = (signal: AbortSignal) => ({
  signal,
  skipErrorToast: true,
  skipSuccessToast: true,
  headers: { "Cache-Control": "no-store" },
});
export const remittanceApi = {
  list: (
    companyId: string,
    filters: Record<string, string>,
    signal: AbortSignal
  ) =>
    http.get<RemittancePage>("/remittance_documents", {
      ...options(signal),
      params: { company_id: companyId, ...filters },
    }),
  upload: (body: FormData, signal: AbortSignal) =>
    http.post("/remittance_documents", body, options(signal)),
  download: (
    companyId: string,
    paymentId: string,
    id: string,
    signal: AbortSignal
  ) =>
    http.get<Blob>(`/remittance_documents/${id}/download`, {
      ...options(signal),
      responseType: "blob",
      params: { company_id: companyId, payment_instruction_id: paymentId },
    }),
};
