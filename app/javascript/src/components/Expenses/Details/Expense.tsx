import React from "react";

import { currencyFormat } from "helpers";

const Expense = ({ expense, currency }) => (
  <div className="mt-8 flex flex-col px-4 lg:px-0">
    <div className="flex flex-col">
      <span className="text-xs font-medium text-miru-dark-purple-1000">
        Amount
      </span>
      <span className="text-4xl font-normal text-miru-dark-purple-1000">
        {currencyFormat(currency, expense?.amount)}
      </span>
    </div>
    <div className="my-10 flex w-full flex-wrap items-center justify-between gap-y-10">
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-miru-dark-purple-1000">
          Date
        </span>
        <span className="text-base font-medium text-miru-dark-purple-1000">
          {expense?.date || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-miru-dark-purple-1000">
          Vendor
        </span>
        <span className="text-base font-medium text-miru-dark-purple-1000">
          {expense?.vendorName || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-miru-dark-purple-1000">
          Type
        </span>
        <span className="text-base font-medium text-miru-dark-purple-1000">
          {expense?.type || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-miru-dark-purple-1000">
          Receipt
        </span>
        <span className="text-base font-medium text-miru-dark-purple-1000">
          {expense?.receipt || "-"}
        </span>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-medium text-miru-dark-purple-1000">
        Description
      </span>
      <span className="text-base font-medium text-miru-dark-purple-1000">
        {expense?.description || "-"}
      </span>
    </div>
  </div>
);

export default Expense;
