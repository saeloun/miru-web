import React, { useEffect, useRef, useState } from "react";

import http from "apis/api";
import { Button } from "components/ui/button";

import { downloadAttachment, errorMessage, requestOptions } from "./api";
import { Field, Section, text } from "./Fields";

const Reports = ({ companyId }) => {
  const [controller] = useState(() => new window.AbortController());
  const [metadata, setMetadata] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [name, setName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const form = useRef<React.ElementRef<"form">>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const options = requestOptions(controller.signal);

  const resetEditor = () => {
    setEditingReportId(null);
    setName("");
    setColumns([]);
  };

  const load = async () => {
    const [reports, settings] = await Promise.all([
      http.get("/employee_reports", options),
      http.get("/employee_record_settings", options),
    ]);
    if (controller.signal.aborted) return;

    if (
      String(reports.data.company_id) !== companyId ||
      String(settings.data.employee_record_setting.company_id) !== companyId
    ) {
      throw new Error("workspace");
    }
    setMetadata(reports.data);
    setEnabled(
      settings.data.employee_record_setting.occasion_reminders_enabled
    );
  };

  const perform = async action => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError((await errorMessage(failure)) || text("failed"));
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  useEffect(() => {
    perform(load);

    return () => controller.abort();
  }, []);

  return (
    <Section title={text("adminReports")}>
      {error && (
        <p className="text-destructive" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!metadata ? (
        !error && <p role="status">{text("loading")}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{text("reportHelp")}</p>
          <form
            className="space-y-4"
            ref={form}
            onSubmit={event => {
              event.preventDefault();
              perform(async () => {
                const data = {
                  employee_report: { company_id: companyId, name, columns },
                };
                if (editingReportId === null) {
                  await http.post("/employee_reports", data, options);
                } else {
                  await http.patch(
                    `/employee_reports/${editingReportId}`,
                    data,
                    options
                  );
                }
                await load();
                if (!controller.signal.aborted) {
                  if (editingReportId === null) setName("");
                  else resetEditor();
                  setNotice(text("reportSaved"));
                }
              });
            }}
          >
            {editingReportId !== null && (
              <h3 className="font-semibold">{text("editReportDefinition")}</h3>
            )}
            <Field
              required
              disabled={busy}
              maxLength={100}
              name="reportName"
              value={name}
              onChange={setName}
            />
            <div className="flex flex-wrap gap-2">
              {Object.entries(metadata.presets).map(([preset, keys]) => (
                <Button
                  key={preset}
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() => setColumns(keys as string[])}
                >
                  {text(`${preset}Preset`)}
                </Button>
              ))}
            </div>
            <fieldset className="grid gap-3 sm:grid-cols-2" disabled={busy}>
              <legend className="mb-2 font-medium">
                {text("reportColumns")}
              </legend>
              {metadata.columns.map(column => (
                <label
                  className="flex min-h-10 items-start gap-2 rounded-md border border-border p-3"
                  key={column.key}
                >
                  <input
                    checked={columns.includes(column.key)}
                    className="mt-1 h-4 w-4 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                    type="checkbox"
                    onChange={event =>
                      setColumns(
                        event.target.checked
                          ? [...columns, column.key]
                          : columns.filter(key => key !== column.key)
                      )
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {column.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {column.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || columns.length === 0} type="submit">
                {text(
                  editingReportId === null ? "saveReport" : "saveReportChanges"
                )}
              </Button>
              {editingReportId !== null && (
                <Button
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetEditor();
                    setError("");
                    setNotice("");
                  }}
                >
                  {text("cancel")}
                </Button>
              )}
            </div>
          </form>
          <Field
            required
            disabled={busy}
            name="reportMonth"
            type="month"
            value={month}
            onChange={setMonth}
          />
          {metadata.employee_reports.length === 0 && <p>{text("noReports")}</p>}
          <ul className="space-y-3">
            {metadata.employee_reports.map(report => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                key={report.id}
              >
                <span className="min-w-0 break-all font-medium">
                  {report.name}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingReportId(report.id);
                      setName(report.name);
                      setColumns([...report.columns]);
                      setError("");
                      setNotice("");
                      const input =
                        form.current?.querySelector<HTMLInputElement>(
                          "#reportName"
                        );
                      input?.focus();
                      input?.scrollIntoView({ block: "center" });
                    }}
                  >
                    {text("editReport", { name: report.name })}
                  </Button>
                  <Button
                    disabled={busy || !/^\d{4}-\d{2}$/.test(month)}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      perform(() =>
                        downloadAttachment(
                          `/employee_reports/${report.id}/download`,
                          `employee-report-${report.id}-${month}.csv`,
                          controller.signal,
                          { month }
                        )
                      )
                    }
                  >
                    {text("downloadCsv")}
                  </Button>
                  <Button
                    disabled={busy}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      perform(async () => {
                        await http.delete(`/employee_reports/${report.id}`, {
                          ...options,
                          data: { employee_report: { company_id: companyId } },
                        });
                        if (
                          !controller.signal.aborted &&
                          report.id === editingReportId
                        ) {
                          resetEditor();
                        }
                        await load();
                      })
                    }
                  >
                    {text("deleteReport", { name: report.name })}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="font-semibold">{text("reminders")}</h3>
            <p className="text-sm text-muted-foreground">
              {text("reminderHelp")}
            </p>
            <label className="flex min-h-10 items-center gap-2">
              <input
                checked={enabled}
                className="h-4 w-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                disabled={busy}
                type="checkbox"
                onChange={event => {
                  const next = event.target.checked;
                  perform(async () => {
                    const response = await http.patch(
                      "/employee_record_settings",
                      {
                        employee_record_setting: {
                          company_id: companyId,
                          occasion_reminders_enabled: next,
                        },
                      },
                      options
                    );
                    if (
                      !controller.signal.aborted &&
                      String(
                        response.data.employee_record_setting.company_id
                      ) === companyId
                    ) {
                      setEnabled(
                        response.data.employee_record_setting
                          .occasion_reminders_enabled
                      );
                      setNotice(text("remindersSaved"));
                    }
                  });
                }}
              />
              <span>{text("enableReminders")}</span>
            </label>
          </div>
        </>
      )}
    </Section>
  );
};

export default Reports;
