import React, { useEffect, useRef, useState } from "react";

import { IndiaHandoff, IndiaHandoffs, IndiaReport, payrollApi } from "./api";
import { exactAmount } from "./amount";
import { errorMessage } from "./paymentLabels";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const statusLabel = (state: string) =>
  ({
    awaiting_payment: "Sent to Accounts — Awaiting Payment",
    uncertain: "Delivery uncertain — review required",
    partially_credited: "Partially credited",
    credited: "Credited",
    queued: "Email queued",
    sending: "Sending email",
    failed: "Email not sent",
    voided: "Voided",
    settlement_blocked:
      "Credit recorded — reimbursement settlement needs review",
  }[state] || state.replace(/_/g, " "));

const issueLabel = (code: string) =>
  ({
    payroll_reference_key_missing:
      "An administrator must configure the stable payroll reference key before any report is sent.",
    run_not_approved:
      "Both assigned reviewers must approve the current revision before sending.",
    line_not_in_revision:
      "Include this consultant in a new payroll revision and obtain both approvals.",
    not_consultant_line:
      "India accounts handoff supports consultant payments. Review this person's engagement type.",
    unsupported_currency: "Prepare the India consultant payment in INR.",
    invalid_net_amount:
      "Review the calculation: the approved INR payable must be positive.",
    terms_missing:
      "Add effective consultant terms on Consultant payroll, then prepare and approve the revision.",
    funding_not_india:
      "This consultant uses Mercury funding. Review their funding terms before using an India account.",
    terms_changed_during_month:
      "Resolve the consultant's mid-month terms change and prepare a reviewed revision.",
    consultant_inactive:
      "Ask an administrator to review this consultant's employment access.",
    bank_profile_incomplete:
      "Complete the account holder, bank name, account number and IFSC in Employee records, then refresh.",
    mercury_activity_exists:
      "A Mercury payment instruction exists. Resolve it before preparing an India payment.",
    split_not_supported:
      "An active or pending spouse split exists. Withdraw it before using the India account; splits use Mercury.",
    creator_no_longer_authorized:
      "The owner who queued this report no longer has active access in this workspace.",
    bank_details_changed:
      "Bank details changed after confirmation. Void this unsent handoff, verify the new details and send a fresh report.",
    terms_changed:
      "Compensation terms changed. Review the terms and prepare a fresh approved report.",
    approved_line_changed:
      "The approved report changed. Reload payroll and review the current revision.",
    report_unavailable:
      "The report could not be prepared. Ask an administrator to check this handoff's delivery logs before retrying.",
    delivery_disabled:
      "Email delivery is disabled on this server. Ask an administrator to enable it before retrying.",
    transport_rejected:
      "The mail provider rejected this recipient. Check the accounts mailbox before retrying.",
    transport_unknown:
      "The mail provider did not confirm delivery. Check the mailbox and provider before resolving this attempt.",
    interrupted:
      "The delivery worker stopped without a known result. Confirm the outcome before resending.",
    delivery_confirmed_absent:
      "Accounts confirmed the previous email was not delivered.",
  }[code] || `Review required: ${code.replace(/_/g, " ")}`);

const Report = ({ report }: { report: IndiaReport }) => (
  <div className="space-y-3 text-sm">
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Contracting entity", report.legal_entity],
        ["Recorded hours", report.recorded_hours],
        ["Working days (hours ÷ 8)", report.working_days],
        ["Monthly fee", exactAmount(report.monthly_fee, "INR", false)],
        ["Confirmed unpaid hours", report.confirmed_unpaid_hours],
        [
          "Adjusted consultancy fee",
          exactAmount(report.amounts.base_minor, "INR"),
        ],
        [
          "Reimbursements",
          exactAmount(report.amounts.reimbursements_minor, "INR"),
        ],
        ["Approved additions", exactAmount(report.amounts.extras_minor, "INR")],
        [
          "Deductions and withholding",
          exactAmount(report.amounts.deductions_minor, "INR"),
        ],
        ["Total INR payable", exactAmount(report.amounts.net_minor, "INR")],
        ["Beneficiary", report.bank.holder],
        [
          "Bank",
          `${report.bank.name} ••••${report.bank.account_mask} · ${report.bank.ifsc}`,
        ],
      ].map(([name, value]) => (
        <div className="min-w-0" key={name}>
          <dt className="text-muted-foreground">{name}</dt>
          <dd className="mt-1 break-words tabular-nums">
            {value || "Unavailable"}
          </dd>
        </div>
      ))}
    </dl>
    {report.reimbursements.length > 0 && (
      <div>
        <h5 className="font-medium">Included reimbursements</h5>
        <ul className="mt-1 space-y-1">
          {report.reimbursements.map((entry, index) => (
            <li className="break-words" key={String(entry.claim_id || index)}>
              {String(entry.label || entry.code)} ·{" "}
              {String(entry.date || "Date unavailable")} ·{" "}
              {exactAmount(String(entry.amount_minor), "INR")}
            </li>
          ))}
        </ul>
      </div>
    )}
    <p className="text-muted-foreground">
      Leave records are included separately in the accounts report. Recorded
      leave is not proof of approved paid leave; missing hours never become an
      automatic deduction.
    </p>
  </div>
);

