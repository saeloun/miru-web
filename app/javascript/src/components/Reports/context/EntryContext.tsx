import { createContext, useContext } from "react";
import RevenueByClientReportContext from "./RevenueByClientContext";
import TimeEntryReportContext from "./TimeEntryReportContext";

const EntryContext = createContext(({
  currentReport: "",
  revenueByClientReport: RevenueByClientReportContext,
  timeEntryReport: TimeEntryReportContext
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
