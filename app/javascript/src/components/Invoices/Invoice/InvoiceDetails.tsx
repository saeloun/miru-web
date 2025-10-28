import React from "react";

import ClientInfo from "./ClientInfo";
import InvoiceInfo from "./InvoiceInfo";
import InvoiceLineItems from "./InvoiceLineItems";
import InvoiceTotalSummary from "./InvoiceTotalSummary";

import CompanyInfo from "../common/CompanyInfo";

const InvoiceDetails = ({ invoice }) => {
  const invoiceWaived = invoice?.status === "waived";
  const strikeAmount = invoiceWaived && "line-through";

  const sortedLineItems = [...invoice.invoiceLineItems].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    return dateA.getTime() - dateB.getTime();
  });

  return (
    <>
      <CompanyInfo company={invoice.company} />
      <div className="flex h-40 justify-between border-b border-miru-gray-400 px-10 py-5">
        <ClientInfo client={invoice.client} />
        <InvoiceInfo invoice={invoice} strikeAmount={strikeAmount} />
      </div>
      <InvoiceLineItems
        showHeader
        currency={invoice.currency}
        dateFormat={invoice.company.dateFormat}
        items={sortedLineItems}
        strikeAmount={strikeAmount}
      />
      <InvoiceTotalSummary invoice={invoice} strikeAmount={strikeAmount} />
    </>
  );
};

export default InvoiceDetails;
