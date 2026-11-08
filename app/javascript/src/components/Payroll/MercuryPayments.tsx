import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  MercuryConsultant,
  MercuryLeg,
  MercuryPayments,
  payrollApi,
} from "./api";
import { errorMessage, eventLabel, label } from "./paymentLabels";
import { exactAmount } from "./amount";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const fieldClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

const when = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "—";

interface Context {
  companyId: string;
  runId: string;
  data: MercuryPayments;
  apply: (action: () => Promise<any>) => Promise<boolean>;
  busy: boolean;
}

const Facts = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {rows.map(([name, value]) => (
      <div className="min-w-0" key={name}>
        <dt className="text-sm text-muted-foreground">{name}</dt>
        <dd className="mt-1 break-words text-sm tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
);

const Setup = ({ companyId, data, apply, busy }: Context) => {
  const { setup, permissions } = data;
  const [token, setToken] = useState("");
  const [environment, setEnvironment] = useState(
    setup.environment || "sandbox"
  );
  const [account, setAccount] = useState("");
  const [legalName, setLegalName] = useState(
    setup.expected_legal_business_name || ""
  );

  const [fee, setFee] = useState(
    setup.wire_fee_minor ? String(Number(setup.wire_fee_minor) / 100) : "15"
  );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const saved = await apply(() =>
      payrollApi.saveConnection(companyId, {
        api_token: token,
        environment,
        source_account_id: account,
        expected_legal_business_name: legalName,
        wire_fee_minor: String(Math.round(Number(fee) * 100)),
      })
    );
    if (saved) setToken("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Mercury setup</h2>
          <Badge variant={setup.verified ? "secondary" : "outline"}>
            {setup.verified ? "Read access verified" : "Verification pending"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Read access does not prove payment capability. Mercury only confirms
          the send-money permission when the first request is made, and a
          different person must approve each request in Mercury.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {setup.configured && (
          <Facts
            rows={[
              ["Environment", setup.environment],
              [
                "Source account",
                setup.verified
                  ? `${setup.account_name} ••••${setup.account_mask}`
                  : setup.source_account_id,
              ],
              ["Legal entity", setup.expected_legal_business_name],
              [
                "OUR fee (configured)",
                exactAmount(setup.wire_fee_minor, "USD"),
              ],
              [
                "Mercury requests",
                setup.writes_enabled
                  ? "Enabled on this server"
                  : "Off on this server",
              ],
              ["Verified", when(setup.verified_at)],
            ]}
          />
        )}
        {permissions.manage && (
          <form className="grid gap-3 md:grid-cols-2" onSubmit={save}>
            <div className="space-y-1">
              <Label htmlFor="mercury-token">
                Scoped API token (never shown again)
              </Label>
              <Input
                autoComplete="off"
                id="mercury-token"
                required={!setup.configured}
                type="password"
                value={token}
                onChange={event => setToken(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mercury-environment">Environment</Label>
              <select
                className={fieldClass}
                id="mercury-environment"
                value={environment}
                onChange={event => setEnvironment(event.target.value)}
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="mercury-account">Source account ID</Label>
              <Input
                id="mercury-account"
                required={!setup.configured}
                value={account}
                onChange={event => setAccount(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mercury-legal-name">Expected legal name</Label>
              <Input
                id="mercury-legal-name"
                required={!setup.configured}
                value={legalName}
                onChange={event => setLegalName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mercury-fee">OUR fee (USD, configured)</Label>
              <Input
                id="mercury-fee"
                inputMode="decimal"
                value={fee}
                onChange={event => setFee(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Button disabled={busy} type="submit">
                Save connection
              </Button>
              {setup.configured && (
                <Button
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    apply(() => payrollApi.verifyConnection(companyId))
                  }
                >
                  Verify read access
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

const SplitPanel = ({
  consultant,
  context,
}: {
  consultant: MercuryConsultant;
  context: Context;
}) => {
  const { companyId, runId, data, apply, busy } = context;
  const { split } = consultant;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    allocation_kind: "percentage",
    allocation_value: "",
    allocated_to: "spouse",
    remainder_to: "consultant",
    bank_account_name: "",
    bank_name: "",
    bank_country: "India",
    bank_account_number: "",
    account_number_confirmation: "",
    bank_ifsc: "",
    bank_swift: "",
  });

  const set = (key: string, value: string) =>
    setForm(previous => ({ ...previous, [key]: value }));

  const fields: [string, string, string?][] = [
    ["bank_account_name", "Spouse legal name (account holder)"],
    ["bank_name", "Bank name"],
    ["bank_country", "Bank country"],
    ["bank_account_number", "Account number", "password"],
    ["account_number_confirmation", "Confirm account number", "password"],
    ["bank_ifsc", "IFSC"],
    ["bank_swift", "SWIFT"],
  ];

  const canReview = data.permissions.manage || data.permissions.accounts_review;

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <h4 className="font-medium">Spouse split</h4>
      {split ? (
        <p className="text-sm">
          {label(split.status)} ·{" "}
          {split.allocation_kind === "percentage"
            ? `${split.allocation_value}%`
            : `INR ${split.allocation_value}`}{" "}
          to {label(split.allocated_to).toLowerCase()}, remainder to{" "}
          {label(split.remainder_to).toLowerCase()} · {split.spouse.name} ·{" "}
          {split.spouse.bank_name} ••••{split.spouse.account_mask} ·{" "}
          {split.spouse.swift_code}. Reimbursements stay with the consultant,
          and income and tax details remain the consultant&apos;s.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No split. The full amount goes to the consultant.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {split?.status === "requested" && data.permissions.accounts_review && (
          <Button
            disabled={busy}
            variant="outline"
            onClick={() =>
              apply(() =>
                payrollApi.splitAction(runId, split.id, "verify", companyId)
              )
            }
          >
            Verify split
          </Button>
        )}
        {split?.status === "verified" && data.permissions.manage && (
          <Button
            disabled={busy}
            variant="outline"
            onClick={() =>
              apply(() =>
                payrollApi.splitAction(runId, split.id, "approve", companyId)
              )
            }
          >
            Approve split
          </Button>
        )}
        {split && split.status !== "withdrawn" && data.permissions.manage && (
          <Button
            disabled={busy}
            variant="outline"
            onClick={() =>
              apply(() =>
                payrollApi.splitAction(runId, split.id, "withdraw", companyId)
              )
            }
          >
            Withdraw split
          </Button>
        )}
        {canReview && (
          <Button variant="outline" onClick={() => setOpen(value => !value)}>
            {split ? "Change split" : "Add spouse split"}
          </Button>
        )}
      </div>
      {open && (
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async event => {
            event.preventDefault();
            const saved = await apply(() =>
              payrollApi.requestSplit(runId, companyId, {
                ...form,
                employment_id: consultant.employment_id,
              })
            );
            if (saved) setOpen(false);
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={`kind-${consultant.employment_id}`}>
              Allocation
            </Label>
            <select
              className={fieldClass}
              id={`kind-${consultant.employment_id}`}
              value={form.allocation_kind}
              onChange={event => set("allocation_kind", event.target.value)}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed_inr">Fixed INR</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`value-${consultant.employment_id}`}>Value</Label>
            <Input
              required
              id={`value-${consultant.employment_id}`}
              inputMode="decimal"
              value={form.allocation_value}
              onChange={event => set("allocation_value", event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`to-${consultant.employment_id}`}>
              Allocated to (the other party gets the remainder)
            </Label>
            <select
              className={fieldClass}
              id={`to-${consultant.employment_id}`}
              value={form.allocated_to}
              onChange={event => {
                set("allocated_to", event.target.value);
                set(
                  "remainder_to",
                  event.target.value === "spouse" ? "consultant" : "spouse"
                );
              }}
            >
              <option value="spouse">Spouse</option>
              <option value="consultant">Consultant</option>
            </select>
          </div>
          {fields.map(([key, name, type]) => (
            <div className="space-y-1" key={key}>
              <Label htmlFor={`${key}-${consultant.employment_id}`}>
                {name}
              </Label>
              <Input
                required
                autoComplete="off"
                id={`${key}-${consultant.employment_id}`}
                type={type || "text"}
                value={form[key]}
                onChange={event => set(key, event.target.value)}
              />
            </div>
          ))}
          <div className="flex items-end">
            <Button disabled={busy} type="submit">
              Request split
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const RecipientLink = ({
  consultant,
  beneficiary,
  context,
}: {
  consultant: MercuryConsultant;
  beneficiary: string;
  context: Context;
}) => {
  const [id, setId] = useState("");
  const inputId = `recipient-${consultant.employment_id}-${beneficiary}`;

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={async event => {
        event.preventDefault();
        const saved = await context.apply(() =>
          payrollApi.linkRecipient(context.companyId, {
            employment_id: consultant.employment_id,
            recipient_id: id,
            beneficiary,
          })
        );
        if (saved) setId("");
      }}
    >
      <div className="min-w-64 flex-1 space-y-1">
        <Label htmlFor={inputId}>
          {label(beneficiary)}: Mercury recipient ID to verify
        </Label>
        <Input
          required
          id={inputId}
          value={id}
          onChange={event => setId(event.target.value)}
        />
      </div>
      <Button disabled={context.busy} type="submit" variant="outline">
        Verify recipient
      </Button>
    </form>
  );
};

const PrepareForm = ({
  consultant,
  context,
}: {
  consultant: MercuryConsultant;
  context: Context;
}) => {
  const { rate } = context.data;
  const [useStored, setUseStored] = useState(rate.available);
  const [manualRate, setManualRate] = useState("");
  const [source, setSource] = useState("");
  const [observed, setObserved] = useState("");
  const id = consultant.employment_id;

  return (
    <form
      className="space-y-3 rounded-md border border-border p-4"
      onSubmit={event => {
        event.preventDefault();
        context.apply(() =>
          payrollApi.prepareMercury(context.runId, context.companyId, {
            employment_id: id,
            expected_digest: context.data.revision_digest,
            ...(useStored
              ? { mode: "exchange_rate" }
              : {
                  mode: "manual",
                  reference_rate: manualRate,
                  source,
                  observed_at: new Date(observed).toISOString(),
                }),
          })
        );
      }}
    >
      <h4 className="font-medium">Reference rate (INR per USD)</h4>
      {rate.available && (
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            checked={useStored}
            type="checkbox"
            onChange={event => setUseStored(event.target.checked)}
          />
          Use Miru&apos;s stored rate {rate.reference_rate} ({rate.source},{" "}
          {rate.date}); buffered {rate.buffered_rate}
        </label>
      )}
      {!useStored && (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor={`rate-${id}`}>Reference rate</Label>
            <Input
              required
              id={`rate-${id}`}
              inputMode="decimal"
              value={manualRate}
              onChange={event => setManualRate(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`source-${id}`}>Rate source</Label>
            <Input
              required
              id={`source-${id}`}
              value={source}
              onChange={event => setSource(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`observed-${id}`}>Observed at</Label>
            <Input
              required
              id={`observed-${id}`}
              type="datetime-local"
              value={observed}
              onChange={event => setObserved(event.target.value)}
            />
          </div>
        </div>
      )}
      <Button disabled={context.busy} type="submit">
        Prepare transfer review
      </Button>
    </form>
  );
};

const Leg = ({ leg, context }: { leg: MercuryLeg; context: Context }) => {
  const { runId, companyId, apply, busy, data } = context;
  const [amount, setAmount] = useState("");
  const [creditedOn, setCreditedOn] = useState("");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [requestId, setRequestId] = useState("");
  const [scan, setScan] = useState<{
    outcome: string;
    candidates: { request_id: string; status: string; created_at: string }[];
  } | null>(null);

  const act = (action: string, payload = {}) =>
    apply(() =>
      payrollApi.legAction(runId, leg.id, action, companyId, payload)
    );

  const reconcile = () =>
    apply(async () => {
      const response = await payrollApi.legAction(
        runId,
        leg.id,
        "reconcile",
        companyId
      );
      setScan(response.data.reconcile);

      return response;
    });

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium">
          {label(leg.beneficiary)} transfer · {leg.recipient.name}
        </h4>
        <Badge variant={leg.released ? "outline" : "secondary"}>
          {label(leg.display_state)}
        </Badge>
      </div>
      <Facts
        rows={[
          ["INR entitlement", exactAmount(leg.entitlement_minor, "INR")],
          ["USD principal", exactAmount(leg.principal_minor, "USD")],
          [
            "OUR fee (configured, company-paid)",
            exactAmount(leg.fee_minor, "USD"),
          ],
          ["Company debit", exactAmount(leg.company_debit_minor, "USD")],
          [
            "Reference and buffered rate",
            `${leg.reference_rate} / ${leg.buffered_rate}`,
          ],
          ["Rate source", `${leg.rate_source} · ${when(leg.rate_observed_at)}`],
          [
            "Quote valid until",
            `${when(leg.rate_valid_until)}${
              leg.quote_expired ? " (expired)" : ""
            }`,
          ],
          ["Fee choice", leg.charge_type.toUpperCase()],
          ["Purpose", `${label(leg.purpose_category)}: ${leg.purpose_info}`],
          [
            "From",
            leg.source_account_mask ? `••••${leg.source_account_mask}` : "—",
          ],
          [
            "To",
            `${leg.recipient.name} ••••${leg.recipient.account_mask} · ${leg.recipient.swift_code}`,
          ],
          [
            "Credited",
            `${exactAmount(leg.credited_minor, "INR")}${
              leg.credit_state !== "none" && leg.shortfall_minor !== "0"
                ? ` · shortfall ${exactAmount(leg.shortfall_minor, "INR")}`
                : ""
            }`,
          ],
          ["Mercury request", leg.provider_request_id || "—"],
          ["Request status", leg.request_status || "—"],
          ["Mercury transaction", leg.provider_transaction_id || "—"],
          ["Transaction status", leg.transaction_status || "—"],
          ["Last checked", when(leg.last_checked_at)],
          [
            "Last issue",
            leg.last_error_code ? label(leg.last_error_code) : "—",
          ],
        ]}
      />
      {!leg.released && leg.credit_state === "none" && (
        <p className="text-sm text-muted-foreground">
          The actual fee is confirmed by Mercury. OUR covers intermediary
          charges, not receiving-bank fees, and the final INR credit stays an
          estimate until accounts confirms it. Mercury approval or a sent status
          does not mean the money was credited.
        </p>
      )}
      {leg.display_state === "returned" && (
        <p className="text-sm">
          This wire came back. Miru can&apos;t replace it yet, so work out the
          next step with accounts. Its history stays here.
        </p>
      )}
      {leg.display_state === "reconciliation_required" && (
        <p className="text-sm">
          {leg.actions.record_credit
            ? "Miru couldn't match this to a single Mercury wire. Check it in Mercury, then record the credit with its bank reference."
            : "Miru is holding this transfer because Mercury's records don't match it. Check it in Mercury with accounts. It can't be replaced from Miru yet."}
        </p>
      )}
      {leg.requester_may_approve === true && (
        <p className="text-sm text-destructive" role="alert">
          Mercury reports the requester may approve this. Have a different
          person approve it.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {leg.actions.submit && (
          <Button
            disabled={busy || !data.setup.writes_enabled}
            onClick={() =>
              act("submit", { expected_digest: leg.frozen_digest })
            }
          >
            {leg.absence_attested
              ? "Retry with the same key"
              : "Create Mercury approval request"}
          </Button>
        )}
        {leg.actions.void && (
          <Button disabled={busy} variant="outline" onClick={() => act("void")}>
            Void and re-quote
          </Button>
        )}
        {leg.actions.refresh && (
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => act("refresh")}
          >
            Refresh bank status
          </Button>
        )}
        {leg.actions.reconcile && (
          <Button disabled={busy} variant="outline" onClick={reconcile}>
            Check Mercury for this request
          </Button>
        )}
      </div>
      {leg.actions.submit && !data.setup.writes_enabled && (
        <p className="text-sm text-muted-foreground">
          Mercury requests are off on this server, so nothing can be sent.
        </p>
      )}
      {leg.display_state === "submission_uncertain" && (
        <div className="space-y-3 rounded-md border border-border p-4">
          <p className="text-sm">
            We don&apos;t know whether Mercury accepted this request, so it may
            exist. An empty search isn&apos;t proof. It can only be retried with
            the same key once accounts records evidence that no request exists,
            and a request Mercury returned must be cancelled there first.
          </p>
          {scan && (
            <div className="text-sm">
              <p>
                {scan.outcome === "candidates"
                  ? "Possible matches. Confirm one only after checking it in Mercury:"
                  : scan.outcome === "none_found"
                  ? "No matching request was listed. This does not prove none exists."
                  : scan.outcome === "incomplete"
                  ? "The list was too long to check completely."
                  : "Linked to the Mercury request."}
              </p>
              <ul className="mt-2 space-y-2">
                {scan.candidates.map(candidate => (
                  <li
                    className="flex flex-wrap items-center gap-2"
                    key={candidate.request_id}
                  >
                    {candidate.request_id} · {candidate.status} ·{" "}
                    {when(candidate.created_at)}
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() =>
                        act("confirm_request", {
                          request_id: candidate.request_id,
                        })
                      }
                    >
                      This is the request
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.permissions.manage && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={event => {
                event.preventDefault();
                act("confirm_request", { request_id: requestId });
              }}
            >
              <div className="min-w-64 flex-1 space-y-1">
                <Label htmlFor={`request-${leg.id}`}>
                  Mercury request ID from the dashboard
                </Label>
                <Input
                  required
                  id={`request-${leg.id}`}
                  value={requestId}
                  onChange={event => setRequestId(event.target.value)}
                />
              </div>
              <Button disabled={busy} type="submit" variant="outline">
                Link this request
              </Button>
            </form>
          )}
          {leg.actions.attest_absence && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={event => {
                event.preventDefault();
                act("attest_absence", { evidence_reference: evidence });
              }}
            >
              <div className="min-w-64 flex-1 space-y-1">
                <Label htmlFor={`evidence-${leg.id}`}>
                  Evidence that no request exists (support case or reference)
                </Label>
                <Input
                  required
                  id={`evidence-${leg.id}`}
                  value={evidence}
                  onChange={event => setEvidence(event.target.value)}
                />
              </div>
              <Button disabled={busy} type="submit" variant="outline">
                Record evidence
              </Button>
            </form>
          )}
        </div>
      )}
      {leg.actions.record_credit && (
        <form
          className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-4"
          onSubmit={event => {
            event.preventDefault();
            act("record_credit", {
              amount,
              credited_on: creditedOn,
              reference,
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor={`amount-${leg.id}`}>Actual INR credited</Label>
            <Input
              required
              id={`amount-${leg.id}`}
              inputMode="decimal"
              value={amount}
              onChange={event => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`date-${leg.id}`}>Credit date</Label>
            <Input
              required
              id={`date-${leg.id}`}
              type="date"
              value={creditedOn}
              onChange={event => setCreditedOn(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`reference-${leg.id}`}>Bank reference</Label>
            <Input
              required
              id={`reference-${leg.id}`}
              value={reference}
              onChange={event => setReference(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button disabled={busy} type="submit" variant="outline">
              Record credit
            </Button>
          </div>
        </form>
      )}
      {leg.actions.resolve_shortfall && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={event => {
            event.preventDefault();
            act("resolve_shortfall", { reason });
          }}
        >
          <div className="min-w-64 flex-1 space-y-1">
            <Label htmlFor={`shortfall-${leg.id}`}>Shortfall resolution</Label>
            <Input
              required
              id={`shortfall-${leg.id}`}
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          </div>
          <Button disabled={busy} type="submit" variant="outline">
            Resolve shortfall
          </Button>
        </form>
      )}
      {leg.events.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            History
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {leg.events.map((event, index) => (
              <li key={index}>
                {eventLabel(event.kind)} · {when(event.created_at)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

const Consultant = ({
  consultant,
  context,
}: {
  consultant: MercuryConsultant;
  context: Context;
}) => {
  const manage = context.data.permissions.manage;
  const unlinked = consultant.recipients.filter(
    recipient => !recipient.linked || !recipient.current
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{consultant.payee_name}</h3>
          <Badge variant="outline">
            {consultant.fully_credited_at
              ? consultant.resolved_shortfall_minor !== "0"
                ? "Fully credited; shortfall resolved"
                : "Fully credited"
              : consultant.legs.some(leg => leg.display_state === "returned")
              ? "Returned. Needs accounts review"
              : consultant.legs.some(
                  leg =>
                    !leg.released &&
                    leg.display_state === "reconciliation_required"
                )
              ? "Needs reconciliation"
              : consultant.legs.some(leg => !leg.released)
              ? "In progress"
              : consultant.blockers.length
              ? "Not ready for payment"
              : "Ready to prepare"}
          </Badge>
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {consultant.run_approved ? "Approved total" : "Revision total"}{" "}
          {exactAmount(consultant.entitlement_minor, "INR")}, of which
          reimbursements {exactAmount(consultant.reimbursement_minor, "INR")}
          {consultant.combined_company_debit_minor !== "0" && (
            <>
              . Combined company debit{" "}
              {exactAmount(consultant.combined_company_debit_minor, "USD")}
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {consultant.settled_claims_need_review && (
          <p className="text-sm text-destructive" role="alert">
            Reimbursements were marked paid when this was fully credited, and a
            transfer has since failed or been returned. Review those claims with
            accounts.
          </p>
        )}
        {consultant.blockers.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {consultant.blockers.map(code => (
              <li key={code}>{label(code)}</li>
            ))}
          </ul>
        )}
        {consultant.allocations.length > 0 && (
          <p className="text-sm tabular-nums">
            {consultant.allocations
              .map(
                allocation =>
                  `${label(allocation.beneficiary)}: ${exactAmount(
                    allocation.amount_minor,
                    "INR"
                  )}`
              )
              .join(" · ")}
          </p>
        )}
        <SplitPanel consultant={consultant} context={context} />
        {consultant.recipients
          .filter(recipient => recipient.linked && recipient.current)
          .map(recipient => (
            <div className="space-y-2" key={recipient.beneficiary}>
              <p className="text-sm">
                {label(recipient.beneficiary)} recipient last verified against
                the Miru profile: {recipient.name} ••••{recipient.account_mask}{" "}
                · {recipient.swift_code}
              </p>
              {manage && (
                <details>
                  <summary className="cursor-pointer text-sm">
                    Verify again or use another recipient
                  </summary>
                  <div className="mt-2">
                    <RecipientLink
                      beneficiary={recipient.beneficiary}
                      consultant={consultant}
                      context={context}
                    />
                  </div>
                </details>
              )}
            </div>
          ))}
        {manage &&
          unlinked.map(recipient => (
            <RecipientLink
              beneficiary={recipient.beneficiary}
              consultant={consultant}
              context={context}
              key={recipient.beneficiary}
            />
          ))}
        {consultant.can_prepare && (
          <PrepareForm consultant={consultant} context={context} />
        )}
        {consultant.legs.map(leg => (
          <Leg context={context} key={leg.id} leg={leg} />
        ))}
      </CardContent>
    </Card>
  );
};

const MercuryPaymentsPanel = ({
  companyId,
  runId,
}: {
  companyId: string;
  runId: string;
}) => {
  const [data, setData] = useState<MercuryPayments | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center" });
  }, [error]);

  useEffect(() => {
    const controller = new window.AbortController();
    payrollApi
      .mercury(runId, companyId, controller.signal)
      .then(response => setData(response.data.mercury_payments))
      .catch(failure => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      });

    return () => controller.abort();
  }, [companyId, runId, refresh]);

  const apply = useCallback(async (action: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setRefresh(value => value + 1);

      return true;
    } catch (failure) {
      setError(errorMessage(failure));
      setRefresh(value => value + 1);

      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  if (!data) {
    return error ? (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    ) : (
      <p role="status">Loading Mercury payments…</p>
    );
  }

  const context: Context = { companyId, runId, data, apply, busy };
  const consultants = data.consultants.filter(
    consultant =>
      !consultant.blockers.includes("funding_not_mercury") ||
      consultant.legs.length > 0
  );
  if (data.consultants.length > 0 && consultants.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Mercury payments</h2>
      {error && (
        <p className="text-sm text-destructive" ref={errorRef} role="alert">
          {error}
        </p>
      )}
      <Setup {...context} />
      {consultants.length ? (
        consultants.map(consultant => (
          <Consultant
            consultant={consultant}
            context={context}
            key={consultant.employment_id}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No revision yet. Accounts prepares one above.
        </p>
      )}
    </section>
  );
};

export default MercuryPaymentsPanel;
