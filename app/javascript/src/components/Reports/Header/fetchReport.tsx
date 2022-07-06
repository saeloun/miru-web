export const getReports = ({ currentReport, timeEntryReport, revenueByClientReport }) => {
  switch (currentReport) {
    case "RevenueByClientReport":
      return revenueByClientReport;
    case "TimeEntryReport":
      return timeEntryReport;
    default:
      break;
  }
};
