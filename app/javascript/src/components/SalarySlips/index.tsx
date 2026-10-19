import React, { useEffect, useState } from "react";
import Api from "apis/api";
import { useUserContext } from "context/UserContext";
import { t } from "../../i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

type Slip = {
  id: number;
  employee_name: string;
  pay_month: string;
  source: string;
  status: "draft" | "published" | "withdrawn";
  filename: string;
};
type Archive = {
  salary_slips: Slip[];
  can_manage: boolean;
  employments: { id: number; name: string; email: string }[];
  pagination: { page: number; pages: number };
};
type Upload = { file: File; employee: string; month: string; error?: string };

const SalarySlipArchive = () => {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    slip: Slip;
    action: "publish" | "withdraw";
  } | null>(null);

  const fail = (failure: any) =>
    setError(failure?.response?.data?.errors || t("salarySlips.failed"));

  useEffect(() => {
    let active = true;
    setArchive(null);
    Api.get("/salary_slips", { params: { month, page } })
      .then(({ data }) => active && setArchive(data))
      .catch(failure => active && fail(failure));

    return () => {
      active = false;
    };
  }, [month, page, refresh]);

  const saveDrafts = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      for (const upload of uploads) {
        const body = new FormData();
        body.append("salary_slip[employment_id]", upload.employee);
        body.append("salary_slip[pay_month]", `${upload.month}-01`);
        body.append("salary_slip[source]", source);
        body.append("salary_slip[file]", upload.file);
        try {
          await Api.post("/salary_slips", body);
          setUploads(previous =>
            previous.filter(item => item.file !== upload.file)
          );
        } catch (failure: any) {
          setUploads(previous =>
            previous.map(item =>
              item.file === upload.file
                ? {
                    ...item,
                    error:
                      failure?.response?.data?.errors ||
                      t("salarySlips.failed"),
                  }
                : item
            )
          );
        }
      }
    } finally {
      setBusy(false);
      setRefresh(value => value + 1);
    }
  };

  const changeStatus = async () => {
    if (!confirmation) return;
    setBusy(true);
    setError("");
    try {
      await Api.post(
        `/salary_slips/${confirmation.slip.id}/${confirmation.action}`
      );
      setConfirmation(null);
      setRefresh(value => value + 1);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  const download = async (slip: Slip) => {
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.get(`/salary_slips/${slip.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `salary-slip-${slip.pay_month.slice(0, 7)}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      fail(failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("salarySlips.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("salarySlips.description")}
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {archive?.can_manage && (
        <form
          className="space-y-4 rounded-lg border bg-card p-5"
          onSubmit={saveDrafts}
        >
          <h2 className="font-semibold">{t("salarySlips.import")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("salarySlips.importHelp")}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slip-source">{t("salarySlips.source")}</Label>
              <Input
                required
                disabled={busy}
                id="slip-source"
                maxLength={100}
                value={source}
                onChange={event => setSource(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slip-files">{t("salarySlips.files")}</Label>
              <Input
                accept="application/pdf"
                disabled={busy}
                id="slip-files"
                multiple
                type="file"
                onChange={event => {
                  const files = Array.from(event.target.files || []);
                  event.target.value = "";
                  if (
                    files.length > 20 ||
                    files.some(file => file.size > 5 * 1024 * 1024)
                  ) {
                    setUploads([]);
                    setError(t("salarySlips.fileLimit"));

                    return;
                  }
                  setError("");
                  setUploads(
                    files.map(file => ({ file, employee: "", month: "" }))
                  );
                }}
              />
            </div>
          </div>
          {uploads.map((upload, index) => (
            <div
              className="grid items-center gap-3 rounded-md border p-3 md:grid-cols-3"
              key={`${upload.file.name}-${index}`}
            >
              <div className="space-y-2">
                <span className="break-all text-sm">{upload.file.name}</span>
                <Button
                  aria-label={`${t("remove")} ${upload.file.name}`}
                  disabled={busy}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setUploads(items =>
                      items.filter(item => item.file !== upload.file)
                    )
                  }
                >
                  {t("remove")}
                </Button>
              </div>
              <Select
                disabled={busy}
                value={upload.employee}
                onValueChange={employee =>
                  setUploads(items =>
                    items.map((item, position) =>
                      position === index ? { ...item, employee } : item
                    )
                  )
                }
              >
                <SelectTrigger
                  aria-label={`${t("salarySlips.employee")} ${
                    upload.file.name
                  }`}
                >
                  <SelectValue placeholder={t("salarySlips.chooseEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {archive.employments.map(employee => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name} ({employee.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label={`${t("salarySlips.payMonth")} ${upload.file.name}`}
                disabled={busy}
                required
                type="month"
                value={upload.month}
                onChange={event =>
                  setUploads(items =>
                    items.map((item, position) =>
                      position === index
                        ? { ...item, month: event.target.value }
                        : item
                    )
                  )
                }
              />
              {upload.error && (
                <p
                  className="text-sm text-destructive md:col-span-3"
                  role="alert"
                >
                  {upload.file.name}: {upload.error}
                </p>
              )}
            </div>
          ))}
          <Button
            disabled={
              busy ||
              !uploads.length ||
              uploads.some(upload => !upload.employee || !upload.month)
            }
            type="submit"
          >
            {t("salarySlips.saveDrafts")}
          </Button>
        </form>
      )}
      <div className="flex max-w-sm items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="slip-filter">{t("salarySlips.payMonth")}</Label>
          <Input
            disabled={busy}
            id="slip-filter"
            type="month"
            value={month}
            onChange={event => {
              setMonth(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          disabled={busy || !month}
          variant="outline"
          onClick={() => {
            setMonth("");
            setPage(1);
          }}
        >
          {t("salarySlips.allMonths")}
        </Button>
      </div>
      {!archive ? (
        <p role="status">
          {error ? t("salarySlips.unavailable") : t("loading")}
        </p>
      ) : archive.salary_slips.length === 0 ? (
        <p className="rounded-lg border p-8 text-sm text-muted-foreground">
          {t("salarySlips.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {[
                  "employee",
                  "payMonth",
                  "source",
                  "files",
                  "status",
                  "actions",
                ].map(key => (
                  <th className="p-3 font-medium" key={key}>
                    {t(`salarySlips.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {archive.salary_slips.map(slip => (
                <tr className="border-b last:border-0" key={slip.id}>
                  <td className="p-3">{slip.employee_name}</td>
                  <td className="whitespace-nowrap p-3 tabular-nums">
                    {slip.pay_month.slice(0, 7)}
                  </td>
                  <td className="p-3">{slip.source}</td>
                  <td className="max-w-xs break-all p-3">{slip.filename}</td>
                  <td className="p-3">
                    <Badge variant="secondary">
                      {t(`salarySlips.${slip.status}`)}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        disabled={busy}
                        size="sm"
                        variant="outline"
                        onClick={() => download(slip)}
                      >
                        {t("download")}
                      </Button>
                      {archive.can_manage && slip.status === "draft" && (
                        <Button
                          disabled={busy}
                          size="sm"
                          onClick={() =>
                            setConfirmation({ slip, action: "publish" })
                          }
                        >
                          {t("salarySlips.publish")}
                        </Button>
                      )}
                      {archive.can_manage && slip.status !== "withdrawn" && (
                        <Button
                          disabled={busy}
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setConfirmation({ slip, action: "withdraw" })
                          }
                        >
                          {t("salarySlips.withdraw")}
                        </Button>
                      )}
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
        open={!!confirmation}
        onOpenChange={open => !busy && !open && setConfirmation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(`salarySlips.${confirmation?.action || "publish"}`)}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {confirmation?.slip.employee_name} ·{" "}
            {confirmation?.slip.pay_month.slice(0, 7)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              confirmation?.action === "withdraw"
                ? "salarySlips.withdrawHelp"
                : "salarySlips.publishHelp"
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => setConfirmation(null)}
            >
              {t("cancel")}
            </Button>
            <Button disabled={busy} onClick={changeStatus}>
              {t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

const SalarySlips = () => {
  const { company } = useUserContext();

  return <SalarySlipArchive key={company?.id} />;
};

export default SalarySlips;
