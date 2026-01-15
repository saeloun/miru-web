import React, { useState, useRef } from "react";

import { useOutsideClick } from "helpers";

import EditButton from "./EditButton";
import MarkInvoiceAsPaidModal from "./MarkInvoicePaidModal";
import SendButton from "./SendButton";

import MoreButton from "../common/MoreButton";
import MoreOptions from "../common/MoreOptions";
import { handleDownloadInvoice } from "../common/utils";

const InvoiceActions = ({
  editInvoiceLink,
  sendInvoice,
  deleteInvoice,
  wavieInvoice,
  invoice,
  setIsSendReminder,
  setShowConnectPaymentDialog,
  isStripeEnabled,
  setShowHistory,
  fetchInvoice,
}) => {
  const [isMoreOptionsVisible, setIsMoreOptionsVisible] =
    useState<boolean>(false);

  const [showInvoicePaymentModal, setShowInvoicePaymentModal] =
    useState<boolean>(false);

  const wrapperRef = useRef(null);

  const markInvoiceAsPaid = () => {
    setShowInvoicePaymentModal(true);
    setIsMoreOptionsVisible(false);
  };

  useOutsideClick(
    wrapperRef,
    () => setIsMoreOptionsVisible(false),
    isMoreOptionsVisible
  );

  const currency = invoice?.currency;
  const dateFormat = invoice?.company?.dateFormat;

  return (
    <div className="justify-items-right flex flex-row">
      <EditButton editInvoiceLink={editInvoiceLink} />
      <SendButton
        onClick={() => {
          if (isStripeEnabled) {
            sendInvoice();
          } else {
            setShowConnectPaymentDialog(true);
          }
        }}
      />
      <div ref={wrapperRef}>
        <MoreButton
          onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
        />
        {isMoreOptionsVisible && (
          <MoreOptions
            deleteInvoice={deleteInvoice}
            downloadInvoice={handleDownloadInvoice}
            invoice={invoice}
            markInvoiceAsPaid={markInvoiceAsPaid}
            sendInvoice={sendInvoice}
            setIsMoreOptionsVisible={setIsMoreOptionsVisible}
            setIsSendReminder={setIsSendReminder}
            wavieInvoice={wavieInvoice}
            showHistory={() => {
              setShowHistory(true);
              setIsMoreOptionsVisible(false);
            }}
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
      </div>
    </div>
  );
};

export default InvoiceActions;
