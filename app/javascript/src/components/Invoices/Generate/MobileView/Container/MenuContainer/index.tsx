import React, { useEffect, useState } from "react";

import { MinusIcon, PlusIcon } from "miruIcons";

import Billing from "./Billing";
import InvoiceDetails from "./InvoiceDetails";
import InvoicePreview from "./InvoicePreview";
import LineItems from "./LineItems";

const MenuContainer = ({
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
  setActiveSection,
  selectedLineItems,
  setEditItem,
  manualEntryArr,
  amountDue,
  amountPaid,
  currency,
  discount,
  setAmount,
  setAmountDue,
  setDiscount,
  setTax,
  tax,
  isInvoicePreviewCall,
  setIsInvoicePreviewCall,
  subTotal,
  total,
  setSubTotal,
  setTotal,
  handleSaveInvoice,
  handleSendButtonClick,
}) => {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(true);
  const [showLineItem, setShowLineItem] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  useEffect(() => {
    setIsInvoicePreviewCall(false);
  }, []);

  useEffect(() => {
    const newLineItemsSubTotalArr = selectedLineItems.filter(
      lineItem => !lineItem._destroy
    );

    const newLineItemsSubTotal = newLineItemsSubTotalArr.reduce(
      (sum, { lineTotal }) => sum + Number(lineTotal),
      0
    );

    const allManualEntries = manualEntryArr.filter(
      lineItem => !lineItem._destroy
    );

    const manualEntryTotal = allManualEntries.reduce(
      (sum, { lineTotal }) => sum + Number(lineTotal),
      0
    );

    const subTotal = Number(newLineItemsSubTotal) + Number(manualEntryTotal);
    const newTotal = subTotal + Number(tax) - Number(discount);
    setSubTotal(subTotal);
    setTotal(newTotal);
    setAmount(newTotal);
    setAmountDue(newTotal - amountPaid);
  }, [selectedLineItems, manualEntryArr, discount, subTotal, tax]);

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
    <div className="flex flex-auto flex-col justify-between">
      <div>
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
              handleSaveInvoice={handleSaveInvoice}
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
            openDropdown={showLineItem}
            setOpenDropdown={setShowLineItem} //eslint-disable-line
            title="Line Items"
          />
          {showLineItem && (
            <>
              <div className="mt-3 border-t border-miru-gray-400" />
              <LineItems
                currency={invoiceDetails.companyDetails.currency}
                dateFormat={dateFormat}
                isInvoicePreviewCall={isInvoicePreviewCall}
                manualEntryArr={manualEntryArr}
                selectedClient={selectedClient}
                selectedLineItems={selectedLineItems}
                setActiveSection={setActiveSection}
                setEditItem={setEditItem}
              />
            </>
          )}
        </div>
        <div
          className={` py-3 px-4 ${
            !showBilling && "border-b border-miru-gray-200"
          }`}
        >
          <ListItem
            openDropdown={showBilling}
            setOpenDropdown={setShowBilling}
            title="Billing Details"
          />
          {showBilling && (
            <Billing
              amountDue={amountDue}
              amountPaid={amountPaid}
              discount={discount}
              setAmount={setAmount}
              setAmountDue={setAmountDue}
              setDiscount={setDiscount}
              setSubTotal={setSubTotal}
              setTax={setTax}
              setTotal={setTotal}
              subTotal={subTotal}
              tax={tax}
              total={total}
            />
          )}
        </div>
      </div>
      <InvoicePreview
        currency={currency}
        handleSaveInvoice={handleSaveInvoice}
        handleSendButtonClick={handleSendButtonClick}
        selectedClient={selectedClient}
        setActiveSection={setActiveSection}
        setIsInvoicePreviewCall={setIsInvoicePreviewCall}
        total={total}
      />
    </div>
  );
};

export default MenuContainer;
