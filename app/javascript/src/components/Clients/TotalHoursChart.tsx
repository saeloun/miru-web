import React from "react";

import AmountBoxContainer from "common/AmountBox";
import MobileAmountBox from "common/AmountBox/MobileAmountBox";
import ChartBar from "common/ChartBar";
import { useUserContext } from "context/UserContext";
import { cashFormatter, currencySymbol } from "helpers";
import { i18n } from "../../i18n";

interface OverdueOutstanding {
  currency?: string;
  overdue_amount?: number;
  outstanding_amount?: number;
}

type Timeframe = "week" | "month" | "year";

interface TotalHoursChartProps {
  clientData: unknown; // TODO: replace with ChartBar data type if available
  fetchClientDetails: (timeframe: Timeframe) => void;
  totalMinutes: number;
  overdueOutstandingAmount?: OverdueOutstanding | null;
}

const TotalHoursChart: React.FC<TotalHoursChartProps> = ({
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
      title: i18n.t("dashboard.overdue"),
      amount: formattedOverdueAmount,
    },
    {
      title: i18n.t("dashboard.outstanding"),
      amount: formattedOutstandingAmount,
    },
  ];

  return (
    <div>
      {isAdminUser && isDesktop && (
        <div className="rounded-xl border border-border bg-card py-10 px-10">
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
            text-foreground
            transition
            ease-in-out"
              onChange={e => fetchClientDetails(e.target.value)}
            >
              <option value="week">{i18n.t("thisWeek").toUpperCase()}</option>
              <option value="month">{i18n.t("thisMonth").toUpperCase()}</option>
              <option value="year">{i18n.t("thisYear").toUpperCase()}</option>
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
