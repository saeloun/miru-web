import React from "react";

import { cashFormatter, currencySymbol } from "helpers";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";

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
      title: "OVERDUE",
      amount:
        currencySymb + cashFormatter(overdueOutstandingAmount?.overdue_amount),
    },
    {
      title: "OUTSTANDING",
      amount:
        currencySymb +
        cashFormatter(overdueOutstandingAmount?.outstanding_amount),
    },
  ];

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
          onChange={handleSelectChange}
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
      {projectDetails && (
        <ChartBar data={projectDetails} totalMinutes={totalMinutes} />
      )}
      <AmountBoxContainer amountBox={amountBox} />
    </div>
  );
};

export default TotalHoursChart;
