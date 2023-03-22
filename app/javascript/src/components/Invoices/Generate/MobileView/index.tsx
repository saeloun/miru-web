import React, { useState } from "react";

import Container from "./Container";
import Header from "./Header";
import { sections } from "./utils";

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
  manualEntryArr,
  setManualEntryArr,
  lineItems,
  setLineItems,
  selectedLineItems,
  setSelectedLineItems,
}) => {
  const [activeSection, setActiveSection] = useState<string>(
    sections.generateInvoice
  );

  return (
    <div className="flex h-full w-full flex-col">
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <Container
        activeSection={activeSection}
        dateFormat={dateFormat}
        dueDate={dueDate}
        invoiceDetails={invoiceDetails}
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        lineItems={lineItems}
        manualEntryArr={manualEntryArr}
        reference={reference}
        selectedClient={selectedClient}
        selectedLineItems={selectedLineItems}
        setActiveSection={setActiveSection}
        setDueDate={setDueDate}
        setInvoiceNumber={setInvoiceNumber}
        setIssueDate={setIssueDate}
        setLineItems={setLineItems}
        setManualEntryArr={setManualEntryArr}
        setReference={setReference}
        setSelectedClient={setSelectedClient}
        setSelectedLineItems={setSelectedLineItems}
      />
    </div>
  );
};

export default MobileView;
