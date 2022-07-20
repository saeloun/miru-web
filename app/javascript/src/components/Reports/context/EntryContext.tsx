import { createContext, useContext } from "react";
import OutstandingOverdueInvoiceContext from "./outstandingOverdueInvoiceContext";
import RevenueByClientReportContext from "./RevenueByClientContext";
import TimeEntryReportContext from "./TimeEntryReportContext";
import TotalHoursLoggedReportContext from "./TotalHoursLoggedReportContext";

const EntryContext = createContext(({
  currentReport: "",
  revenueByClientReport: RevenueByClientReportContext,
  timeEntryReport: TimeEntryReportContext,
  outstandingOverdueInvoice: OutstandingOverdueInvoiceContext,
  totalHoursLoggedReport: TotalHoursLoggedReportContext
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
