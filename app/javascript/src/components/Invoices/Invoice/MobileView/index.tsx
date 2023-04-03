import React, { useState } from "react";

import {
  PaperPlaneTiltIcon,
  PrinterIcon,
  DeleteIcon,
  DotsThreeVerticalIcon,
  ArrowLeftIcon,
  EditIcon,
} from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button, MobileMoreOptions, Badge } from "StyledComponents";

import CompanyInfo from "components/Invoices/common/CompanyInfo";
import InvoiceInfo from "components/Invoices/Generate/MobileView/Container/InvoicePreview/InvoiceInfo";
import InvoiceTotal from "components/Invoices/Generate/MobileView/Container/InvoicePreview/InvoiceTotal";
import LineItems from "components/Invoices/Generate/MobileView/Container/MenuContainer/LineItems";
import DeleteInvoice from "components/Invoices/popups/DeleteInvoice";
import getStatusCssClass from "utils/getBadgeStatus";

const MobileView = ({ invoice }) => {
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const navigate = useNavigate();
  const subTotal = invoice.invoiceLineItems.reduce(
    (prev, curr) => prev + (curr.rate * curr.quantity) / 60,
    0
  );
  const tax = invoice.tax;
  const discount = invoice.discount;
  const total = Number(subTotal) + Number(tax) - Number(discount);

  return (
    <div>
      <div className="sticky flex h-12 items-center justify-between px-3 shadow-c1">
        <div className="flex items-center">
          <Button
            style="ternary"
            onClick={() => {
              navigate("/invoices");
            }}
          >
            <ArrowLeftIcon
              className="mr-4 text-miru-dark-purple-1000"
              size={16}
              weight="bold"
            />
          </Button>
          <span>Invoice #{invoice.invoiceNumber}</span>
        </div>
        <div>
          <Badge
            className={`${getStatusCssClass(invoice.status)} uppercase`}
            text={invoice.status}
          />
        </div>
      </div>
      <CompanyInfo company={invoice.company} />
      <InvoiceInfo
        amount={invoice.amount}
        currency={invoice.company.currency}
        dateFormat={invoice.company.dateFormat}
        dueDate={invoice.dueDate}
        invoiceNumber={invoice.invoiceNumber}
        issueDate={invoice.issueDate}
        reference={invoice.reference}
        selectedClient={invoice.client}
        setActiveSection={() => {}} //eslint-disable-line
        showEditButton={false}
      />
      <div className="border-b border-miru-gray-400 px-4 py-2">
        <LineItems
          isInvoicePreviewCall
          currency={invoice.company.currency}
          dateFormat={invoice.company.dateFormat}
          manualEntryArr={[]}
          selectedClient={invoice.client}
          selectedLineItems={invoice.invoiceLineItems}
          setActiveSection={() => {}} //eslint-disable-line
          setEditItem={() => {}} //eslint-disable-line
        />
      </div>
      <InvoiceTotal
        amountDue={invoice.amountDue}
        amountPaid={invoice.amountPaid}
        currency={invoice.company.currency}
        discount={discount}
        setActiveSection={() => {}} //eslint-disable-line
        showEditButton={false}
        subTotal={subTotal}
        tax={tax}
        total={total}
      />
      <div className="flex w-full justify-between p-4 shadow-c1">
        <Button
          className="mr-2 flex w-1/2 items-center justify-center px-4 py-2"
          style="primary"
        >
          <EditIcon className="text-white" size={16} weight="bold" />
          <span className="ml-2 text-center text-base font-bold leading-5 text-white">
            Edit
          </span>
        </Button>
        <Button
          className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
          style="primary"
        >
          <PaperPlaneTiltIcon className="text-white" size={16} weight="bold" />
          <span className="ml-2 text-center text-base font-bold leading-5 text-white">
            Send to
          </span>
        </Button>
        <Button onClick={() => setShowMoreOptions(true)}>
          <DotsThreeVerticalIcon
            className="ml-4 text-miru-han-purple-1000"
            size={20}
            weight="bold"
          />
        </Button>
      </div>
      {showMoreOptions && (
        <MobileMoreOptions setVisibilty={setShowMoreOptions}>
          <li className="flex cursor-pointer items-center px-5 py-2 text-sm text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:py-1 xl:py-2">
            <PrinterIcon
              className="mr-4 text-miru-han-purple-1000"
              size={16}
              weight="bold"
            />
            Print
          </li>
          <li
            className="flex cursor-pointer items-center py-2 px-5 text-sm text-miru-red-400 hover:bg-miru-gray-100 lg:py-1 xl:py-2"
            onClick={() => {
              setShowMoreOptions(false);
              setShowDeleteDialog(true);
            }}
          >
            <DeleteIcon
              className="mr-4 text-miru-red-400"
              size={16}
              weight="bold"
            />
            Delete
          </li>
          {invoice.status == "DRAFT" && (
            <li className="flex cursor-pointer items-center px-5 py-2 text-sm text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:py-1 xl:py-2">
              <PrinterIcon
                className="mr-4 text-miru-han-purple-1000"
                size={16}
                weight="bold"
              />
              Download
            </li>
          )}
        </MobileMoreOptions>
      )}
      {showDeleteDialog && (
        <DeleteInvoice
          invoice={invoice.id}
          setShowDeleteDialog={setShowDeleteDialog}
        />
      )}
    </div>
  );
};

export default MobileView;
