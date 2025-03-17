import React from "react";

import MobileView from "components/Invoices/Generate/MobileView";

const EditInvoiceForm = ({
  baseCurrency,
  invoiceDetails,
  handleSaveInvoice,
  lineItems,
  setAmount,
  setAmountDue,
  setDiscount,
  setDueDate,
  setInvoiceNumber,
  setIssueDate,
  setLineItems,
  setReference,
  setTax,
  setSelectedClient,
  setBaseCurrency,
  selectedClient,
  setSelectedLineItems,
  setManualEntryArr,
  manualEntryArr,
  amount,
  amountDue,
  amountPaid,
  discount,
  dueDate,
  invoiceNumber,
  issueDate,
  reference,
  tax,
  selectedLineItems,
  isStripeEnabled,
  showConnectPaymentDialog,
  setShowConnectPaymentDialog,
}) => {
  const { company } = invoiceDetails;

  return (
    <MobileView
      isEdit
      amount={amount}
      amountDue={amountDue}
      amountPaid={amountPaid}
      baseCurrency={baseCurrency}
      dateFormat={company.dateFormat}
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
      setAmount={setAmount}
      setAmountDue={setAmountDue}
      setBaseCurrency={setBaseCurrency}
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
  );
};
export default EditInvoiceForm;
