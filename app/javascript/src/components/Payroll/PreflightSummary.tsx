import React, { useId } from "react";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";

type MinorUnits = number | string | null;

export interface PreflightResult {
  readonly status: string;
  readonly blockers: readonly string[];
  readonly required_minor_units: MinorUnits;
  readonly available_minor_units: MinorUnits;
  readonly currency: string | null;
  readonly revision_digest: string | null;
}

interface Props {
  readonly companyLabel: string;
  readonly month: string;
  readonly result: Readonly<PreflightResult> | null;
  readonly payrollOnly?: boolean;
}

const blockerLabels: Readonly<Record<string, string>> = {
  provider_setup_required: "Provider connection has not been verified.",
  roster_binding_required: "The complete payroll roster has not been verified.",
  dry_run_only: "This dry run cannot send payments.",
  invalid_expected_binding:
    "Confirm the company, currency and provider account.",
  balance_binding_mismatch: "The balance does not match the selected account.",
  invalid_required_amounts: "Review payroll totals, fees and reserve amounts.",
  invalid_available_balance: "An available balance is needed for this review.",
  balance_stale_or_invalid: "Refresh the balance before continuing the review.",
  revision_not_reviewed: "Review the current calculation revision again.",
  accounts_approval_missing: "Accounts approval is missing.",
  final_approval_missing: "Final approval is missing.",
  capabilities_unverified: "Provider capabilities have not been verified.",
  recipients_unverified: "Recipient mapping has not been verified.",
  insufficient_balance: "The balance does not cover payroll, fees and reserve.",
};

const parseMinorUnits = (value: MinorUnits): bigint | null => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
  }

  if (typeof value === "string" && /^\d{1,80}$/.test(value)) {
    return BigInt(value);
  }

  return null;
};

const formatAmount = (
  value: bigint | null,
  currency: string | null
): string => {
  if (value === null || !["INR", "USD"].includes(currency)) {
    return "Unavailable";
  }

  const whole = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value / BigInt(100));
  const fraction = (value % BigInt(100)).toString().padStart(2, "0");

  return `${currency} ${whole}.${fraction}`;
};

const PreflightSummary = ({
  companyLabel,
  month,
  result,
  payrollOnly = false,
}: Props) => {
  const headingId = useId();
  const required = parseMinorUnits(result?.required_minor_units);
  const available = parseMinorUnits(result?.available_minor_units);
  const currency = result?.currency ?? null;
  const blockers =
    Array.isArray(result?.blockers) &&
    result.blockers.every(code => typeof code === "string")
      ? result.blockers
      : null;

  const digest = result?.revision_digest;
  const validDigest =
    typeof digest === "string" && /^[0-9a-f]{64}$/.test(digest);

  const validDisplay =
    required !== null &&
    required > BigInt(0) &&
    available !== null &&
    ["INR", "USD"].includes(currency) &&
    validDigest &&
    blockers !== null;

  const ready =
    validDisplay &&
    result?.status === "ready_for_manual_review" &&
    blockers.length === 0 &&
    available >= required;

  return (
    <section aria-labelledby={headingId}>
      <Card className="w-full max-w-3xl border-border">
        <CardHeader className="gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Dry run preview only
          </p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2
                className="break-words text-xl font-semibold text-foreground"
                id={headingId}
              >
                Payroll balance review
              </h2>
              <p className="break-words text-sm text-muted-foreground">
                {companyLabel?.trim() || "Company unavailable"}
                {" · "}
                {month?.trim() || "Payroll month unavailable"}
              </p>
            </div>
            <Badge variant={ready ? "secondary" : "outline"}>
              {ready ? "Ready for manual review" : "Blocked"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {payrollOnly
              ? "Recorded payroll totals are shown below. Provider balance, fees and reserve are unavailable until the connection is verified. Payments remain blocked."
              : "This preview compares the recorded balance with payroll, fees and reserve. It does not authorize or send payments."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-md border border-border p-4">
              <dt className="text-sm text-muted-foreground">
                {payrollOnly
                  ? "Recorded net payroll total"
                  : "Required including fees and reserve"}
              </dt>
              <dd className="mt-2 break-all text-lg font-semibold tabular-nums text-foreground">
                {formatAmount(required, currency)}
              </dd>
            </div>
            <div className="min-w-0 rounded-md border border-border p-4">
              <dt className="text-sm text-muted-foreground">
                Available balance
              </dt>
              <dd className="mt-2 break-all text-lg font-semibold tabular-nums text-foreground">
                {formatAmount(available, currency)}
              </dd>
            </div>
          </dl>
          {!ready && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                Before manual review
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                {blockers?.map((code, index) => (
                  <li key={`${code}-${index}`}>
                    {Object.prototype.hasOwnProperty.call(blockerLabels, code)
                      ? blockerLabels[code]
                      : code.replace(/[_:]/g, " ")}
                  </li>
                ))}
                {(!validDisplay || !blockers?.length) && (
                  <li>Complete and verify the preflight data before review.</li>
                )}
              </ul>
            </div>
          )}
          <dl className="text-sm">
            <dt className="text-muted-foreground">Calculation revision</dt>
            <dd className="mt-1 font-mono text-foreground">
              {validDigest ? digest.slice(0, 12) : "Unavailable"}
            </dd>
          </dl>
        </CardContent>
      </Card>
    </section>
  );
};

export default PreflightSummary;
