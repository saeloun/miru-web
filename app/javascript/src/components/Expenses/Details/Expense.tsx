import React from "react";

import { currencyFormat } from "helpers";

import { FileDownloader } from "../utils";

const Expense = ({ expense, currency }) => (
  <div className="mt-8 flex flex-col px-4 lg:px-0">
    <div className="flex flex-col">
      <span className="text-xs font-medium text-foreground">Amount</span>
      <span className="text-2xl font-normal tracking-tight text-foreground">
        {currencyFormat(currency, expense?.amount)}
      </span>
    </div>
    <div className="my-10 flex w-full flex-wrap items-center justify-between gap-y-10">
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">Date</span>
        <span className="text-base font-medium text-foreground">
          {expense?.date || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">Vendor</span>
        <span className="text-base font-medium text-foreground">
          {expense?.vendorName || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">Type</span>
        <span className="text-base font-medium text-foreground">
          {expense?.type || "-"}
        </span>
      </div>
      <div className="flex w-1/2 flex-col lg:w-1/4">
        <span className="text-xs font-medium text-foreground">Receipt</span>
        <div className="flex flex-col">
          {expense?.receipts.length > 0
            ? expense?.receipts.map((receipt, index) => (
                <span
                  className="my-2 cursor-pointer text-base font-medium text-foreground underline"
                  key={index}
                >
                  <FileDownloader fileUrl={receipt} />
                </span>
              ))
            : "-"}
        </div>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-medium text-foreground">Description</span>
      <span className="text-base font-medium text-foreground">
        {expense?.description || "-"}
      </span>
    </div>
  </div>
);

export default Expense;
