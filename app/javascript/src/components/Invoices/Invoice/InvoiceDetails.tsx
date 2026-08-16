import React from "react";

import ClientInfo from "./ClientInfo";
import InvoiceInfo from "./InvoiceInfo";
import InvoiceLineItems from "./InvoiceLineItems";
import InvoiceTotalSummary from "./InvoiceTotalSummary";
import PaymentDetails from "./PaymentDetails";

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
      <div className="flex h-auto flex-col gap-4 border-b border-border px-4 py-5 lg:h-40 lg:flex-row lg:justify-between lg:px-10">
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
      {invoice.amountPaid > 0 && <PaymentDetails invoice={invoice} />}
    </>
  );
};

export default InvoiceDetails;
