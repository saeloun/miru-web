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

  const parseAmount = value => {
    if (typeof value === "number") return value;
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  };
  const overdueAmount = parseAmount(summary.overdueAmount);
  const outstandingAmount = parseAmount(summary.outstandingAmount);
  const providedOpenAmount = parseAmount(summary.openAmount ?? 0);
  const draftAmount = parseAmount(summary.draftAmount);
  const openAmount =
    summary.openAmount !== undefined
      ? providedOpenAmount
      : Math.max(outstandingAmount - overdueAmount, 0);
  const totalAmount = overdueAmount + openAmount + draftAmount;

  const summaryList = [
    {
      label: i18n.t("all").toUpperCase(),
      value: totalAmount,
      onClick: () => applyFilter([]), // Clear all filters to show all invoices
    },
    {
      label: i18n.t("invoices.overdue").toUpperCase(),
      value: overdueAmount,
      onClick: () =>
        applyFilter([
          { value: "overdue", label: i18n.t("invoices.overdue").toUpperCase() },
        ]),
    },
    {
      label: i18n.t("invoices.outstanding").toUpperCase(),
      value: openAmount,
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
        ]),
    },
    {
      label: isDesktop
        ? i18n.t("invoices.draft").toUpperCase()
        : i18n.t("invoices.draft").toUpperCase(),
      value: draftAmount,
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
