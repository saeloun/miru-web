import React, { useState } from "react";

import Container from "./Container";
import Header from "./Header";
import { sections } from "./utils";

const MobileView = ({
  baseCurrency,
  baseCurrencyAmount,
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
  clientCurrency,
  manualEntryArr,
  setManualEntryArr,
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
  isEdit,
  isStripeEnabled,
  setShowConnectPaymentDialog,
  setBaseCurrencyAmount,
  setClientCurrency,
  showConnectPaymentDialog,
}) => {
  const [activeSection, setActiveSection] = useState<string>(
    isEdit ? sections.invoicePreview : sections.generateInvoice
  );

  return (
    <div className="flex h-full w-full flex-col">
      <Header
        activeSection={activeSection}
        isEdit={isEdit}
        setActiveSection={setActiveSection}
      />
      <Container
        activeSection={activeSection}
        amount={amount}
        amountDue={amountDue}
        amountPaid={amountPaid}
        baseCurrency={baseCurrency}
        baseCurrencyAmount={baseCurrencyAmount}
        clientCurrency={clientCurrency}
        dateFormat={dateFormat}
        discount={discount}
        dueDate={dueDate}
        handleSaveInvoice={handleSaveInvoice}
        invoiceDetails={invoiceDetails}
        invoiceNumber={invoiceNumber}
        isStripeEnabled={isStripeEnabled}
        issueDate={issueDate}
        lineItems={lineItems}
        manualEntryArr={manualEntryArr}
        reference={reference}
        selectedClient={selectedClient}
        selectedLineItems={selectedLineItems}
        setActiveSection={setActiveSection}
        setAmount={setAmount}
        setAmountDue={setAmountDue}
        setBaseCurrencyAmount={setBaseCurrencyAmount}
        setClientCurrency={setClientCurrency}
        setDiscount={setDiscount}
        setDueDate={setDueDate}
        setInvoiceNumber={setInvoiceNumber}
        setIssueDate={setIssueDate}
        setLineItems={setLineItems}
        setManualEntryArr={setManualEntryArr}
        setReference={setReference}
        setSelectedClient={setSelectedClient}
        setSelectedLineItems={setSelectedLineItems}
        setShowConnectPaymentDialog={setShowConnectPaymentDialog}
        setTax={setTax}
        showConnectPaymentDialog={showConnectPaymentDialog}
        tax={tax}
      />
    </div>
  );
};

export default MobileView;
