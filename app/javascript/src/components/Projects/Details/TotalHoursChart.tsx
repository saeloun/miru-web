import React from "react";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import { cashFormatter } from "helpers";

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
    <div className="bg-miru-gray-100 py-10 px-10">
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
          text-miru-han-purple-1000
          transition
          ease-in-out"
          onChange={({ target: { value } }) => setTimeframe(value)}
        >
          <option className="text-miru-dark-purple-600" value="week">
            THIS WEEK
          </option>
          <option className="text-miru-dark-purple-600" value="month">
            THIS MONTH
          </option>
          <option className="text-miru-dark-purple-600" value="year">
            THIS YEAR
          </option>
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
