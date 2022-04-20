import React, { useState } from "react";

import CompanyInfo from "./CompanyInfo";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceTotal from "./InvoiceTotal";
import InvoiceTable from "./InvoiveTable";
import MultipleEntriesModal from "./MultipleEntriesModal";

const Container = ({
  invoiceDetails,
  lineItems, setLineItems,
  selectedClient, setSelectedClient,
  invoiceNumber, setInvoiceNumber,
  amount, setAmount,
  reference, setReference,
  issueDate,
  dueDate,
  outstandingAmount, setOutstandingAmount,
  amountDue, setAmountDue,
  amountPaid, setAmountPaid,
  discount, setDiscount,
  tax, setTax,
  selectedOption, setSelectedOption
}) => {

  const [showMultilineModal, setShowMultilineModal] = useState<boolean>(false);

  return (
    <div className="bg-miru-gray-100 mt-5 mb-10 p-0 m-0 w-full">
      <CompanyInfo companyDetails={invoiceDetails.companyDetails}/>
      <InvoiceDetails
        clientList = {invoiceDetails.clientList}
        selectedClient={selectedClient}
        setSelectedClient= {setSelectedClient}
        amountDue={amountDue}
        issueDate={issueDate}
        dueDate={dueDate}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        reference={reference}
      />
      <div className="px-10 py-5">
        <InvoiceTable
          selectedClient ={selectedClient}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          setLineItems={setLineItems}
          lineItems={lineItems}
          setShowMultilineModal={setShowMultilineModal}
        />
        {showMultilineModal &&
        <MultipleEntriesModal
          lineItems={lineItems}
          setLineItems={setLineItems}
          setShowMultilineModal={setShowMultilineModal}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
        }
      </div>
      <InvoiceTotal
        newLineItems={selectedOption}
        setAmountDue={setAmountDue}
        amountDue={amountDue}
        discount={discount}
        setDiscount={setDiscount}
        tax={tax}
        setTax={setTax}
      />
    </div>
  );
};

export default Container;
