/* global AbortController */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useUserContext } from "context/UserContext";
import { Button } from "components/ui/button";
import { consultantInvoicesApi } from "components/Profile/ConsultantInvoices/api";
import { invoiceError } from "./Invoices";

type RunList = {
  runs: { id: string; period: string; can_review_others: boolean }[];
  page: number;
  has_more: boolean;
};

export default function InvoiceRunSelector() {
  const { company, user } = useUserContext();
  const companyId = String(company?.id || "");
  if (!companyId || companyId !== String(user?.current_workspace_id)) {
    return null;
  }

  return (
    <ScopedInvoiceRunSelector
      key={`${companyId}:${user?.id || ""}`}
      companyId={companyId}
    />
  );
}

function ScopedInvoiceRunSelector({ companyId }: { companyId: string }) {
  const [data, setData] = useState<RunList>();
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setData(undefined);
    setError("");
    consultantInvoicesApi
      .runs(companyId, page, controller.signal)
      .then(response => {
        if (!controller.signal.aborted) setData(response.data);
      })
      .catch(failure => {
        if (!axios.isCancel(failure) && !controller.signal.aborted) {
          setError(invoiceError(failure));
        }
      });

    return () => controller.abort();
  }, [companyId, page]);

  return (
    <section
      aria-label="Consultant invoice service periods"
      className="space-y-3 rounded-lg border p-4"
    >
      <h2 className="text-lg font-semibold">Consultant invoices</h2>
      <p className="text-sm text-muted-foreground">
        Prepare invoice facts for approved service periods. An assigned accounts
        reviewer or owner must review another consultant's facts before issuance
        or email.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading invoice service periods…</p>}
      {data?.runs.length === 0 && (
        <p className="text-sm">
          No approved service periods are available yet.
        </p>
      )}
      <ul className="space-y-2">
        {data?.runs.map(run => (
          <li key={run.id}>
            <Link
              className="text-sm font-medium text-primary underline"
              to={`/payroll/${run.id}/consultant-invoices`}
            >
              Prepare consultant invoices · {run.period}
            </Link>
          </li>
        ))}
      </ul>
      {data && (data.page > 1 || data.has_more) && (
        <nav aria-label="Invoice service period pages" className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={data.page === 1}
            onClick={() => setPage(data.page - 1)}
          >
            Previous service periods
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!data.has_more}
            onClick={() => setPage(data.page + 1)}
          >
            Next service periods
          </Button>
        </nav>
      )}
    </section>
  );
}
