export const getReports = ({ currentReport, timeEntryReport, revenueByClientReport, totalHoursLoggedReport, outstandingOverdueInvoice }) => {
  switch (currentReport) {
    case "RevenueByClientReport":
      return revenueByClientReport;
    case "TimeEntryReport":
      return timeEntryReport;
    case "outstandingOverdueInvoiceReport":
      return outstandingOverdueInvoice;
    case "TotalHoursLoggedReport":
      return totalHoursLoggedReport;
    default:
      break;
  }
};
