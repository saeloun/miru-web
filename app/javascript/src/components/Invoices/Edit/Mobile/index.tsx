import React from "react";

import MobileView from "components/Invoices/Generate/MobileView";

const EditInvoiceForm = ({
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
}) => (
  //   const handleSendButtonClick = () => {
  //     if (client && invoiceNumber !== "") {
  //       return setActiveSection(sections.sendInvoice);
  //     }

  //     if (client) {
  //       return Toastr.error(INVOICE_NUMBER_ERROR);
  //     }

  //     return Toastr.error(SELECT_CLIENT_ERROR);
  //   };

  <MobileView
    isEdit
    amount={amount}
    amountDue={amountDue}
    amountPaid={amountPaid}
    dateFormat={invoiceDetails.company.dateFormat}
    discount={discount}
    dueDate={dueDate}
    handleSaveInvoice={handleSaveInvoice}
    invoiceDetails={invoiceDetails}
    invoiceNumber={invoiceNumber}
    issueDate={issueDate}
    lineItems={lineItems}
    manualEntryArr={manualEntryArr}
    reference={reference}
    selectedClient={selectedClient}
    selectedLineItems={selectedLineItems}
    setAmount={setAmount}
    setAmountDue={setAmountDue}
    setDiscount={setDiscount}
    setDueDate={setDueDate}
    setInvoiceNumber={setInvoiceNumber}
    setIssueDate={setIssueDate}
    setLineItems={setLineItems}
    setManualEntryArr={setManualEntryArr}
    setReference={setReference}
    setSelectedClient={setSelectedClient}
    setSelectedLineItems={setSelectedLineItems}
    setTax={setTax}
    tax={tax}
  />
  // <div>
  //   <div className="flex h-12 items-center justify-between bg-miru-han-purple-1000 px-3 text-white">
  //     Edit Invoice #{invoiceNumber}
  //   </div>
  //   <InvoicePreviewContainer
  //     isInvoicePreviewCall
  //     amount={amount}
  //     amountDue={amountDue}
  //     amountPaid={amountPaid}
  //     currency={company.currency}
  //     discount={discount}
  //     dueDate={dueDate}
  //     handleSaveInvoice={handleSaveInvoice}
  //     handleSendButtonClick={() => {}}
  //     invoiceDetails={invoiceDetails}
  //     invoiceNumber={invoiceNumber}
  //     issueDate={issueDate}
  //     manualEntryArr={[]}
  //     reference={reference}
  //     selectedClient={client}
  //     selectedLineItems={invoiceLineItems}
  //     setActiveSection={setActiveSection}
  //     setEditItem={() => {}}
  //     subTotal={0}
  //     tax={tax}
  //     total={0}
  //   />
  // </div>
);
export default EditInvoiceForm;
