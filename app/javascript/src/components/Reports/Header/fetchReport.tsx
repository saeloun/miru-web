export const getReports = ({ currentReport, timeEntryReport, revenueByClientReport, outstandingOverdueInvoice }) => {
  switch (currentReport) {
    case "RevenueByClientReport":
      return revenueByClientReport;
    case "TimeEntryReport":
      return timeEntryReport;
    case "outstandingOverdueInvoiceReport":
      return outstandingOverdueInvoice;
    default:
      break;
  }
};
