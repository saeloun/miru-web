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

export interface ReviewerChoice {
  id: string;
  name: string;
}

export interface RunPreparationOptions {
  can_create: boolean;
  accounts_reviewers?: ReviewerChoice[];
  final_reviewers?: ReviewerChoice[];
}

export interface PreparationClaim {
  id: number;
  date: string;
  description: string;
  currency: string;
  amount: string;
  receipt_count: number;
}

export interface PreparationConsultant {
  employment_id: number;
  consultant_name: string;
  monthly_fee: string | null;
  expected_hours: string | null;
  recorded_hours: string | null;
  fee_estimate: string | null;
  payment_source: string | null;
  warnings: string[];
  eligible_expenses: PreparationClaim[];
  excluded_expenses: Record<string, number>;
  required_acknowledgements: string[];
  not_ready_reasons: string[];
  ready: boolean;
  locked: boolean;
  current: {
    included: boolean;
    confirmed_unpaid_hours?: string | null;
    unpaid_reason?: string | null;
    expense_ids?: number[];
    other_earning?: string | null;
    other_deduction?: string | null;
    withholding?: string | null;
  };
}

export interface RunPreparation {
  can_prepare: boolean;
  cutoff: string;
  current_digest: string | null;
  consultants: PreparationConsultant[];
}

export interface MercuryLeg {
  id: string;
  beneficiary: string;
  display_state: string;
  released: boolean;
  frozen_digest: string;
  entitlement_minor: string;
  principal_minor: string;
  fee_minor: string;
  company_debit_minor: string;
  charge_type: string;
  reference_rate: string;
  buffered_rate: string;
  rate_source: string;
  rate_mode: string;
  rate_observed_at: string;
  rate_valid_until: string;
  quote_expired: boolean;
  purpose_category: string;
  purpose_info: string;
  source_account_mask: string | null;
  recipient: { name: string; account_mask: string; swift_code: string };
  provider_request_id: string | null;
  request_status: string | null;
  requester_may_approve: boolean | null;
  approvers_required: number | null;
  provider_transaction_id: string | null;
  transaction_status: string | null;
  transaction_link_state: string;
  transaction_failure_reason: string | null;
  credit_state: string;
  credited_minor: string;
  shortfall_minor: string;
  last_error_code: string | null;
  last_checked_at: string | null;
  absence_attested: boolean;
  events: { kind: string; created_at: string }[];
  actions: Record<
    | "submit"
    | "void"
    | "refresh"
    | "reconcile"
    | "attest_absence"
    | "record_credit"
    | "resolve_shortfall",
    boolean
  >;
}

export interface MercurySplit {
  id: string;
  status: string;
  allocation_kind: string;
  allocation_value: string;
  allocated_to: string;
  remainder_to: string;
  spouse: {
    name: string;
    bank_name: string;
    account_mask: string;
    swift_code: string;
  };
}

export interface MercuryConsultant {
  employment_id: string;
  payee_name: string;
  entitlement_minor: string;
  reimbursement_minor: string;
  currency: string;
  blockers: string[];
  allocations: { beneficiary: string; amount_minor: string }[];
  split: MercurySplit | null;
  recipients: {
    beneficiary: string;
    linked: boolean;
    current: boolean;
    name: string | null;
    account_mask: string | null;
    swift_code: string | null;
  }[];
  fully_credited_at: string | null;
  combined_company_debit_minor: string;
  resolved_shortfall_minor: string;
  settled_claims_need_review: boolean;
  run_approved: boolean;
  legs: MercuryLeg[];
  can_prepare: boolean;
}

export interface MercuryPayments {
  setup: {
    configured: boolean;
    verified: boolean;
    writes_enabled: boolean;
    environment?: string;
    source_account_id?: string;
    expected_legal_business_name?: string;
    account_name?: string | null;
    account_mask?: string | null;
    verified_at?: string | null;
    wire_fee_minor?: string;
  };
  rate: {
    available: boolean;
    reference_rate?: string;
    buffered_rate?: string;
    source?: string;
    date?: string;
    observed_at?: string;
  };
  run_status: string;
  revision_digest: string | null;
  permissions: {
    manage: boolean;
    accounts_review: boolean;
    record_credit: boolean;
  };
  consultants: MercuryConsultant[];
}

export interface IndiaReport {
  bank_version: string;
  consultant_name: string;
  period: string;
  legal_entity: string;
  recorded_hours: string;
  working_days: string;
  monthly_fee: string;
  confirmed_unpaid_hours: string;
  leave_entries: Record<string, unknown>[];
  reimbursements: Record<string, unknown>[];
  amounts: Record<string, string>;
  extras: Adjustment[];
  deductions: Adjustment[];
  bank: { holder: string; name: string; account_mask: string; ifsc: string };
}

