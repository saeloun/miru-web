import React from "react";

import CompanyInfo from "components/Invoices/common/CompanyInfo";
import ClientInfo from "components/Invoices/Invoice/ClientInfo";
import InvoiceLineItems from "components/Invoices/Invoice/InvoiceLineItems";

import InvoiceInfo from "./InvoiceInfo";
import InvoiceTotalSummary from "./InvoiceTotalSummary";

const InvoiceDetails = ({ invoice, company, lineItems, client, logo }) => {
  const invoiceWaived = invoice?.status === "waived";
  const strikeAmount = invoiceWaived && "line-through";

  return (
    <>
      <CompanyInfo company={company} logo={logo} />
      <div className="flex h-36 justify-between border-b-2 border-miru-gray-400 px-10 py-5">
        <ClientInfo client={client} />
        <InvoiceInfo
          company={company}
          invoice={invoice}
          strikeAmount={strikeAmount}
        />
      </div>
      <InvoiceLineItems
        currency={company.currency}
        dateFormat={company.dateFormat || company.date_format}
        items={lineItems}
        showHeader={lineItems.length > 0}
        strikeAmount={strikeAmount}
      />
      <InvoiceTotalSummary
        company={company}
        invoice={invoice}
        lineItems={lineItems}
        strikeAmount={strikeAmount}
      />
    </>
  );
};

export default InvoiceDetails;