interface Actions {
  busy: boolean;
  perform: (action: () => Promise<any>) => Promise<boolean>;
  companyId: string;
  runId: string;
}

const Handoff = ({
  handoff,
  busy,
  perform,
  companyId,
  runId,
}: Actions & { handoff: IndiaHandoff }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [evidence, setEvidence] = useState("");
  const [outcome, setOutcome] = useState("delivered");
  const [stopped, setStopped] = useState(false);
  const credit = BigInt(handoff.credited_minor);
  const payable = BigInt(handoff.entitlement_minor);
  const remaining = payable > credit ? payable - credit : 0n;
  const excess = credit > payable ? credit - payable : 0n;
  const action = (
    name: "retry_delivery" | "void" | "reconcile_delivery" | "record_credit",
    payload = {}
  ) =>
    perform(() =>
      payrollApi.indiaHandoffAction(runId, handoff.id, name, companyId, payload)
    );

  return (
    <section
      aria-label={`Handoff ${handoff.id}`}
      className="space-y-4 rounded-md border border-border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium">Accounts handoff #{handoff.id}</h4>
        <Badge variant="outline">{statusLabel(handoff.status)}</Badge>
      </div>
      <p className="break-words text-sm">
        Recipient: {handoff.accounts_email} · Created{" "}
        {new Date(handoff.created_at).toLocaleString()}
      </p>
      {handoff.settlement_blocked && (
        <p role="alert" className="text-sm text-destructive">
          The credit is saved, but reserved reimbursements need reconciliation.
          After correcting the claims, record the same reference, amount and
          date to retry settlement. Do not send another bank payment.
        </p>
      )}
      <Report report={handoff.report} />
      <p className="text-sm tabular-nums">
        Recorded credit: {exactAmount(handoff.credited_minor, "INR")} ·
        Remaining: {exactAmount(remaining.toString(), "INR")}
        {excess > 0n && ` · Overpaid: ${exactAmount(excess.toString(), "INR")}`}
      </p>
      <details>
        <summary className="min-h-10 cursor-pointer py-2.5 text-sm font-medium">
          Delivery and credit history
        </summary>
        <ul className="mt-2 space-y-2 text-sm">
          {handoff.attempts.map(attempt => (
            <li key={attempt.attempt_number}>
              Attempt {attempt.attempt_number}: {statusLabel(attempt.state)} ·{" "}
              {new Date(attempt.created_at).toLocaleString()}
              {attempt.error_code && ` · ${issueLabel(attempt.error_code)}`}
              {attempt.reviewed_at && " · reviewed by accounts"}
            </li>
          ))}
          {handoff.credits.map(entry => (
            <li key={entry.id}>
              Credit {exactAmount(entry.amount_minor, "INR")} on{" "}
              {entry.credited_on} · Evidence #{entry.id}
            </li>
          ))}
        </ul>
      </details>
      {(handoff.actions.retry || handoff.actions.void) && (
        <div className="flex flex-wrap gap-2">
          {handoff.actions.retry && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => action("retry_delivery")}
            >
              Retry unsent email
            </Button>
          )}
          {handoff.actions.void && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => action("void")}
            >
              Void unsent handoff
            </Button>
          )}
        </div>
      )}
      {handoff.actions.reconcile && (
        <form
          className="space-y-3"
          onSubmit={async event => {
            event.preventDefault();
            if (
              await action("reconcile_delivery", {
                outcome,
                evidence_reference: evidence,
                worker_stopped: stopped,
              })
            ) {
              setEvidence("");
              setStopped(false);
            }
          }}
        >
          <p className="text-sm">
            Check the mail provider and accounts mailbox before resolving this
            attempt. An uncertain email must not be resent automatically.
          </p>
          <Label htmlFor={`outcome-${handoff.id}`}>
            Verified delivery outcome
          </Label>
          <select
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            id={`outcome-${handoff.id}`}
            value={outcome}
            onChange={e => setOutcome(e.target.value)}
          >
            <option value="delivered">Confirmed delivered</option>
            <option value="not_delivered">Confirmed not delivered</option>
          </select>
          <Label htmlFor={`evidence-${handoff.id}`}>
            Provider or mailbox evidence reference
          </Label>
          <Input
            id={`evidence-${handoff.id}`}
            required
            maxLength={200}
            value={evidence}
            onChange={e => setEvidence(e.target.value)}
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={stopped}
              onChange={e => setStopped(e.target.checked)}
            />
            I confirmed the previous delivery worker has stopped.
          </label>
          <Button disabled={busy || !stopped}>Record delivery review</Button>
        </form>
      )}
      {handoff.actions.record_credit && (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={async event => {
            event.preventDefault();
            if (
              await action("record_credit", {
                amount,
                credited_on: date,
                reference,
              })
            ) {
              setAmount("");
              setReference("");
            }
          }}
        >
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Record money actually credited to the beneficiary. This records
            accounts evidence and does not send a bank transfer. Partial credit
            keeps reimbursements reserved.
          </p>
          <div className="space-y-1">
            <Label htmlFor={`credit-${handoff.id}`}>Actual INR credit</Label>
            <Input
              id={`credit-${handoff.id}`}
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`date-${handoff.id}`}>Credit date</Label>
            <Input
              id={`date-${handoff.id}`}
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`reference-${handoff.id}`}>
              Bank transaction reference
            </Label>
            <Input
              id={`reference-${handoff.id}`}
              autoComplete="off"
              required
              maxLength={200}
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
          </div>
          <Button
            className="sm:col-span-2 sm:justify-self-start"
            disabled={busy}
          >
            Record confirmed credit
          </Button>
        </form>
      )}
    </section>
  );
};

