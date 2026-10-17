import http from "apis/api";

export interface Approval {
  stage: string;
  actor_name: string;
  created_at: string;
}

export interface RunSummary {
  id: string;
  company_id: string;
  period: string;
  currency: string;
  dry_run: boolean;
  current_revision: {
    number: number;
    digest: string;
    created_at: string;
  } | null;
}

export interface Adjustment {
  code: string;
  amount_minor: string;
  currency: string;
  origin_period: string;
  reason_code: string;
}

type Facts = Record<string, unknown>;

export interface ReviewLine {
  employment_id: string;
  payee_name: string;
  pay_type: string;
  currency: string;
  amounts: Record<string, string>;
  extras: Adjustment[];
  reimbursements: Adjustment[];
  deductions: Adjustment[];
  source: {
    month: string;
    digest: string;
    captured_at: string;
    work_entries: Facts[];
    timeoff_entries: Facts[];
    review_exceptions: { code: string }[];
    company_calendar: Facts;
    employment: Facts;
  } | null;
  source_resolutions: { code: string; decision: string; reason_code: string }[];
  calculation: {
    input: Facts;
    policy: Facts;
    net: string;
    manual_net_delta: string | null;
    issues: string[];
    review_ready: boolean;
    preview_only: boolean;
  } | null;
}

export interface RunDetail extends RunSummary {
  status: string;
  review_issues: string[];
  reviewers: {
    accounts: { id: string; name: string } | null;
    final: { id: string; name: string } | null;
  };
  revision: {
    number: number;
    digest: string;
    created_at: string;
    policies: Record<
      string,
      { version: string; effective_from: string; effective_to: string }
    >;
    exceptions: string[];
    lines: ReviewLine[];
    approvals: Approval[];
    audit: {
      number: number;
      digest: string;
      created_at: string;
      created_by_name: string;
      approvals: Approval[];
    }[];
  } | null;
}

export interface RunPreflight {
  status: string;
  approval_state: string;
  preview_only: boolean;
  execution_enabled: boolean;
  company_id: string;
  revision_digest: string | null;
  recipient_count: number;
  total_net_minor: string | null;
  currency: string;
  blockers: string[];
  reconciliation: { reconciled: boolean; issues: string[] };
}

type RequestSignal = InstanceType<typeof window.AbortController>["signal"];

const get = (
  path: string,
  companyId: string,
  signal: RequestSignal,
  page?: number
) =>
  http.get(path, {
    params: { company_id: companyId, ...(page ? { page } : {}) },
    headers: { "Cache-Control": "no-store" },
    signal,
    skipErrorToast: true,
  });

export const payrollApi = {
  index: (companyId: string, signal: RequestSignal, page: number) =>
    get("/payroll_runs", companyId, signal, page),
  show: (id: string, companyId: string, signal: RequestSignal) =>
    get(`/payroll_runs/${encodeURIComponent(id)}`, companyId, signal),
  preflight: (id: string, companyId: string, signal: RequestSignal) =>
    get(`/payroll_runs/${encodeURIComponent(id)}/preflight`, companyId, signal),
};
