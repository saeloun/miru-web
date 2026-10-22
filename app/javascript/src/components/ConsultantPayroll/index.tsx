import React, { useEffect, useState } from "react";
import Api from "apis/api";
import { useUserContext } from "context/UserContext";
import { currencyFormat } from "helpers/currency";
import useDialogReturnFocus from "../../hooks/useDialogReturnFocus";
import { t } from "../../i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type Terms = {
  id: number;
  effective_on: string;
  monthly_fee: string;
  hours_per_day: string;
  weekdays: number[];
  payment_source: string;
  legal_entity_name: string;
  change_reason: string;
  created_by: string;
};
type ReviewSummary = {
  employment_id: number;
  consultant_name: string;
  month: string;
  cutoff: string;
  monthly_fee: string | null;
  payment_source: string | null;
  legal_entity_name: string | null;
  expected_hours: string | null;
  recorded_hours: string | null;
  approved_work_hours: string | null;
  not_required_work_hours: string | null;
  pending_work_hours: string | null;
  rejected_work_hours: string | null;
  unresolved_work_hours: string | null;
  working_days: string | null;
  recorded_timeoff_hours: string | null;
  confirmed_unpaid_hours: string;
  unpaid_reason: string | null;
  fee_estimate: string | null;
  warnings: string[];
};
type Review = ReviewSummary & {
  reimbursement_total: string;
  total_estimate: string | null;
  selected_expense_ids: number[];
  excluded_expenses: Record<string, number>;
  eligible_expenses: {
    id: number;
    date: string;
    description: string;
    amount: string;
    currency: string;
    receipt_count: number;
  }[];
};
type Archive = {
  reviews: ReviewSummary[];
  employments: { id: number; name: string }[];
  pagination: { page: number; pages: number };
  period: { month: string; cutoff: string; today: string };
};
type Configuration = {
  employment: string;
  effective_on: string;
  monthly_fee: string;
  hours_per_day: string;
  weekdays: number[];
  payment_source: string;
  legal_entity_name: string;
  change_reason: string;
};
type History = {
  employment: number;
  records: Terms[];
  page: number;
  pages: number;
};
const amount = (value: string | null) =>
  value === null ? "—" : currencyFormat("INR", value);

