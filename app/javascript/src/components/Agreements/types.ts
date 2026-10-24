import type { JSONContent } from "@tiptap/core";

export type Field = {
  key: string;
  label: string;
  type:
    | "text"
    | "date"
    | "number"
    | "checkbox"
    | "dropdown"
    | "signature"
    | "initials";
  role: "admin" | "counterparty" | "company_signer";
  required: boolean;
  read_only: boolean;
  options?: string[];
};
export type Values = Record<string, string | boolean | null>;
export type Summary = {
  id: number;
  title: string;
  kind: "client" | "consultant";
  lock_version: number;
  updated_at: string;
};
export type Contract = Summary & {
  company_id: number;
  document: JSONContent;
  fields: Field[];
  field_values?: Values;
};
export type Preview = {
  document: JSONContent;
  fields: Field[];
  warnings: string[];
};
export type Party = {
  id: number;
  name: string;
  email: string;
  employee_id?: string;
};
export const emptyDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
