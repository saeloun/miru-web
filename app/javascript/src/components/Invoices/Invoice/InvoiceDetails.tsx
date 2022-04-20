import React from "react";
import ClientInfo from "./ClientInfo";
import CompanyInfo from "./CompanyInfo";

const InvoiceDetails = ({ invoice }) => (
  <>
    <CompanyInfo company={invoice.company}/>
    <ClientInfo client={invoice.client}/>
  </>
);

export default InvoiceDetails;
