import React from "react";

import getStatusCssClass from "utils/getStatusTag";

const InvoiceStatus = ({ invoice }) => (
  <div className="flex flex-row">
    <div className="flex self-center mr-2">
      <p className="text-4xl font-bold">Invoice #{invoice.invoiceNumber}</p>
    </div>
    <div className="flex self-center ml-2">
      <span className={`${getStatusCssClass("draft")} uppercase`}>
        {invoice.status}
      </span>
    </div>
  </div>
);

export default InvoiceStatus;
