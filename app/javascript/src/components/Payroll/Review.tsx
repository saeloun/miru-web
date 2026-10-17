import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useUserContext } from "context/UserContext";
import { hasPayrollReviewAccess } from "../../lib/payrollAccess";

import {
  payrollApi,
  RunDetail,
  RunPreflight,
  RunSummary,
  ReviewLine,
  Approval,
} from "./api";
import PreflightSummary from "./PreflightSummary";
import PayrollAccessGate from "./AccessGate";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";

export const label = (code: string): string => {
  const labels: Record<string, string> = {
    provider_setup_required: "Provider connection needs verification",
    capabilities_unverified: "Provider capabilities need verification",
    recipients_unverified: "Recipient mapping needs verification",
    roster_binding_required: "The complete payroll roster needs verification",
    dry_run_only: "Dry run only; payments are unavailable",
    source_missing_or_changed:
      "Source records are missing or have changed; review a new revision",
    calculation_missing_or_inconsistent:
      "Calculation evidence is missing or inconsistent",
    calculation_requires_review: "Calculation exceptions need review",
    accounts_approved: "Accounts approved",
    approved: "Owner approved",
    draft: "Draft",
    accounts: "Accounts review",
    final: "Final owner review",
  };

  return Object.prototype.hasOwnProperty.call(labels, code)
    ? labels[code]
    : code.replace(/^source_exception:/, "Source: ").replace(/[_:]/g, " ");
};