export interface IndiaHandoff {
  id: string;
  status: string;
  accounts_email: string;
  created_at: string;
  credited_at: string | null;
  entitlement_minor: string;
  credited_minor: string;
  settlement_blocked: boolean;
  report: IndiaReport;
  attempts: {
    attempt_number: number;
    state: string;
    error_code: string | null;
    created_at: string;
    sent_at: string | null;
    reviewed_at: string | null;
  }[];
  credits: {
    id: string;
    amount_minor: string;
    credited_on: string;
    recorded_at: string;
  }[];
  actions: {
    retry: boolean;
    void: boolean;
    reconcile: boolean;
    record_credit: boolean;
  };
}

export interface IndiaHandoffs {
  revision_digest: string | null;
  run_status: string;
  permissions: { manage: boolean; record_credit: boolean };
  consultants: {
    employment_id: string;
    payee_name: string;
    entitlement_minor: string | null;
    blockers: string[];
    preview: IndiaReport | null;
    handoffs: IndiaHandoff[];
  }[];
}

type RequestSignal = InstanceType<typeof window.AbortController>["signal"];

type Payload = Record<string, unknown>;

const post = (path: string, companyId: string, payload: Payload = {}) =>
  http.post(
    path,
    { company_id: companyId, ...payload },
    { skipErrorToast: true }
  );

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
  create: (companyId: string, payload: Payload) =>
    post("/payroll_runs", companyId, payload),
  preparation: (id: string, companyId: string, signal: RequestSignal) =>
    get(
      `/payroll_runs/${encodeURIComponent(id)}/preparation`,
      companyId,
      signal
    ),
  revise: (id: string, companyId: string, payload: Payload) =>
    post(
      `/payroll_runs/${encodeURIComponent(id)}/revisions`,
      companyId,
      payload
    ),
  approve: (id: string, companyId: string, payload: Payload) =>
    post(
      `/payroll_runs/${encodeURIComponent(id)}/approvals`,
      companyId,
      payload
    ),
  mercury: (id: string, companyId: string, signal: RequestSignal) =>
    get(
      `/payroll_runs/${encodeURIComponent(id)}/mercury_payments`,
      companyId,
      signal
    ),
  indiaHandoffs: (id: string, companyId: string, signal: RequestSignal) =>
    get(
      `/payroll_runs/${encodeURIComponent(id)}/india_handoffs`,
      companyId,
      signal
    ),
  createIndiaHandoff: (id: string, companyId: string, payload: Payload) =>
    post(
      `/payroll_runs/${encodeURIComponent(id)}/india_handoffs`,
      companyId,
      payload
    ),
  indiaHandoffAction: (
    id: string,
    handoffId: string,
    action: "retry_delivery" | "void" | "reconcile_delivery" | "record_credit",
    companyId: string,
    payload: Payload = {}
  ) =>
    post(
      `/payroll_runs/${encodeURIComponent(
        id
      )}/india_handoffs/${encodeURIComponent(handoffId)}/${action}`,
      companyId,
      { india_handoff: payload }
    ),
  prepareMercury: (id: string, companyId: string, payload: Payload) =>
    post(
      `/payroll_runs/${encodeURIComponent(id)}/mercury_payments`,
      companyId,
      payload
    ),
  legAction: (
    id: string,
    legId: string,
    action: string,
    companyId: string,
    payload: Payload = {}
  ) =>
    post(
      `/payroll_runs/${encodeURIComponent(
        id
      )}/mercury_payments/${encodeURIComponent(legId)}/${action}`,
      companyId,
      { mercury_payment: payload }
    ),
  saveConnection: (companyId: string, payload: Payload) =>
    http.patch(
      "/payroll_mercury_connection",
      { company_id: companyId, payroll_mercury_connection: payload },
      { skipErrorToast: true }
    ),
  verifyConnection: (companyId: string) =>
    post("/payroll_mercury_connection/verify", companyId),
  linkRecipient: (companyId: string, payload: Payload) =>
    post("/payroll_mercury_connection/recipients", companyId, payload),
  requestSplit: (id: string, companyId: string, payload: Payload) =>
    post(
      `/payroll_runs/${encodeURIComponent(id)}/split_arrangements`,
      companyId,
      { payroll_split_arrangement: payload }
    ),
  splitAction: (
    id: string,
    splitId: string,
    action: string,
    companyId: string
  ) =>
    post(
      `/payroll_runs/${encodeURIComponent(
        id
      )}/split_arrangements/${encodeURIComponent(splitId)}/${action}`,
      companyId
    ),
};
