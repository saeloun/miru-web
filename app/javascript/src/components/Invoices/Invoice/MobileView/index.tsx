import React, { useState } from "react";

import {
  PaperPlaneTiltIcon,
  PrinterIcon,
  DeleteIcon,
  DotsThreeVerticalIcon,
  ArrowLeftIcon,
  EditIcon,
  WaiveSVG,
  ReminderIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
} from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button, MobileMoreOptions, Badge } from "StyledComponents";

import CompanyInfo from "components/Invoices/common/CompanyInfo";
import InvoiceInfo from "components/Invoices/Generate/MobileView/Container/InvoicePreview/InvoiceInfo";
import InvoiceTotal from "components/Invoices/Generate/MobileView/Container/InvoicePreview/InvoiceTotal";
import LineItems from "components/Invoices/Generate/MobileView/Container/MenuContainer/LineItems";
import MarkInvoiceAsPaidModal from "components/Invoices/Invoice/MarkInvoicePaidModal";
import ConnectPaymentGateway from "components/Invoices/popups/ConnectPaymentGateway";
import DeleteInvoice from "components/Invoices/popups/DeleteInvoice";
import WavieOffInvoice from "components/Invoices/popups/WavieOffInvoice";
import getStatusCssClass from "utils/getBadgeStatus";

import HistoryMobileView from "../ViewHistory/HistoryMobileView";

