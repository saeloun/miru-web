import React, { useEffect, useState } from "react";
import Api from "apis/api";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { failureMessage, quiet } from "../DocumentSignatures/api";
import type { ArchiveFile } from "../DocumentSignatures/types";
import ArtifactFiles from "./Files";

type Archives = {
  company_id: number;
  archives: {
    id: number;
    title: string;
    number: number;
    archived_at: string;
    files: ArchiveFile[];
  }[];
  pagination: { page: number; pages: number };
};

export function ArchiveList({
  companyId,
  userId,
  clientId,
}: {
  companyId: number | string;
  userId?: number | string;
  clientId?: number | string;
}) {
  const [result, setResult] = useState<Archives | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new window.AbortController();
    setResult(null);
    setError("");
    Api.get("/signature_archives", {
      ...quiet,
      signal: controller.signal,
      params: {
        company_id: companyId,
        user_id: userId,
        client_id: clientId,
        page,
      },
    })
      .then(({ data }) => {
        if (controller.signal.aborted) return;

        if (Number(data.company_id) !== Number(companyId)) {
          throw new Error("The workspace changed. Reload this page.");
        }
        setResult(data);
      })
      .catch(failure => {
        if (!controller.signal.aborted) {
          setError(
            failureMessage(
              failure,
              "Signed documents could not be loaded. Try again."
            )
          );
        }
      });

    return () => controller.abort();
  }, [companyId, userId, clientId, page, attempt]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="space-y-2">
          <p role="alert" className="text-destructive">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAttempt(value => value + 1)}
          >
            Try again
          </Button>
        </div>
      ) : !result ? (
        <p role="status">Loading signed documents…</p>
      ) : (
        <>
          {result.archives.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Signed documents will appear here after verification.
            </p>
          )}
          {result.archives.map(archive => (
            <article
              key={archive.id}
              data-signature-archive
              className="space-y-3 rounded-md border border-border p-4"
            >
              <p className="break-words font-semibold">{archive.title}</p>
              <p className="text-sm text-muted-foreground">
                Version {archive.number} · Saved{" "}
                {new Date(archive.archived_at).toLocaleString()}
              </p>
              <ArtifactFiles
                key={`${companyId}:${archive.id}`}
                companyId={companyId}
                revisionId={archive.id}
                files={archive.files}
              />
            </article>
          ))}
          {result.pagination.pages > 1 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={result.pagination.page <= 1}
                onClick={() => setPage(result.pagination.page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {result.pagination.page} of {result.pagination.pages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={result.pagination.page >= result.pagination.pages}
                onClick={() => setPage(result.pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SignedDocuments() {
  const { company } = useUserContext();
  if (!company?.id) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Signed documents</h1>
      <p className="text-sm text-muted-foreground">
        Completed documents are available after Miru verifies and saves the
        signed files.
      </p>
      <ArchiveList key={company.id} companyId={company.id} />
    </div>
  );
}
