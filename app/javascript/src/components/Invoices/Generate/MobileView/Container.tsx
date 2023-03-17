import React, { useState } from "react";

import { MinusIcon, PlusIcon } from "miruIcons";

import InvoiceDetails from "./InvoiceDetails";

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
}) => {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  const ListItem = ({ title, openDropdown, setOpenDropdown }) => (
    <div
      className="flex items-center justify-between"
      onClick={() => {
        setOpenDropdown(!openDropdown);
      }}
    >
      <span
        className={`text-base leading-5 text-miru-dark-purple-1000 ${
          openDropdown ? "font-bold" : "font-medium"
        }`}
      >
        {title}
      </span>
      <div className="flex items-center">
        {openDropdown ? (
          <MinusIcon
            className="mx-2 text-miru-han-purple-1000"
            size={16}
            weight="bold"
          />
        ) : (
          <PlusIcon
            className="mx-2 text-miru-han-purple-1000"
            size={16}
            weight="bold"
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="border-b border-miru-gray-200 py-3 px-4">
        <ListItem
          openDropdown={showInvoiceDetails}
          setOpenDropdown={setShowInvoiceDetails}
          title="Invoice Details"
        />
        {showInvoiceDetails && (
          <InvoiceDetails
            dateFormat={dateFormat}
            dueDate={dueDate}
            invoiceDetails={invoiceDetails}
            invoiceNumber={invoiceNumber}
            issueDate={issueDate}
            reference={reference}
            selectedClient={selectedClient}
            setDueDate={setDueDate}
            setInvoiceNumber={setInvoiceNumber}
            setIssueDate={setIssueDate}
            setReference={setReference}
            setSelectedClient={setSelectedClient}
          />
        )}
      </div>
      <div className="border-b border-miru-gray-200 py-3 px-4">
        <ListItem
          openDropdown={false}
          setOpenDropdown={null} //eslint-disable-line
          title="Line Items"
        />
      </div>
      <div className="border-b border-miru-gray-200 py-3 px-4">
        <ListItem
          openDropdown={false}
          setOpenDropdown={null} //eslint-disable-line
          title="Billing Details"
        />
      </div>
    </>
  );
};

export default Container;
