export const getReports = ({
  currentReport,
  timeEntryReport,
  revenueByClientReport,
  outstandingOverdueInvoice,
  accountsAgingReport,
}) => {
  switch (currentReport) {
    case "RevenueByClientReport":
      return revenueByClientReport;
    case "TimeEntryReport":
      return timeEntryReport;
    case "outstandingOverdueInvoiceReport":
      return outstandingOverdueInvoice;
    case "accountsAgingReport":
      return accountsAgingReport;
    default:
      return;
  }
};
