import React from "react";

import classnames from "classnames";
import { currencyFormat } from "helpers";

type SummaryDashboardProps = {
  summaryList: any;
  currency: any;
};

const DEFAULT_STYLE =
  "mt-6 px-10 py-10 flex flex-col lg:flex-row lg:overflow-x-auto rounded-2xl bg-miru-han-purple-1000 text-white";

const SummaryDashboard = ({ summaryList, currency }: SummaryDashboardProps) => (
  <ul className={classnames(DEFAULT_STYLE)}>
    {summaryList.map((summary, index) => (
      <li
        className="page-display__box mt-6 flex cursor-pointer items-center md:pr-12 lg:mt-0 lg:items-start"
        key={index}
      >
        <p className="whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-white">
          {summary.label}
        </p>
        <p className="2xl:text-5xl text-2xl font-semibold tracking-widest text-white lg:mt-3 xl:text-3xl">
          {currencyFormat({
            baseCurrency: currency,
            amount: summary.value,
            notation: "compact",
          })}
        </p>
      </li>
    ))}
  </ul>
);

export default SummaryDashboard;
