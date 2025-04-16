import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";

const InvoiceInfo = ({ invoice, company, strikeAmount = "" }) => {
  const { date_format } = company;
  const { currency, issue_date, due_date, invoice_number, reference, amount } =
    invoice;
  const formattedDate = date => dayjs(date).format(date_format);

  return (
    <>
      <div className="group">
        <p className="flex text-xs font-normal text-miru-dark-purple-1000">
          Date of Issue
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {formattedDate(issue_date)}
        </p>
        <p className="mt-4 text-xs font-normal text-miru-dark-purple-1000">
          Due Date
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {formattedDate(due_date)}
        </p>
      </div>
      <div className="group">
        <p className="text-xs font-normal text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {invoice_number}
        </p>
        <p className="mt-4 text-xs font-normal text-miru-dark-purple-1000">
          Reference
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {reference}
        </p>
      </div>
      <div>
        <p className="text-right text-xs font-normal text-miru-dark-purple-1000">
          Amount
        </p>
        <p
          className={`mt-6 text-4xl font-normal text-miru-dark-purple-1000 ${strikeAmount}`}
        >
          {currencyFormat(currency, amount)}
        </p>
      </div>
    </>
  );
};

export default InvoiceInfo;
