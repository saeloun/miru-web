import React, { useEffect, useRef, useState } from "react";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { failureMessage, quiet, verifyWorkspace } from "./api";
import { type HiringMessage, type ReceiptDetailPage } from "./types";

export default function DeliveryReview({
  companyId,
  receiptId,
  message,
  onSaved,
  onDirtyChange,
}: {
  companyId: number;
  receiptId: number;
  message: HiringMessage;
  onSaved: (result: ReceiptDetailPage) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [outcome, setOutcome] = useState("");
  const [evidence, setEvidence] = useState("");
  const [workerStopped, setWorkerStopped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    onDirtyChange(Boolean(outcome || evidence || workerStopped));
  }, [outcome, evidence, workerStopped, onDirtyChange]);

  const save = async () => {
    if (
      busy ||
      !outcome ||
      !evidence.trim() ||
      (outcome === "not_accepted" && !workerStopped)
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data: result } = await Api.post<ReceiptDetailPage>(
        `/hiring/receipts/${receiptId}/messages/${message.id}/reconcile`,
        {
          hiring_message: {
            company_id: companyId,
            lock_version: message.lock_version,
            outcome,
            evidence,
            worker_stopped: workerStopped,
          },
        },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (mounted.current) onSaved(result);
    } catch (failure) {
      if (mounted.current) setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <form
      aria-label={`Review delivery attempt ${message.attempt_number}`}
      className="space-y-3 rounded-md border p-3"
      onSubmit={event => {
        event.preventDefault();
        void save();
      }}
    >
      <h4 className="font-semibold">Review unknown delivery</h4>
      <p className="text-sm text-muted-foreground">
        Check provider records and the original job’s outcome. This records your
        review without sending an email or changing Miru’s observed SMTP result.
        The recorded review and evidence cannot be edited.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} Reload email before trying again.
        </p>
      )}
      <fieldset disabled={busy} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`delivery-outcome-${message.id}`}>
            Verified provider outcome
          </Label>
          <select
            id={`delivery-outcome-${message.id}`}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
            required
            value={outcome}
            onChange={event => {
              setOutcome(event.target.value);
              setWorkerStopped(false);
            }}
          >
            <option value="">Choose a verified outcome</option>
            <option value="accepted">Mail server accepted</option>
            <option value="not_accepted">Mail server did not accept</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`delivery-evidence-${message.id}`}>
            Evidence for this review
          </Label>
          <Textarea
            id={`delivery-evidence-${message.id}`}
            required
            maxLength={2000}
            value={evidence}
            onChange={event => setEvidence(event.target.value)}
          />
        </div>
        {outcome === "not_accepted" && (
          <>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                required
                checked={workerStopped}
                onChange={event => setWorkerStopped(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span>Original worker has stopped</span>
            </label>
            <p className="text-sm text-muted-foreground">
              Confirm both that the original worker cannot resume and that the
              provider did not accept this message. An incorrect confirmation
              can cause duplicate email if you later authorize a retry.
            </p>
          </>
        )}
        <Button type="submit" className="min-h-11" disabled={Boolean(error)}>
          {busy ? "Recording…" : "Record delivery review"}
        </Button>
      </fieldset>
    </form>
  );
}
