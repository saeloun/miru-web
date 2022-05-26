import React from "react";

import CompanyInfo from "./CompanyInfo";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceTable from "./InvoiceTable";
import InvoiceTotal from "./InvoiceTotal";

const Container = ({
  invoiceDetails,
  lineItems, setLineItems,
  selectedClient, setSelectedClient,
  invoiceNumber, setInvoiceNumber,
  amount, setAmount,
  reference,
  issueDate, setIssueDate,
  dueDate, setDueDate,
  amountDue, setAmountDue,
  amountPaid,
  discount, setDiscount,
  tax, setTax,
  selectedOption, setSelectedOption
}) => (
  <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
    <CompanyInfo companyDetails={invoiceDetails.companyDetails} />
    <InvoiceDetails
      currency={invoiceDetails.companyDetails.currency}
      clientList={invoiceDetails.clientList}
      selectedClient={selectedClient}
      setSelectedClient={setSelectedClient}
      amount={amount}
      setDueDate={setDueDate}
      issueDate={issueDate}
      setIssueDate={setIssueDate}
      dueDate={dueDate}
      invoiceNumber={invoiceNumber}
      setInvoiceNumber={setInvoiceNumber}
      reference={reference}
      optionSelected={false}
      clientVisible={false}
    />
    <div className="px-10 py-5">
      <InvoiceTable
        selectedClient={selectedClient}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        setLineItems={setLineItems}
        lineItems={lineItems}
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
    />
  </div>
);

export default Container;
