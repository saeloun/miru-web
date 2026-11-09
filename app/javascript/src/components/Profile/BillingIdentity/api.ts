import http from "apis/api";

type Signal = InstanceType<typeof window.AbortController>["signal"];
export type EvidenceKind = "pan" | "gst";
export type BillingFacts = {
  legal_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  pan_status: string;
  pan_number: string;
  pan_reason: string;
  gst_status: string;
  gst_number: string;
  gst_scheme: string;
  gst_reason: string;
};
export type BillingReview = {
  id: string;
  actor_id: string;
  submission_id: string;
  previous_review_id: string | null;
  decision: "approved" | "needs_information" | "rejected";
  reason: string;
  manual_tax_reviewed: boolean;
  missing_pan_acknowledged: boolean;
  created_at: string;
  current?: boolean;
};
export type SubmissionReceipt = {
  id: string;
  actor_id: string;
  previous_submission_id: string | null;
  created_at: string;
  current?: boolean;
  latest_review?: BillingReview | null;
};
export type BillingSubmission = SubmissionReceipt & {
  facts: BillingFacts;
  masked_facts: BillingFacts;
  digest: string;
  evidence: {
    kind: EvidenceKind;
    content_type: string;
    byte_size: number;
    download_path: string;
  }[];
};
export type BillingIdentity = {
  company_id: number;
  employment_id: number;
  user_id: number;
  consultant_name: string;
  status:
    | "missing"
    | "submitted"
    | "approved"
    | "needs_information"
    | "rejected";
  can_submit: boolean;
  can_review: boolean;
  can_approve: boolean;
  current_submission: BillingSubmission | null;
  current_review: BillingReview | null;
  selected_submission: BillingSubmission | null;
  history: SubmissionReceipt[];
  next_before_id: string | null;
  review_history: BillingReview[];
  next_review_before_id: string | null;
  recorded_submission?: SubmissionReceipt;
  recorded_review?: BillingReview;
};
export type SubmissionCommand = {
  kind: "submission";
  expected_submission_id: string;
  idempotency_key: string;
  facts: BillingFacts;
  reuse_pan_evidence: boolean;
  reuse_gst_evidence: boolean;
  pan_evidence?: File;
  gst_evidence?: File;
};
export type ReviewCommand = {
  kind: "review";
  submission_id: string;
  expected_review_id: string;
  decision: BillingReview["decision"];
  reason: string;
  manual_tax_reviewed: boolean;
  missing_pan_acknowledged: boolean;
  idempotency_key: string;
};

const path = "/consultant_billing_identity";
const options = (signal: Signal) => ({
  signal,
  skipErrorToast: true,
  skipSuccessToast: true,
  headers: { "Cache-Control": "no-store" },
});
export const billingIdentityApi = {
  read: (
    companyId: string,
    userId: string,
    signal: Signal,
    query: {
      submission_id?: string;
      before_id?: string;
      review_before_id?: string;
    } = {}
  ) =>
    http.get<{ billing_identity: BillingIdentity }>(path, {
      ...options(signal),
      params: { company_id: companyId, user_id: userId, ...query },
    }),
  submit: (
    companyId: string,
    userId: string,
    command: SubmissionCommand,
    signal: Signal
  ) => {
    const body = new FormData();
    body.append("company_id", companyId);
    body.append("user_id", userId);
    Object.entries(command.facts).forEach(([key, value]) =>
      body.append(`billing_identity[${key}]`, value)
    );

    [
      "expected_submission_id",
      "idempotency_key",
      "reuse_pan_evidence",
      "reuse_gst_evidence",
    ].forEach(key =>
      body.append(`billing_identity[${key}]`, String(command[key]))
    );

    (["pan", "gst"] as EvidenceKind[]).forEach(kind => {
      const file = command[`${kind}_evidence`];
      if (file) body.append(`billing_identity[${kind}_evidence]`, file);
    });

    return http.post<{ billing_identity: BillingIdentity }>(
      path,
      body,
      options(signal)
    );
  },
  review: (
    companyId: string,
    userId: string,
    command: ReviewCommand,
    signal: Signal
  ) => {
    const { kind, ...review } = command;

    return http.post<{ billing_identity: BillingIdentity }>(
      `${path}/reviews`,
      {
        company_id: companyId,
        user_id: userId,
        billing_review: review,
      },
      options(signal)
    );
  },
  evidence: (
    companyId: string,
    userId: string,
    submissionId: string,
    kind: EvidenceKind,
    signal: Signal
  ) =>
    http.get(`${path}/submissions/${submissionId}/evidence/${kind}`, {
      ...options(signal),
      params: { company_id: companyId, user_id: userId },
      responseType: "blob",
    }),
};
