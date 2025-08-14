import React from "react";

import StatusBadge from "components/ui/status-badge";

const InvoiceStatus = ({ invoice }) => (
  <div className="flex flex-row">
    <div className="mr-2 flex self-center">
      <p className="text-4xl font-bold">Invoice #{invoice.invoiceNumber}</p>
    </div>
    <div className="ml-2 flex self-center">
      <StatusBadge status={invoice.status} />
    </div>
  </div>
);

export default InvoiceStatus;
