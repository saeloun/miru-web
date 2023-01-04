import React from "react";

import { currencyNotationFormat } from "helpers";

const InvoiceSummary = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
}) => {
  const formattedAmount = amount =>
    currencyNotationFormat({ baseCurrency, amount });

  const applyFilter = status => {
    setFilterParams({
      ...filterParams,
      ["status"]: status,
    });
  };

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl bg-miru-han-purple-1000 px-10 py-10 text-white">
      <ul className="page-display__wrap mt-0 border-t-0">
        <li
          className="page-display__box flex cursor-pointer items-center lg:items-start"
          onClick={() => applyFilter([{ value: "overdue", label: "OVERDUE" }])}
        >
          <p className="text-sm font-normal uppercase tracking-widest text-white">
            Overdue
          </p>
          <p className="text-2xl font-semibold tracking-normal text-white lg:mt-3 lg:text-4.5xl">
            {formattedAmount(summary.overdueAmount)}
          </p>
        </li>
        <li
          className="page-display__box mt-6 flex cursor-pointer items-center lg:mt-0 lg:items-start"
          onClick={() =>
            applyFilter([
              { value: "sent", label: "SENT" },
              { value: "viewed", label: "VIEWED" },
              { value: "overdue", label: "OVERDUE" },
            ])
          }
        >
          <p className="text-sm font-normal uppercase tracking-widest text-white">
            Outstanding
          </p>
          <p className="text-2xl font-semibold tracking-normal text-white lg:mt-3 lg:text-4.5xl">
            {formattedAmount(summary.outstandingAmount)}
          </p>
        </li>
        <li
          className="page-display__box mt-6 flex cursor-pointer items-center lg:mt-0 lg:items-start"
          onClick={() => applyFilter([{ value: "draft", label: "DRAFT" }])}
        >
          <p className="text-sm font-normal uppercase tracking-widest text-white">
            Amount in draft
          </p>
          <p className="text-2xl font-semibold tracking-normal text-white lg:mt-3 lg:text-4.5xl">
            {formattedAmount(summary.draftAmount)}
          </p>
        </li>
      </ul>
    </div>
  );
};

export default InvoiceSummary;
