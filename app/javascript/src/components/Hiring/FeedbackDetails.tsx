import React from "react";
import InternalNoticeHistory from "./InternalNoticeHistory";
import CandidateMessages from "./CandidateMessages";
import { Badge } from "../ui/badge";
import { stageLabel } from "./types";
import { bookingTimeLabel } from "./bookingTypes";
import {
  assessmentFields,
  recommendations,
  type FeedbackRecord,
} from "./feedbackTypes";

export default function FeedbackDetails({
  record,
  recovery,
}: {
  record: FeedbackRecord;
  recovery?: {
    companyId: number;
    path: string;
    onDenied: (failure: unknown) => void;
  };
}) {
  const details = record.details;

  return (
    <article className="min-w-0 space-y-3 rounded-lg border p-4">
      <h3 className="break-words font-semibold">
        Round {record.round.number} · {record.round.title}
      </h3>
      <p className="break-words">Reviewer: {record.reviewer_name}</p>
      <Badge variant="secondary">{stageLabel(record.state)}</Badge>
      <p>
        Booking {record.booking.number} · {stageLabel(record.booking.status)}
      </p>
      <p className="break-words">
        Scheduled:{" "}
        {bookingTimeLabel(
          record.booking.starts_at,
          record.booking.candidate_time_zone
        )}{" "}
        · {record.booking.candidate_time_zone}
      </p>
      <p className="break-words">
        Feedback due:{" "}
        {bookingTimeLabel(
          record.booking.feedback_due_at,
          record.booking.candidate_time_zone
        )}{" "}
        · {record.booking.candidate_time_zone}
      </p>
      {details && (
        <>
          <p>
            {details.attendance === "no_show"
              ? "No-show date"
              : "Actual interview date"}
            : {details.interview_on}
          </p>
          <p>
            Attendance:{" "}
            {details.attendance === "no_show" ? "No-show" : "Attended"}
          </p>
          <p>
            Recommendation:{" "}
            {
              recommendations.find(
                ([key]) => key === details.recommendation
              )?.[1]
            }
          </p>
          {record.late && <p>Submitted late</p>}
          <dl className="space-y-3">
            {[
              ...assessmentFields,
              ["evidence", "Evidence and examples"] as const,
            ].map(
              ([key, label]) =>
                details[key] && (
                  <div key={key}>
                    <dt className="font-medium">{label}</dt>
                    <dd className="whitespace-pre-wrap break-words">
                      {details[key]}
                    </dd>
                  </div>
                )
            )}
            {record.round.feedback_questions.map(
              (question, index) =>
                details.answers[index] && (
                  <div key={question}>
                    <dt className="break-words font-medium">{question}</dt>
                    <dd className="whitespace-pre-wrap break-words">
                      {details.answers[index]}
                    </dd>
                  </div>
                )
            )}
          </dl>
        </>
      )}
      {recovery && record.notifications ? (
        <section aria-label="Internal feedback delivery history">
          <CandidateMessages
            companyId={recovery.companyId}
            path={recovery.path}
            context={{
              kind: "feedback",
              number: record.id,
              version: record.lock_version,
            }}
            onDenied={recovery.onDenied}
          />
        </section>
      ) : (
        <InternalNoticeHistory
          title="Internal feedback delivery history"
          notifications={record.notifications}
        />
      )}
    </article>
  );
}
