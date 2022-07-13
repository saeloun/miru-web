import { createContext, useContext } from "react";
import RevenueByClientReportContext from "./RevenueByClientContext";
import TimeEntryReportContext from "./TimeEntryReportContext";
import TotalHoursLoggedReportContext from "./TotalHoursLoggedReportContext";

const EntryContext = createContext(({
  currentReport: "",
  revenueByClientReport: RevenueByClientReportContext,
  timeEntryReport: TimeEntryReportContext,
  totalHoursLoggedReport: TotalHoursLoggedReportContext
}));

export const useEntry = () => useContext(EntryContext);

export default EntryContext;
