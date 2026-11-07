import type { InternalNotice, Pagination } from "./types";

export const assessmentFields = [
  ["topics", "Topics covered"],
  ["assessment", "Assessment"],
  ["technical_skills", "Technical skills"],
  ["communication", "Communication"],
  ["strengths", "Strengths"],
  ["concerns", "Concerns"],
] as const;
export const requiredAssessmentFields = [
  "topics",
  "assessment",
  "communication",
];
export const recommendations = [
  ["pass", "Pass"],
  ["fail", "Fail"],
  ["hold", "Hold"],
  ["additional_round_required", "Additional round required"],
] as const;
export type FeedbackContent = {
  interview_on: string;
  attendance: string;
  topics: string;
  assessment: string;
  technical_skills: string;
  communication: string;
  strengths: string;
  concerns: string;
  evidence: string;
  recommendation: string;
  answers: string[];
};
export type FeedbackRecord = {
  id: number;
  lock_version: number;
  state: string;
  submitted_at: string | null;
  details: FeedbackContent | null;
  reviewer_name: string;
  late: boolean;
  notifications?: InternalNotice[];
  booking: {
    id: number;
    number: number;
    status: string;
    starts_at: string;
    ends_at: string;
    feedback_due_at: string;
    candidate_time_zone: string;
  };
  round: {
    number: number;
    title: string;
    kind: string;
    criteria: string;
    feedback_questions: string[];
  };
};
export type FeedbackPage = {
  company_id: number;
  feedbacks: (FeedbackRecord & { candidate_name?: string })[];
  pagination: Pagination;
};
export type FeedbackResponse = {
  company_id: number;
  candidate_name: string;
  application_version: number;
  interview_version: number;
  booking_version: number;
  feedback: Omit<FeedbackRecord, "booking" | "round"> & { can_submit: boolean };
  booking: FeedbackRecord["booking"];
  round: FeedbackRecord["round"];
};
