export type Recipient = {
  id: string;
  name: string;
  email: string;
  role: "signer" | "reviewer" | "cc";
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
export type Revision = {
  id: number;
  number: number;
  title: string;
  status: string;
  content_digest: string;
  documents: SourceDocument[];
  recipients: Recipient[];
  fields: Field[];
};
export type SigningRequest = Summary & {
  revision: Revision;
  revisions: { id: number; number: number; status: string }[];
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
