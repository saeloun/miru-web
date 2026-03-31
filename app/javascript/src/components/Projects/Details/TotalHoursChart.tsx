import React from "react";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import { cashFormatter } from "helpers";
import { i18n } from "../../../i18n";

import { getAmountBox } from "../constants";

const TotalHoursChart = ({
  project,
  currencySymb,
  setTimeframe,
  overdueOutstandingAmount,
}) => {
  const amountBox = getAmountBox(
    currencySymb,
    cashFormatter,
    overdueOutstandingAmount
  );

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
          onChange={({ target: { value } }) => setTimeframe(value)}
        >
          <option value="week">{i18n.t("thisWeek").toUpperCase()}</option>
          <option value="month">{i18n.t("thisMonth").toUpperCase()}</option>
          <option value="year">{i18n.t("thisYear").toUpperCase()}</option>
        </select>
      </div>
      {project && (
        <ChartBar data={project.members} totalMinutes={project.totalMinutes} />
      )}
      <AmountBoxContainer amountBox={amountBox} />
    </div>
  );
};

export default TotalHoursChart;
