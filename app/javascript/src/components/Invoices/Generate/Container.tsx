import React from "react";

import CompanyInfo from "../common/CompanyInfo";
import InvoiceDetails from "../common/InvoiceDetails";
import InvoiceTable from "../common/InvoiceTable";
import InvoiceTotal from "../common/InvoiceTotal";

const Container = ({
  invoiceDetails,
  lineItems,
  setLineItems,
  selectedClient,
  setSelectedClient,
  invoiceNumber,
  setInvoiceNumber,
  amount,
  setAmount,
  reference,
  setReference,
  issueDate,
  setIssueDate,
  dueDate,
  setDueDate,
  amountDue,
  setAmountDue,
  amountPaid,
  discount,
  setDiscount,
  tax,
  setTax,
  selectedOption,
  setSelectedOption,
  manualEntryArr,
  setManualEntryArr,
}) => (
  <div className="relative m-0 mt-5 mb-10 w-full bg-miru-gray-100 p-0">
    <CompanyInfo company={invoiceDetails.companyDetails} />
    <InvoiceDetails
      amount={amount}
      clientList={invoiceDetails.clientList}
      clientVisible={false}
      currency={invoiceDetails.companyDetails.currency}
      dueDate={dueDate}
      invoiceNumber={invoiceNumber}
      issueDate={issueDate}
      optionSelected={false}
      reference={reference}
      selectedClient={selectedClient}
      setDueDate={setDueDate}
      setInvoiceNumber={setInvoiceNumber}
      setIssueDate={setIssueDate}
      setReference={setReference}
      setSelectedClient={setSelectedClient}
    />
    <div className="block overflow-x-auto whitespace-nowrap py-5 md:overflow-x-visible md:whitespace-normal md:pl-10">
      <InvoiceTable
        currency={invoiceDetails.companyDetails.currency}
        lineItems={lineItems}
        manualEntryArr={manualEntryArr}
        selectedClient={selectedClient}
        selectedLineItems={selectedOption}
        setLineItems={setLineItems}
        setManualEntryArr={setManualEntryArr}
        setSelectedLineItems={setSelectedOption}
      />
    </div>
    <InvoiceTotal
      amountDue={amountDue}
      amountPaid={amountPaid}
      currency={invoiceDetails.companyDetails.currency}
      discount={discount}
      manualEntryArr={manualEntryArr}
      newLineItems={selectedOption}
      setAmount={setAmount}
      setAmountDue={setAmountDue}
      setDiscount={setDiscount}
      setTax={setTax}
      showDiscountInput={false}
      showTax={false}
      tax={tax}
    />
  </div>
);

export default Container;
