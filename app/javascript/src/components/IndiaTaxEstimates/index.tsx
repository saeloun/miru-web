import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Api from "apis/api";
import { useUserContext } from "context/UserContext";
import { currencyFormat } from "helpers/currency";
import { t } from "../../i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const MONEY_PATTERN = "[0-9]{1,11}([.][0-9]{1,2})?";
const DEDUCTION_FIELDS = [
  "investments",
  "employee_nps",
  "additional_nps",
  "personal_nps_paid",
  "pension_salary",
  "professional_tax",
  "health_self",
  "health_parents",
  "eligible_interest",
] as const;
type DeductionField = (typeof DEDUCTION_FIELDS)[number];
type EmployerPension = {
  contribution: string;
  salary_basis: string;
  government: boolean;
};
type Form = {
  tax_year: string;
  age_group: string;
  gross_salary: string;
  taxable_interest: string;
  deductions: Record<DeductionField, string> & {
    family_senior: boolean;
    parents_senior: boolean;
  };
  employer_pensions: EmployerPension[];
  scope_confirmed: boolean;
  eligibility_confirmed: boolean;
};
type Metadata = {
  periods: { value: string; label: string }[];
  age_groups: string[];
  sources: string[];
};
type Deduction = { code: string; claimed: string; allowed: string };
type Breakdown = {
  taxable_income: string;
  salary_deductions: string;
  chapter_deductions: string;
  slab_tax: string;
  rebate: string;
  rebate_marginal_relief: string;
  surcharge: string;
  surcharge_marginal_relief: string;
  cess: string;
  annual_tax: string;
  deductions: Deduction[];
};
type Estimate = {
  period_label: string;
  governing_act: string;
  rule_version: string;
  preferred_regime: string;
  annual_saving: string;
  regimes: Record<"old" | "new", Breakdown>;
  legal_references: Record<string, string>;
};
const money = (value: string) => currencyFormat("INR", value);

