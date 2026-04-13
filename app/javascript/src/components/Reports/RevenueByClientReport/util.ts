import { i18n } from "../../../i18n";

export const REVENUE_REPORT_PAGE = "Revenue Report";

export const summaryList = (revenueByClientReport, isDesktop) => {
  if (isDesktop) {
    return [
      {
        label: i18n.t("reports.outstandingAmount").toUpperCase(),
        value: revenueByClientReport.summary.totalOutstandingAmount,
      },
      {
        label: i18n.t("reports.paidAmount").toUpperCase(),
        value: revenueByClientReport.summary.totalPaidAmount,
      },
      {
        label: i18n.t("reports.totalRevenue").toUpperCase(),
        value: revenueByClientReport.summary.totalRevenue,
      },
    ];
  }

  return [
    {
      label: i18n.t("reports.outstanding").toUpperCase(),
      value: revenueByClientReport.summary.totalOutstandingAmount,
    },
    {
      label: i18n.t("reports.paid").toUpperCase(),
      value: revenueByClientReport.summary.totalPaidAmount,
    },
    {
      label: i18n.t("reports.totalRevenue").toUpperCase(),
      value: revenueByClientReport.summary.totalRevenue,
    },
  ];
};
