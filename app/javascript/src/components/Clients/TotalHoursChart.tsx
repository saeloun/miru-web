import React from "react";

import AmountBoxContainer from "common/AmountBox";
import MobileAmountBox from "common/AmountBox/MobileAmountBox";
import ChartBar from "common/ChartBar";
import { useUserContext } from "context/UserContext";
import { cashFormatter, currencySymbol } from "helpers";

const TotalHoursChart = ({
  clientData,
  fetchClientDetails,
  totalMinutes,
  overdueOutstandingAmount,
}) => {
  const { isAdminUser, isDesktop } = useUserContext();

  const {
    currency = "",
    overdue_amount = 0,
    outstanding_amount = 0,
  } = overdueOutstandingAmount ?? {};

  const currencySymb = currencySymbol(currency);
  const formattedOverdueAmount = currencySymb + cashFormatter(overdue_amount);
  const formattedOutstandingAmount =
    currencySymb + cashFormatter(outstanding_amount);

  const amountBox = [
    {
      title: "OVERDUE",
      amount: formattedOverdueAmount,
    },
    {
      title: "OUTSTANDING",
      amount: formattedOutstandingAmount,
    },
  ];

  return (
    <div>
      {isAdminUser && isDesktop && (
        <div className="bg-miru-gray-100 py-10 px-10">
          <div className="flex justify-end">
            <select
              id="timeFrame"
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
              onChange={e => fetchClientDetails(e.target.value)}
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
          {clientData && (
            <ChartBar data={clientData} totalMinutes={totalMinutes} />
          )}
          <AmountBoxContainer amountBox={amountBox} />
        </div>
      )}
      {isAdminUser && !isDesktop && (
        <MobileAmountBox
          outstandingAmount={formattedOutstandingAmount}
          overdueAmount={formattedOverdueAmount}
          totalMinutes={totalMinutes}
        />
      )}
    </div>
  );
};

export default TotalHoursChart;