const EstimateWorkspace = ({ companyId }: { companyId: number | string }) => {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Estimate | null>(null);
  const [form, setForm] = useState<Form>(() => ({
    tax_year: "2026-27",
    age_group: "under_60",
    gross_salary: "",
    taxable_interest: "0",
    deductions: {
      investments: "0",
      employee_nps: "0",
      additional_nps: "0",
      personal_nps_paid: "0",
      pension_salary: "0",
      professional_tax: "0",
      health_self: "0",
      health_parents: "0",
      eligible_interest: "0",
      family_senior: false,
      parents_senior: false,
    },
    employer_pensions: [],
    scope_confirmed: false,
    eligibility_confirmed: false,
  }));

  const fail = (failure: any) =>
    setError(failure?.response?.data?.errors || t("indiaTax.failed"));

  useEffect(() => {
    let active = true;
    Api.get("/india_tax_estimates", { skipErrorToast: true })
      .then(({ data }) => active && setMetadata(data))
      .catch(failure => active && fail(failure));

    return () => {
      active = false;
    };
  }, [companyId]);

  const change = (values: Partial<Form>) => {
    setForm(previous => ({ ...previous, ...values }));
    setResult(null);
    setError("");
  };

  const calculate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await Api.post(
        "/india_tax_estimates",
        {
          tax_estimate: { ...form, company_id: companyId, currency: "INR" },
        },
        { skipErrorToast: true }
      );
      setResult(data.estimate);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header className="space-y-2">
        <Link className="text-sm text-primary underline" to="/tax-declarations">
          {t("taxDeclarations.title")}
        </Link>
        <h1 className="text-2xl font-semibold">{t("indiaTax.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("indiaTax.description")}
        </p>
      </header>
      {error && (
        <p
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {!metadata ? (
        !error && <p role="status">{t("loading")}</p>
      ) : (
        <>
          <form
            className="space-y-6 rounded-lg border bg-card p-4 md:p-6"
            onSubmit={calculate}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="india-tax-year">{t("indiaTax.year")}</Label>
                <Select
                  disabled={busy}
                  value={form.tax_year}
                  onValueChange={tax_year =>
                    change({
                      tax_year,
                      scope_confirmed: false,
                      eligibility_confirmed: false,
                    })
                  }
                >
                  <SelectTrigger id="india-tax-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.periods.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="india-tax-age">{t("indiaTax.age")}</Label>
                <Select
                  disabled={busy}
                  value={form.age_group}
                  onValueChange={age_group => change({ age_group })}
                >
                  <SelectTrigger id="india-tax-age">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.age_groups.map(age => (
                      <SelectItem key={age} value={age}>
                        {t(`indiaTax.ages.${age}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(["gross_salary", "taxable_interest"] as const).map(field => (
                <div className="space-y-2" key={field}>
                  <Label htmlFor={`india-tax-${field}`}>
                    {t(`indiaTax.fields.${field}`)}
                  </Label>
                  <Input
                    disabled={busy}
                    id={`india-tax-${field}`}
                    inputMode="decimal"
                    maxLength={14}
                    pattern={MONEY_PATTERN}
                    required
                    value={form[field]}
                    onChange={event => change({ [field]: event.target.value })}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("indiaTax.salaryHelp")}
            </p>
            <fieldset className="space-y-4 border-t pt-4">
              <legend className="font-medium">
                {t("indiaTax.deductions")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {t("indiaTax.deductionHelp")}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {DEDUCTION_FIELDS.map(field => (
                  <div className="space-y-2" key={field}>
                    <Label htmlFor={`india-tax-${field}`}>
                      {t(`indiaTax.fields.${field}`)}
                    </Label>
                    <Input
                      disabled={busy}
                      id={`india-tax-${field}`}
                      inputMode="decimal"
                      maxLength={14}
                      pattern={MONEY_PATTERN}
                      required
                      value={form.deductions[field]}
                      onChange={event =>
                        change({
                          deductions: {
                            ...form.deductions,
                            [field]: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.age_group === "under_60"
                  ? t("indiaTax.savingsHelp")
                  : t("indiaTax.depositHelp")}
              </p>
              {(["family_senior", "parents_senior"] as const).map(field => (
                <label className="flex items-start gap-2 text-sm" key={field}>
                  <input
                    checked={form.deductions[field]}
                    disabled={busy}
                    type="checkbox"
                    onChange={event =>
                      change({
                        deductions: {
                          ...form.deductions,
                          [field]: event.target.checked,
                        },
                      })
                    }
                  />
                  <span>{t(`indiaTax.${field}`)}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="space-y-4 border-t pt-4">
              <legend className="font-medium">
                {t("indiaTax.employerPensions")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {t("indiaTax.employerHelp")}
              </p>
              {form.employer_pensions.map((pension, index) => (
                <div className="space-y-3 rounded-md border p-3" key={index}>
                  {(["contribution", "salary_basis"] as const).map(field => (
                    <div className="space-y-2" key={field}>
                      <Label htmlFor={`employer-${index}-${field}`}>
                        {t(`indiaTax.employer_${field}`, { number: index + 1 })}
                      </Label>
                      <Input
                        disabled={busy}
                        id={`employer-${index}-${field}`}
                        inputMode="decimal"
                        maxLength={14}
                        pattern={MONEY_PATTERN}
                        required
                        value={pension[field]}
                        onChange={event =>
                          change({
                            employer_pensions: form.employer_pensions.map(
                              (row, position) =>
                                position === index
                                  ? { ...row, [field]: event.target.value }
                                  : row
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      checked={pension.government}
                      disabled={busy}
                      type="checkbox"
                      onChange={event =>
                        change({
                          employer_pensions: form.employer_pensions.map(
                            (row, position) =>
                              position === index
                                ? { ...row, government: event.target.checked }
                                : row
                          ),
                        })
                      }
                    />
                    <span>
                      {t("indiaTax.employerGovernment", { number: index + 1 })}
                    </span>
                  </label>
                  <Button
                    disabled={busy}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      change({
                        employer_pensions: form.employer_pensions.filter(
                          (_row, position) => position !== index
                        ),
                      })
                    }
                  >
                    {t("indiaTax.removeEmployer", { number: index + 1 })}
                  </Button>
                </div>
              ))}
              <Button
                disabled={busy || form.employer_pensions.length >= 10}
                type="button"
                variant="outline"
                onClick={() =>
                  change({
                    employer_pensions: [
                      ...form.employer_pensions,
                      {
                        contribution: "0",
                        salary_basis: "0",
                        government: false,
                      },
                    ],
                  })
                }
              >
                {t("indiaTax.addEmployer")}
              </Button>
            </fieldset>
            <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
              <p>{t("indiaTax.scopeHelp")}</p>
              <label className="flex items-start gap-2">
                <input
                  checked={form.scope_confirmed}
                  disabled={busy}
                  required
                  type="checkbox"
                  onChange={event =>
                    change({ scope_confirmed: event.target.checked })
                  }
                />
                <span>{t("indiaTax.scopeConfirm")}</span>
              </label>
              <p className="text-xs text-muted-foreground">
                {t("indiaTax.eligibilityHelp")}
              </p>
              <label className="flex items-start gap-2">
                <input
                  checked={form.eligibility_confirmed}
                  disabled={busy}
                  required
                  type="checkbox"
                  onChange={event =>
                    change({ eligibility_confirmed: event.target.checked })
                  }
                />
                <span>{t("indiaTax.eligibilityConfirm")}</span>
              </label>
            </div>
            <Button disabled={busy} type="submit">
              {busy ? t("loading") : t("indiaTax.compare")}
            </Button>
          </form>
          {result && (
            <section aria-label="Tax comparison" className="min-w-0 space-y-4">
              <h2 className="text-xl font-semibold">
                {t("indiaTax.comparison")}
              </h2>
              <p className="text-sm">
                {result.period_label} · {result.governing_act}
              </p>
              <p className="text-sm font-medium">
                {t(`indiaTax.preferred.${result.preferred_regime}`)} ·{" "}
                {t("indiaTax.saving")}: {money(result.annual_saving)}
              </p>
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                {(["old", "new"] as const).map(name => (
                  <article
                    className="min-w-0 space-y-3 rounded-lg border bg-card p-4"
                    data-regime={name}
                    key={name}
                  >
                    <h3 className="font-medium">
                      {t(`indiaTax.regimes.${name}`)}
                    </h3>
                    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                      {(
                        [
                          "salary_deductions",
                          "chapter_deductions",
                          "taxable_income",
                          "slab_tax",
                          "rebate",
                          "rebate_marginal_relief",
                          "surcharge",
                          "surcharge_marginal_relief",
                          "cess",
                          "annual_tax",
                        ] as const
                      ).map(field => (
                        <React.Fragment key={field}>
                          <dt>{t(`indiaTax.totals.${field}`)}</dt>
                          <dd className="whitespace-nowrap text-right tabular-nums">
                            {money(result.regimes[name][field])}
                          </dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
              <div className="max-w-full overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <caption className="p-3 text-left font-medium">
                    {t("indiaTax.admitted")}
                  </caption>
                  <thead>
                    <tr>
                      {["item", "rule", "entered", "old", "new"].map(field => (
                        <th className="whitespace-nowrap p-3" key={field}>
                          {t(`indiaTax.columns.${field}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.regimes.old.deductions.map((line, index) => (
                      <tr className="border-t" key={line.code}>
                        <td className="p-3">
                          {t(`indiaTax.items.${line.code}`)}
                        </td>
                        <td className="p-3">
                          {result.legal_references[line.code]}
                        </td>
                        <td className="whitespace-nowrap p-3 tabular-nums">
                          {money(line.claimed)}
                        </td>
                        <td className="whitespace-nowrap p-3 tabular-nums">
                          {money(line.allowed)}
                        </td>
                        <td className="whitespace-nowrap p-3 tabular-nums">
                          {money(result.regimes.new.deductions[index].allowed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("indiaTax.resultHelp")} · {result.rule_version}
              </p>
            </section>
          )}
          <footer className="space-y-2 text-xs text-muted-foreground">
            <p>{t("indiaTax.sources")}</p>
            {metadata.sources.map((source, index) => (
              <a
                className="block break-words text-primary underline"
                href={source}
                key={source}
                rel="noreferrer"
                target="_blank"
              >
                {t("indiaTax.source", { number: index + 1 })}
              </a>
            ))}
          </footer>
        </>
      )}
    </main>
  );
};

const IndiaTaxEstimates = () => {
  const { company, user } = useUserContext();

  if (
    !company?.id ||
    String(company.id) !== String(user?.current_workspace_id)
  ) {
    return (
      <p className="p-6" role="status">
        {t("loading")}
      </p>
    );
  }

  return (
    <EstimateWorkspace
      companyId={company.id}
      key={`${user.current_workspace_id}-${company.id}`}
    />
  );
};
export default IndiaTaxEstimates;
