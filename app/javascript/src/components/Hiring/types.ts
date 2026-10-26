export type Choice = { id: number; label: string };
export type FormField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  sensitive: boolean;
  choices?: string[];
};
export type FormSchema = { enabled: boolean; fields: FormField[] };
export type CompensationAnswer = {
  amount: string;
  currency: string;
  period: string;
};
export type FormAnswer =
  | string
  | boolean
  | string[]
  | CompensationAnswer
  | null;
export type CandidateFormReview = {
  id: number;
  access_id: number;
  issued_at: string;
  approved_setting_version: number;
  submitted_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  fields: FormField[];
  answers: Record<string, FormAnswer>;
  resume: { filename: string; byte_size: number } | null;
};
export type CandidateFormsPage = {
  company_id: number;
  forms: CandidateFormReview[];
  pagination: Pagination;
  application_lock_version: number;
  application_stage: string;
  approved_setting_version: number | null;
  active_access_id: number | null;
};
export type Role = {
  id: number;
  title: string;
  status: "open" | "closed";
  lock_version: number;
};
export type Pagination = { page: number; per_page: number; has_more: boolean };
export type Application = {
  id: number;
  candidate: { id: number; full_name: string; email: string };
  submitted_name: string;
  submitted_email?: string;
  role: Pick<Role, "id" | "title" | "status"> | null;
  owner: { id: number; full_name: string; employee_id: string | null } | null;
  stage: string;
  source: string;
  received_at: string;
  lock_version: number;
  notes?: string | null;
};
export type ApplicationPage = {
  company_id: number;
  applications: Application[];
  stages: Record<string, string>;
  time_zone: string;
  pagination: Pagination;
};
export type ApplicationDetail = {
  company_id: number;
  application: Application;
  history: Application[];
  time_zone: string;
  pagination: Pagination;
};
export type RolePage = {
  company_id: number;
  roles: Role[];
  pagination: Pagination;
};
export const hiringTextFields = [
  { key: "company_intro", label: "Company introduction" },
  { key: "working_arrangements", label: "Working arrangements" },
  { key: "working_week", label: "Working week" },
  { key: "overlap", label: "Overlap" },
  { key: "pto", label: "PTO and engagement policy" },
  { key: "hiring_process", label: "Hiring process" },
  { key: "acknowledgement_subject", label: "Acknowledgement subject" },
  { key: "acknowledgement_body", label: "Acknowledgement body" },
] as const;
export type HiringSettingsDetails = Record<
  (typeof hiringTextFields)[number]["key"],
  string | null
> & { client_count: number | null };
export type HiringSettings = {
  details: HiringSettingsDetails;
  form: FormSchema;
  lock_version: number | null;
  approved: boolean;
  approved_at: string | null;
  complete: boolean;
  preview: { subject: string; body: string } | null;
};
export type HiringSettingsPage = {
  company_id: number;
  settings: HiringSettings;
};
export type Mailbox = {
  id: number;
  name: string;
  source_email: string;
  active: boolean;
  lock_version: number;
  ingress_path: string;
};
export type MailboxPage = {
  company_id: number;
  mailboxes: Mailbox[];
  pagination: Pagination;
};
export const emailStateLabels = {
  pending: "Processing",
  review: "Needs review",
  accepted: "Added or linked",
  dismissed: "Dismissed",
};
export type EmailReceipt = {
  id: number;
  state: keyof typeof emailStateLabels;
  subject: string | null;
  review_reason: string | null;
  received_at: string;
  reviewed_at: string | null;
  reviewed_by: { id: number; name: string } | null;
  lock_version: number;
  application_id: number | null;
  mailbox: Pick<Mailbox, "id" | "name" | "source_email">;
};
export type ReceiptPage = {
  company_id: number;
  receipts: EmailReceipt[];
  pagination: Pagination;
  time_zone: string;
};
export type RetainedEmail = EmailReceipt & {
  email?: string | null;
  full_name?: string | null;
  original_date?: string | null;
  text?: string;
  text_truncated?: boolean;
  reviewed_identity?: { full_name: string; email: string };
  reviewed_reason?: string;
  attachments: {
    index: number;
    filename: string;
    bytes: number;
    content_type: string;
  }[];
};
export const deliveryStateLabels = {
  queued: "Queued",
  sending: "Sending",
  sent: "Accepted by mail server",
  failed: "Not sent",
  uncertain: "Delivery unknown",
};
export type HiringMessage = {
  id: number;
  kind: string;
  state: keyof typeof deliveryStateLabels;
  error_code: string | null;
  enqueued_at: string | null;
  started_at: string | null;
  sent_at: string | null;
  created_at: string;
  lock_version: number;
  attempt_number: number;
  original_message_id: number | null;
  approved_setting_version: number;
  automatic: boolean;
  retryable: boolean;
  queued_by: { id: number; name: string } | null;
  resolution: "accepted" | "not_accepted" | null;
  resolution_details: { evidence: string; worker_stopped: boolean } | null;
  resolved_at: string | null;
  resolved_by: { id: number; name: string } | null;
  events: {
    id: number;
    action: string;
    created_at: string;
    actor_id: number | null;
    actor: { id: number; name: string } | null;
    changes: {
      state?: string | [string, string];
      resolution?: string | [string | null, string];
    };
  }[];
  content: { to: string; reply_to: string; subject: string; body: string };
};
export type ReceiptDetailPage = {
  company_id: number;
  receipt: RetainedEmail;
  application: Application | null;
  messages: HiringMessage[];
  time_zone: string;
};
export const stageLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
export const receiptLabel = (value: string, zone: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone,
  }).format(new Date(value));
