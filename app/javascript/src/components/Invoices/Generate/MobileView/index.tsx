import React from "react";

import Container from "./Container";
import Header from "./Header";

const MobileView = ({
  dueDate,
  issueDate,
  invoiceDetails,
  invoiceNumber,
  reference,
  selectedClient,
  setReference,
  setSelectedClient,
  dateFormat,
  setDueDate,
  setIssueDate,
  setInvoiceNumber,
}) => (
  <div>
    <Header />
    <Container
      dateFormat={dateFormat}
      dueDate={dueDate}
      invoiceDetails={invoiceDetails}
      invoiceNumber={invoiceNumber}
      issueDate={issueDate}
      reference={reference}
      selectedClient={selectedClient}
      setDueDate={setDueDate}
      setInvoiceNumber={setInvoiceNumber}
      setIssueDate={setIssueDate}
      setReference={setReference}
      setSelectedClient={setSelectedClient}
    />
  </div>
);

export default MobileView;
