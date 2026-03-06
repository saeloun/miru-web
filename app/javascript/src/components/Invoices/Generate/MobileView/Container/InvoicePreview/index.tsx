import React from "react";

import CompanyInfo from "components/Invoices/common/CompanyInfo";
import { EditIcon, FloppyDiskIcon, PaperPlaneTiltIcon } from "miruIcons";
import { Button } from "StyledComponents";

import InvoiceInfo from "./InvoiceInfo";
import InvoiceTotal from "./InvoiceTotal";

import { sections } from "../../utils";
import LineItems from "../MenuContainer/LineItems";

const InvoicePreviewContainer = ({
  invoiceDetails,
  selectedClient,
  setActiveSection,
  selectedLineItems,
  setEditItem,
  manualEntryArr,
  dueDate,
  issueDate,
  invoiceNumber,
  reference,
  amount,
  isInvoicePreviewCall,
  amountDue,
  amountPaid,
  currency,
  discount,
  tax,
  total,
  subTotal,
  handleSaveInvoice,
  handleSendButtonClick,
}) => {
  const { companyDetails, baseCurrencyAmount, company } = invoiceDetails;

  return (
    <div className="flex-1 overflow-y-auto">
      {companyDetails && <CompanyInfo company={companyDetails} />}
      <InvoiceInfo
        amount={amount}
        currency={currency}
        dueDate={dueDate}
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        reference={reference}
        selectedClient={selectedClient}
        setActiveSection={setActiveSection}
        dateFormat={
          invoiceDetails?.companyDetails?.date_format ||
          invoiceDetails?.company?.dateFormat
        }
      />
      <div className="border-b border-miru-gray-400 px-4 py-2">
        <LineItems
          currency={currency || companyDetails.currency}
          isInvoicePreviewCall={isInvoicePreviewCall}
          manualEntryArr={manualEntryArr}
          selectedClient={selectedClient}
          selectedLineItems={selectedLineItems}
          setActiveSection={setActiveSection}
          setEditItem={setEditItem}
          dateFormat={
            invoiceDetails?.companyDetails?.date_format ||
            invoiceDetails?.company?.dateFormat
          }
        />
        <div
          className="mt-2 flex w-full items-center justify-center px-4 py-3 text-miru-han-purple-1000 sm:px-12"
          onClick={() => {
            setActiveSection(sections.generateInvoice);
          }}
        >
          <EditIcon className="mr-2" weight="bold" />
          <span className="text-xs font-bold">Edit Line Items</span>
        </div>
      </div>
      <InvoiceTotal
        amountDue={amountDue}
        amountPaid={amountPaid}
        baseCurrency={company?.currency}
        baseCurrencyAmount={baseCurrencyAmount}
        currency={currency}
        discount={discount}
        setActiveSection={setActiveSection}
        subTotal={subTotal}
        tax={tax}
        total={total}
      />
      <div className="flex w-full gap-2 p-4 shadow-c1">
        <Button
          className="flex flex-1 items-center justify-center px-4 py-2"
          style="primary"
          onClick={handleSaveInvoice}
        >
          <FloppyDiskIcon className="text-white" size={16} weight="bold" />
          <span className="ml-2 text-center text-base font-bold leading-5 text-white">
            Save
          </span>
        </Button>
        <Button
          className="flex flex-1 items-center justify-center px-4 py-2"
          style="primary"
          onClick={() => {
            handleSendButtonClick();
          }}
        >
          <PaperPlaneTiltIcon className="text-white" size={16} weight="bold" />
          <span className="ml-2 text-center text-base font-bold leading-5 text-white">
            Send to
          </span>
        </Button>
      </div>
    </div>
  );
};

export default InvoicePreviewContainer;
