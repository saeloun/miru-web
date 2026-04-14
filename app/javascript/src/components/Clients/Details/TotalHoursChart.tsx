import React from "react";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import { cashFormatter, currencySymbol } from "helpers";
import { i18n } from "../../../i18n";

const TotalHoursChart = ({
  projectDetails,
  totalMinutes,
  overdueOutstandingAmount,
  handleSelectChange,
}) => {
  const currencySymb = currencySymbol(
    overdueOutstandingAmount?.client_currency
  );

  const amountBox = [
    {
      title: i18n.t("reports.overdue").toUpperCase(),
      amount:
        currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount),
    },
    {
      title: i18n.t("reports.outstanding").toUpperCase(),
      amount:
        currencySymb +
        cashFormatter(overdueOutstandingAmount?.outstanding_amount),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card py-10 px-10">
      <div className="flex justify-end">
        <select
          className="focus:outline-none
          m-0
          border-none
          bg-transparent
          bg-clip-padding bg-no-repeat px-3
          py-1.5
          text-base
          font-normal
          text-foreground
          transition
          ease-in-out"
          onChange={handleSelectChange}
        >
          <option value="week">{i18n.t("thisWeek").toUpperCase()}</option>
          <option value="month">{i18n.t("thisMonth").toUpperCase()}</option>
          <option value="year">{i18n.t("thisYear").toUpperCase()}</option>
        </select>
      </div>
      {projectDetails && (
        <ChartBar data={projectDetails} totalMinutes={totalMinutes} />
      )}
      <AmountBoxContainer amountBox={amountBox} />
    </div>
  );
};

export default TotalHoursChart;
