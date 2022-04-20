import React from "react";

const InvoiceInfo = ({ invoice }) => (
  <>
    <div className="group">
      <p className="font-normal text-xs text-miru-dark-purple-1000 flex">
        Date of Issue
      </p>
      <p className="font-normal text-base text-miru-dark-purple-1000">
        {invoice.issueDate}
      </p>
      <p className="font-normal text-xs text-miru-dark-purple-1000 mt-4">
        Due Date
      </p>
      <p className="font-normal text-base text-miru-dark-purple-1000">
        {invoice.dueDate}
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
        ${invoice.amount}
      </p>
    </div>
  </>
);

export default InvoiceInfo;
