import React from "react";
import { Button } from "../ui/button";
import type { ReviewComment } from "./types";

export default function ReviewComments({
  comments,
  older,
  busy,
  loadOlder,
}: {
  comments: ReviewComment[];
  older: number | null;
  busy: boolean;
  loadOlder: () => void;
}) {
  return (
    <section aria-label="Version comments" className="space-y-3">
      <h3 className="font-semibold">Comments on this version</h3>
      {older && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={loadOlder}
        >
          Load earlier comments
        </Button>
      )}
      {!comments.length && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}
      <ol className="space-y-3">
        {comments.map(comment => (
          <li key={comment.id} className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">
              {comment.author_name} ·{" "}
              {comment.author_kind === "admin" ? "Admin" : "Reviewer"} ·{" "}
              <time dateTime={comment.created_at}>
                {new Date(comment.created_at).toLocaleString()}
              </time>
            </p>
            <p className="whitespace-pre-wrap break-words text-sm">
              {comment.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
