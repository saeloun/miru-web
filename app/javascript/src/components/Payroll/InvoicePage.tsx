import React from "react";
import { useParams } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import PayrollInvoices from "./Invoices";

export default function PayrollInvoicePage() {
  const { runId } = useParams<{ runId: string }>();
  const { company, user } = useUserContext();
  const companyId = String(company?.id || "");
  if (
    !runId ||
    !companyId ||
    companyId !== String(user?.current_workspace_id)
  ) {
    return (
      <p role="alert" className="p-6">
        Consultant invoices are unavailable in this workspace.
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      <PayrollInvoices companyId={companyId} runId={runId} />
    </main>
  );
}
