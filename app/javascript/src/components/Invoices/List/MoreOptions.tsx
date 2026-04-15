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
import { i18n } from "../../../i18n";

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
        className="absolute bottom-16 right-0 hidden items-center justify-between rounded-xl border-2 border-border bg-background text-foreground lg:w-28 lg:p-2 lg:group-hover:flex xl:w-40 xl:p-3"
        onClick={e => e.stopPropagation()}
      >
        <Tooltip content={i18n.t("invoices.sendTo")}>
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
        <Tooltip content={i18n.t("download")}>
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
        <Tooltip content={i18n.t("edit")}>
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
        <Tooltip content={i18n.t("actions")}>
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
            <div className="h-6 w-6 origin-bottom-left rotate-45 transform border-2 border-border bg-background" />
          </div>
          <ul
            className="mt-1 rounded-lg border border-border bg-background text-foreground shadow-c1 lg:py-3 xl:py-4"
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
                {i18n.t("invoices.sendReminder")}
              </li>
            )}
            {showPrint && (
              <li className="flex cursor-pointer items-center px-5 text-sm text-primary hover:bg-muted lg:py-1 xl:py-2">
                <PrinterIcon
                  className="text-primary lg:mr-2 xl:mr-4"
                  size={16}
                  weight="bold"
                />
                {i18n.t("invoices.invoice")}
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
              {i18n.t("delete")}
            </li>
            {showSendLink && (
              <li className="flex cursor-pointer items-center px-5 text-sm text-primary hover:bg-muted lg:py-1 xl:py-2">
                <PaperPlaneTiltIcon
                  className="text-primary lg:mr-2 xl:mr-4"
                  size={16}
                  weight="bold"
                />
                {i18n.t("invoices.sendInvoice")}
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
      <ul className="shadow-2 w-full rounded-lg border border-border bg-background text-foreground">
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
            <PaperPlaneTiltIcon className="mr-4" size={16} />{" "}
            {i18n.t("invoices.sendInvoice")}
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
            <DownloadSimpleIcon className="mr-4" size={16} />{" "}
            {i18n.t("download")}
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
            <PenIcon className="mr-4" size={16} />{" "}
            {i18n.t("invoices.editInvoice")}
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
            {i18n.t("invoices.sendReminder")}
          </li>
        )}
        {showPrint && (
          <li className="flex cursor-pointer items-center py-2 text-primary">
            <PrinterIcon className="mr-4" size={16} />
            {i18n.t("invoices.invoice")}
          </li>
        )}
        {showSendLink && (
          <li className="flex cursor-pointer items-center py-2 text-primary">
            <PaperPlaneTiltIcon className="mr-4" size={16} />
            {i18n.t("invoices.sendInvoice")}
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
          {i18n.t("delete")}
        </li>
      </ul>
    </Modal>
  );
};

export default MoreOptions;
