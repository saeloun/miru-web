import React from "react";

import classnames from "classnames";
import { currencyFormat } from "helpers";

type SummaryDashboardProps = {
  summaryList: any;
  currency: any;
  wrapperClassName?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  showPointer?: boolean;
};

const DEFAULT_STYLE =
  "py-4 lg:py-6 flex flex-wrap md:flex-nowrap lg:overflow-x-auto rounded-2xl";

const SummaryDashboard = ({
  summaryList,
  currency,
  wrapperClassName = "",
  bgColor = "bg-miru-han-purple-1000",
  textColor = "text-white",
  borderColor = "border-miru-han-purple-600",
  showPointer = true,
}: SummaryDashboardProps) => (
  <ul
    className={classnames(DEFAULT_STYLE, bgColor, textColor, wrapperClassName)}
  >
    {summaryList.map((summary, index) => (
      <li
        key={index}
        className={classnames(
          `page-display__box w-auto flex-1 ${
            showPointer ? `cursor-pointer` : ""
          } pt-3 md:w-full lg:mt-3 ${
            summaryList.length > 3
              ? "w-1/2 flex-auto border-b pb-2 md:w-full md:border-b-0"
              : null
          }`,
          borderColor
        )}
        onClick={summary.onClick}
      >
        <p className="truncate text-xxs font-semibold uppercase tracking-semiWidest lg:text-sm lg:tracking-widest">
          {summary.label}
        </p>
        <p className="mt-1 truncate text-lg font-medium md:text-xl lg:text-3xl lg:font-semibold">
          {summary.hideCurrencySymbol
            ? summary.value
            : currencyFormat(
                currency,
                summary.value,
                summary.value > 999 ? "compact" : "standard"
              )}
        </p>
      </li>
    ))}
  </ul>
);

export default SummaryDashboard;
