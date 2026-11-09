import http from "apis/api";

type Signal = InstanceType<typeof window.AbortController>["signal"];

export type AuthorizationEvent = {
  id: string;
  action: "grant" | "withdraw";
  actor_id: string;
  created_at: string;
  statement_version: string;
  statement_digest: string;
  statement_text: string;
  previous_event_id: string | null;
  current?: boolean;
};

export type Authorization = {
  company_id: number;
  employment_id: number;
  user_id: number;
  consultant_name: string;
  status: "not_granted" | "granted" | "withdrawn" | "reauthorization_required";
  statement: { version: string; text: string; digest: string };
  current_event: AuthorizationEvent | null;
  history: AuthorizationEvent[];
  next_before_id: string | null;
  can_grant: boolean;
  can_withdraw: boolean;
  recorded_event?: AuthorizationEvent;
};

export type AuthorizationCommand = {
  action: "grant" | "withdraw";
  expected_event_id: string;
  statement_digest: string;
  idempotency_key: string;
};

const path = "/consultant_invoice_authorization";
const options = (signal: Signal) => ({
  signal,
  skipErrorToast: true,
  skipSuccessToast: true,
  headers: { "Cache-Control": "no-store" },
});

export const invoiceAuthorizationApi = {
  read: (
    companyId: string,
    userId: string,
    signal: Signal,
    beforeId?: string
  ) =>
    http.get<{ invoice_authorization: Authorization }>(path, {
      ...options(signal),
      params: { company_id: companyId, user_id: userId, before_id: beforeId },
    }),
  record: (
    companyId: string,
    userId: string,
    command: AuthorizationCommand,
    signal: Signal
  ) =>
    http.post<{ invoice_authorization: Authorization }>(
      path,
      {
        company_id: companyId,
        user_id: userId,
        invoice_authorization: command,
      },
      options(signal)
    ),
};
