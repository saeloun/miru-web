import type { Company } from "../types/company";

export const hasPayrollReviewAccess = (
  company: Company | null | undefined,
  workspaceId: string | number | null | undefined,
  role: string
): boolean =>
  company?.payroll_review_enabled === true &&
  company?.id != null &&
  workspaceId != null &&
  String(company.id) === String(workspaceId) &&
  ["owner", "admin", "book_keeper"].includes(role);
