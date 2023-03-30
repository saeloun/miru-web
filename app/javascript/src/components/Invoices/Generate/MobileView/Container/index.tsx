import React, { useState } from "react";

import AddLineItemContainer from "./AddLineItemContainer";
import InvoicePreviewContainer from "./InvoicePreview";
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
  amount,
  amountDue,
  amountPaid,
  discount,
  setAmount,
  setAmountDue,
  setDiscount,
  setTax,
  tax,
  handleSaveInvoice,
}) => {
  const [multiLineItemModal, setMultiLineItemModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<any>({});
  const [isInvoicePreviewCall, setIsInvoicePreviewCall] =
    useState<boolean>(false);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const getContainerComponent = () => {
    switch (activeSection) {
      case sections.generateInvoice:
        return (
          <MenuContainer
            amountDue={amountDue}
            amountPaid={amountPaid}
            currency={invoiceDetails.companyDetails.currency}
            dateFormat={dateFormat}
            discount={discount}
            dueDate={dueDate}
            handleSaveInvoice={handleSaveInvoice}
            invoiceDetails={invoiceDetails}
            invoiceNumber={invoiceNumber}
            isInvoicePreviewCall={isInvoicePreviewCall}
            issueDate={issueDate}
            manualEntryArr={manualEntryArr}
            reference={reference}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setAmount={setAmount}
            setAmountDue={setAmountDue}
            setDiscount={setDiscount}
            setDueDate={setDueDate}
            setEditItem={setEditItem}
            setInvoiceNumber={setInvoiceNumber}
            setIsInvoicePreviewCall={setIsInvoicePreviewCall}
            setIssueDate={setIssueDate}
            setReference={setReference}
            setSelectedClient={setSelectedClient}
            setSubTotal={setSubTotal}
            setTax={setTax}
            setTotal={setTotal}
            subTotal={subTotal}
            tax={tax}
            total={total}
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
      case sections.invoicePreview:
        return (
          <InvoicePreviewContainer
            amount={amount}
            amountDue={amountDue}
            amountPaid={amountPaid}
            currency={invoiceDetails.companyDetails.currency}
            discount={discount}
            dueDate={dueDate}
            handleSaveInvoice={handleSaveInvoice}
            invoiceDetails={invoiceDetails}
            invoiceNumber={invoiceNumber}
            isInvoicePreviewCall={isInvoicePreviewCall}
            issueDate={issueDate}
            manualEntryArr={manualEntryArr}
            reference={reference}
            selectedClient={selectedClient}
            selectedLineItems={selectedLineItems}
            setActiveSection={setActiveSection}
            setEditItem={setEditItem}
            subTotal={subTotal}
            tax={tax}
            total={total}
          />
        );
    }
  };

  return getContainerComponent();
};

export default Container;
