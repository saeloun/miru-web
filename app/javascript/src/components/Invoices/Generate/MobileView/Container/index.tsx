import React, { useState } from "react";

import AddLineItemContainer from "./AddLineItemContainer";
import MenuContainer from "./MenuContainer";
import MultiLineContainer from "./MultiLineContainer";

import { sections } from "../utils";

const Container = ({
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
  activeSection,
  setActiveSection,
  setManualEntryArr,
  manualEntryArr,
  lineItems,
  setLineItems,
  selectedLineItems,
  setSelectedLineItems,
}) => {
  const [multiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<any>({});

  const getContainerComponent = () => {
    switch (activeSection) {
      case sections.generateInvoice:
        return (
          <MenuContainer
            dateFormat={dateFormat}
            dueDate={dueDate}
            invoiceDetails={invoiceDetails}
            invoiceNumber={invoiceNumber}
            issueDate={issueDate}
            manualEntryArr={manualEntryArr}
            reference={reference}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setDueDate={setDueDate}
            setEditItem={setEditItem}
            setInvoiceNumber={setInvoiceNumber}
            setIssueDate={setIssueDate}
            setReference={setReference}
            setSelectedClient={setSelectedClient}
          />
        );
      case sections.addLineItem:
        return (
          <AddLineItemContainer
            dateFormat={dateFormat}
            editItem={editItem}
            lineItems={lineItems}
            manualEntryArr={manualEntryArr}
            multiLineItemModal={multiLineItemModal}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setEditItem={setEditItem}
            setLineItems={setLineItems}
            setManualEntryArr={setManualEntryArr}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedLineItems={setSelectedLineItems}
          />
        );
      case sections.editLineItem:
        return (
          <AddLineItemContainer
            dateFormat={dateFormat}
            editItem={editItem}
            lineItems={lineItems}
            manualEntryArr={manualEntryArr}
            multiLineItemModal={multiLineItemModal}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setEditItem={setEditItem}
            setLineItems={setLineItems}
            setManualEntryArr={setManualEntryArr}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedLineItems={setSelectedLineItems}
          />
        );
      case sections.multipleEntries:
        return (
          <MultiLineContainer
            dateFormat={dateFormat}
            multiLineItemModal={multiLineItemModal}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setMultiLineItemModal={setMultiLineItemModal}
            setSelectedLineItems={setSelectedLineItems}
          />
        );
    }
  };

  return getContainerComponent();
};

export default Container;
