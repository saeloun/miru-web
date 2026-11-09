import React, { useEffect, useRef, useState } from "react";

import { payrollApi, ServicePeriodFee } from "./api";
import { exactAmount } from "./amount";
import { errorMessage, label } from "./paymentLabels";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export default function ServiceFeePanel({
  companyId,
  employmentId,
  month,
  onChanged,
}: {
  companyId: string;
  employmentId: number;
  month: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<ServicePeriodFee | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const initialized = useRef(false);
  const mounted = useRef(true);
  const command = useRef<{
    draft: string;
    attributes: Record<string, string>;
  } | null>(null);
  const id = `service-fee-${employmentId}`;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new window.AbortController();
    setLoading(true);
    setError("");
    payrollApi
      .serviceFee(employmentId, companyId, month, controller.signal)
      .then(response => {
        if (controller.signal.aborted) return;

        if (String(response.data.company_id) !== companyId) {
          setData(null);
          setError("Workspace changed. Reload before reviewing this fee.");

          return;
        }
        const result: ServicePeriodFee = response.data.service_period;
        setData(result);
        setNeedsRefresh(false);
        if (!initialized.current) {
          setAmount(result.current_review?.amount || "");
          setReason(result.current_review?.reason || "");
          initialized.current = true;
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, refresh, employmentId, companyId, month]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || busy || loading || needsRefresh || data.blockers.length) {
      return;
    }

    const draft = JSON.stringify([month, amount, reason]);
    if (command.current?.draft !== draft) {
      command.current = {
        draft,
        attributes: {
          period: month,
          amount,
          reason,
          expected_digest: data.digest,
          expected_review_id: data.current_review?.id || "",
          idempotency_key: window.crypto.randomUUID(),
        },
      };
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await payrollApi.reviewServiceFee(
        employmentId,
        companyId,
        command.current.attributes
      );
      if (!mounted.current) return;

      if (String(response.data.company_id) !== companyId) {
        setNeedsRefresh(true);
        setError("Workspace changed. Reload before continuing.");

        return;
      }
      setData(response.data.service_period);
      command.current = null;
      setNotice(
        response.data.service_period.recorded_review?.current === false
          ? "Earlier save confirmed. A newer basis is current; review it before making a replacement."
          : "Service-period basis saved. Payroll still needs both approvals."
      );
      onChanged();
    } catch (failure) {
      if (!mounted.current) return;

      setError(errorMessage(failure));
      if (failure?.response?.status >= 400 && failure.response.status < 500) {
        command.current = null;
      }

      if (failure?.response?.status === 409) setNeedsRefresh(true);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <details onToggle={event => setOpen(event.currentTarget.open)}>
      <summary className="min-h-10 cursor-pointer text-sm font-medium">
        Service-period fee review
      </summary>
      <div className="space-y-3 rounded-md border border-border p-3">
        <p className="text-sm text-muted-foreground">
          Record the agreed fee for these service dates. Approved unpaid time is
          deducted afterward; reimbursements and withholding stay separate.
        </p>
        {loading && <p role="status">Loading service period…</p>}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm" role="status">
            {notice}
          </p>
        )}
        {needsRefresh && (
          <p className="text-sm">
            Your draft is kept. Refresh the period details before saving again.
          </p>
        )}
        {data && (
          <>
            <p className="text-sm tabular-nums">
              {data.context.service_from} to {data.context.service_to} ·
              Scheduled service: {data.context.scheduled_minutes} minutes ·{" "}
              {label(data.context.payment_source || "no_funding_source")} ·{" "}
              {data.context.legal_entity_name || "Legal entity unavailable"}
            </p>
            {data.context.terms.map(term => (
              <p className="text-sm" key={term.id}>
                Contractual monthly fee from {term.effective_on}:{" "}
                {exactAmount(term.monthly_fee, "INR", false)}
              </p>
            ))}
            {data.current_review && (
              <p className="break-words text-sm">
                Saved period base:{" "}
                {exactAmount(data.current_review.amount, "INR", false)} ·{" "}
                {data.current_review.reason}
                {!data.current_review.current &&
                  " — dates or terms changed; review a new basis."}
              </p>
            )}
            {data.required && !data.current_review?.current && (
              <p className="text-sm">
                An explicit period fee is required before leave and payroll
                review.
              </p>
            )}
            {data.blockers.length > 0 && (
              <ul className="list-disc pl-5 text-sm">
                {data.blockers.map(code => (
                  <li key={code}>{label(code)}</li>
                ))}
              </ul>
            )}
            <form className="space-y-3" onSubmit={save}>
              <fieldset
                className="space-y-3"
                disabled={
                  busy || loading || needsRefresh || data.blockers.length > 0
                }
              >
                <div className="space-y-1">
                  <Label htmlFor={`${id}-amount`}>
                    Service-period base fee (INR)
                  </Label>
                  <Input
                    id={`${id}-amount`}
                    inputMode="decimal"
                    required
                    maxLength={15}
                    pattern="[0-9]{1,12}([.][0-9]{1,2})?"
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`${id}-reason`}>
                    Reason for this period fee
                  </Label>
                  <Textarea
                    id={`${id}-reason`}
                    required
                    maxLength={1000}
                    value={reason}
                    onChange={event => setReason(event.target.value)}
                  />
                </div>
                <Button type="submit">Save service-period basis</Button>
              </fieldset>
            </form>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy || loading}
          onClick={() => setRefresh(value => value + 1)}
        >
          Refresh period details
        </Button>
      </div>
    </details>
  );
}
