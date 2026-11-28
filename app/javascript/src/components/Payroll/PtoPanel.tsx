import React, { useEffect, useState } from "react";
import http from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { errorMessage, label } from "./paymentLabels";
import { exactAmount } from "./amount";

export interface PtoFacts {
  digest: string;
  policy_id: number | null;
  decision_id?: number | null;
  decision?: string | null;
  opening_hours?: string;
  accrued_hours?: string;
  closing_hours?: string;
  paid_hours?: string;
  unpaid_hours?: string;
  advance_hours?: string;
  deferred_hours?: string;
  unresolved_hours?: string;
  gap_hours?: string;
  gap_minutes?: string;
  blockers: string[];
}

interface Obligation {
  origin_entry_id: number;
  origin_component: string;
  period: string;
  kind: string;
  remaining_hours: string;
  accrued_recovery_hours: string;
  debt: boolean;
  review: string | null;
}

interface CashCase {
  entry_id: number;
  origin_entry_id: number | null;
  origin_component: string | null;
  period: string;
  hours: string;
  amount_minor: string | null;
  state: string;
  recovery_id: number | null;
  payroll_run_id: number | null;
  can_review_credit?: boolean;
  original_period?: string;
  accrued_recovery_hours?: string;
}

interface PtoData {
  facts: PtoFacts;
  can_manage: boolean;
  policy: Record<string, string> | null;
  obligations: Obligation[];
  cash_cases: CashCase[];
  history: {
    id: number;
    period: string;
    kind: string;
    hours: string;
    cash_amount_minor: string;
    reason: string;
    actor_name: string;
  }[];
}

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const treatments = [
  ["paid", "Approve paid PTO"],
  ["unpaid", "Deduct confirmed unpaid this month"],
  ["advance", "Allow advance PTO"],
  ["defer", "Defer recovery with full pay"],
  ["waive", "Waive with a reason"],
  ["correction", "Request correction"],
];

const policyFields = [
  ["effective_on", "PTO effective date", "date"],
  ["opening_on", "Opening as of", "date"],
  ["opening_hours", "Reconciled opening hours", "text"],
  ["monthly_accrual_hours", "Monthly accrual hours", "text"],
  ["accrual_day", "Accrual day", "text"],
  ["leave_year_month", "Leave year start month", "text"],
  ["leave_year_day", "Leave year start day", "text"],
  ["advance_limit_hours", "Advance limit hours", "text"],
  ["exception_threshold_hours", "Unexplained hours threshold", "text"],
  ["negative_threshold_hours", "Negative balance threshold", "text"],
  ["evidence", "Opening evidence reference", "text"],
  ["reason", "Policy approval reason", "text"],
];

const allocationFields = [
  ["paid", "Paid allocation hours"],
  ["advance", "Advance allocation hours"],
  ["unpaid", "Unpaid allocation hours"],
  ["defer", "Deferred allocation hours"],
  ["waive", "Waived allocation hours"],
  ["correction", "Correction allocation hours"],
];

export const PtoSummary = ({ facts }: { facts?: PtoFacts | null }) => (
  <section aria-label="Approved PTO facts" className="space-y-3">
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
      {[
        ["Opening PTO hours", facts?.opening_hours],
        ["Accrued PTO hours", facts?.accrued_hours],
        ["Approved paid leave hours", facts?.paid_hours],
        ["Advance PTO hours", facts?.advance_hours],
        ["Confirmed unpaid hours", facts?.unpaid_hours],
        ["Deferred hours", facts?.deferred_hours],
        ["Unresolved hours", facts?.unresolved_hours],
        ["Closing PTO hours", facts?.closing_hours],
      ].map(([name, value]) => (
        <React.Fragment key={name}>
          <dt>{name}</dt>
          <dd className="tabular-nums">{value ?? "Unavailable"}</dd>
        </React.Fragment>
      ))}
    </dl>
    {facts?.blockers.length ? (
      <ul className="list-disc pl-5 text-sm">
        {facts.blockers.map(code => (
          <li key={code}>{label(code)}</li>
        ))}
      </ul>
    ) : null}
  </section>
);