const MobileView = ({
  invoice,
  handleSendInvoice,
  isStripeEnabled,
  showConnectPaymentDialog,
  setShowSendInvoiceModal,
  setShowConnectPaymentDialog,
  setIsSendReminder,
  fetchInvoice,
}) => {
  const {
    id,
    invoiceLineItems,
    tax,
    discount,
    invoiceNumber,
    status,
    company,
    amount,
    dueDate,
    issueDate,
    reference,
    client,
    amountDue,
    amountPaid,
  } = invoice;
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showWavieDialog, setShowWavieDialog] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showInvoicePaymentModal, setShowInvoicePaymentModal] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const subTotal = invoiceLineItems.reduce(
    (prev, curr) => prev + (curr.rate * curr.quantity) / 60,
    0
  );
  const total = Number(subTotal) + Number(tax) - Number(discount);
  const invoiceWaived = invoice?.status === "waived";
  const strikeAmount = invoice?.status === "waived" && "line-through";
  const currency = company?.currency;
  const dateFormat = company?.dateFormat;

  if (showHistory) {
    return (
      <HistoryMobileView invoice={invoice} setShowHistory={setShowHistory} />
    );
  }

  return (
    <div className="h-full">
      <div className="sticky top-0 left-0 right-0 z-50 flex h-12 items-center justify-between bg-white px-4 shadow-c1">
        <div className="flex items-center">
          <Button
            className="xsm:p-0"
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
          <span>Invoice #{invoiceNumber}</span>
        </div>
        <div>
          <Badge
            className={`${getStatusCssClass(status)} uppercase`}
            text={status}
          />
        </div>
      </div>
      <div className="h-full overflow-y-scroll">
        <CompanyInfo company={company} />
        <InvoiceInfo
          amount={amount}
          dateFormat={company.dateFormat}
          dueDate={dueDate}
          invoiceNumber={invoiceNumber}
          issueDate={issueDate}
          reference={reference}
          selectedClient={client}
          setActiveSection={() => {}} //eslint-disable-line
          showEditButton={false}
          strikeAmount={strikeAmount}
        />
        <div className="border-b border-miru-gray-400 px-4 py-2">
          <LineItems
            isInvoicePreviewCall
            currency={client.currency}
            dateFormat={company.dateFormat}
            manualEntryArr={[]}
            selectedClient={client}
            selectedLineItems={invoiceLineItems}
            setActiveSection={() => {}} //eslint-disable-line
            setEditItem={() => {}} //eslint-disable-line
            strikeAmount={strikeAmount}
          />
        </div>
        <InvoiceTotal
          amountDue={amountDue}
          amountPaid={amountPaid}
          currency={client.currency}
          discount={discount}
          setActiveSection={() => {}} //eslint-disable-line
          showEditButton={false}
          strikeAmount={strikeAmount}
          subTotal={subTotal}
          tax={tax}
          total={total}
        />
      </div>
      {!invoiceWaived && (
        <>
          <div className="sticky bottom-0 left-0 right-0 z-50 flex w-full items-center justify-between  bg-white p-4 shadow-c1">
            <Button
              className="mr-2 flex w-1/2 items-center justify-center px-4 py-2"
              style="primary"
              onClick={() => {
                navigate(`/invoices/${invoice.id}/edit`);
              }}
            >
              <EditIcon className="text-white" size={16} weight="bold" />
              <span className="ml-2 text-center text-xs font-bold leading-5 text-white sm:text-base">
                Edit
              </span>
            </Button>
            <Button
              className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
              style="primary"
              onClick={() => {
                if (isStripeEnabled) {
                  handleSendInvoice();
                } else {
                  setShowConnectPaymentDialog(true);
                }
              }}
            >
              <PaperPlaneTiltIcon
                className="text-white"
                size={16}
                weight="bold"
              />
              <span className="ml-2 text-center text-xs font-bold leading-5 text-white sm:text-base">
                Send to
              </span>
            </Button>
            <Button
              className="ml-4"
              style="ternary"
              onClick={() => setShowMoreOptions(true)}
            >
              <DotsThreeVerticalIcon size={20} weight="bold" />
            </Button>
          </div>
          {showMoreOptions && (
            <MobileMoreOptions
              setVisibilty={setShowMoreOptions}
              visibilty={showMoreOptions}
            >
              <li
                className="flex cursor-pointer items-center px-5 py-2 text-sm text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:py-1 xl:py-2"
                onClick={() => {
                  setShowMoreOptions(false);
                  setShowHistory(true);
                }}
              >
                <ClockIcon
                  className="mr-4 text-miru-han-purple-1000"
                  size={16}
                  weight="bold"
                />
                View History
              </li>
              <li
                className="flex cursor-pointer items-center px-5 py-2 text-sm text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:py-1 xl:py-2"
                onClick={() => {
                  setShowMoreOptions(false);
                  setShowInvoicePaymentModal(true);
                }}
              >
                <CurrencyCircleDollarIcon
                  className="mr-4 text-miru-han-purple-1000"
                  size={16}
                  weight="bold"
                />
                Mark as paid
              </li>
              {["sent", "overdue", "viewed"].includes(invoice?.status) && (
                <li
                  className="flex cursor-pointer items-center py-2 px-5 text-sm text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:py-1 xl:py-2"
                  onClick={() => {
                    setShowMoreOptions(false);
                    setShowWavieDialog(true);
                  }}
                >
                  <img
                    className="mr-4"
                    height="16px"
                    src={WaiveSVG}
                    width="16px"
                  />
                  Waive Off
                </li>
              )}
              {invoice?.status === "overdue" && (
                <li
                  className="flex cursor-pointer items-center py-2 px-5 text-sm text-miru-han-purple-1000 hover:bg-miru-gray-100 lg:py-1 xl:py-2"
                  onClick={() => {
                    setShowMoreOptions(false);
                    setIsSendReminder(true);
                    handleSendInvoice();
                  }}
                >
                  <ReminderIcon className="mr-4" size={16} weight="bold" />
                  Send Reminder
                </li>
              )}
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
              {status == "DRAFT" && (
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
              invoice={id}
              setShowDeleteDialog={setShowDeleteDialog}
              showDeleteDialog={showDeleteDialog}
            />
          )}
          {showWavieDialog && (
            <WavieOffInvoice
              invoice={id}
              invoiceNumber={invoiceNumber}
              setShowWavieDialog={setShowWavieDialog}
              showWavieDialog={showWavieDialog}
            />
          )}
          {!isStripeEnabled && showConnectPaymentDialog && (
            <ConnectPaymentGateway
              invoice={invoice}
              setIsSending={setShowSendInvoiceModal}
              setShowConnectPaymentDialog={setShowConnectPaymentDialog}
              showConnectPaymentDialog={showConnectPaymentDialog}
            />
          )}
          {showInvoicePaymentModal && (
            <MarkInvoiceAsPaidModal
              baseCurrency={currency}
              dateFormat={dateFormat}
              fetchInvoice={fetchInvoice}
              invoice={invoice}
              setShowManualEntryModal={setShowInvoicePaymentModal}
              showManualEntryModal={showInvoicePaymentModal}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MobileView;
