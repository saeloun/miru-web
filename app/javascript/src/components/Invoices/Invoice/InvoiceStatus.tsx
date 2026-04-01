import React from "react";

import StatusBadge from "components/ui/status-badge";
import { i18n } from "../../../i18n";

const InvoiceStatus = ({ invoice }) => (
  <div className="flex flex-row">
    <div className="mr-2 flex self-center">
      <p className="text-2xl font-semibold tracking-tight">
        {i18n.t("invoices.invoice")} #{invoice.invoiceNumber}
      </p>
    </div>
    <div className="ml-2 flex self-center">
      <StatusBadge status={invoice.status} />
    </div>
  </div>
);

export default InvoiceStatus;
