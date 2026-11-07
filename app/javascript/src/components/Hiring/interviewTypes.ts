import type {
  ApplicationChange,
  CandidateFormReview,
  Pagination,
} from "./types";
import type { Assessment } from "./assessmentTypes";

export type PanelDetails = {
  expertise?: string;
  availability?: string;
  booking_url?: string;
};
export type PanelMember = {
  id: number;
  employment_id: number;
  full_name: string;
  details: PanelDetails;
  lock_version: number;
  active: boolean;
};
export type PanelPage = {
  company_id: number;
  panel_members: PanelMember[];
  pagination: Pagination;
};
export type RoundDetails = {
  title: string;
  kind: string;
  duration_minutes: number;
  criteria: string;
  preparation: string;
  feedback_questions: string[];
};
export type RoundMember = {
  panel_member_id: number;
  full_name: string;
  details: PanelDetails;
  compensation_access: boolean;
};
export type Interview = {
  id: number;
  number: number;
  status: "planned" | "completed" | "skipped" | "cancelled";
  lock_version: number;
  previous_interview_id: number | null;
  ended_at: string | null;
  details: RoundDetails;
  panel: RoundMember[];
};
export type InterviewPage = {
  company_id: number;
  interviews: Interview[];
  application: ApplicationChange & { id: number };
  pagination: Pagination;
};
export type InterviewHandover = {
  company_id: number;
  interview: Pick<Interview, "id" | "number" | "status" | "details"> & {
    panel: Pick<RoundMember, "full_name" | "details">[];
  };
  handover: {
    candidate: { full_name: string; email: string };
    role: { title: string } | null;
    form: CandidateFormReview | null;
    assessment: Assessment | null;
  };
};
