import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import Picker from "./Picker";
import Pager from "./Pager";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import {
  emailStateLabels,
  receiptLabel,
  type Choice,
  type ReceiptDetailPage,
  type ReceiptPage,
} from "./types";

export default function Inbox({ companyId }: { companyId: number }) {
  const navigate = useNavigate();
  const [data, setData] = useState<ReceiptPage | null>(null);
  const [state, setState] = useState("review");
  const [filterMailbox, setFilterMailbox] = useState<Choice | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadMailbox, setUploadMailbox] = useState<Choice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    read<ReceiptPage>(
      "receipts",
      companyId,
      { state: state || undefined, mailbox_id: filterMailbox?.id, page },
      controller.signal
    )
      .then(result => {
        if (active) setData(result);
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, state, filterMailbox?.id, page, refresh]);

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !uploadMailbox || busy) return;

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("Choose an email file of at most 20 MB.");

      return;
    }
    setBusy(true);
    setUploadError("");
    const body = new FormData();
    body.append("hiring_receipt[company_id]", String(companyId));
    body.append("hiring_receipt[mailbox_id]", String(uploadMailbox.id));
    body.append("hiring_receipt[file]", file);
    try {
      const { data: result } = await Api.post<ReceiptDetailPage>(
        "/hiring/receipts",
        body,
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) navigate(`/hiring/inbox/${result.receipt.id}`);
    } catch (failure) {
      if (mounted.current) setUploadError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Email inbox</h2>
          <p className="text-sm text-muted-foreground">
            Review uncertain mail and preserve the source of every application.
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/hiring/mailboxes">Manage inboxes</Link>
        </Button>
      </header>
      <form
        aria-label="Retain email"
        onSubmit={upload}
        className="space-y-3 rounded-lg border bg-card p-4"
      >
        <h3 className="font-semibold">Retain an email file</h3>
        <p className="text-sm text-muted-foreground">
          Upload an original .eml file, up to 20 MB. New applications identified
          during processing may receive your approved acknowledgement.
        </p>
        <fieldset
          disabled={busy}
          className="grid min-w-0 items-end gap-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <Picker
            id="upload-mailbox"
            label="Destination inbox"
            kind="mailboxes"
            purpose="intake"
            companyId={companyId}
            value={uploadMailbox}
            change={setUploadMailbox}
            emptyLabel="Choose an inbox"
          />
          <div className="min-w-0 space-y-2">
            <Label htmlFor="email-file">Email file</Label>
            <Input
              id="email-file"
              type="file"
              accept=".eml,message/rfc822"
              className="h-11 min-w-0 max-w-full"
              onChange={event => {
                setFile(event.target.files?.[0] || null);
                setUploadError("");
              }}
            />
          </div>
          <Button
            type="submit"
            className="min-h-11"
            disabled={!file || !uploadMailbox}
          >
            {busy ? "Retaining…" : "Retain email"}
          </Button>
        </fieldset>
        {uploadError && (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        )}
      </form>
      <section
        aria-label="Email filters"
        className="grid items-end gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]"
      >
        <div className="space-y-2">
          <Label htmlFor="email-state">Email status</Label>
          <select
            id="email-state"
            value={state}
            onChange={event => {
              setState(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All emails</option>
            {Object.entries(emailStateLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Picker
          id="filter-mailbox"
          label="Source inbox"
          kind="mailboxes"
          purpose="history"
          companyId={companyId}
          value={filterMailbox}
          change={value => {
            setFilterMailbox(value);
            setPage(1);
          }}
          emptyLabel="All inboxes"
        />
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => setRefresh(value => value + 1)}
        >
          Reload emails
        </Button>
      </section>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!data && !error && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading retained emails…
        </p>
      )}
      {data && (
        <>
          {data.receipts.length === 0 && (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              No emails match this view.
            </p>
          )}
          <ul aria-label="Retained emails" className="space-y-3">
            {data.receipts.map(receipt => (
              <li
                key={receipt.id}
                className="min-w-0 space-y-2 rounded-lg border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    className="min-w-0 break-words font-semibold text-primary underline-offset-4 hover:underline"
                    to={`/hiring/inbox/${receipt.id}`}
                  >
                    {receipt.subject || "Email awaiting processing"}
                  </Link>
                  <Badge variant="secondary">
                    {emailStateLabels[receipt.state]}
                  </Badge>
                </div>
                <p className="break-all text-sm text-muted-foreground">
                  {receipt.mailbox.name} · {receipt.mailbox.source_email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Received {receiptLabel(receipt.received_at, data.time_zone)}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Received times: {data.time_zone}
          </p>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={false}
          />
        </>
      )}
    </div>
  );
}
