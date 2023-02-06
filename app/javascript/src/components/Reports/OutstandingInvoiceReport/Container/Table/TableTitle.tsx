import React from "react";

import { currencyFormat } from "helpers";
import { Avatar } from "StyledComponents";

const TableTitle = ({ report, currency }) => (
  <div className="mt-3 flex flex-col justify-between border-b border-miru-han-purple-1000 py-4 lg:flex-row lg:items-center lg:py-3">
    <div className="flex items-center">
      <Avatar classNameImg="mr-4 lg:mr-6" />
      <h1 className="text-lg font-bold leading-6 text-miru-han-purple-1000 lg:text-xl lg:leading-7 ">
        {report.name}
      </h1>
    </div>
    <div className="mt-2 flex flex-col lg:mt-0 lg:flex-row lg:items-center">
      <p className="text-sm leading-5 lg:text-right lg:text-base">
        Total outstanding amount :
        <span className="font-bold">
          {currencyFormat(currency, report.totalOutstandingAmount)}{" "}
          <span className="mx-1 hidden lg:inline">•</span>
        </span>
      </p>
      <p className="text-sm leading-5 lg:text-right lg:text-base">
        Total overdue amount :
        <span className="font-bold">
          {currencyFormat(currency, report.totalOverdueAmount)}
        </span>
      </p>
    </div>
  </div>
);

export default TableTitle;
