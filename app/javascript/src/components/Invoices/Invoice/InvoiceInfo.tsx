import React from "react";

import { currencyFormat } from "helpers";

const InvoiceInfo = ({
  invoice: { currency, invoiceNumber, reference, issueDate, dueDate, amount },
  strikeAmount = "",
}) => (
  <>
    <div className="flex w-full flex-col gap-3 sm:w-1/2 lg:mr-2 lg:w-2/12 lg:gap-0">
      <div className="relative h-12 rounded border border-miru-gray-400 px-4 py-3">
        <p className="absolute left-2 -top-2 bg-miru-gray-100 px-2 text-xs font-medium text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="text-base font-medium text-miru-dark-purple-1000">
          {invoiceNumber}
        </p>
      </div>
      <div className="relative h-12 rounded border border-miru-gray-400 px-4 py-3">
        <p className="absolute left-2 -top-2 bg-miru-gray-100 px-2 text-xs font-medium text-miru-dark-purple-1000">
          Reference
        </p>
        <p className="text-base font-medium text-miru-dark-purple-1000">
          {reference || "-"}
        </p>
      </div>
    </div>
    <div className="flex w-full flex-col gap-3 sm:w-1/2 lg:ml-2 lg:w-2/12 lg:gap-0">
      <div className="relative h-12 rounded border border-miru-gray-400 px-4 py-3">
        <p className="absolute left-2 -top-2 bg-miru-gray-100 px-2 text-xs font-medium text-miru-dark-purple-1000">
          Date of Issue
        </p>
        <p className="text-base font-medium text-miru-dark-purple-1000">
          {issueDate}
        </p>
      </div>
      <div className="relative h-12 rounded border border-miru-gray-400 px-4 py-3">
        <p className="absolute left-2 -top-2 bg-miru-gray-100 px-2 text-xs font-medium text-miru-dark-purple-1000">
          Due Date
        </p>
        <p className="text-base font-medium text-miru-dark-purple-1000">
          {dueDate}
        </p>
      </div>
    </div>
    <div className="relative w-full rounded border border-miru-gray-400 lg:ml-4 lg:w-4/12">
      <p className="absolute left-2 -top-2 bg-miru-gray-100 px-2 text-left text-xs font-medium text-miru-dark-purple-1000 lg:left-auto lg:right-2 lg:text-right">
        Amount
      </p>
      <p
        className={`mt-4 px-4 text-left text-2xl font-medium tracking-tight text-miru-dark-purple-1000 lg:mt-6 lg:pr-4 lg:pl-0 lg:text-right ${strikeAmount}`}
      >
        {currencyFormat(currency, amount)}
      </p>
    </div>
  </>
);

export default InvoiceInfo;
