import React from "react";

import { currencyFormat } from "helpers";

const InvoiceInfo = ({ invoice }) => (
  <>
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
    <div className="group">
      <p className="flex text-xs font-normal text-miru-dark-purple-1000">
        Date of Issue
      </p>
      <p className="text-base font-normal text-miru-dark-purple-1000">
        {invoice.issueDate}
      </p>
      <p className="mt-4 text-xs font-normal text-miru-dark-purple-1000">
        Due Date
      </p>
      <p className="text-base font-normal text-miru-dark-purple-1000">
        {invoice.dueDate}
      </p>
    </div>
    <div>
      <p className="text-right text-xs font-normal text-miru-dark-purple-1000">
        Amount
      </p>
      <p className="mt-6 text-4xl font-normal text-miru-dark-purple-1000">
        {currencyFormat(invoice.company.currency, invoice.amount)}
      </p>
    </div>
  </>
);

export default InvoiceInfo;
