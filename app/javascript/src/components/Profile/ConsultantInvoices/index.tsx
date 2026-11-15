/* global AbortController */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";
import { useUserContext } from "context/UserContext";
import { Button } from "components/ui/button";
import {
  InvoiceCard,
  InvoiceForm,
  invoiceError,
  invoiceReason,
} from "components/Payroll/Invoices";
import {
  consultantInvoicesApi,
  saveInvoicePdf,
  type ConsultantInvoice,
  type OwnInvoices,
} from "./api";

export default function ConsultantInvoicesPage() {
  const { company, user } = useUserContext();

  return (
    <ScopedConsultantInvoices
      key={`${company?.id || ""}:${user?.id || ""}:${
        user?.current_workspace_id || ""
      }`}
    />
  );
}

function ScopedConsultantInvoices() {
  const { company, user } = useUserContext();
  const companyId = String(company?.id || "");
  const valid =
    Boolean(companyId) && companyId === String(user?.current_workspace_id);
  const scope = `${companyId}:${user?.id || ""}`;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const [data, setData] = useState<OwnInvoices>();
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const abort = useRef<AbortController | undefined>(undefined);
  useLayoutEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    setData(undefined);
    setError("");
    if (valid) {
      consultantInvoicesApi
        .own(companyId, page, controller.signal)
        .then(response => {
          if (!controller.signal.aborted && scopeRef.current === scope) {
            setData(response.data);
          }
        })
        .catch(failure => {
          if (!axios.isCancel(failure) && !controller.signal.aborted) {
            setError(invoiceError(failure));
          }
        });
    }

    return () => controller.abort();
  }, [scope, valid, companyId, page, refresh]);

  const download = async (
    invoice: ConsultantInvoice,
    kind: "paid" | "original"
  ) => {
    if (!abort.current) return;
    const controller = abort.current;
    try {
      const response = await consultantInvoicesApi.pdf(
        companyId,
        invoice,
        kind,
        controller.signal
      );
      if (!controller.signal.aborted && scopeRef.current === scope) {
        saveInvoicePdf(
          response.data,
          `consultant-invoice-${invoice.id}-${kind}.pdf`
        );
      }
    } catch (failure) {
      if (!axios.isCancel(failure) && !controller.signal.aborted) {
        setError(invoiceError(failure));
      }
    }
  };
  if (!valid) {
    return (
      <p role="alert" className="p-6 text-sm">
        Consultant invoice history is unavailable in this workspace.
      </p>
    );
  }

  const run = data?.available_runs.find(
    option => `${option.id}:${option.employment_id}` === selected
  );

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">My consultant invoices</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRefresh(value => value + 1)}
        >
          Refresh invoice history
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Paid invoices and original documents remain available after
        authorization withdrawal or exit while this identity is retained.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading private invoice history…</p>}
      {data?.invoices.length === 0 && (
        <p className="rounded-lg border p-4 text-sm">
          No paid consultant invoices are available yet.
        </p>
      )}
      {data?.invoices.map(invoice => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          download={kind => void download(invoice, kind)}
        />
      ))}
      {data && (data.page > 1 || data.has_more) && (
        <nav className="flex gap-2" aria-label="Invoice history pages">
          <Button
            type="button"
            variant="outline"
            disabled={data.page === 1}
            onClick={() => setPage(data.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!data.has_more}
            onClick={() => setPage(data.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
      {data?.preparations.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Submitted originals</h2>
          {data.preparations.map(preparation => (
            <article
              key={preparation.id}
              className="space-y-2 rounded-lg border p-4"
            >
              <h3 className="font-medium">
                {preparation.facts.number} · {preparation.period}
              </h3>
              <p className="text-sm">
                {preparation.reviewed
                  ? "Accounts reviewed"
                  : "Awaiting accounts review"}
                . {invoiceReason(preparation.error_code)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const controller = abort.current;
                  if (controller) {
                    void consultantInvoicesApi
                      .original(companyId, preparation.id, controller.signal)
                      .then(response => {
                        if (
                          !controller.signal.aborted &&
                          scopeRef.current === scope
                        ) {
                          saveInvoicePdf(
                            response.data,
                            "consultant-original.pdf"
                          );
                        }
                      })
                      .catch(failure => {
                        if (
                          !axios.isCancel(failure) &&
                          !controller.signal.aborted
                        ) {
                          setError(invoiceError(failure));
                        }
                      });
                  }
                }}
              >
                Download submitted original
              </Button>
            </article>
          ))}
        </section>
      ) : null}
      {Boolean(data?.available_runs.length) && (
        <section className="space-y-3 border-t pt-5">
          <h2 className="text-lg font-semibold">
            Have an existing invoice for a settlement?
          </h2>
          <label
            className="block text-sm font-medium"
            htmlFor="existing-invoice-period"
          >
            Approved service period
          </label>
          <select
            id="existing-invoice-period"
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
            value={selected}
            onChange={event => setSelected(event.target.value)}
          >
            <option value="">Select the invoice's service period</option>
            {data!.available_runs.map(option => (
              <option
                key={`${option.id}:${option.employment_id}`}
                value={`${option.id}:${option.employment_id}`}
              >
                {option.period} · {option.legal_entity_name}
              </option>
            ))}
          </select>
          {run && (
            <InvoiceForm
              key={`${scope}:${selected}:${run.preparation?.id || ""}`}
              own
              companyId={companyId}
              runId={run.id}
              employmentId={run.employment_id}
              revisionDigest={run.revision_digest}
              entityName={run.legal_entity_name}
              financialYear={run.financial_year}
              accountsEmail={data!.accounts_email}
              preparation={run.preparation}
              onSaved={() => {
                setSelected("");
                setRefresh(value => value + 1);
              }}
            />
          )}
        </section>
      )}
    </main>
  );
}
