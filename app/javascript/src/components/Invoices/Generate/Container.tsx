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
  clientCurrency,
  setClientCurrency,
  setBaseCurrencyAmount,
  amount,
  baseCurrencyAmount,
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
  dateFormat,
}) => (
  <div>
    <CompanyInfo company={invoiceDetails.companyDetails} />
    <InvoiceDetails
      amount={amount}
      clientCurrency={clientCurrency}
      clientList={invoiceDetails.clientList}
      clientVisible={false}
      dateFormat={dateFormat}
      dueDate={dueDate}
      invoiceNumber={invoiceNumber}
      issueDate={issueDate}
      optionSelected={false}
      reference={reference}
      selectedClient={selectedClient}
      setClientCurrency={setClientCurrency}
      setDueDate={setDueDate}
      setInvoiceNumber={setInvoiceNumber}
      setIssueDate={setIssueDate}
      setReference={setReference}
      setSelectedClient={setSelectedClient}
    />
    <div className="flex w-full px-10 py-6">
      <InvoiceTable
        clientCurrency={clientCurrency}
        dateFormat={invoiceDetails.companyDetails.date_format}
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
      baseCurrencyAmount={baseCurrencyAmount}
      clientCurrency={clientCurrency}
      currency={invoiceDetails.companyDetails.currency}
      discount={discount}
      manualEntryArr={manualEntryArr}
      newLineItems={selectedOption}
      setAmount={setAmount}
      setAmountDue={setAmountDue}
      setBaseCurrencyAmount={setBaseCurrencyAmount}
      setDiscount={setDiscount}
      setTax={setTax}
      tax={tax}
    />
  </div>
);

export default Container;