export const exactAmount = (
  value: unknown,
  currency: string,
  minor = true
): string => {
  if (typeof value !== "string" || !["INR", "USD"].includes(currency)) {
    return "Unavailable";
  }

  if (!(minor ? /^-?\d{1,80}$/ : /^-?\d{1,80}(\.\d{1,40})?$/).test(value)) {
    return "Unavailable";
  }
  const negative = value.startsWith("-");
  const digits = value.replace(/^-/, "");
  const [whole, fraction] = minor
    ? [digits.padStart(3, "0").slice(0, -2), digits.padStart(3, "0").slice(-2)]
    : digits.split(".");

  const grouped = whole
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "−" : ""}${currency} ${grouped}.${(
    fraction || ""
  ).padEnd(2, "0")}`;
};

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : "Unavailable";

const date = (value: string): string => {
  const parsed = new Date(value);

  return Number.isNaN(parsed.valueOf())
    ? "Unavailable"
    : parsed.toLocaleString();
};

const Issues = ({ issues }: { issues: string[] }) =>
  issues.length ? (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      {issues.map((issue, index) => (
        <li key={`${issue}-${index}`}>{label(issue)}</li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">
      No recorded exceptions. Provider and roster checks still apply.
    </p>
  );

const Facts = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {rows.map(([name, value]) => (
      <div className="min-w-0" key={name}>
        <dt className="text-sm text-muted-foreground">{name}</dt>
        <dd className="mt-1 break-words text-sm tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
);

const Approvals = ({ approvals }: { approvals: Approval[] }) =>
  approvals.length ? (
    <ul className="space-y-2 text-sm">
      {approvals.map((approval, index) => (
        <li key={index}>
          {label(approval.stage)} ·{" "}
          {approval.actor_name || "Reviewer unavailable"} ·{" "}
          {date(approval.created_at)}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">
      No approvals recorded for this revision.
    </p>
  );

const Line = ({ line }: { line: ReviewLine }) => {
  const input = line.calculation?.input || {};
  const policy = line.calculation?.policy || {};
  const compensation = input.compensation as
    | Record<string, unknown>
    | undefined;
  const manual = input.manual_net as Record<string, unknown> | undefined;
  const fx = policy.fx as Record<string, unknown> | undefined;
  const rounding = policy.rounding as
    | Record<string, { mode: string; digits: string | null }>
    | undefined;

  const adjustments = [
    ...line.extras.map(item => ({ ...item, kind: "Extra" })),
    ...line.reimbursements.map(item => ({ ...item, kind: "Reimbursement" })),
    ...line.deductions.map(item => ({ ...item, kind: "Deduction" })),
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">
          {line.payee_name || "Payee unavailable"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {label(line.pay_type)} · {line.currency}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Facts
          rows={[
            ["Base pay", exactAmount(line.amounts.base_minor, line.currency)],
            ["Extras", exactAmount(line.amounts.extras_minor, line.currency)],
            [
              "Reimbursements",
              exactAmount(line.amounts.reimbursements_minor, line.currency),
            ],
            [
              "Deductions",
              exactAmount(line.amounts.deductions_minor, line.currency),
            ],
            [
              "Calculated net",
              exactAmount(line.amounts.net_minor, line.currency),
            ],
            [
              "Calculation status",
              line.calculation
                ? line.calculation.review_ready
                  ? "Recorded checks complete; final gates remain"
                  : "Needs review"
                : "Calculation unavailable",
            ],
          ]}
        />
        <details className="rounded-md border border-border p-4">
          <summary className="cursor-pointer font-medium">
            Calculation inputs and policy
          </summary>
          <div className="mt-4 space-y-4">
            <Facts
              rows={[
                ["Compensation basis", text(compensation?.basis)],
                [
                  "Compensation",
                  exactAmount(
                    compensation?.amount,
                    text(input.source_currency),
                    false
                  ),
                ],
                [
                  text(policy.paid_quantity_name) === "Unavailable"
                    ? "Paid quantity"
                    : text(policy.paid_quantity_name),
                  text(input.paid_quantity),
                ],
                [
                  text(policy.basis_quantity_name) === "Unavailable"
                    ? "Basis quantity"
                    : text(policy.basis_quantity_name),
                  text(input.basis_quantity),
                ],
                ["Hours", text(input.hours)],
                ["Pay policy version", text(policy.version)],
                ["Effective from", text(compensation?.effective_from)],
                ["Effective to", text(compensation?.effective_to)],
                [
                  "Manual net",
                  exactAmount(manual?.amount, text(manual?.currency), false),
                ],
                [
                  "Manual net difference",
                  exactAmount(
                    line.calculation?.manual_net_delta,
                    line.currency,
                    false
                  ),
                ],
                [
                  "Override reason",
                  manual?.reason
                    ? label(text(manual.reason))
                    : "No override recorded",
                ],
                ["FX rate", text(fx?.rate)],
                [
                  "FX direction",
                  fx
                    ? `${text(fx.from)} → ${text(fx.to)} · ${text(
                        fx.direction
                      )}`
                    : "No conversion recorded",
                ],
                ["FX observed date", text(fx?.as_of)],
              ]}
            />
            {rounding && (
              <ul className="space-y-1 text-sm">
                {Object.entries(rounding).map(([stage, profile]) => (
                  <li key={stage}>
                    {label(stage)} rounding: {label(profile.mode)};{" "}
                    {profile.digits === null
                      ? "retain precision"
                      : `${profile.digits} decimal places`}
                  </li>
                ))}
              </ul>
            )}
            <Issues issues={line.calculation?.issues || []} />
          </div>
        </details>
        <div>
          <h4 className="mb-3 font-medium">Itemized adjustments</h4>
          {adjustments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Type",
                      "Description",
                      "Amount",
                      "Origin month",
                      "Reason",
                    ].map(heading => (
                      <th className="p-2 font-medium" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((item, index) => (
                    <tr className="border-b border-border" key={index}>
                      <td className="p-2">{item.kind}</td>
                      <td className="p-2">{label(item.code)}</td>
                      <td className="p-2 tabular-nums">
                        {exactAmount(item.amount_minor, item.currency)}
                      </td>
                      <td className="p-2">{item.origin_period}</td>
                      <td className="p-2">{label(item.reason_code)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No itemized adjustments recorded.
            </p>
          )}
        </div>
        <details className="rounded-md border border-border p-4">
          <summary className="cursor-pointer font-medium">
            Worked time, PTO and source evidence
          </summary>
          <div className="mt-4 space-y-4">
            {line.source ? (
              <>
                <Facts
                  rows={[
                    ["Source month", line.source.month],
                    ["Captured", date(line.source.captured_at)],
                    ["Work records", line.source.work_entries.length],
                    ["PTO / leave records", line.source.timeoff_entries.length],
                    ["Joined", text(line.source.employment?.joined_at)],
                    ["Left", text(line.source.employment?.resigned_at)],
                    ["Timezone", text(line.source.company_calendar?.timezone)],
                    [
                      "Working days",
                      Array.isArray(line.source.company_calendar?.working_days)
                        ? line.source.company_calendar.working_days.join(", ")
                        : text(line.source.company_calendar?.working_days),
                    ],
                  ]}
                />
                <p className="text-sm text-muted-foreground">
                  Time and PTO are source evidence. Paid quantity follows the
                  recorded policy; leave must not be deducted twice.
                </p>
                {[
                  ["Work entries", line.source.work_entries],
                  ["PTO / leave entries", line.source.timeoff_entries],
                ].map(
                  ([title, entries]: [string, Record<string, unknown>[]]) => (
                    <div key={title}>
                      <h5 className="font-medium">{title}</h5>
                      {entries.length ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {entries.map((entry, index) => (
                            <li key={index}>
                              {text(entry.date)} ·{" "}
                              {text(entry.duration_minutes)} minutes
                              {entry.review_status
                                ? ` · ${label(text(entry.review_status))}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No records captured.
                        </p>
                      )}
                    </div>
                  )
                )}
                <Issues
                  issues={line.source.review_exceptions.map(
                    exception => exception.code
                  )}
                />
                {line.source_resolutions.length > 0 && (
                  <ul className="text-sm">
                    {line.source_resolutions.map((resolution, index) => (
                      <li key={index}>
                        {label(resolution.code)}: {label(resolution.decision)} ·{" "}
                        {label(resolution.reason_code)}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-sm text-destructive">
                Source evidence is unavailable. Review is blocked.
              </p>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

interface ReviewState {
  scope: string;
  loading: boolean;
  error: string | null;
  runs: RunSummary[];
  hasMore: boolean;
  run: RunDetail | null;
  preflight: RunPreflight | null;
}

const Review = () => {
  const { runId } = useParams();
  const { user, company, companyRole } = useUserContext();
  const payrollEnabled = hasPayrollReviewAccess(
    company,
    user?.current_workspace_id,
    companyRole
  );
  const companyId = String(user?.current_workspace_id || "");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const scope = `${companyId}:${payrollEnabled}:${
    runId || "list"
  }:${page}:${refresh}`;
  const [state, setState] = useState<ReviewState | null>(null);

  useEffect(() => {
    const controller = new window.AbortController();
    const empty = {
      scope,
      loading: true,
      error: null,
      runs: [],
      hasMore: false,
      run: null,
      preflight: null,
    };
    setState(empty);
    if (!companyId || !payrollEnabled) return () => controller.abort();

    const load = async () => {
      try {
        if (runId) {
          const [detail, preview] = await Promise.all([
            payrollApi.show(runId, companyId, controller.signal),
            payrollApi.preflight(runId, companyId, controller.signal),
          ]);
          const run: RunDetail = detail.data.payroll_run;
          const preflight: RunPreflight = preview.data.preflight;
          if (
            String(run.company_id) !== companyId ||
            String(preflight.company_id) !== companyId ||
            run.id !== runId ||
            preflight.revision_digest !== (run.revision?.digest ?? null)
          ) {
            throw new Error("scope");
          }

          if (!controller.signal.aborted) {
            setState({ ...empty, loading: false, run, preflight });
          }
        } else {
          const response = await payrollApi.index(
            companyId,
            controller.signal,
            page
          );
          const runs: RunSummary[] = response.data.payroll_runs;
          if (
            !Array.isArray(runs) ||
            runs.some(run => String(run.company_id) !== companyId)
          ) {
            throw new Error("scope");
          }

          if (!controller.signal.aborted) {
            setState({
              ...empty,
              loading: false,
              runs,
              hasMore: response.data.pagination.has_more === true,
            });
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const status = error.response?.status;
        const message =
          status === 403
            ? "You do not have access to payroll review in this workspace."
            : status === 404
            ? "This payroll run is unavailable in the current workspace."
            : status === 409
            ? "Your workspace changed. Reload this page before reviewing payroll."
            : "Payroll review could not be loaded. Refresh to try again.";
        setState({ ...empty, loading: false, error: message });
      }
    };
    load();

    return () => controller.abort();
  }, [companyId, payrollEnabled, runId, page, refresh]);

  const current = state?.scope === scope ? state : null;
  const run = current?.run;
  const preflight = current?.preflight;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 text-foreground sm:p-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Payroll review</h1>
          <Badge variant="outline">Read-only dry run</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Review saved monthly calculations, source records and approval
          history. Changes, approvals, payslip delivery and payments are
          unavailable here.
        </p>
        {runId && (
          <Link
            className="inline-flex min-h-10 items-center text-sm text-primary underline"
            to="/payroll"
          >
            Back to payroll runs
          </Link>
        )}
      </header>
      {(!current || current.loading) && (
        <p role="status">Loading payroll review…</p>
      )}
      {current?.error && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p role="alert">{current.error}</p>
            <Button
              onClick={() => setRefresh(value => value + 1)}
              variant="outline"
            >
              Refresh review
            </Button>
          </CardContent>
        </Card>
      )}
      {current && !current.loading && !current.error && !runId && (
        <>
          <p className="text-sm text-muted-foreground">
            {company?.name || "Current workspace"} · Page {page}
          </p>
          {current.runs.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {current.runs.map(item => (
                <Card key={item.id}>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">
                      <Link
                        className="inline-flex min-h-10 items-center text-primary underline"
                        to={`/payroll/${item.id}`}
                      >
                        {item.period.slice(0, 7)} · {item.currency}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {item.dry_run ? "Dry run" : "Saved review"} ·{" "}
                      {item.current_revision
                        ? `Revision ${item.current_revision.number}`
                        : "No calculation revision"}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>
                  No payroll runs are available for your review in this
                  workspace.
                </p>
              </CardContent>
            </Card>
          )}
          <div className="flex gap-3">
            <Button
              disabled={page === 1}
              onClick={() => setPage(value => value - 1)}
              variant="outline"
            >
              Previous page
            </Button>
            <Button
              disabled={!current.hasMore}
              onClick={() => setPage(value => value + 1)}
              variant="outline"
            >
              Next page
            </Button>
          </div>
        </>
      )}
      {run && (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {run.period.slice(0, 7)} · {run.currency}
              </h2>
              <p className="text-sm text-muted-foreground">
                {company?.name || "Current workspace"} · {label(run.status)}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <Facts
                rows={[
                  [
                    "Current revision",
                    run.revision
                      ? `${run.revision.number} · ${run.revision.digest.slice(
                          0,
                          12
                        )}`
                      : "Unavailable",
                  ],
                  [
                    "Accounts reviewer",
                    run.reviewers.accounts?.name || "Unassigned",
                  ],
                  ["Final reviewer", run.reviewers.final?.name || "Unassigned"],
                ]}
              />
              <Issues issues={run.review_issues} />
            </CardContent>
          </Card>
          {preflight && (
            <>
              <PreflightSummary
                payrollOnly
                companyLabel={company?.name || "Current workspace"}
                month={run.period.slice(0, 7)}
                result={{
                  status: "blocked",
                  blockers: preflight.blockers,
                  required_minor_units: preflight.total_net_minor,
                  available_minor_units: null,
                  currency: preflight.currency,
                  revision_digest: preflight.revision_digest,
                }}
              />
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Reconciliation</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Facts
                    rows={[
                      [
                        "Recipients in this revision",
                        preflight.recipient_count,
                      ],
                      [
                        "Calculated net total",
                        exactAmount(
                          preflight.total_net_minor,
                          preflight.currency
                        ),
                      ],
                      [
                        "Detail reconciliation",
                        preflight.reconciliation.reconciled
                          ? "Detail totals reconcile; complete roster verification remains"
                          : "Needs review",
                      ],
                    ]}
                  />
                  <Issues issues={preflight.reconciliation.issues} />
                </CardContent>
              </Card>
            </>
          )}
          {run.revision ? (
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Versioned policies</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(run.revision.policies).map(
                    ([kind, policy]) => (
                      <p className="break-words text-sm" key={kind}>
                        {label(kind)} · {policy.version} ·{" "}
                        {policy.effective_from} to {policy.effective_to}
                      </p>
                    )
                  )}
                  <Issues issues={run.revision.exceptions} />
                </CardContent>
              </Card>
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Recipient calculations
                </h2>
                {run.revision.lines.map(line => (
                  <Line key={line.employment_id} line={line} />
                ))}
              </section>
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Current revision approvals
                  </h2>
                </CardHeader>
                <CardContent>
                  <Approvals approvals={run.revision.approvals} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Most recent revisions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Showing up to the latest 20 revisions. Approvals apply to a
                    recorded revision. Source changes require renewed review.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {run.revision.audit.map(revision => (
                    <div
                      className="space-y-2 rounded-md border border-border p-4"
                      key={revision.number}
                    >
                      <h3 className="font-medium">
                        Revision {revision.number} ·{" "}
                        {revision.digest.slice(0, 12)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {revision.created_by_name || "Actor unavailable"} ·{" "}
                        {date(revision.created_at)}
                      </p>
                      <Approvals approvals={revision.approvals} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <p>
              No saved calculation revision is available. Review is blocked.
            </p>
          )}
        </>
      )}
    </main>
  );
};

const PayrollReview = () => {
  const { user, companyRole, company } = useUserContext();
  const payrollEnabled = hasPayrollReviewAccess(
    company,
    user?.current_workspace_id,
    companyRole
  );

  return (
    <PayrollAccessGate>
      <Review
        key={`${user?.id}:${user?.current_workspace_id}:${companyRole}:${payrollEnabled}`}
      />
    </PayrollAccessGate>
  );
};

export default PayrollReview;
