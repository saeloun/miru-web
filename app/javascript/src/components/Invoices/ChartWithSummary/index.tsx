import React, { useState } from "react";
import { currencyFormat } from "helpers";
import MonthlyRevenueChart from "../MonthlyRevenueChart";

interface ChartWithSummaryProps {
  summary: {
    overdueAmount: number;
    outstandingAmount: number;
    draftAmount: number;
  };
  baseCurrency: string;
  filterParams: any;
  setFilterParams: (params: any) => void;
}

const ChartWithSummary: React.FC<ChartWithSummaryProps> = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
}) => {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const applyFilter = (status: any) => {
    setFilterParams({
      ...filterParams,
      status,
    });
  };

  const summaryItems = [
    {
      label: "Overdue",
      value: summary.overdueAmount,
      colorClass: "text-red-600",
      bgClass: "bg-red-50 hover:bg-red-100",
      onClick: () => applyFilter([{ value: "overdue", label: "OVERDUE" }]),
    },
    {
      label: "Outstanding",
      value: summary.outstandingAmount,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50 hover:bg-amber-100",
      onClick: () =>
        applyFilter([
          { value: "sent", label: "SENT" },
          { value: "viewed", label: "VIEWED" },
          { value: "overdue", label: "OVERDUE" },
        ]),
    },
    {
      label: "Draft",
      value: summary.draftAmount,
      colorClass: "text-gray-600",
      bgClass: "bg-gray-50 hover:bg-gray-100",
      onClick: () => applyFilter([{ value: "draft", label: "DRAFT" }]),
    },
  ];

  return (
    <div className="mt-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chart - Takes 2/3 width on desktop */}
        <div className="flex-1 lg:flex-[2]">
          <MonthlyRevenueChart
            baseCurrency={baseCurrency}
            chartType={chartType}
            height={280}
            onChartTypeChange={setChartType}
          />
        </div>

        {/* Summary Cards - Takes 1/3 width on desktop */}
        <div className="lg:flex-[1] flex flex-col justify-center space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Invoice Summary
          </h3>
          {summaryItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${item.bgClass} rounded-lg p-4 text-left transition-colors duration-200 border border-gray-200`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p className={`text-2xl font-semibold ${item.colorClass}`}>
                    {currencyFormat({
                      baseCurrency,
                      amount: item.value,
                    })}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartWithSummary;
