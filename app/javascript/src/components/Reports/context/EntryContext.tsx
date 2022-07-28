import { createContext, useContext } from "react";
import OutstandingOverdueInvoiceContext from "./outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "./RevenueByClientContext";
import TimeEntryReportContext from "./TimeEntryReportContext";

const EntryContext = createContext(({
  currentReport: "",
  revenueByClientReport: RevenueByClientReportContext,
  timeEntryReport: TimeEntryReportContext,
  outstandingOverdueInvoice: OutstandingOverdueInvoiceContext
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
