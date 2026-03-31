import React from "react";

import { SummaryDashboard } from "StyledComponents";
import { i18n } from "../../../i18n";

const InvoiceSummary = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
  isDesktop,
}) => {
  const applyFilter = status => {
    setFilterParams({
      ...filterParams,
      ["status"]: status,
    });
  };

  const summaryList = [
    {
      label: i18n.t("all").toUpperCase(),
      value: summary.totalAmount,
      onClick: () => applyFilter([]), // Clear all filters to show all invoices
    },
    {
      label: i18n.t("invoices.overdue").toUpperCase(),
      value: summary.overdueAmount,
      onClick: () => applyFilter([{ value: "overdue", label: i18n.t("invoices.overdue").toUpperCase() }]),
    },
    {
      label: i18n.t("invoices.outstanding").toUpperCase(),
      value: summary.outstandingAmount,
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: i18n.t("invoices.overdue").toUpperCase() },
        ]),
    },
    {
      label: isDesktop ? i18n.t("invoices.draft").toUpperCase() : i18n.t("invoices.draft").toUpperCase(),
      value: summary.draftAmount,
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  return (
    <SummaryDashboard
      currency={baseCurrency}
      summaryList={summaryList}
      wrapperClassName="mt-1 lg:mt-4"
    />
  );
};

export default InvoiceSummary;
