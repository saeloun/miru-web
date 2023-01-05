import React from "react";

import classnames from "classnames";
import { currencyNotationFormat } from "helpers";

type SummaryDashboardProps = {
  summaryList: any;
  currency: any;
};

const DEFAULT_STYLE =
  "mt-6 px-10 py-10 flex flex-col lg:flex-row lg:overflow-x-auto rounded-2xl bg-miru-han-purple-1000  text-white";

const formattedAmount = (amount, baseCurrency) =>
  currencyNotationFormat({ baseCurrency, amount });

const SummaryDashboard = ({ summaryList, currency }: SummaryDashboardProps) => (
  <ul className={classnames(DEFAULT_STYLE)}>
    {summaryList.map((summary, index) => (
      <li
        className="page-display__box flex cursor-pointer items-center lg:items-start"
        key={index}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-white">
          {summary.label}
        </p>
        <p className="text-2xl font-semibold tracking-widest text-white lg:mt-3 lg:text-5xl">
          {formattedAmount(summary.value, currency)}
        </p>
      </li>
    ))}
  </ul>
);

export default SummaryDashboard;
