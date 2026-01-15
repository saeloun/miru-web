import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";

const InvoiceInfo = ({ invoice, company, strikeAmount = "" }) => {
  const { date_format } = company;
  const { currency, issue_date, due_date, invoice_number, reference, amount } =
    invoice;
  const formattedDate = date => dayjs(date).format(date_format);

  return (
    <div className="flex flex-col items-start justify-between border-b border-miru-gray-400 px-4 py-2">
      <div className="mt-4 flex w-full items-center justify-between">
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Date of Issue
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {formattedDate(issue_date)}
          </span>
        </div>
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Invoice Number
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {invoice_number}
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full items-center justify-between">
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Due Date
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {formattedDate(due_date)}
          </span>
        </div>
        <div className="flex w-1/2 flex-col items-start justify-between">
          <span className="text-xs font-normal text-miru-dark-purple-1000">
            Reference
          </span>
          <span className="text-base font-normal leading-5 text-miru-dark-purple-1000">
            {reference}
          </span>
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col items-start justify-between">
        <span className="text-xs font-normal text-miru-dark-purple-1000">
          Amount
        </span>
        <span
          className={`mt-1 text-2xl font-semibold leading-8 text-miru-dark-purple-1000 ${strikeAmount}`}
        >
          {currencyFormat(currency, amount)}
        </span>
      </div>
    </div>
  );
};

export default InvoiceInfo;
