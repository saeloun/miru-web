/* global BeforeUnloadEvent */
import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import PdfPages from "./PdfPages";
import ReviewComments from "./ReviewComments";
import { download } from "./api";
import type { Revision, ReviewComment } from "./types";
import "./signatures.css";

type ReviewData = {
  name: string;
  company_name: string;
  expires_at: string;
  decision: string | null;
  revision: Pick<
    Revision,
    "number" | "title" | "content_digest" | "status" | "documents" | "fields"
  > & {
    recipients: { id: string; name: string; role: string }[];
  };
  comments: ReviewComment[];
  older_before_id: number | null;
};

function Review({ token }: { token: string }) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState({ document: "", page: 1 });
  const request = useCallback(
    async (
      path: string,
      attributes: object = {},
      signal?: InstanceType<typeof window.AbortController>["signal"]
    ) => {
      const response = await window.fetch(`/document-review/${path}`, {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal,
        headers: {
          "Content-Type": "application/json",
          Accept: path === "original" ? "application/pdf" : "application/json",
        },
        body: JSON.stringify({ signature_review: { token, ...attributes } }),
      });
      if (!response.ok) {
        if (response.status === 410) {
          setUnavailable(true);
          setReview(null);
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.errors === "string"
            ? data.errors
            : "The review request failed. Please try again."
        );
      }

      return response;
    },
    [token]
  );

  const loadSource = useCallback(
    async (
      key: string,
      signal?: InstanceType<typeof window.AbortController>["signal"]
    ) =>
      (await request("original", { document_key: key }, signal)).arrayBuffer(),
    [request]
  );

  useEffect(() => {
    const controller = new window.AbortController();
    request("open", {}, controller.signal)
      .then(response => response.json())
      .then(data => {
        if (!controller.signal.aborted) {
          setReview(data.review);
          setPreview({
            document: data.review.revision.documents[0].key,
            page: 1,
          });
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) setError(failure.message);
      });

    return () => controller.abort();
  }, [request]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (body.trim()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);

    return () => window.removeEventListener("beforeunload", guard);
  }, [body]);

  const comment = async (decision?: string) => {
    setBusy(true);
    setError("");
    try {
      const response = await request("comments", { body, decision });
      const data = await response.json();
      setReview(data.review);
      setBody("");
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  const loadOlder = async () => {
    if (!review) return;
    setBusy(true);
    try {
      const response = await request("open", {
        before_id: review.older_before_id,
      });
      const data = await response.json();
      setReview({
        ...data.review,
        comments: [...data.review.comments, ...review.comments],
      });
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signature-workspace mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <p className="text-sm font-semibold">Miru · Private document review</p>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-destructive"
        >
          {error}
        </p>
      )}
      {!review ? (
        <p role="status">
          {unavailable
            ? "Ask the sender for a new review link."
            : error
            ? "Open your original email link to try again."
            : "Loading document…"}
        </p>
      ) : (
        <>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">Review this document</h1>
            <h2 className="break-words font-semibold">
              {review.revision.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              For {review.name} · {review.company_name} · Version{" "}
              {review.revision.number}
            </p>
            <p className="text-sm">
              Review approval is not a signature. This link expires{" "}
              {new Date(review.expires_at).toLocaleString()}.
            </p>
          </header>
          <PdfPages
            documents={review.revision.documents}
            fields={review.revision.fields}
            selected={selected}
            preview={preview}
            setPreview={setPreview}
            loadSource={loadSource}
            select={field => {
              setSelected(field.id);
              setPreview({ document: field.document_id, page: field.page });
            }}
            change={() => undefined}
            editable={false}
          />
          <div className="flex flex-wrap gap-2">
            {review.revision.documents.map(document => (
              <Button
                key={document.key}
                type="button"
                variant="outline"
                className="max-w-full whitespace-normal break-all text-left"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    download(
                      new Blob([await loadSource(document.key)], {
                        type: "application/pdf",
                      }),
                      document.filename
                    );
                  } catch (failure: any) {
                    setError(failure.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Download original: {document.filename}
              </Button>
            ))}
          </div>
          <section
            aria-label="Signing fields"
            className="space-y-2 rounded-lg border border-border p-4"
          >
            <h2 className="font-semibold">Fields prepared for signing</h2>
            <p className="text-sm text-muted-foreground">
              These fields cannot be edited during review. Signatures will be
              collected separately after approval.
            </p>
            <ul className="space-y-2 text-sm">
              {review.revision.fields.map(field => (
                <li key={field.id} className="break-words">
                  <strong>{field.label}</strong> ·{" "}
                  {
                    review.revision.recipients.find(
                      person => person.id === field.recipient_id
                    )?.name
                  }{" "}
                  ·{" "}
                  {
                    review.revision.documents.find(
                      document => document.key === field.document_id
                    )?.filename
                  }
                  , page {field.page}
                  {field.value !== undefined && field.value !== null && (
                    <>
                      {" "}
                      · Prefilled:{" "}
                      {typeof field.value === "boolean"
                        ? field.value
                          ? "Yes"
                          : "No"
                        : field.value}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <ReviewComments
            comments={review.comments}
            older={review.older_before_id}
            busy={busy}
            loadOlder={() => void loadOlder()}
          />
          {review.decision && (
            <p role="status">
              {review.decision === "approved"
                ? "Review approved"
                : "Changes requested"}{" "}
              for version {review.revision.number}.
            </p>
          )}
          <fieldset
            disabled={busy}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <Label htmlFor="review-comment">Review comment</Label>
            <Textarea
              id="review-comment"
              maxLength={4000}
              value={body}
              onChange={event => setBody(event.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!body.trim()}
                onClick={() => void comment()}
              >
                Add comment
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!body.trim()}
                onClick={() => void comment("changes_requested")}
              >
                Request changes
              </Button>
              <Button type="button" onClick={() => void comment("approved")}>
                Approve this version
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Request changes with a comment, or confirm that this exact version
              is ready for the sender's final approval.
            </p>
          </fieldset>
        </>
      )}
    </div>
  );
}

export function mountReview(element: HTMLElement, token: string) {
  createRoot(element).render(<Review token={token} />);
}
