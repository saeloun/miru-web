import React from "react";
import ClientInfo from "../Invoices/Invoice/ClientInfo";
import CompanyInfo from "../Invoices/Invoice/CompanyInfo";
import InvoiceInfo from "./InvoiceInfo";
import InvoiceLineItems from "../Invoices/Invoice/InvoiceLineItems";
import InvoiceTotalSummary from "./InvoiceTotalSummary";

const InvoiceDetails = ({ invoice, company, lineItems, client, logo }) => (
  <>
    <CompanyInfo company={company} logo={logo}/>
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <ClientInfo client={client}/>
      <InvoiceInfo invoice={invoice} company={company}/>
    </div>
    <InvoiceLineItems items={lineItems} showHeader={lineItems.length > 0}/>
    <InvoiceTotalSummary invoice={invoice} company={company} lineItems={lineItems}/>
  </>
);

export default InvoiceDetails;
