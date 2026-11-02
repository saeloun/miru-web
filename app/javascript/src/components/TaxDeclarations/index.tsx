import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

type Declaration = {
  id: number;
  employee_name: string;
  tax_year: number;
  category: string;
  claimed_amount: string;
  approved_amount: string | null;
  notes: string;
  status: string;
  review_reason: string | null;
  reviewed_at: string | null;
  supersedes_id: number | null;
  revision_id: number | null;
  can_submit: boolean;
  can_review: boolean;
  can_revise: boolean;
  can_withdraw: boolean;
  evidence: { id: number; filename: string }[];
};
type Archive = {
  can_estimate_tax: boolean;
  tax_declarations: Declaration[];
  categories: string[];
  tax_years: number[];
  pagination: { page: number; pages: number };
};
type Draft = {
  taxYear: string;
  category: string;
  amount: string;
  notes: string;
  files: File[];
  reuse: boolean;
  previous: Declaration | null;
};

const yearLabel = (year: number | string) => t(`taxDeclarations.years.${year}`);

const DeclarationWorkspace = ({
  companyId,
}: {
  companyId: number | string | undefined;
}) => {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [year, setYear] = useState("all");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<Declaration | null>(null);
  const [decision, setDecision] = useState("approved");
  const [approved, setApproved] = useState("");
  const [reason, setReason] = useState("");
  const [withdraw, setWithdraw] = useState(false);
  const dialogFocus = useDialogReturnFocus();
  const withdrawalFocus = useDialogReturnFocus();

  const fail = (failure: any) =>
    setError(failure?.response?.data?.errors || t("taxDeclarations.failed"));

  useEffect(() => {
    let active = true;
    setArchive(null);
    Api.get("/tax_declarations", {
      params: { tax_year: year === "all" ? "" : year, page },
    })
      .then(({ data }) => active && setArchive(data))
      .catch(failure => active && fail(failure));

    return () => {
      active = false;
    };
  }, [year, page, refresh]);

  const openRecord = async (id: number) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.get(`/tax_declarations/${id}`);
      setSelected(data.tax_declaration);
      setApproved(data.tax_declaration.claimed_amount);
      setReason("");
      setDecision("approved");
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const startDraft = (previous: Declaration | null = null) => {
    setSelected(null);
    setError("");
    setDraft({
      previous,
      taxYear: String(previous?.tax_year || 2026),
      category: previous?.category || "investment",
      amount: previous?.claimed_amount || "",
      notes: previous?.notes || "",
      files: [],
      reuse: !!previous?.evidence.length,
    });
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("tax_declaration[company_id]", String(companyId));
    body.append("tax_declaration[tax_year]", draft.taxYear);
    body.append("tax_declaration[category]", draft.category);
    body.append("tax_declaration[claimed_amount]", draft.amount);
    body.append("tax_declaration[notes]", draft.notes);
    if (draft.previous) {
      body.append("tax_declaration[supersedes_id]", String(draft.previous.id));
      body.append("tax_declaration[reuse_evidence]", String(draft.reuse));
    }

    draft.files.forEach(file =>
      body.append("tax_declaration[evidence][]", file)
    );
    try {
      const { data } = await Api.post("/tax_declarations", body);
      setDraft(null);
      setSelected(data.tax_declaration);
      setRefresh(value => value + 1);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (action: "submit" | "review" | "withdraw") => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.post(
        `/tax_declarations/${selected.id}/${action}`,
        action === "review"
          ? { review: { decision, approved_amount: approved, reason } }
          : {}
      );
      setSelected(data.tax_declaration);
      setWithdraw(false);
      setRefresh(value => value + 1);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const download = async (file: Declaration["evidence"][number]) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.get(
        `/tax_declarations/${selected.id}/evidence/${file.id}`,
        { responseType: "blob", skipErrorToast: true }
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure: any) {
      if (failure?.response?.status === 404) {
        setError(t("documentUnavailable"));
      } else {
        fail(failure);
      }
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
            {t("taxDeclarations.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("taxDeclarations.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {archive?.can_estimate_tax && (
            <Button asChild variant="outline">
              <Link to="/india-tax">{t("indiaTax.open")}</Link>
            </Button>
          )}
          <Button
            disabled={busy || !archive || !companyId}
            onClick={event => {
              dialogFocus.remember(event);
              startDraft();
            }}
          >
            {t("taxDeclarations.new")}
          </Button>
        </div>
      </header>
      <p className="rounded-lg border bg-muted/30 p-4 text-sm">
        {t("taxDeclarations.manualHelp")}
      </p>
      {error && !draft && !selected && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="max-w-sm space-y-2">
        <Label htmlFor="declaration-year">{t("taxDeclarations.taxYear")}</Label>
        <Select
          disabled={busy}
          value={year}
          onValueChange={value => {
            setYear(value);
            setPage(1);
          }}
        >
          <SelectTrigger id="declaration-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("taxDeclarations.allYears")}</SelectItem>
            {(archive?.tax_years || [2025, 2026]).map(value => (
              <SelectItem key={value} value={String(value)}>
                {yearLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!archive ? (
        <p role="status">
          {error ? t("taxDeclarations.failed") : t("loading")}
        </p>
      ) : !archive.tax_declarations.length ? (
        <p className="rounded-lg border p-8 text-sm text-muted-foreground">
          {t("taxDeclarations.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "employee",
                  "taxYear",
                  "category",
                  "claimed",
                  "approved",
                  "status",
                  "actions",
                ].map(key => (
                  <th className="p-3 font-medium" key={key}>
                    {t(`taxDeclarations.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archive.tax_declarations.map(record => (
                <tr className="border-b last:border-0" key={record.id}>
                  <td className="p-3">{record.employee_name}</td>
                  <td className="whitespace-nowrap p-3">
                    {yearLabel(record.tax_year)}
                  </td>
                  <td className="p-3">
                    {t(`taxDeclarations.categories.${record.category}`)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {currencyFormat("INR", record.claimed_amount)}
                  </td>
                  <td className="p-3 tabular-nums">
                    {record.approved_amount
                      ? currencyFormat("INR", record.approved_amount)
                      : "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {t(`taxDeclarations.states.${record.status}`)}
                    </Badge>
                    {record.revision_id && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("taxDeclarations.hasRevision", {
                          id: record.revision_id,
                        })}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      disabled={busy}
                      size="sm"
                      variant="outline"
                      onClick={event => {
                        dialogFocus.remember(event);
                        openRecord(record.id);
                      }}
                    >
                      {t("taxDeclarations.view", { id: record.id })}
                    </Button>
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
        open={!!draft}
        onOpenChange={open => {
          if (!busy && !open) {
            setDraft(null);
            setError("");
          }
        }}
      >
        <DialogContent onCloseAutoFocus={dialogFocus.restore}>
          <DialogHeader>
            <DialogTitle>
              {t(
                draft?.previous
                  ? "taxDeclarations.correct"
                  : "taxDeclarations.new"
              )}
            </DialogTitle>
            <DialogDescription>
              {t("taxDeclarations.draftHelp")}
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form className="space-y-4" onSubmit={saveDraft}>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="claim-year">
                  {t("taxDeclarations.taxYear")}
                </Label>
                <Select
                  disabled={busy || !!draft.previous}
                  value={draft.taxYear}
                  onValueChange={taxYear => setDraft({ ...draft, taxYear })}
                >
                  <SelectTrigger id="claim-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(archive?.tax_years || [2025, 2026]).map(value => (
                      <SelectItem key={value} value={String(value)}>
                        {yearLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-category">
                  {t("taxDeclarations.category")}
                </Label>
                <Select
                  disabled={busy || !!draft.previous}
                  value={draft.category}
                  onValueChange={category => setDraft({ ...draft, category })}
                >
                  <SelectTrigger id="claim-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {archive?.categories.map(value => (
                      <SelectItem key={value} value={value}>
                        {t(`taxDeclarations.categories.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-amount">
                  {t("taxDeclarations.claimed")}
                </Label>
                <Input
                  disabled={busy}
                  id="claim-amount"
                  inputMode="decimal"
                  maxLength={13}
                  pattern="[0-9]{1,10}(\.[0-9]{1,2})?"
                  required
                  value={draft.amount}
                  onChange={event =>
                    setDraft({ ...draft, amount: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-notes">
                  {t("taxDeclarations.notes")}
                </Label>
                <Textarea
                  disabled={busy}
                  id="claim-notes"
                  maxLength={2000}
                  required={draft.category === "other"}
                  value={draft.notes}
                  onChange={event =>
                    setDraft({ ...draft, notes: event.target.value })
                  }
                />
              </div>
              {!!draft.previous?.evidence.length && (
                <label className="flex items-start gap-2 text-sm">
                  <input
                    checked={draft.reuse}
                    disabled={busy}
                    type="checkbox"
                    onChange={event =>
                      setDraft({ ...draft, reuse: event.target.checked })
                    }
                  />
                  {t("taxDeclarations.reuseEvidence", {
                    count: draft.previous.evidence.length,
                  })}
                </label>
              )}
              <div className="space-y-2">
                <Label htmlFor="claim-evidence">
                  {t("taxDeclarations.evidence")}
                </Label>
                <Input
                  accept="application/pdf,image/jpeg,image/png"
                  disabled={busy}
                  id="claim-evidence"
                  multiple
                  type="file"
                  onChange={event => {
                    const files = Array.from(event.target.files || []);
                    if (
                      files.length +
                        (draft.reuse
                          ? draft.previous?.evidence.length || 0
                          : 0) >
                        5 ||
                      files.some(file => file.size > 5 * 1024 * 1024)
                    ) {
                      setError(t("taxDeclarations.fileLimit"));
                      event.target.value = "";
                      setDraft({ ...draft, files: [] });

                      return;
                    }
                    setError("");
                    setDraft({ ...draft, files });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("taxDeclarations.fileLimit")}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(null);
                    setError("");
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button disabled={busy} type="submit">
                  {t("taxDeclarations.save")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selected}
        onOpenChange={open => {
          if (!busy && !open) {
            setSelected(null);
            setError("");
          }
        }}
      >
        <DialogContent onCloseAutoFocus={dialogFocus.restore}>
          <DialogHeader>
            <DialogTitle>
              {selected
                ? t("taxDeclarations.view", { id: selected.id })
                : t("taxDeclarations.title")}
            </DialogTitle>
            <DialogDescription>
              {selected?.employee_name} ·{" "}
              {selected && yearLabel(selected.tax_year)}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {error && !withdraw && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {t(`taxDeclarations.states.${selected.status}`)}
                </Badge>
                <span className="text-sm">
                  {t(`taxDeclarations.categories.${selected.category}`)}
                </span>
              </div>
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
                <dt>{t("taxDeclarations.claimed")}</dt>
                <dd className="tabular-nums">
                  {currencyFormat("INR", selected.claimed_amount)}
                </dd>
                <dt>{t("taxDeclarations.approved")}</dt>
                <dd className="tabular-nums">
                  {selected.approved_amount
                    ? currencyFormat("INR", selected.approved_amount)
                    : "—"}
                </dd>
              </dl>
              {selected.notes && (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {selected.notes}
                </p>
              )}
              {selected.review_reason && (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{t("taxDeclarations.reason")}</p>
                  <p className="whitespace-pre-wrap break-words">
                    {selected.review_reason}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t("taxDeclarations.evidence")}
                </p>
                {selected.evidence.length ? (
                  selected.evidence.map(file => (
                    <Button
                      className="h-auto max-w-full whitespace-normal break-all text-left"
                      disabled={busy}
                      key={file.id}
                      variant="outline"
                      onClick={() => download(file)}
                    >
                      {t("download")} · {file.filename}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("taxDeclarations.noEvidence")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.supersedes_id && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => openRecord(selected.supersedes_id!)}
                  >
                    {t("taxDeclarations.previousVersion")}
                  </Button>
                )}
                {selected.revision_id && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => openRecord(selected.revision_id!)}
                  >
                    {t("taxDeclarations.nextVersion")}
                  </Button>
                )}
              </div>
              {selected.can_review && (
                <form
                  className="space-y-3 border-t pt-4"
                  onSubmit={event => {
                    event.preventDefault();
                    changeStatus("review");
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="claim-decision">
                      {t("taxDeclarations.decision")}
                    </Label>
                    <Select
                      disabled={busy}
                      value={decision}
                      onValueChange={setDecision}
                    >
                      <SelectTrigger id="claim-decision">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["approved", "needs_information", "rejected"].map(
                          value => (
                            <SelectItem key={value} value={value}>
                              {t(`taxDeclarations.states.${value}`)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {decision === "approved" && (
                    <div className="space-y-2">
                      <Label htmlFor="claim-approved">
                        {t("taxDeclarations.approved")}
                      </Label>
                      <Input
                        disabled={busy}
                        id="claim-approved"
                        inputMode="decimal"
                        maxLength={13}
                        pattern="[0-9]{1,10}(\.[0-9]{1,2})?"
                        required
                        value={approved}
                        onChange={event => setApproved(event.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="claim-reason">
                      {t("taxDeclarations.reason")}
                    </Label>
                    <Textarea
                      disabled={busy}
                      id="claim-reason"
                      maxLength={2000}
                      required
                      value={reason}
                      onChange={event => setReason(event.target.value)}
                    />
                  </div>
                  <Button disabled={busy} type="submit">
                    {t("taxDeclarations.review")}
                  </Button>
                </form>
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                {selected.can_withdraw && (
                  <Button
                    disabled={busy}
                    variant="ghost"
                    onClick={event => {
                      withdrawalFocus.remember(event);
                      setError("");
                      setWithdraw(true);
                    }}
                  >
                    {t("taxDeclarations.withdraw")}
                  </Button>
                )}
                {selected.can_revise && (
                  <Button
                    disabled={busy}
                    variant="outline"
                    onClick={() => startDraft(selected)}
                  >
                    {t("taxDeclarations.correct")}
                  </Button>
                )}
                {selected.can_submit && (
                  <Button
                    disabled={busy || !selected.evidence.length}
                    onClick={() => changeStatus("submit")}
                  >
                    {t("taxDeclarations.submit")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={withdraw} onOpenChange={open => !busy && setWithdraw(open)}>
        <DialogContent onCloseAutoFocus={withdrawalFocus.restore}>
          <DialogHeader>
            <DialogTitle>{t("taxDeclarations.withdraw")}</DialogTitle>
            <DialogDescription>
              {t("taxDeclarations.withdrawHelp")}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => setWithdraw(false)}
            >
              {t("cancel")}
            </Button>
            <Button disabled={busy} onClick={() => changeStatus("withdraw")}>
              {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

const TaxDeclarations = () => {
  const { company } = useUserContext();

  return <DeclarationWorkspace companyId={company?.id} key={company?.id} />;
};
export default TaxDeclarations;
