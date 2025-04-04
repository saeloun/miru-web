import React from "react";

import { EditIcon, FloppyDiskIcon, PaperPlaneTiltIcon } from "miruIcons";
import { Button } from "StyledComponents";

import CompanyInfo from "components/Invoices/common/CompanyInfo";

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
  const { companyDetails } = invoiceDetails;

  return (
    <div className="flex-1 overflow-y-scroll">
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
          className="mt-2 flex w-full items-center justify-center py-3 px-12 text-miru-han-purple-1000"
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
        currency={currency}
        discount={discount}
        setActiveSection={setActiveSection}
        subTotal={subTotal}
        tax={tax}
        total={total}
      />
      <div className="flex w-full justify-between p-4 shadow-c1">
        <Button
          className="mr-2 flex w-1/2 items-center justify-center px-4 py-2"
          style="primary"
          onClick={handleSaveInvoice}
        >
          <FloppyDiskIcon className="text-white" size={16} weight="bold" />
          <span className="ml-2 text-center text-base font-bold leading-5 text-white">
            Save
          </span>
        </Button>
        <Button
          className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
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
