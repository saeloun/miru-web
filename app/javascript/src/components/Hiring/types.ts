export type Choice = { id: number; label: string };
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
export const stageLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
export const receiptLabel = (value: string, zone: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone,
  }).format(new Date(value));
