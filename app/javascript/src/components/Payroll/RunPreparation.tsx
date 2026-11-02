import React, { useEffect, useState } from "react";

import {
  payrollApi,
  PreparationConsultant,
  RunDetail,
  RunPreparation,
  RunPreparationOptions,
} from "./api";
import { exactAmount } from "./amount";
import { errorMessage, label } from "./paymentLabels";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const fieldClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

export const CreateRunForm = ({
  companyId,
  options,
  onCreated,
}: {
  companyId: string;
  options: RunPreparationOptions;
  onCreated: () => void;
}) => {
  const [month, setMonth] = useState("");
  const [accounts, setAccounts] = useState("");
  const [final, setFinal] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await payrollApi.create(companyId, {
        month,
        accounts_reviewer_id: accounts,
        final_reviewer_id: final,
      });
      onCreated();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Make Payment</h2>
        <p className="text-sm text-muted-foreground">
          Start with a review. This creates a payroll run for accounts to
          prepare; it does not move money.
        </p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={submit}>
          <div className="space-y-1">
            <Label htmlFor="payroll-month">Payroll month</Label>
            <Input
              required
              id="payroll-month"
              type="month"
              value={month}
              onChange={event => setMonth(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="accounts-reviewer">Accounts reviewer</Label>
            <select
              required
              className={fieldClass}
              id="accounts-reviewer"
              value={accounts}
              onChange={event => setAccounts(event.target.value)}
            >
              <option value="">Choose</option>
              {options.accounts_reviewers?.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="final-reviewer">Owner approver</Label>
            <select
              required
              className={fieldClass}
              id="final-reviewer"
              value={final}
              onChange={event => setFinal(event.target.value)}
            >
              <option value="">Choose</option>
              {options.final_reviewers?.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button disabled={busy} type="submit">
              Create payroll run
            </Button>
          </div>
        </form>
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

interface Selection {
  included: boolean;
  unpaid: string;
  reason: string;
  expenseIds: number[];
  acknowledged: boolean;
  earning: string;
  deduction: string;
  withholding: string;
}

const emptySelection: Selection = {
  included: false,
  unpaid: "",
  reason: "",
  expenseIds: [],
  acknowledged: false,
  earning: "",
  deduction: "",
  withholding: "",
};

const ConsultantRow = ({
  consultant,
  selection,
  canPrepare,
  onChange,
}: {
  consultant: PreparationConsultant;
  selection: Selection;
  canPrepare: boolean;
  onChange: (next: Selection) => void;
}) => {
  const id = consultant.employment_id;
  const update = (patch: Partial<Selection>) =>
    onChange({ ...selection, ...patch });

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{consultant.consultant_name}</h3>
        <Badge variant={consultant.ready ? "secondary" : "outline"}>
          {consultant.ready ? "Can be included" : "Not ready for payment"}
        </Badge>
      </div>
      <p className="text-sm tabular-nums text-muted-foreground">
        Expected {consultant.expected_hours ?? "—"} h · Recorded{" "}
        {consultant.recorded_hours ?? "—"} h · Fee estimate{" "}
        {exactAmount(consultant.fee_estimate, "INR", false)} ·{" "}
        {label(consultant.payment_source || "no_funding_source")}
      </p>
      {consultant.not_ready_reasons.length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {consultant.not_ready_reasons.map(reason => (
            <li key={reason}>{label(reason)}</li>
          ))}
        </ul>
      )}
      {consultant.ready && canPrepare && (
        <div className="space-y-3">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input
              aria-label={`Include ${consultant.consultant_name}`}
              checked={selection.included}
              type="checkbox"
              onChange={event => update({ included: event.target.checked })}
            />
            Include in this revision
          </label>
          {selection.included && (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1">
                  <Label htmlFor={`unpaid-${id}`}>Confirmed unpaid hours</Label>
                  <Input
                    id={`unpaid-${id}`}
                    inputMode="decimal"
                    value={selection.unpaid}
                    onChange={event => update({ unpaid: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`reason-${id}`}>Unpaid reason</Label>
                  <Input
                    id={`reason-${id}`}
                    value={selection.reason}
                    onChange={event => update({ reason: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`earning-${id}`}>Other earning (INR)</Label>
                  <Input
                    id={`earning-${id}`}
                    inputMode="decimal"
                    value={selection.earning}
                    onChange={event => update({ earning: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`deduction-${id}`}>
                    Other deduction (INR)
                  </Label>
                  <Input
                    id={`deduction-${id}`}
                    inputMode="decimal"
                    value={selection.deduction}
                    onChange={event =>
                      update({ deduction: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`withholding-${id}`}>Withholding (INR)</Label>
                  <Input
                    id={`withholding-${id}`}
                    inputMode="decimal"
                    value={selection.withholding}
                    onChange={event =>
                      update({ withholding: event.target.value })
                    }
                  />
                </div>
              </div>
              {consultant.eligible_expenses.length > 0 && (
                <fieldset className="space-y-1">
                  <legend className="text-sm font-medium">
                    Reimbursements (never prorated)
                  </legend>
                  {consultant.eligible_expenses.map(claim => (
                    <label
                      className="flex min-h-10 items-center gap-2 text-sm"
                      key={claim.id}
                    >
                      <input
                        checked={selection.expenseIds.includes(claim.id)}
                        type="checkbox"
                        onChange={event =>
                          update({
                            expenseIds: event.target.checked
                              ? [...selection.expenseIds, claim.id]
                              : selection.expenseIds.filter(
                                  value => value !== claim.id
                                ),
                          })
                        }
                      />
                      {claim.date} · {claim.description || "Claim"} ·{" "}
                      {exactAmount(claim.amount, claim.currency, false)} ·{" "}
                      {claim.receipt_count} receipt(s)
                    </label>
                  ))}
                </fieldset>
              )}
              {Object.keys(consultant.excluded_expenses).length > 0 && (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {Object.entries(consultant.excluded_expenses).map(
                    ([reason, count]) => (
                      <li key={reason}>
                        {count} claim(s) excluded: {label(reason)}
                      </li>
                    )
                  )}
                </ul>
              )}
              {consultant.required_acknowledgements.length > 0 && (
                <label className="flex min-h-10 items-start gap-2 text-sm">
                  <input
                    checked={selection.acknowledged}
                    className="mt-1"
                    type="checkbox"
                    onChange={event =>
                      update({ acknowledged: event.target.checked })
                    }
                  />
                  <span>
                    I reviewed:{" "}
                    {consultant.required_acknowledgements
                      .map(code => label(code))
                      .join("; ")}
                    . No deduction is made unless unpaid hours are entered
                    above.
                  </span>
                </label>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const PrepareRevisionPanel = ({
  companyId,
  runId,
  onChanged,
}: {
  companyId: string;
  runId: string;
  onChanged: () => void;
}) => {
  const [data, setData] = useState<RunPreparation | null>(null);
  const [selections, setSelections] = useState<Record<number, Selection>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [key] = useState(() => window.crypto.randomUUID());

  useEffect(() => {
    const controller = new window.AbortController();
    payrollApi
      .preparation(runId, companyId, controller.signal)
      .then(response => setData(response.data))
      .catch(failure => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      });

    return () => controller.abort();
  }, [companyId, runId]);

  if (!data && !error) return <p role="status">Loading consultants…</p>;

  const submit = async () => {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      await payrollApi.revise(runId, companyId, {
        cutoff: data.cutoff,
        expected_digest: data.current_digest,
        idempotency_key: key,
        consultants: data.consultants
          .filter(row => selections[row.employment_id]?.included)
          .map(row => {
            const selection = selections[row.employment_id];

            return {
              employment_id: row.employment_id,
              confirmed_unpaid_hours: selection.unpaid,
              unpaid_reason: selection.reason,
              expense_ids: selection.expenseIds,
              acknowledged: selection.acknowledged,
              other_earning: selection.earning,
              other_deduction: selection.deduction,
              withholding: selection.withholding,
            };
          }),
      });
      onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Accounts preparation</h2>
        <p className="text-sm text-muted-foreground">
          {data?.can_prepare
            ? `Include consultants and record decisions. Claims approved by ${data.cutoff} can be selected. A new revision replaces earlier approvals.`
            : "Only the assigned accounts reviewer can prepare a revision."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.consultants.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No consultants have terms for this month. Add terms in Consultant
            payroll first.
          </p>
        )}
        {data?.consultants.map(row => (
          <ConsultantRow
            canPrepare={data.can_prepare}
            consultant={row}
            key={row.employment_id}
            selection={selections[row.employment_id] || emptySelection}
            onChange={next =>
              setSelections(previous => ({
                ...previous,
                [row.employment_id]: next,
              }))
            }
          />
        ))}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {data?.can_prepare && (
          <Button
            disabled={
              busy ||
              !Object.values(selections).some(selection => selection.included)
            }
            onClick={submit}
          >
            Save revision for approval
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const ApprovalPanel = ({
  companyId,
  run,
  currentUserId,
  onChanged,
}: {
  companyId: string;
  run: RunDetail;
  currentUserId: string;
  onChanged: () => void;
}) => {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const stage =
    run.status === "draft"
      ? "accounts"
      : run.status === "accounts_approved"
      ? "final"
      : null;

  const assigned =
    stage === "accounts" ? run.reviewers.accounts : run.reviewers.final;

  const canApprove =
    stage !== null &&
    assigned?.id === currentUserId &&
    run.review_issues.length === 0;

  const approve = async () => {
    setBusy(true);
    setError("");
    try {
      await payrollApi.approve(run.id, companyId, {
        stage,
        expected_digest: run.revision?.digest,
      });
      onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Payroll approval</h2>
        <p className="text-sm text-muted-foreground">
          {run.status === "approved"
            ? "Both reviewers approved this revision. Selected claims are reserved against this run."
            : stage &&
              `Waiting for ${assigned?.name || "the assigned reviewer"}.`}
        </p>
      </CardHeader>
      {canApprove && (
        <CardContent className="space-y-3">
          <Button disabled={busy} onClick={approve}>
            {stage === "accounts"
              ? "Approve as accounts"
              : "Approve as owner and reserve claims"}
          </Button>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};
