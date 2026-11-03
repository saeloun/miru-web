import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  download,
  failureMessage,
  originalBytes,
} from "../DocumentSignatures/api";
import type { ArchiveFile } from "../DocumentSignatures/types";

export default function ArtifactFiles({
  companyId,
  revisionId,
  files,
}: {
  companyId: string | number;
  revisionId: number;
  files: ArchiveFile[];
}) {
  const [controller] = useState(() => new window.AbortController());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => controller.abort(), [controller]);

  const save = async (file: ArchiveFile) => {
    setBusy(true);
    setError("");
    try {
      const path = `/signature_archives/${revisionId}/files/${encodeURIComponent(
        file.key
      )}?company_id=${encodeURIComponent(companyId)}`;
      const bytes = await originalBytes(path, controller.signal);
      if (!controller.signal.aborted) {
        download(new Blob([bytes], { type: "application/pdf" }), file.filename);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(
          failureMessage(
            failure,
            "The signed file could not be downloaded. Try again."
          )
        );
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {busy && <p role="status">Downloading…</p>}
      <ul className="space-y-2">
        {files.map(file => (
          <li key={file.key}>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="h-auto min-h-10 max-w-full whitespace-normal break-words text-left"
              onClick={() => void save(file)}
            >
              {file.filename}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
