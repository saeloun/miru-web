import React from "react";

import { Badge } from "StyledComponents";

import getStatusCssClass from "utils/getStatusTag";

const InvoiceStatus = ({ invoice }) => (
  <div className="flex flex-row">
    <div className="flex self-center mr-2">
      <p className="text-4xl font-bold">Invoice #{invoice.invoiceNumber}</p>
    </div>
    <div className="flex self-center ml-2">
      <Badge
        text={invoice.status}
        className={getStatusCssClass(invoice.status) + " uppercase"}
      />
    </div>
  </div>
);

export default InvoiceStatus;
