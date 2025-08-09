import React from "react";

import { Badge } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const InvoiceStatus = ({ invoice }) => (
  <div className="flex flex-row">
    <div className="mr-2 flex self-center">
      <p className="text-4xl font-bold">Invoice #{invoice.invoiceNumber}</p>
    </div>
    <div className="ml-2 flex self-center">
      <Badge
        className={`${getStatusCssClass(invoice.status)} uppercase`}
        text={invoice.status}
      />
    </div>
  </div>
);

export default InvoiceStatus;
