import React from "react";

import ClientInfo from "./ClientInfo";
import InvoiceInfo from "./InvoiceInfo";
import InvoiceLineItems from "./InvoiceLineItems";
import InvoiceTotalSummary from "./InvoiceTotalSummary";

import CompanyInfo from "../common/CompanyInfo";

const InvoiceDetails = ({ invoice }) => (
  <>
    <CompanyInfo company={invoice.company} />
    <div className="flex h-36 justify-between border-b-2 border-miru-gray-400 px-10 py-5">
      <ClientInfo client={invoice.client} />
      <InvoiceInfo invoice={invoice} />
    </div>
    <InvoiceLineItems
      showHeader
      currency={invoice.company.currency}
      items={invoice.invoiceLineItems}
    />
    <InvoiceTotalSummary invoice={invoice} />
  </>
);

export default InvoiceDetails;
