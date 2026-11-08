import React from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { quiet } from "./api";
import { assessmentDimensions, type Assessment } from "./assessmentTypes";
import { stageLabel } from "./types";

export async function downloadAssessmentFile(
  path: string,
  companyId: number,
  filename: string
) {
  const response = await Api.get(`/hiring/${path}`, {
    ...quiet,
    params: { company_id: companyId },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export default function AssessmentWork({
  assessment,
  busy,
  download,
}: {
  assessment: Assessment;
  busy: boolean;
  download: (id: number, filename: string) => void;
}) {
  const labels = {
    setup: "Setup instructions",
    approach: "Approach and explanation",
    own_contribution: "Own contribution",
    ai_used: "AI tools used?",
    ai_tools: "AI tools",
    ai_how: "How AI was used",
    ai_parts: "Parts assisted by AI",
  };

  return (
    <div className="min-w-0 space-y-4 text-sm">
      <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Approved task version</dt>
          <dd>{assessment.template_version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expected effort</dt>
          <dd>{assessment.details.expected_minutes} minutes</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Submission deadline</dt>
          <dd>{new Date(assessment.due_at).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{stageLabel(assessment.status)}</dd>
        </div>
      </dl>
      {[
        ["Task instructions", assessment.details.instructions],
        ["Assessment criteria", assessment.details.criteria],
        ["AI policy", assessment.details.ai_policy],
        ["Candidate instructions", assessment.candidate_note],
      ]
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <h4 className="font-medium">{label}</h4>
            <p className="mt-1 whitespace-pre-wrap break-words">{value}</p>
          </div>
        ))}
      {assessment.submission ? (
        <section
          aria-label="Submitted assessment work"
          className="space-y-4 rounded-lg border p-4"
        >
          <h4 className="font-semibold">Submitted work</h4>
          <p>
            Submitted{" "}
            {new Date(assessment.submission.submitted_at).toLocaleString()}
          </p>
          {typeof assessment.submission.answers.repository_url === "string" &&
            assessment.submission.answers.repository_url && (
              <a
                className="inline-flex min-h-11 max-w-full items-center break-all text-primary underline"
                href={assessment.submission.answers.repository_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open repository: {assessment.submission.answers.repository_url}
              </a>
            )}
          {Object.entries(labels).map(([key, label]) => {
            const value = assessment.submission?.answers[key];
            if (value === undefined || value === null || value === "") {
              return null;
            }

            return (
              <div key={key}>
                <h5 className="font-medium">{label}</h5>
                <p className="mt-1 whitespace-pre-wrap break-words">
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value)}
                </p>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            {assessment.submission.files.map(file => (
              <Button
                key={file.id}
                type="button"
                variant="outline"
                className="min-h-11 max-w-full whitespace-normal break-all"
                disabled={busy}
                onClick={() => download(file.id, file.filename)}
              >
                Download {file.filename}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Treat submitted code as untrusted. Review it without execution here;
            any execution must use a separate isolated environment.
          </p>
        </section>
      ) : (
        <p className="rounded-lg border p-4 text-muted-foreground">
          Awaiting candidate submission. Draft answers and files are not
          available for review.
        </p>
      )}
      <section aria-label="Assessment review history" className="space-y-3">
        <h4 className="font-semibold">Review history</h4>
        {!assessment.reviews.length && (
          <p className="text-muted-foreground">No review recorded.</p>
        )}
        {assessment.reviews.map(review => (
          <details
            key={review.id}
            open={assessment.current_review_id === review.id}
            className="rounded-lg border p-3"
          >
            <summary className="min-h-11 cursor-pointer break-words py-3 font-medium">
              {stageLabel(review.outcome)} · {review.details.reviewer_name} ·
              Round {review.review_round + 1}
              {assessment.current_review_id === review.id
                ? " · Current review"
                : " · Earlier review"}
            </summary>
            <p className="mb-3 text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleString()}
            </p>
            <dl className="space-y-3">
              {Object.entries(assessmentDimensions).map(([key, label]) => (
                <div key={key}>
                  <dt className="font-medium">{label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words">
                    {review.details.dimensions[key]}
                  </dd>
                </div>
              ))}
            </dl>
            {review.details.request_kind !== "none" && (
              <p className="mt-3">
                Requested: {stageLabel(review.details.request_kind)}
              </p>
            )}
            {review.details.notes && (
              <p className="mt-2 whitespace-pre-wrap break-words">
                {review.details.notes}
              </p>
            )}
          </details>
        ))}
      </section>
    </div>
  );
}
