import React from "react";

import { SummaryDashboard } from "StyledComponents";

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
      label: "OVERDUE",
      value: summary.overdueAmount,
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      label: "OUTSTANDING",
      value: summary.outstandingAmount,
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: "OVERDUE" },
        ]),
    },
    {
      label: isDesktop ? "AMOUNT IN DRAFT" : "DRAFT",
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