const ObligationForm = ({
  row,
  busy,
  onSubmit,
}: {
  row: Obligation;
  busy: boolean;
  onSubmit: (attributes: Record<string, string>) => Promise<void>;
}) => {
  const [kind, setKind] = useState("");
  const [reason, setReason] = useState("");
  const [rate, setRate] = useState<Record<string, string>>({});
  const id = `pto-history-${row.origin_entry_id}-${row.origin_component}`;

  return (
    <form
      className="space-y-3 rounded-md border border-border p-3"
      onSubmit={async event => {
        event.preventDefault();
        await onSubmit({
          kind,
          reason,
          origin_entry_id: String(row.origin_entry_id),
          origin_component: row.origin_component,
          ...(kind === "unpaid" ? rate : {}),
        });
      }}
    >
      <p className="text-sm tabular-nums">
        {row.period} · {label(row.kind)} · Outstanding {row.remaining_hours} h ·
        Already recovered through accrual {row.accrued_recovery_hours} h
      </p>
      {row.review && (
        <p className="text-sm">Latest review: {label(row.review)}</p>
      )}
      <Label htmlFor={`${id}-kind`}>Historical treatment</Label>
      <select
        className={inputClass}
        disabled={busy}
        id={`${id}-kind`}
        required
        value={kind}
        onChange={event => setKind(event.target.value)}
      >
        <option value="">Choose an explicit treatment</option>
        {treatments
          .filter(
            ([value]) => value !== "paid" && (value !== "advance" || !row.debt)
          )
          .map(([value, name]) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
      </select>
      <Label htmlFor={`${id}-reason`}>Historical decision reason</Label>
      <Textarea
        disabled={busy}
        id={`${id}-reason`}
        maxLength={1000}
        required
        value={reason}
        onChange={event => setReason(event.target.value)}
      />
      {kind === "unpaid" && (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["rate_amount", "Approved historical amount (INR)"],
            ["rate_hours", "Approved historical hours basis"],
            ["rate_reference", "Historical rate evidence reference"],
          ].map(([key, name]) => (
            <div className="space-y-1" key={key}>
              <Label htmlFor={`${id}-${key}`}>{name}</Label>
              <Input
                disabled={busy}
                id={`${id}-${key}`}
                required
                value={rate[key] || ""}
                onChange={event =>
                  setRate(previous => ({
                    ...previous,
                    [key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
          <p className="text-sm text-muted-foreground md:col-span-2">
            Only the outstanding quantity is recoverable. No current or
            historical rate is chosen automatically. Accounts and owner must
            approve a new payroll revision before any payment.
          </p>
        </div>
      )}
      <Button disabled={busy} type="submit">
        Approve historical treatment
      </Button>
    </form>
  );
};

const CreditReviewForm = ({
  recoveryId,
  busy,
  onSubmit,
}: {
  recoveryId: number;
  busy: boolean;
  onSubmit: (attributes: Record<string, string>) => Promise<void>;
}) => {
  const [reason, setReason] = useState("");

  return (
    <form
      className="space-y-2"
      onSubmit={async event => {
        event.preventDefault();
        await onSubmit({ reason, expected_recovery_id: String(recoveryId) });
      }}
    >
      <p>
        Only the assigned owner can resolve this review after full credit on the
        exact approved revision is independently reverified. A confirmed bank
        reversal cannot be cleared here.
      </p>
      <Label htmlFor={`pto-credit-review-${recoveryId}`}>
        Prior credit review reason and evidence
      </Label>
      <Textarea
        disabled={busy}
        id={`pto-credit-review-${recoveryId}`}
        required
        maxLength={1000}
        value={reason}
        onChange={event => setReason(event.target.value)}
      />
      <Button disabled={busy} type="submit">
        Confirm prior credit review
      </Button>
    </form>
  );
};

export const PtoPanel = ({
  companyId,
  employmentId,
  month,
  onChanged,
}: {
  companyId: string;
  employmentId: number;
  month: string;
  onChanged: () => void;
}) => {
  const [data, setData] = useState<PtoData | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [configuration, setConfiguration] = useState<Record<
    string,
    string
  > | null>(null);
  const [kind, setKind] = useState("");
  const [allocationHours, setAllocationHours] = useState<
    Record<string, string>
  >({});
  const [reason, setReason] = useState("");
  const [through, setThrough] = useState("");
  const [command, setCommand] = useState(() => window.crypto.randomUUID());

  useEffect(() => {
    const controller = new window.AbortController();
    setData(null);
    http
      .get(`/payroll_pto/${employmentId}`, {
        params: { company_id: companyId, month },
        signal: controller.signal,
      })
      .then(response => setData(response.data))
      .catch(failure => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      });

    return () => controller.abort();
  }, [companyId, employmentId, month, revision]);

  const mutate = async (path: string, attributes: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      await http.post(`/payroll_pto/${employmentId}/${path}`, {
        company_id: companyId,
        ...attributes,
      });
      setCommand(window.crypto.randomUUID());
      setConfiguration(null);
      setKind("");
      setAllocationHours({});
      setReason("");
      setRevision(value => value + 1);
      onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const decide = async (attributes: Record<string, unknown>) => {
    if (!data) return;
    await mutate("decisions", {
      pto_decision: {
        ...attributes,
        period: `${month}-01`,
        expected_digest: data.facts.digest,
        idempotency_key: command,
      },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Approved leave is separate from recorded work. Missing hours and
        historical negative balances never cause an automatic deduction.
        Decisions change the source and require fresh payroll approval.
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading approved PTO facts…</p>}
      {data && (
        <>
          <PtoSummary facts={data.facts} />
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => {
              setError("");
              setKind("");
              setReason("");
              setCommand(window.crypto.randomUUID());
              setRevision(value => value + 1);
            }}
          >
            Refresh leave facts
          </Button>
          {data.can_manage && (
            <>
              {!configuration && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    setConfiguration(
                      Object.fromEntries([
                        ...policyFields.map(([key]) => [
                          key,
                          data.policy?.[key] ||
                            (key === "effective_on" || key === "opening_on"
                              ? `${month}-01`
                              : ""),
                        ]),
                        ["carry_rule", data.policy?.carry_rule || ""],
                        ["rate_basis", data.policy?.rate_basis || ""],
                      ])
                    )
                  }
                >
                  {data.policy
                    ? "Append approved PTO policy"
                    : "Configure approved PTO policy"}
                </Button>
              )}
              {configuration && (
                <form
                  className="space-y-3"
                  onSubmit={async event => {
                    event.preventDefault();
                    await mutate("policy", {
                      pto_policy: {
                        ...configuration,
                        idempotency_key: command,
                      },
                    });
                  }}
                >
                  <p className="text-sm">
                    Enter the approved engagement policy and reconciled opening.
                    Zero must be entered explicitly when applicable. Year-end
                    carry or expiry requires owner review.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {policyFields.map(([key, name, type]) => (
                      <div className="space-y-1" key={key}>
                        <Label htmlFor={`pto-${employmentId}-${key}`}>
                          {name}
                        </Label>
                        <Input
                          disabled={busy}
                          id={`pto-${employmentId}-${key}`}
                          readOnly={
                            !!data.policy &&
                            ["opening_hours", "opening_on"].includes(key)
                          }
                          required
                          type={type}
                          value={configuration[key]}
                          onChange={event =>
                            setConfiguration(previous => ({
                              ...previous,
                              [key]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div className="space-y-1">
                      <Label htmlFor={`pto-${employmentId}-carry`}>
                        Carry and expiry treatment
                      </Label>
                      <select
                        className={inputClass}
                        id={`pto-${employmentId}-carry`}
                        required
                        value={configuration.carry_rule}
                        onChange={event =>
                          setConfiguration(previous => ({
                            ...previous,
                            carry_rule: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose</option>
                        <option value="review">
                          Owner review at leave-year boundary
                        </option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`pto-${employmentId}-rate`}>
                        Historical recovery rate basis
                      </Label>
                      <select
                        className={inputClass}
                        id={`pto-${employmentId}-rate`}
                        required
                        value={configuration.rate_basis}
                        onChange={event =>
                          setConfiguration(previous => ({
                            ...previous,
                            rate_basis: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose</option>
                        <option value="origin_period_fee">
                          Explicit approved origin-period amount and hours
                        </option>
                      </select>
                    </div>
                  </div>
                  <Button disabled={busy} type="submit">
                    Approve PTO policy
                  </Button>
                  <Button
                    disabled={busy}
                    type="button"
                    variant="outline"
                    onClick={() => setConfiguration(null)}
                  >
                    Cancel policy
                  </Button>
                </form>
              )}
              {data.facts.policy_id && (
                <>
                  {Number(data.facts.gap_hours) === 0 &&
                    data.facts.decision_id &&
                    data.facts.blockers.includes(
                      "pto_decision_source_changed"
                    ) && (
                      <form
                        className="space-y-3"
                        onSubmit={async event => {
                          event.preventDefault();
                          await decide({ kind: "correction", reason });
                        }}
                      >
                        <p className="text-sm">
                          Corrected work leaves no scheduled gap. Clear the
                          obsolete leave allocation and retain its history.
                        </p>
                        <Label htmlFor={`pto-${employmentId}-clearance`}>
                          Clearance reason
                        </Label>
                        <Textarea
                          disabled={busy}
                          id={`pto-${employmentId}-clearance`}
                          maxLength={1000}
                          required
                          value={reason}
                          onChange={event => setReason(event.target.value)}
                        />
                        <Button disabled={busy} type="submit">
                          Clear obsolete leave decision
                        </Button>
                      </form>
                    )}
                  {Number(data.facts.gap_hours) > 0 && (
                    <form
                      className="space-y-3"
                      onSubmit={async event => {
                        event.preventDefault();
                        await decide({
                          kind,
                          reason,
                          ...(kind === "allocation"
                            ? {
                                allocations: Object.entries(allocationHours)
                                  .filter(
                                    ([, hours]) =>
                                      hours === "remaining" ||
                                      (hours.trim() !== "" &&
                                        Number(hours) !== 0)
                                  )
                                  .map(([partKind, hours]) => ({
                                    kind: partKind,
                                    hours,
                                  })),
                              }
                            : {}),
                        });
                      }}
                    >
                      <p className="text-sm tabular-nums">
                        Scheduled hours requiring a decision:{" "}
                        {data.facts.gap_hours}. This action approves their
                        treatment, not the recorded timesheets.
                      </p>
                      <Label htmlFor={`pto-${employmentId}-kind`}>
                        Current leave treatment
                      </Label>
                      <select
                        className={inputClass}
                        disabled={busy}
                        id={`pto-${employmentId}-kind`}
                        required
                        value={kind}
                        onChange={event => setKind(event.target.value)}
                      >
                        <option value="">Choose an explicit treatment</option>
                        {treatments.map(([value, name]) => (
                          <option key={value} value={value}>
                            {name}
                          </option>
                        ))}
                        <option value="allocation">
                          Approve an explicit split
                        </option>
                      </select>
                      {kind === "allocation" && (
                        <fieldset className="grid gap-3 md:grid-cols-2">
                          <legend className="text-sm">
                            Approve each portion. Positive allocations must
                            total the scheduled source gap exactly. A correction
                            portion keeps payroll blocked.
                          </legend>
                          <div className="space-y-1 md:col-span-2">
                            <Label htmlFor={`pto-${employmentId}-remaining`}>
                              Treatment for remaining gap
                            </Label>
                            <select
                              className={inputClass}
                              disabled={busy}
                              id={`pto-${employmentId}-remaining`}
                              value={
                                Object.keys(allocationHours).find(
                                  key => allocationHours[key] === "remaining"
                                ) || ""
                              }
                              onChange={event => {
                                const selected = event.target.value;
                                setAllocationHours(previous => ({
                                  ...Object.fromEntries(
                                    Object.entries(previous).map(
                                      ([key, hours]) => [
                                        key,
                                        hours === "remaining" ? "" : hours,
                                      ]
                                    )
                                  ),
                                  ...(selected
                                    ? { [selected]: "remaining" }
                                    : {}),
                                }));
                              }}
                            >
                              <option value="">
                                Enter every portion explicitly
                              </option>
                              {treatments.map(([value, name]) => (
                                <option key={value} value={value}>
                                  {name}
                                </option>
                              ))}
                            </select>
                            <p className="text-sm tabular-nums text-muted-foreground">
                              Exact source gap:{" "}
                              {data.facts.gap_minutes ?? "Unavailable"} minutes.{" "}
                              The chosen treatment receives the exact source gap
                              left after the other entered hours.
                            </p>
                          </div>
                          {allocationFields.map(([key, name]) => (
                            <div className="space-y-1" key={key}>
                              <Label
                                htmlFor={`pto-${employmentId}-allocation-${key}`}
                              >
                                {name}
                              </Label>
                              <Input
                                disabled={
                                  busy || allocationHours[key] === "remaining"
                                }
                                id={`pto-${employmentId}-allocation-${key}`}
                                inputMode="decimal"
                                value={
                                  allocationHours[key] === "remaining"
                                    ? ""
                                    : allocationHours[key] || ""
                                }
                                placeholder={
                                  allocationHours[key] === "remaining"
                                    ? "Exact remaining gap"
                                    : undefined
                                }
                                onChange={event =>
                                  setAllocationHours(previous => ({
                                    ...previous,
                                    [key]: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </fieldset>
                      )}
                      <Label htmlFor={`pto-${employmentId}-reason`}>
                        Leave decision reason
                      </Label>
                      <Textarea
                        disabled={busy}
                        id={`pto-${employmentId}-reason`}
                        maxLength={1000}
                        required
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                      />
                      <Button disabled={busy} type="submit">
                        Approve leave decision
                      </Button>
                    </form>
                  )}
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={async event => {
                      event.preventDefault();
                      await mutate("accrue", { through });
                    }}
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`pto-${employmentId}-through`}>
                        Post configured accrual through
                      </Label>
                      <Input
                        disabled={busy}
                        id={`pto-${employmentId}-through`}
                        required
                        type="date"
                        value={through}
                        onChange={event => setThrough(event.target.value)}
                      />
                    </div>
                    <Button disabled={busy} type="submit" variant="outline">
                      Post configured accrual
                    </Button>
                  </form>
                  {data.obligations.length > 0 && (
                    <section
                      aria-label="Historical leave obligations"
                      className="space-y-3"
                    >
                      <h3 className="font-medium">
                        Outstanding history and year-end or exit review
                      </h3>
                      {data.obligations.map(row => (
                        <ObligationForm
                          busy={busy}
                          key={`${row.origin_entry_id}:${row.origin_component}:${data.facts.digest}`}
                          row={row}
                          onSubmit={decide}
                        />
                      ))}
                    </section>
                  )}
                  {data.cash_cases.length > 0 && (
                    <section
                      aria-label="Unsettled leave recoveries"
                      className="space-y-3"
                    >
                      <h3 className="font-medium">
                        Unsettled leave adjustments and recoveries
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A planned deduction is not collected cash. Unreserved,
                        released or uncertain recoveries stay on this worklist
                        until their exact approved payment is settled.
                      </p>
                      {data.cash_cases.map(row => (
                        <div
                          className="space-y-3 rounded-md border border-border p-3 text-sm"
                          key={row.entry_id}
                        >
                          <p className="tabular-nums">
                            {row.period} · {row.hours} h ·{" "}
                            {exactAmount(row.amount_minor, "INR")} ·{" "}
                            {label(row.state)}
                          </p>
                          {row.payroll_run_id && (
                            <a
                              className="inline-flex min-h-10 items-center underline focus-visible:ring-2 focus-visible:ring-ring"
                              href={`/payroll/${row.payroll_run_id}`}
                            >
                              Review the bound payroll run
                            </a>
                          )}
                          {row.can_review_credit && row.recovery_id && (
                            <CreditReviewForm
                              busy={busy}
                              recoveryId={row.recovery_id}
                              onSubmit={attributes =>
                                mutate(
                                  `recoveries/${row.recovery_id}/resolve`,
                                  { pto_recovery_review: attributes }
                                )
                              }
                            />
                          )}
                          {row.origin_entry_id &&
                            row.origin_component &&
                            ["unreserved", "released"].includes(row.state) && (
                              <ObligationForm
                                busy={busy}
                                row={{
                                  origin_entry_id: row.origin_entry_id,
                                  origin_component: row.origin_component,
                                  period: row.original_period || row.period,
                                  kind: row.origin_component,
                                  remaining_hours: row.hours,
                                  accrued_recovery_hours:
                                    row.accrued_recovery_hours || "0.0",
                                  debt: ["advance", "opening"].includes(
                                    row.origin_component
                                  ),
                                  review:
                                    "Planned cash recovery remains unsettled",
                                }}
                                onSubmit={decide}
                              />
                            )}
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </>
          )}
          <section aria-label="Leave decision history" className="space-y-2">
            <h3 className="font-medium">Recorded decision history</h3>
            {data.history.length === 0 && (
              <p className="text-sm">No decisions recorded.</p>
            )}
            {data.history.map(entry => (
              <article
                className="rounded-md border border-border p-3 text-sm"
                key={entry.id}
              >
                <p className="tabular-nums">
                  {entry.period} · {label(entry.kind)} · {entry.hours} h
                  {entry.cash_amount_minor !== "0" &&
                    ` · ${exactAmount(entry.cash_amount_minor, "INR")}`}
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {entry.reason}
                </p>
                <p className="text-muted-foreground">
                  {entry.actor_name} · Record {entry.id}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

interface ReviewCase {
  employment_id: number;
  consultant_name: string;
  historical_negative_hours: string;
  threshold_review: boolean;
  year_end_review: boolean;
  exit_review: boolean;
  cash_cases: CashCase[];
  deferred_cases: {
    id: number;
    period: string;
    kind: string;
    hours: string;
    accrued_recovery_hours: string;
  }[];
}

export const PtoReviewQueue = ({
  companyId,
  onSelect,
}: {
  companyId: string;
  onSelect: (
    employment: number,
    name: string,
    month: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
}) => {
  const [asOf, setAsOf] = useState("");
  const [reviewedDate, setReviewedDate] = useState("");
  const [cases, setCases] = useState<ReviewCase[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section
      aria-label="Leave year-end and exit review"
      className="mt-6 space-y-3 rounded-md border border-border p-4"
    >
      <h2 className="text-lg font-semibold">Leave year-end and exit review</h2>
      <p className="text-sm text-muted-foreground">
        Review outstanding advances, deferred cases, corrections and negative
        balances at the configured leave-year boundary or exit. This report
        never makes a deduction.
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async event => {
          event.preventDefault();
          setBusy(true);
          setError("");
          setCases(null);
          try {
            const response = await http.get("/payroll_pto/report", {
              params: { company_id: companyId, as_of: asOf },
            });
            setCases(response.data.cases);
            setReviewedDate(asOf);
          } catch (failure) {
            setError(errorMessage(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="pto-review-date">Leave review as of</Label>
          <Input
            disabled={busy}
            id="pto-review-date"
            required
            type="date"
            value={asOf}
            onChange={event => {
              setAsOf(event.target.value);
              setCases(null);
            }}
          />
        </div>
        <Button disabled={busy} type="submit" variant="outline">
          Load leave review queue
        </Button>
      </form>
      {busy && <p role="status">Loading leave review queue…</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {cases?.length === 0 && (
        <p className="text-sm">No configured leave policies at this date.</p>
      )}
      {cases?.map(row => (
        <article
          className="space-y-2 rounded-md border border-border p-3 text-sm"
          key={row.employment_id}
        >
          <p className="font-medium">{row.consultant_name}</p>
          <p className="tabular-nums">
            Negative balance: {row.historical_negative_hours} h
            {row.threshold_review && " · Threshold review"}
            {row.year_end_review && " · Leave-year review"}
            {row.exit_review && " · Exit review"}
          </p>
          {row.deferred_cases.map(entry => (
            <p className="tabular-nums" key={entry.id}>
              {entry.period} · {label(entry.kind)} · Outstanding {entry.hours} h
              · Accrual already recovered {entry.accrued_recovery_hours} h
            </p>
          ))}
          {row.cash_cases.map(entry => (
            <p className="tabular-nums" key={entry.entry_id}>
              Unsettled recovery · {entry.period} ·{" "}
              {exactAmount(entry.amount_minor, "INR")} · {label(entry.state)}
            </p>
          ))}
          <Button
            className="h-auto min-h-10 max-w-full whitespace-normal text-left"
            disabled={busy}
            size="sm"
            variant="outline"
            onClick={event =>
              onSelect(
                row.employment_id,
                row.consultant_name,
                reviewedDate.slice(0, 7),
                event
              )
            }
          >
            Review leave case {row.consultant_name}
          </Button>
        </article>
      ))}
    </section>
  );
};
