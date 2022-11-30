import React from "react";

import dayjs from "dayjs";
import { currencyFormat } from "helpers";

const formatDate = date => dayjs(date).format("DD-MM-YYYY");

const InvoiceInfo = ({ invoice }) => {
  const formattedIssueDate = formatDate(invoice.issueDate);
  const formattedDueDate = formatDate(invoice.dueDate);

  return (
    <>
      <div className="group">
        <p className="flex text-xs font-normal text-miru-dark-purple-1000">
          Date of Issue
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {formattedIssueDate}
        </p>
        <p className="mt-4 text-xs font-normal text-miru-dark-purple-1000">
          Due Date
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {formattedDueDate}
        </p>
      </div>
      <div className="group">
        <p className="text-xs font-normal text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {invoice.invoiceNumber}
        </p>
        <p className="mt-4 text-xs font-normal text-miru-dark-purple-1000">
          Reference
        </p>
        <p className="text-base font-normal text-miru-dark-purple-1000">
          {invoice.reference}
        </p>
      </div>
      <div>
        <p className="text-right text-xs font-normal text-miru-dark-purple-1000">
          Amount
        </p>
        <p className="mt-6 text-4xl font-normal text-miru-dark-purple-1000">
          {currencyFormat({
            baseCurrency: invoice.company.currency,
            amount: invoice.amount,
          })}
        </p>
      </div>
    </>
  );
};

export default InvoiceInfo;
