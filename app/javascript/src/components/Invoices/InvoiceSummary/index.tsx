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
      label: "Overdue",
      value: summary.overdueAmount,
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      label: "Outstanding",
      value: summary.outstandingAmount,
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: "OVERDUE" },
        ]),
    },
    {
      label: isDesktop ? "Amount in draft" : "AMT IN DRAFT",
      value: summary.draftAmount,
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  return (
    <SummaryDashboard
      currency={baseCurrency}
      summaryList={summaryList}
      wrapperClassName="mt-1 lg:mt-6"
    />
  );
};

export default InvoiceSummary;
