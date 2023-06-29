import React, { useState, useRef } from "react";

import { useOutsideClick } from "helpers";
import { useNavigate } from "react-router-dom";

import EditButton from "./EditButton";
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
}) => {
  const [isMoreOptionsVisible, setIsMoreOptionsVisible] =
    useState<boolean>(false);

  const wrapperRef = useRef(null);

  const navigate = useNavigate();

  const markInvoiceAsPaid = async (id: number) => {
    navigate(`/payments/?invoiceId=${id}`);
  };

  useOutsideClick(
    wrapperRef,
    () => setIsMoreOptionsVisible(false),
    isMoreOptionsVisible
  );

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
            setIsSendReminder={setIsSendReminder}
            wavieInvoice={wavieInvoice}
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceActions;
