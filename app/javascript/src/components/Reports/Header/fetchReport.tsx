export const getReports = ({ currentReport, timeEntryReport, revenueByClientReport, totalHoursLoggedReport }) => {
  switch (currentReport) {
    case "RevenueByClientReport":
      return revenueByClientReport;
    case "TimeEntryReport":
      return timeEntryReport;
    case "TotalHoursLoggedReport":
      return totalHoursLoggedReport;
    default:
      break;
  }
};
