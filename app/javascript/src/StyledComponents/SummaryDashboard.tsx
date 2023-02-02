import React from "react";

import classnames from "classnames";
import { currencyFormat } from "helpers";

type SummaryDashboardProps = {
  summaryList: any;
  currency: any;
  wrapperClassName?: string;
};

const DEFAULT_STYLE =
  "py-4 lg:py-10 flex flex-wrap md:flex-nowrap lg:overflow-x-auto rounded-2xl bg-miru-han-purple-1000 text-white";

const SummaryDashboard = ({
  summaryList,
  currency,
  wrapperClassName = "",
}: SummaryDashboardProps) => (
  <ul className={classnames(DEFAULT_STYLE, wrapperClassName)}>
    {summaryList.map((summary, index) => (
      <li
        key={index}
        className={`page-display__box w-auto flex-1 cursor-pointer pt-4 md:w-full lg:mt-6 ${
          summaryList.length > 3 &&
          "w-1/2 flex-auto border-b pb-2 md:w-full md:border-b-0"
        }`}
        onClick={summary.onClick}
      >
        <p className="truncate text-xs font-semibold uppercase tracking-widest text-white lg:text-sm">
          {summary.label}
        </p>
        <p className="mt-2 truncate text-lg font-medium tracking-widest text-white md:text-2xl lg:mt-3 lg:text-4.5xl lg:font-semibold">
          {currencyFormat(
            currency,
            summary.value,
            summary.value > 9999 ? "compact" : "standard"
          )}
        </p>
      </li>
    ))}
  </ul>
);

export default SummaryDashboard;