const QueueForm = ({
  consultant,
  data,
  ...actions
}: Actions & {
  consultant: IndiaHandoffs["consultants"][number];
  data: IndiaHandoffs;
}) => {
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const active = consultant.handoffs.some(
    handoff => handoff.status !== "voided"
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{consultant.payee_name}</h3>
      {!active && (
        <>
          {consultant.preview && <Report report={consultant.preview} />}
          {consultant.blockers.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {consultant.blockers.map(code => (
                <li key={code}>{issueLabel(code)}</li>
              ))}
            </ul>
          )}
          {data.permissions.manage && (
            <form
              className="space-y-3"
              onSubmit={async event => {
                event.preventDefault();
                if (
                  await actions.perform(() =>
                    payrollApi.createIndiaHandoff(
                      actions.runId,
                      actions.companyId,
                      {
                        employment_id: consultant.employment_id,
                        expected_digest: data.revision_digest,
                        accounts_email: email,
                        bank_confirmed: confirmed,
                      }
                    )
                  )
                ) {
                  setEmail("");
                  setConfirmed(false);
                }
              }}
            >
              <Label htmlFor={`accounts-${consultant.employment_id}`}>
                Accounts recipient email
              </Label>
              <Input
                id={`accounts-${consultant.employment_id}`}
                type="email"
                autoComplete="off"
                required
                maxLength={254}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                />
                I verified the beneficiary and recipient mailbox. The email will
                include the full bank account number and confidential payroll
                report.
              </label>
              <Button
                disabled={
                  actions.busy ||
                  !confirmed ||
                  consultant.blockers.length > 0 ||
                  !data.revision_digest
                }
              >
                Send approved report to accounts
              </Button>
            </form>
          )}
        </>
      )}
      {consultant.handoffs.map(handoff => (
        <Handoff key={handoff.id} handoff={handoff} {...actions} />
      ))}
    </div>
  );
};

const IndiaHandoffsPanel = ({
  companyId,
  runId,
}: {
  companyId: string;
  runId: string;
}) => {
  const [data, setData] = useState<IndiaHandoffs | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const controller = new window.AbortController();
    const currentGeneration = ++generation.current;
    payrollApi
      .indiaHandoffs(runId, companyId, controller.signal)
      .then(response => {
        if (
          !controller.signal.aborted &&
          generation.current === currentGeneration
        ) {
          setData(response.data.india_handoffs);
          setError("");
        }
      })
      .catch(reason => {
        if (
          !controller.signal.aborted &&
          generation.current === currentGeneration
        ) {
          setError(errorMessage(reason, issueLabel));
        }
      });

    return () => controller.abort();
  }, [companyId, runId, refresh]);

  const pending = data?.consultants.some(consultant =>
    consultant.handoffs.some(handoff =>
      ["queued", "sending"].includes(handoff.status)
    )
  );

  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setInterval(
      () => setRefresh(value => value + 1),
      5000
    );

    return () => window.clearInterval(timer);
  }, [pending]);

  const perform = async (action: () => Promise<any>) => {
    generation.current += 1;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await action();
      setData(response.data.india_handoffs);
      setNotice("Accounts handoff updated.");

      return true;
    } catch (reason) {
      setError(errorMessage(reason, issueLabel));
      setRefresh(value => value + 1);

      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card role="region" aria-label="India accounts payments">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">India accounts payments</h2>
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => setRefresh(value => value + 1)}
          >
            Refresh India handoffs
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Send approved India-funded consultant reports to accounts, then record
          actual bank credit.
        </p>
      </CardHeader>
      <CardContent className="space-y-6" aria-busy={busy}>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        {!data && !error && (
          <p className="text-sm">Loading India accounts handoffs…</p>
        )}
        {data?.consultants.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No India-funded consultants in this payroll revision.
          </p>
        )}
        {data?.consultants.map(consultant => (
          <QueueForm
            key={consultant.employment_id}
            consultant={consultant}
            data={data}
            companyId={companyId}
            runId={runId}
            busy={busy}
            perform={perform}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default IndiaHandoffsPanel;
