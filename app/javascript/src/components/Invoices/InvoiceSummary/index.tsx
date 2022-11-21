import React from "react";

import { currencyNotationFormat } from "helpers";

const InvoiceSummary = ({
  summary,
  baseCurrency,
  filterParams,
  setFilterParams,
}) => {
  const formattedAmount = (amount) =>
    currencyNotationFormat({ baseCurrency: baseCurrency, amount });

  const applyFilter = (status) => {
    setFilterParams({
      ...filterParams,
      ["status"]: status,
    });
  };

  return (
    <div className="px-10 py-10 mt-6 bg-miru-han-purple-1000 text-white rounded-2xl overflow-x-auto">
      <ul className="mt-0 border-t-0 page-display__wrap">
        <li
          onClick={() => applyFilter([{ value: "overdue", label: "OVERDUE" }])}
          className="page-display__box flex items-center md:items-start cursor-pointer"
        >
          <p className="text-sm text-white font-normal tracking-widest uppercase">
            Overdue
          </p>
          <p className="mt-3 text-2xl text-white md:text-5xl font-normal tracking-widest">
            {formattedAmount(summary.overdueAmount)}
          </p>
        </li>

        <li
          onClick={() =>
            applyFilter([
              { value: "sent", label: "SENT" },
              { value: "viewed", label: "VIEWED" },
              { value: "overdue", label: "OVERDUE" },
            ])
          }
          className="page-display__box mt-8 md:mt-0 flex items-center md:items-start cursor-pointer"
        >
          <p className="text-sm text-white font-normal tracking-widest uppercase">
            Outstanding
          </p>
          <p className="mt-3 text-2xl text-white md:text-5xl font-normal tracking-widest">
            {formattedAmount(summary.outstandingAmount)}
          </p>
        </li>

        <li
          onClick={() => applyFilter([{ value: "draft", label: "DRAFT" }])}
          className="page-display__box mt-8 md:mt-0 flex items-center md:items-start cursor-pointer"
        >
          <p className="text-sm text-white font-normal tracking-widest uppercase">
            Amount in draft
          </p>
          <p className="mt-3 text-2xl text-white md:text-5xl font-normal tracking-widest">
            {formattedAmount(summary.draftAmount)}
          </p>
        </li>
      </ul>
    </div>
  );
};

export default InvoiceSummary;
