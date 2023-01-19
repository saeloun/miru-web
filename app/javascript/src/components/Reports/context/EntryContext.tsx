import { createContext, useContext } from "react";

import AccountsAgingReportContext from "./AccountsAgingReportContext";
import OutstandingOverdueInvoiceContext from "./outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "./RevenueByClientContext";
import TimeEntryReportContext from "./TimeEntryReportContext";

const EntryContext = createContext({
  currentReport: "",
  revenueByClientReport: RevenueByClientReportContext,
  timeEntryReport: TimeEntryReportContext,
  outstandingOverdueInvoice: OutstandingOverdueInvoiceContext,
  accountsAgingReport: AccountsAgingReportContext,
});

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
