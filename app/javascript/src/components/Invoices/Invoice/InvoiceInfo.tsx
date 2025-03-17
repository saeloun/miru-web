import React from "react";

import { currencyFormat } from "helpers";

const InvoiceInfo = ({
  invoice: { client, invoiceNumber, reference, issueDate, dueDate, amount },
  strikeAmount = "",
}) => (
  <>
    <div className="mr-2 flex w-2/12 flex-col justify-between ">
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
    <div className="ml-2 flex w-2/12 flex-col justify-between">
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
    <div className="relative ml-4 w-4/12 rounded border border-miru-gray-400">
      <p className="absolute right-2 -top-2 bg-miru-gray-100 px-2 text-right text-xs font-medium text-miru-dark-purple-1000">
        Amount
      </p>
      <p
        className={`mt-6 pr-4 text-right text-4xl font-medium text-miru-dark-purple-1000 ${strikeAmount}`}
      >
        {currencyFormat(client.currency, amount)}
      </p>
    </div>
  </>
);

export default InvoiceInfo;
