import React from "react";
import ClientInfo from "./ClientInfo";
import CompanyInfo from "./CompanyInfo";
import InvoiceInfo from "./InvoiceInfo";

const InvoiceDetails = ({ invoice }) => (
  <>
    <CompanyInfo company={invoice.company}/>
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <ClientInfo client={invoice.client}/>
      <InvoiceInfo invoice={invoice} />
    </div>
  </>
);

export default InvoiceDetails;
