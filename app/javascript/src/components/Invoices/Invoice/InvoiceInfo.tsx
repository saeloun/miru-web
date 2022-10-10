import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";

const formatDate = (date) => dayjs(date).format("DD-MM-YYYY");

const InvoiceInfo = ({ invoice }) => {
  const formattedIssueDate = formatDate(invoice.issueDate);
  const formattedDueDate = formatDate(invoice.dueDate);

  return (
    <>
      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
          Date of Issue
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {formattedIssueDate}
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
          Due Date
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {formattedDueDate}
        </p>
      </div>

      <div className="group">
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          {invoice.invoiceNumber}
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
          {currencyFormat({ baseCurrency: invoice.company.currency, amount: invoice.amount })}
        </p>
      </div>
    </>
  );
};

export default InvoiceInfo;
