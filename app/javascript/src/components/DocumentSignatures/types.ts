export type Recipient = {
  id: string;
  name: string;
  email: string;
  role: "signer" | "reviewer" | "cc";
  authentication?: "email_link" | "email_code";
};
export const authenticationLabels = {
  email_code: "Email code at completion",
  email_link: "Email link",
};
export type SourceDocument = {
  key: string;
  filename: string;
  sha256: string;
  byte_size: number;
  pages: { width: number; height: number; rotation: number }[];
};
export type Field = {
  id: string;
  document_id: string;
  recipient_id: string;
  page: number;
  type:
    | "signature"
    | "initials"
    | "date"
    | "name"
    | "email"
    | "text"
    | "number"
    | "checkbox"
    | "dropdown";
  label: string;
  required: boolean;
  read_only: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  options?: string[];
  value?: string | boolean | null;
};
export type Summary = {
  id: number;
  company_id: number;
  title: string;
  status: string;
  lock_version: number;
  current_revision_id: number;
  revision_number: number;
  updated_at: string;
};
export type ArchiveFile = {
  key: string;
  kind: "signed" | "certificate" | "audit_log";
  filename: string;
  byte_size: number;
  sha256: string;
};
export type Revision = {
  id: number;
  number: number;
  title: string;
  status: string;
  content_digest: string;
  signing_options: {
    version: number;
    timezone: string;
    dateFormat: string;
    envelopeExpirationPeriod: { unit: "month"; amount: number };
  } | null;
  documents: SourceDocument[];
  recipients: Recipient[];
  fields: Field[];
  delivery: {
    archive: {
      status: "complete" | "pending" | "failed" | "unavailable";
      completed_at: string | null;
      error_message: string | null;
      files: ArchiveFile[];
    };
    operation_id: string | null;
    provider_envelope_id: string | null;
    provider_status: string | null;
    provider_checked_at: string | null;
    cancel_requested_at: string | null;
    cancel_retryable: boolean;
    last_reminder_at: string | null;
    next_reminder_at: string | null;
    automatic_reminders_count: number;
    signing_window_expired?: boolean;
    recipient_statuses: {
      recipient_id: string;
      signing_status: string;
      send_status: string;
      read_status: string;
      expires_at?: string | null;
    }[];
    operations: {
      id: number;
      kind: "send" | "cancel" | "remind" | "refresh";
      state: string;
      phase: string;
      error_message: string | null;
      created_at: string;
    }[];
  };
};
export type SigningRequest = Summary & {
  revision: Revision;
  revisions: { id: number; number: number; status: string }[];
};
export type ReviewComment = {
  id: number;
  body: string;
  created_at: string;
  author_name: string;
  author_kind: "admin" | "reviewer";
};
export type ReviewSummary = {
  comments: ReviewComment[];
  older_before_id: number | null;
  invitations: {
    id: number;
    recipient_id: string;
    name: string;
    expires_at: string;
    revoked_at: string | null;
    decision: string | null;
    email_status: string;
  }[];
  approval: {
    approved_at: string | null;
    approval_source: string | null;
    approval_digest: string | null;
    approval_note: string | null;
  };
};
export const fieldTypes: Field["type"][] = [
  "signature",
  "initials",
  "date",
  "name",
  "email",
  "text",
  "number",
  "checkbox",
  "dropdown",
];
export const titleCase = (text: string) =>
  text.replace(/_/g, " ").replace(/^\w/, letter => letter.toUpperCase());
