export const REVENUE_REPORT_PAGE = "Revenue Report";

export const summaryList = (revenueByClientReport, isDesktop) => {
  if (isDesktop) {
    return [
      {
        label: "TOTAL PENDING AMOUNT",
        value: revenueByClientReport.summary.totalOutstandingAmount,
      },
      {
        label: "TOTAL PAID AMOUNT",
        value: revenueByClientReport.summary.totalPaidAmount,
      },
      {
        label: "TOTAL REVENUE",
        value: revenueByClientReport.summary.totalRevenue,
      },
    ];
  }

  return [
    {
      label: "PENDING",
      value: revenueByClientReport.summary.totalOutstandingAmount,
    },
    {
      label: "PAID",
      value: revenueByClientReport.summary.totalPaidAmount,
    },
    {
      label: "REVENUE",
      value: revenueByClientReport.summary.totalRevenue,
    },
  ];
};
