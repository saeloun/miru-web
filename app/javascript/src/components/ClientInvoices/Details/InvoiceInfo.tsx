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
        <p className="flex text-xs font-normal text-foreground">
          Date of Issue
        </p>
        <p className="text-base font-normal text-foreground">
          {formattedDate(issue_date)}
        </p>
        <p className="mt-4 text-xs font-normal text-foreground">Due Date</p>
        <p className="text-base font-normal text-foreground">
          {formattedDate(due_date)}
        </p>
      </div>
      <div className="group">
        <p className="text-xs font-normal text-foreground">Invoice Number</p>
        <p className="text-base font-normal text-foreground">
          {invoice_number}
        </p>
        <p className="mt-4 text-xs font-normal text-foreground">Reference</p>
        <p className="text-base font-normal text-foreground">{reference}</p>
      </div>
      <div>
        <p className="text-right text-xs font-normal text-foreground">Amount</p>
        <p
          className={`mt-6 text-2xl font-normal tracking-tight text-foreground ${strikeAmount}`}
        >
          {currencyFormat(currency, amount)}
        </p>
      </div>
    </>
  );
};

export default InvoiceInfo;
