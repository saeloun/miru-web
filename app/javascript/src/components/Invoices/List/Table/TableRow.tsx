import { ApiStatus as InvoicesStatus } from "constants/index";

import React, { useState, useRef } from "react";

import invoicesApi from "apis/invoices";
import CustomCheckbox from "common/CustomCheckbox";
import SendInvoice from "components/Invoices/common/InvoiceForm/SendInvoice";
import SendInvoiceContainer from "components/Invoices/Generate/MobileView/Container/SendInvoiceContainer";
import ConnectPaymentGateway from "components/Invoices/popups/ConnectPaymentGateway";
import { currencyFormat, useDebounce } from "helpers";
import { ArrowLeftIcon, DotsThreeVerticalIcon, XIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Toastr, Tooltip } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

import MoreOptions from "../MoreOptions";

const TableRow = ({
  invoice,
  isSelected,
  selectInvoices,
  deselectInvoices,
  setShowDeleteDialog,
  setInvoiceToDelete,
  fetchInvoices,
  isDesktop,
  index,
  isStripeEnabled,

  _setIsStripeEnabled,
}) => {
  const [sendStatus, setSendStatus] = useState<InvoicesStatus>(
    InvoicesStatus.IDLE
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const [showToolTip, setShowToolTip] = useState<boolean>(false);
  const [isSendReminder, setIsSendReminder] = useState<boolean>(false);
  useDebounce(isMenuOpen, 500);
  const [showConnectPaymentDialog, setShowConnectPaymentDialog] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const toolTipRef = useRef(null);

  const {
    amount,
    client,
    currency,
    dueDate,
    id,
    invoiceNumber,
    issueDate,
    status,
  } = invoice;

  const { name, logo } = client;

  const handleCheckboxChange = () => {
    if (isSelected) {
      deselectInvoices([id]);
    } else {
      selectInvoices([id]);
    }
  };

  const handleOnClick = e => {
    e.stopPropagation();
  };

  const handleTooltip = () => {
    if (toolTipRef?.current?.offsetWidth < toolTipRef?.current?.scrollWidth) {
      setShowToolTip(true);
    } else {
      setShowToolTip(false);
    }
  };

  const submitSendInvoice = async (e, invoiceEmail) => {
    e.preventDefault();
    e.stopPropagation();
    if (invoiceEmail?.recipients.length > 0) {
      try {
        setSendStatus(InvoicesStatus.LOADING);

        const payload = { invoice_email: invoiceEmail };
        let resp;
        if (isSendReminder) {
          resp = await invoicesApi.sendReminder(invoice.id, payload);
        } else {
          resp = await invoicesApi.sendInvoice(invoice.id, payload);
        }

        Toastr.success(resp.data.message);
        setSendStatus(InvoicesStatus.SUCCESS);
        setIsSending(false);
        setIsSendReminder(false);
        setTimeout(fetchInvoices, 6000);
      } catch {
        setSendStatus(InvoicesStatus.ERROR);
      }
    }
  };

  return (
    <>
      <tr
        className="group cursor-pointer last:border-b-0 md:hover:bg-miru-gray-100"
        id="invoicesListTableRow"
        key={index}
        onClick={() => {
          navigate(`/invoices/${id}`);
        }}
      >
        <td className="px-0 py-0">
          <CustomCheckbox
            isUpdatedDesign
            checkboxValue={isSelected}
            handleCheck={handleCheckboxChange}
            handleOnClick={handleOnClick}
            id={id}
            isChecked={isSelected}
            text=""
            wrapperClassName="h-8 w-8 m-auto rounded-3xl p-2 hover:bg-miru-gray-1000"
          />
        </td>
        <td>
          <Tooltip content={name} show={showToolTip}>
            <div className="flex w-40 cursor-pointer items-center py-5 pr-2 text-left font-medium tracking-normal sm:w-80 md:w-96 lg:w-full">
              <Avatar url={logo} />
              <div
                className="ml-2 overflow-hidden truncate whitespace-nowrap lg:ml-4"
                ref={toolTipRef}
                onMouseEnter={handleTooltip}
              >
                <span className="text-sm font-semibold capitalize leading-4 text-miru-dark-purple-1000 lg:text-base lg:leading-5">
                  {name}
                </span>
                <h3 className="text-xs font-medium leading-4 text-miru-dark-purple-400 lg:text-sm lg:leading-5">
                  {invoiceNumber}
                </h3>
              </div>
            </div>
          </Tooltip>
        </td>
        {isDesktop && (
          <td className="w-1/4 whitespace-nowrap px-4 py-5 font-medium tracking-normal lg:px-6">
            <h1 className="text-xs font-normal text-miru-dark-purple-1000 lg:text-base lg:font-semibold">
              {issueDate}
            </h1>
            <h3 className="text-xs font-medium text-miru-dark-purple-400 lg:text-sm">
              Due on {dueDate}
            </h3>
          </td>
        )}
        <td className="hidden px-2 text-right text-sm font-bold tracking-normal text-miru-dark-purple-1000 lg:table-cell lg:w-1/6 lg:px-6 lg:pt-2 lg:pb-7 lg:text-xl">
          {currencyFormat(currency, amount)}
        </td>
        <td
          className="relative px-2 text-right font-medium lg:px-6 lg:pb-10"
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          {isDesktop && (
            <MoreOptions
              invoice={invoice}
              isDesktop={isDesktop}
              isMenuOpen={isMenuOpen}
              isSending={isSending}
              isStripeEnabled={isStripeEnabled}
              setInvoiceToDelete={setInvoiceToDelete}
              setIsMenuOpen={setIsMenuOpen}
              setIsSendReminder={setIsSendReminder}
              setIsSending={setIsSending}
              setShowConnectPaymentDialog={setShowConnectPaymentDialog}
              setShowDeleteDialog={setShowDeleteDialog}
              setShowMoreOptions={setShowMoreOptions}
              showConnectPaymentDialog={showConnectPaymentDialog}
              showMoreOptions={showMoreOptions}
              showPrint={false}
              showSendLink={false}
            />
          )}
          <Badge
            className={`${getStatusCssClass(status)} uppercase`}
            text={status}
          />
          <dl className="text-right text-sm font-medium leading-5 lg:hidden">
            <dt className="mt-1">{currencyFormat(currency, amount)}</dt>
          </dl>
        </td>
        {!isDesktop && (
          <td className="text-right text-sm text-miru-dark-purple-1000">
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setShowMoreOptions(true);
              }}
            >
              <DotsThreeVerticalIcon size={26} />
            </button>
          </td>
        )}
        {(isSending || isSendReminder) &&
          isDesktop &&
          !showConnectPaymentDialog && (
            <SendInvoice
              handleSubmit={submitSendInvoice}
              invoice={invoice}
              isSendReminder={isSendReminder}
              isSending={isSending}
              setIsSendReminder={setIsSendReminder}
              setIsSending={setIsSending}
              status={sendStatus}
            />
          )}
        {!isStripeEnabled && showConnectPaymentDialog && (
          <ConnectPaymentGateway
            invoice={invoice}
            setIsSending={setIsSending}
            setShowConnectPaymentDialog={setShowConnectPaymentDialog}
            showConnectPaymentDialog={showConnectPaymentDialog}
          />
        )}
        {(isSending || isSendReminder) && !isDesktop && (
          <div
            className="absolute inset-0 z-50 flex flex-col bg-white"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex w-full bg-miru-han-purple-1000 pl-4">
              <Button
                style="ternary"
                onClick={() => {
                  if (isSendReminder) {
                    setIsSendReminder(false);
                  } else {
                    setIsSending(false);
                  }
                }}
              >
                <ArrowLeftIcon className="text-white" size={16} weight="bold" />
              </Button>
              <div className="flex h-12 w-full items-center justify-center bg-miru-han-purple-1000 px-3 text-white">
                {isSendReminder ? "Send Invoice Reminder" : "Send Invoice"}
              </div>
              <button
                className="mr-4 text-miru-gray-1000"
                type="button"
                onClick={() => {
                  if (isSendReminder) {
                    setIsSendReminder(false);
                  } else {
                    setIsSending(false);
                  }
                }}
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>
            <div className="flex flex-1">
              <SendInvoiceContainer
                handleSaveSendInvoice={null}
                invoice={invoice}
                isSendReminder={isSendReminder}
                setIsSending={setIsSending}
              />
            </div>
          </div>
        )}
      </tr>
      {!isDesktop && showMoreOptions && (
        <MoreOptions
          invoice={invoice}
          isDesktop={isDesktop}
          isMenuOpen={isMenuOpen}
          isSending={isSending}
          isStripeEnabled={isStripeEnabled}
          setInvoiceToDelete={setInvoiceToDelete}
          setIsMenuOpen={setIsMenuOpen}
          setIsSendReminder={setIsSendReminder}
          setIsSending={setIsSending}
          setShowConnectPaymentDialog={setShowConnectPaymentDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          setShowMoreOptions={setShowMoreOptions}
          showConnectPaymentDialog={showConnectPaymentDialog}
          showMoreOptions={showMoreOptions}
          showPrint={false}
          showSendLink={false}
        />
      )}
    </>
  );
};

export default TableRow;
