import React from "react";

import CompanyInfo from "../common/CompanyInfo";
import InvoiceDetails from "../common/InvoiceDetails";
import InvoiceTable from "../common/InvoiceTable";
import InvoiceTotal from "../common/InvoiceTotal";

const Container = ({
  invoiceDetails,
  lineItems, setLineItems,
  selectedClient, setSelectedClient,
  invoiceNumber, setInvoiceNumber,
  amount, setAmount,
  reference,
  setReference,
  issueDate, setIssueDate,
  dueDate, setDueDate,
  amountDue, setAmountDue,
  amountPaid,
  discount, setDiscount,
  tax, setTax,
  selectedOption, setSelectedOption,
  manualEntryArr, setManualEntryArr
}) => (
  <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full relative">
    <CompanyInfo company={invoiceDetails.companyDetails} />
    <InvoiceDetails
      currency={invoiceDetails.companyDetails.currency}
      clientList={invoiceDetails.clientList}
      amount={amount}
      selectedClient={selectedClient}
      setSelectedClient={setSelectedClient}
      issueDate={issueDate}
      setIssueDate={setIssueDate}
      dueDate={dueDate}
      setDueDate={setDueDate}
      invoiceNumber={invoiceNumber}
      setInvoiceNumber={setInvoiceNumber}
      reference={reference}
      setReference={setReference}
      optionSelected={false}
      clientVisible={false}
    />
    <div className="md:pl-10 py-5 overflow-x-auto md:overflow-x-visible block whitespace-nowrap md:whitespace-normal">
      <InvoiceTable
        currency={invoiceDetails.companyDetails.currency}
        selectedClient={selectedClient}
        lineItems={lineItems}
        setLineItems={setLineItems}
        selectedLineItems={selectedOption}
        setSelectedLineItems={setSelectedOption}
        manualEntryArr={manualEntryArr}
        setManualEntryArr={setManualEntryArr}
      />
    </div>
    <InvoiceTotal
      currency={invoiceDetails.companyDetails.currency}
      newLineItems={selectedOption}
      amountPaid={amountPaid}
      amountDue={amountDue}
      setAmountDue={setAmountDue}
      setAmount={setAmount}
      discount={discount}
      setDiscount={setDiscount}
      tax={tax}
      setTax={setTax}
      showDiscountInput={false}
      showTax={false}
      manualEntryArr={manualEntryArr}
    />
  </div>
);

export default Container;
