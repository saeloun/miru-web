import React from "react";

import {
  PaperPlaneTiltIcon,
  DeleteIcon,
  PrinterIcon,
  PenIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  ReminderIcon,
} from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Tooltip, Modal } from "StyledComponents";

import { handleDownloadInvoice } from "../common/utils";

const MoreOptions = ({
  setShowDeleteDialog,
  setInvoiceToDelete,
  invoice,
  isMenuOpen,
  setIsMenuOpen,
  setIsSending,
  isSending,
  isDesktop,
  showMoreOptions,
  setShowMoreOptions,
  showPrint,
  showSendLink,
  setIsSendReminder,
  showConnectPaymentDialog,
  setShowConnectPaymentDialog,
  isStripeEnabled,
}) => {
  const navigate = useNavigate();

  return isDesktop ? (
    <>
      <div
        className="absolute bottom-16 right-0 hidden items-center justify-between rounded-xl border-2 border-border bg-white lg:w-28 lg:p-2 lg:group-hover:flex xl:w-40 xl:p-3"
        onClick={e => e.stopPropagation()}
      >
        <Tooltip content="Send To">
          <button
            className="rounded p-2 text-primary hover:bg-muted"
            id="sendInvoiceButton"
            onClick={e => {
              e.stopPropagation();
              if (isStripeEnabled) {
                setIsSending(!isSending);
              } else {
                setShowConnectPaymentDialog(!showConnectPaymentDialog);
              }
            }}
          >
            <PaperPlaneTiltIcon
              className="hover:bg-muted"
              size={16}
              weight="bold"
            />
          </button>
        </Tooltip>
        <Tooltip content="Download">
          <button
            disabled={invoice.status == "draft"}
            className={
              invoice.status == "draft"
                ? "text-foreground"
                : "rounded p-2 text-primary hover:bg-muted"
            }
            onClick={e => {
              e.stopPropagation();
              handleDownloadInvoice(invoice);
            }}
          >
            <DownloadSimpleIcon size={16} weight="bold" />
          </button>
        </Tooltip>
        <Tooltip content="Edit">
          <button
            className="rounded p-2 text-primary hover:bg-muted"
            id="editInvoiceButton"
            onClick={e => {
              e.stopPropagation();
              navigate(`/invoices/${invoice.id}/edit`);
            }}
          >
            <PenIcon size={16} weight="bold" />
          </button>
        </Tooltip>
        <Tooltip content="More">
          <button
            id="openMenu"
            className={`rounded p-2 text-primary  hover:bg-muted ${
              isMenuOpen && `bg-muted`
            }`}
            onClick={e => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <DotsThreeVerticalIcon size={16} weight="bold" />
          </button>
        </Tooltip>
      </div>
      {isMenuOpen && (
        <div
          className="absolute top-4 right-0 z-10 flex-col items-end group-hover:flex"
          onClick={e => e.stopPropagation()}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="hidden overflow-hidden lg:w-10 xl:w-12">
            <div className="h-6 w-6 origin-bottom-left rotate-45 transform border-2 border-border bg-white" />
          </div>
          <ul
            className="mt-1 rounded-lg border-border bg-white shadow-c1 lg:py-3 xl:py-4"
            onClick={e => e.stopPropagation()}
          >
            {invoice?.status === "overdue" && (
              <li
                className="flex cursor-pointer items-center px-5 text-sm text-primary hover:bg-muted lg:py-1 xl:py-2"
                id="reminderIcon"
                onClick={() => {
                  setIsSendReminder(true);
                  setIsSending(!isSending);
                }}
              >
                <ReminderIcon
                  className="lg:mr-2 xl:mr-4"
                  size={16}
                  weight="bold"
                />
                Send Reminder
              </li>
            )}
            {showPrint && (
              <li className="flex cursor-pointer items-center px-5 text-sm text-primary hover:bg-muted lg:py-1 xl:py-2">
                <PrinterIcon
                  className="text-primary lg:mr-2 xl:mr-4"
                  size={16}
                  weight="bold"
                />
                Print
              </li>
            )}
            <li
              className="flex cursor-pointer items-center px-5 text-sm text-destructive hover:bg-muted lg:py-1 xl:py-2"
              onClick={() => {
                setShowDeleteDialog(true);
                setInvoiceToDelete(invoice.id);
              }}
            >
              <DeleteIcon
                className="text-destructive lg:mr-2 xl:mr-4"
                size={16}
                weight="bold"
              />
              Delete
            </li>
            {showSendLink && (
              <li className="flex cursor-pointer items-center px-5 text-sm text-primary hover:bg-muted lg:py-1 xl:py-2">
                <PaperPlaneTiltIcon
                  className="text-primary lg:mr-2 xl:mr-4"
                  size={16}
                  weight="bold"
                />
                Send link
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  ) : (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showMoreOptions}
      onClose={() => setShowMoreOptions(false)}
    >
      <ul className="shadow-2 w-full rounded-lg bg-white">
        <li>
          <button
            className="flex cursor-pointer items-center py-2 text-primary"
            onClick={e => {
              e.stopPropagation();
              setIsSending(!isSending);
              setShowMoreOptions(false);
              if (isStripeEnabled) {
                setIsSending(!isSending);
                setShowMoreOptions(false);
              } else {
                setShowConnectPaymentDialog(true);
                setIsSending(false);
              }
            }}
          >
            <PaperPlaneTiltIcon className="mr-4" size={16} /> Send Invoice
          </button>
        </li>
        <li className="flex cursor-pointer items-center py-2">
          <button
            disabled={invoice.status == "draft"}
            className={
              invoice.status == "draft"
                ? "flex cursor-pointer items-center py-2 text-foreground"
                : "flex cursor-pointer items-center py-2 text-primary"
            }
            onClick={() => handleDownloadInvoice(invoice)}
          >
            <DownloadSimpleIcon className="mr-4" size={16} /> Download Invoice
          </button>
        </li>
        <li>
          <button
            className="flex cursor-pointer items-center py-2 text-primary"
            id="editInvoiceButton"
            onClick={() => {
              navigate(`/invoices/${invoice.id}/edit`);
            }}
          >
            <PenIcon className="mr-4" size={16} /> Edit Invoice
          </button>
        </li>
        {invoice?.status === "overdue" && (
          <li
            className="flex cursor-pointer items-center py-2 text-primary"
            onClick={() => {
              setIsSendReminder(true);
              setShowMoreOptions(false);
            }}
          >
            <ReminderIcon className="mr-4" size={16} weight="bold" />
            Send Reminder
          </li>
        )}
        {showPrint && (
          <li className="flex cursor-pointer items-center py-2 text-primary">
            <PrinterIcon className="mr-4" size={16} />
            Print
          </li>
        )}
        {showSendLink && (
          <li className="flex cursor-pointer items-center py-2 text-primary">
            <PaperPlaneTiltIcon className="mr-4" size={16} />
            Send link
          </li>
        )}
        <li
          className="flex cursor-pointer items-center py-2 text-destructive"
          onClick={() => {
            setShowDeleteDialog(true);
            setInvoiceToDelete(invoice.id);
          }}
        >
          <DeleteIcon className="mr-4 text-destructive" size={16} />
          Delete
        </li>
      </ul>
    </Modal>
  );
};

export default MoreOptions;
