import type { AssignmentTemplate } from "./AssignmentLibrary";
import type { FormAnswer, Pagination } from "./types";

export const assessmentDimensions = {
  correctness: "Correctness",
  code_quality: "Code quality",
  testing: "Testing",
  maintainability: "Maintainability",
  problem_solving: "Problem solving",
  understanding: "Understanding",
};
export type AssessmentReview = {
  id: number;
  outcome: "pass" | "fail" | "clarification_required";
  review_round: number;
  created_at: string;
  details: {
    dimensions: Record<string, string>;
    request_kind: string;
    notes: string | null;
    reviewer_name: string;
  };
};
export type Assessment = {
  id: number;
  title: string;
  candidate_name: string;
  role: string | null;
  template_version: number;
  details: AssignmentTemplate["details"];
  candidate_note: string | null;
  due_at: string;
  status: string;
  lock_version: number;
  application_version: number;
  application_stage: string;
  current_review_id: number | null;
  reviews: AssessmentReview[];
  submission: {
    id: number;
    submitted_at: string;
    answers: Record<string, FormAnswer>;
    files: { id: number; filename: string; byte_size: number }[];
  } | null;
};
export type AdminAssessment = Assessment & {
  request_key: string;
  ended_at: string | null;
  previous_assignment_id: number | null;
  reviewer: { id: number; full_name: string } | null;
  url: string | null;
  events: {
    id: number;
    action: string;
    created_at: string;
    details: Record<string, string | number | null>;
  }[];
};
export type AssessmentPage = {
  company_id: number;
  assignments: AdminAssessment[];
  application_version: number;
  application_stage: string;
  active_assignment_id: number | null;
  can_issue: boolean;
  pagination: Pagination;
};
