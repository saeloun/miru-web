import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";

const InvoiceInfo = ({ invoice, company }) => {

  const formattedDate = (date) =>
    dayjs(date).format(company.date_format);

  return (
    <>
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
        Date of Issue
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {formattedDate(invoice.issue_date)}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
        Due Date
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {formattedDate(invoice.due_date)}
        </p>
      </div>

      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000">
        Invoice Number
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {invoice.invoice_number}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
        Reference
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {invoice.reference}
        </p>
      </div>

      <div>
        <p className="font-normal text-xs text-miru-dark-purple-1000 text-right">
        Amount
        </p>
        <p className="font-normal text-4xl text-miru-dark-purple-1000 mt-6">
          {currencyFormat({ baseCurrency: company.base_currency, amount: invoice.amount })}
        </p>
      </div>
    </>
  );};

export default InvoiceInfo;