const PayrollWorkspace = ({
  companyId,
}: {
  companyId: number | string | undefined;
}) => {
  const [month, setMonth] = useState("");
  const [cutoff, setCutoff] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [archive, setArchive] = useState<Archive | null>(null);
  const [configuration, setConfiguration] = useState<Configuration | null>(
    null
  );
  const [history, setHistory] = useState<History | null>(null);
  const [selected, setSelected] = useState<Review | null>(null);
  const [unpaid, setUnpaid] = useState("0");
  const [reason, setReason] = useState("");
  const [expenseIds, setExpenseIds] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogFocus = useDialogReturnFocus();
  const fail = (failure: any) =>
    setError(failure?.response?.data?.errors || t("consultantPayroll.failed"));

  useEffect(() => {
    let active = true;
    setArchive(null);
    Api.get("/consultant_payroll", {
      params: { month: month || undefined, cutoff: cutoff || undefined, page },
    })
      .then(({ data }) => {
        if (!active) return;
        setArchive(data);
        if (!month) setMonth(data.period.month);

        if (!cutoff) setCutoff(data.period.cutoff);
      })
      .catch(failure => active && fail(failure));

    return () => {
      active = false;
    };
  }, [month, cutoff, page, refresh]);

  const startConfiguration = () => {
    setError("");
    setConfiguration({
      employment: "",
      effective_on: `${month}-01`,
      monthly_fee: "",
      hours_per_day: "8",
      weekdays: [1, 2, 3, 4, 5],
      payment_source: "india",
      legal_entity_name: "",
      change_reason: "",
    });
  };

  const saveConfiguration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!configuration) return;
    setBusy(true);
    setError("");
    try {
      const { employment, ...terms } = configuration;
      await Api.post(`/consultant_payroll/${employment}/compensations`, {
        consultant_compensation: { ...terms, company_id: companyId },
      });
      setConfiguration(null);
      setRefresh(value => value + 1);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const loadHistory = async (employment: number, historyPage = 1) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.get(
        `/consultant_payroll/${employment}/compensations`,
        { params: { page: historyPage } }
      );

      setHistory({
        employment,
        records: data.compensations,
        ...data.pagination,
      });
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const openReview = async (row: ReviewSummary) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.post(
        `/consultant_payroll/${row.employment_id}/preview`,
        {
          payroll_preview: {
            company_id: companyId,
            month: row.month,
            cutoff: row.cutoff,
          },
        }
      );
      setSelected(data.review);
      setUnpaid("0");
      setReason("");
      setExpenseIds([]);
      setDirty(false);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const recalculate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.post(
        `/consultant_payroll/${selected.employment_id}/preview`,
        {
          payroll_preview: {
            company_id: companyId,
            month: selected.month,
            cutoff: selected.cutoff,
            confirmed_unpaid_hours: unpaid,
            unpaid_reason: reason,
            expense_ids: expenseIds,
          },
        }
      );
      setSelected(data.review);
      setDirty(false);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold"
            ref={dialogFocus.fallbackRef}
            tabIndex={-1}
          >
            {t("consultantPayroll.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("consultantPayroll.description")}
          </p>
        </div>
        <Button
          disabled={busy || !archive || !companyId}
          onClick={event => {
            dialogFocus.remember(event);
            startConfiguration();
          }}
        >
          {t("consultantPayroll.configure")}
        </Button>
      </header>
      <p className="rounded-lg border bg-muted/30 p-4 text-sm">
        {t("consultantPayroll.previewHelp")}
      </p>
      {error && !configuration && !selected && !history && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="payroll-month">{t("consultantPayroll.month")}</Label>
          <Input
            disabled={busy}
            id="payroll-month"
            max={archive?.period.today.slice(0, 7)}
            type="month"
            value={month}
            onChange={event => {
              setMonth(event.target.value);
              setPage(1);
              setError("");
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payroll-cutoff">
            {t("consultantPayroll.cutoff")}
          </Label>
          <Input
            disabled={busy}
            id="payroll-cutoff"
            max={archive?.period.today}
            type="date"
            value={cutoff}
            onChange={event => {
              setCutoff(event.target.value);
              setPage(1);
              setError("");
            }}
          />
        </div>
      </div>
      {!archive ? (
        <p role="status">
          {error ? t("consultantPayroll.failed") : t("loading")}
        </p>
      ) : !archive.reviews.length ? (
        <p className="rounded-lg border p-8 text-sm text-muted-foreground">
          {t("consultantPayroll.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "consultant",
                  "monthlyFee",
                  "expected",
                  "recorded",
                  "days",
                  "feeEstimate",
                  "source",
                  "actions",
                ].map(key => (
                  <th className="p-3 font-medium" key={key}>
                    {t(`consultantPayroll.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archive.reviews.map(row => (
                <tr className="border-b last:border-0" key={row.employment_id}>
                  <td className="p-3">
                    {row.consultant_name}
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {t("consultantPayroll.notReady")}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3 tabular-nums">
                    {amount(row.monthly_fee)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.expected_hours ?? "—"}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.recorded_hours ?? "—"}
                  </td>
                  <td className="p-3 tabular-nums">
                    {row.working_days ?? "—"}
                  </td>
                  <td className="p-3 tabular-nums">
                    {amount(row.fee_estimate)}
                  </td>
                  <td className="p-3">
                    {row.payment_source
                      ? t(`consultantPayroll.sources.${row.payment_source}`)
                      : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busy}
                        size="sm"
                        onClick={event => {
                          dialogFocus.remember(event);
                          openReview(row);
                        }}
                      >
                        {t("consultantPayroll.review", {
                          name: row.consultant_name,
                        })}
                      </Button>
                      <Button
                        disabled={busy}
                        size="sm"
                        variant="outline"
                        onClick={event => {
                          dialogFocus.remember(event);
                          loadHistory(row.employment_id);
                        }}
                      >
                        {t("consultantPayroll.history")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {archive && (
        <nav
          aria-label={t("pagination")}
          className="flex items-center justify-end gap-3 text-sm"
        >
          <Button
            disabled={busy || archive.pagination.page <= 1}
            variant="outline"
            onClick={() => setPage(archive.pagination.page - 1)}
          >
            {t("previous")}
          </Button>
          <span>{t("salarySlips.page", archive.pagination)}</span>
          <Button
            disabled={
              busy || archive.pagination.page >= archive.pagination.pages
            }
            variant="outline"
            onClick={() => setPage(archive.pagination.page + 1)}
          >
            {t("next")}
          </Button>
        </nav>
      )}

      <Dialog
        open={!!configuration}
        onOpenChange={open => !busy && !open && setConfiguration(null)}
      >
        <DialogContent onCloseAutoFocus={dialogFocus.restore}>
          <DialogHeader>
            <DialogTitle>{t("consultantPayroll.configure")}</DialogTitle>
            <DialogDescription>
              {t("consultantPayroll.versionHelp")}
            </DialogDescription>
          </DialogHeader>
          {configuration && (
            <form className="space-y-4" onSubmit={saveConfiguration}>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="consultant-employment">
                  {t("consultantPayroll.consultant")}
                </Label>
                <Select
                  disabled={busy}
                  required
                  value={configuration.employment}
                  onValueChange={employment =>
                    setConfiguration({ ...configuration, employment })
                  }
                >
                  <SelectTrigger id="consultant-employment">
                    <SelectValue placeholder={t("consultantPayroll.choose")} />
                  </SelectTrigger>
                  <SelectContent>
                    {archive?.employments.map(person => (
                      <SelectItem key={person.id} value={String(person.id)}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant-effective">
                  {t("consultantPayroll.effective")}
                </Label>
                <Input
                  disabled={busy}
                  id="consultant-effective"
                  required
                  type="date"
                  value={configuration.effective_on}
                  onChange={event =>
                    setConfiguration({
                      ...configuration,
                      effective_on: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant-fee">
                  {t("consultantPayroll.monthlyFee")}
                </Label>
                <Input
                  disabled={busy}
                  id="consultant-fee"
                  inputMode="decimal"
                  maxLength={13}
                  pattern="[0-9]{1,10}(\.[0-9]{1,2})?"
                  required
                  value={configuration.monthly_fee}
                  onChange={event =>
                    setConfiguration({
                      ...configuration,
                      monthly_fee: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant-entity">
                  {t("consultantPayroll.entity")}
                </Label>
                <Input
                  disabled={busy}
                  id="consultant-entity"
                  maxLength={200}
                  required
                  value={configuration.legal_entity_name}
                  onChange={event =>
                    setConfiguration({
                      ...configuration,
                      legal_entity_name: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant-source">
                  {t("consultantPayroll.source")}
                </Label>
                <Select
                  disabled={busy}
                  value={configuration.payment_source}
                  onValueChange={payment_source =>
                    setConfiguration({ ...configuration, payment_source })
                  }
                >
                  <SelectTrigger id="consultant-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["india", "mercury_us"].map(source => (
                      <SelectItem key={source} value={source}>
                        {t(`consultantPayroll.sources.${source}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultant-daily-hours">
                  {t("consultantPayroll.dailyHours")}
                </Label>
                <Input
                  disabled={busy}
                  id="consultant-daily-hours"
                  inputMode="decimal"
                  maxLength={5}
                  pattern="[0-9]{1,2}(\.[0-9]{1,2})?"
                  required
                  value={configuration.hours_per_day}
                  onChange={event =>
                    setConfiguration({
                      ...configuration,
                      hours_per_day: event.target.value,
                    })
                  }
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  {t("consultantPayroll.weekdays")}
                </legend>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={day}
                    >
                      <input
                        checked={configuration.weekdays.includes(day)}
                        disabled={busy}
                        type="checkbox"
                        onChange={event =>
                          setConfiguration({
                            ...configuration,
                            weekdays: event.target.checked
                              ? [...configuration.weekdays, day]
                              : configuration.weekdays.filter(
                                  value => value !== day
                                ),
                          })
                        }
                      />
                      {t(`consultantPayroll.weekday.${day}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="consultant-change">
                  {t("consultantPayroll.changeReason")}
                </Label>
                <Textarea
                  disabled={busy}
                  id="consultant-change"
                  maxLength={1000}
                  required
                  value={configuration.change_reason}
                  onChange={event =>
                    setConfiguration({
                      ...configuration,
                      change_reason: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() => setConfiguration(null)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  disabled={busy || !configuration.employment}
                  type="submit"
                >
                  {t("consultantPayroll.save")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!history}
        onOpenChange={open => !busy && !open && setHistory(null)}
      >
        <DialogContent onCloseAutoFocus={dialogFocus.restore}>
          <DialogHeader>
            <DialogTitle>{t("consultantPayroll.history")}</DialogTitle>
            <DialogDescription>
              {t("consultantPayroll.versionHelp")}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {history?.records.map(record => (
            <article
              className="space-y-2 rounded-md border p-3 text-sm"
              key={record.id}
            >
              <p className="font-medium">
                {record.effective_on} · {amount(record.monthly_fee)}
              </p>
              <p>
                {record.legal_entity_name} ·{" "}
                {t(`consultantPayroll.sources.${record.payment_source}`)}
              </p>
              <p>
                {record.weekdays
                  .map(day => t(`consultantPayroll.weekday.${day}`))
                  .join(", ")}{" "}
                · {record.hours_per_day} {t("consultantPayroll.hoursPerDay")}
              </p>
              <p className="whitespace-pre-wrap break-words">
                {record.change_reason}
              </p>
              <p className="text-muted-foreground">{record.created_by}</p>
            </article>
          ))}
          {history && (
            <div className="flex items-center justify-end gap-3">
              <Button
                disabled={busy || history.page <= 1}
                variant="outline"
                onClick={() =>
                  loadHistory(history.employment, history.page - 1)
                }
              >
                {t("previous")}
              </Button>
              <span>{t("salarySlips.page", history)}</span>
              <Button
                disabled={busy || history.page >= history.pages}
                variant="outline"
                onClick={() =>
                  loadHistory(history.employment, history.page + 1)
                }
              >
                {t("next")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selected}
        onOpenChange={open => !busy && !open && setSelected(null)}
      >
        <DialogContent onCloseAutoFocus={dialogFocus.restore}>
          <DialogHeader>
            <DialogTitle>
              {selected?.consultant_name || t("consultantPayroll.title")}
            </DialogTitle>
            <DialogDescription>
              {selected?.month} · {t("consultantPayroll.cutoff")}{" "}
              {selected?.cutoff}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <form className="space-y-4" onSubmit={recalculate}>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <p className="text-sm">
                {selected.legal_entity_name ||
                  t("consultantPayroll.missingEntity")}{" "}
                ·{" "}
                {selected.payment_source
                  ? t(`consultantPayroll.sources.${selected.payment_source}`)
                  : "—"}
              </p>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                {[
                  ["monthlyFee", amount(selected.monthly_fee)],
                  ["expected", selected.expected_hours ?? "—"],
                  ["recorded", selected.recorded_hours],
                  ["days", selected.working_days],
                  ["approvedWork", selected.approved_work_hours],
                  ["notRequiredWork", selected.not_required_work_hours],
                  ["pendingWork", selected.pending_work_hours],
                  ["rejectedWork", selected.rejected_work_hours],
                  ["unresolvedWork", selected.unresolved_work_hours],
                  ["recordedLeave", selected.recorded_timeoff_hours],
                  ["approvedPaidLeave", t("consultantPayroll.unavailable")],
                  ["ptoBalances", t("consultantPayroll.unavailable")],
                ].map(([key, value]) => (
                  <React.Fragment key={key}>
                    <dt>{t(`consultantPayroll.${key}`)}</dt>
                    <dd className="tabular-nums">{value ?? "—"}</dd>
                  </React.Fragment>
                ))}
              </dl>
              {selected.warnings.length > 0 && (
                <ul className="list-disc space-y-1 rounded-md border p-4 pl-7 text-sm">
                  {selected.warnings.map(warning => (
                    <li key={warning}>
                      {t(`consultantPayroll.warnings.${warning}`)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="space-y-2">
                <Label htmlFor="payroll-unpaid">
                  {t("consultantPayroll.unpaid")}
                </Label>
                <Input
                  disabled={busy}
                  id="payroll-unpaid"
                  inputMode="decimal"
                  maxLength={9}
                  pattern="[0-9]{1,6}(\.[0-9]{1,2})?"
                  required
                  value={unpaid}
                  onChange={event => {
                    setUnpaid(event.target.value);
                    setDirty(true);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("consultantPayroll.unpaidHelp")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-unpaid-reason">
                  {t("consultantPayroll.unpaidReason")}
                </Label>
                <Textarea
                  disabled={busy}
                  id="payroll-unpaid-reason"
                  maxLength={1000}
                  required={Number(unpaid) > 0}
                  value={reason}
                  onChange={event => {
                    setReason(event.target.value);
                    setDirty(true);
                  }}
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  {t("consultantPayroll.reimbursements")}
                </legend>
                <p className="text-xs text-muted-foreground">
                  {t("consultantPayroll.reimbursementHelp")}
                </p>
                {selected.eligible_expenses.length ? (
                  selected.eligible_expenses.map(expense => (
                    <label
                      className="flex items-start gap-2 rounded-md border p-3 text-sm"
                      key={expense.id}
                    >
                      <input
                        checked={expenseIds.includes(expense.id)}
                        disabled={busy}
                        type="checkbox"
                        onChange={event => {
                          setExpenseIds(previous =>
                            event.target.checked
                              ? [...previous, expense.id]
                              : previous.filter(id => id !== expense.id)
                          );
                          setDirty(true);
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block">
                          #{expense.id} · {expense.date} ·{" "}
                          {amount(expense.amount)}
                        </span>
                        <span className="block whitespace-pre-wrap break-words">
                          {expense.description}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t("consultantPayroll.receipts", {
                            count: expense.receipt_count,
                          })}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("consultantPayroll.noClaims")}
                  </p>
                )}
                {Object.entries(selected.excluded_expenses).map(
                  ([key, count]) => (
                    <p className="text-xs text-muted-foreground" key={key}>
                      {t(`consultantPayroll.excluded.${key}`, { count })}
                    </p>
                  )
                )}
              </fieldset>
              {dirty && (
                <p className="text-sm" role="status">
                  {t("consultantPayroll.recalculateHelp")}
                </p>
              )}
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t pt-4 text-sm">
                <dt>{t("consultantPayroll.feeEstimate")}</dt>
                <dd className="tabular-nums">
                  {dirty ? "—" : amount(selected.fee_estimate)}
                </dd>
                <dt>{t("consultantPayroll.selectedClaims")}</dt>
                <dd className="tabular-nums">
                  {dirty ? "—" : amount(selected.reimbursement_total)}
                </dd>
                <dt>{t("consultantPayroll.withholding")}</dt>
                <dd>{t("consultantPayroll.unavailable")}</dd>
                <dt className="font-medium">{t("consultantPayroll.total")}</dt>
                <dd className="font-medium tabular-nums">
                  {dirty ? "—" : amount(selected.total_estimate)}
                </dd>
              </dl>
              <p className="text-xs text-muted-foreground">
                {t("consultantPayroll.previewHelp")}
              </p>
              <Button disabled={busy} type="submit">
                {t("consultantPayroll.recalculate")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

const ConsultantPayroll = () => {
  const { company } = useUserContext();

  return <PayrollWorkspace companyId={company?.id} key={company?.id} />;
};
export default ConsultantPayroll;
