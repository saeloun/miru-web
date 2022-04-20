import React from "react";
import CompanyInfo from "./CompanyInfo";

const InvoiceDetails = ({ invoice }) => (
  <>
    <CompanyInfo company={invoice.company}/>
  </>
);

export default InvoiceDetails;
