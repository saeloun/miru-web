import React, { useState, useRef } from "react";

import { useOutsideClick } from "helpers";

import EditButton from "./EditButton";
import SendButton from "./SendButton";

import MoreButton from "../common/MoreButton";
import MoreOptions from "../common/MoreOptions";
import { handleDownloadInvoice } from "../common/utils";

const InvoiceActions = ({
  editInvoiceLink,
  sendInvoice,
  deleteInvoice,
  invoice,
}) => {
  const [isMoreOptionsVisible, setIsMoreOptionsVisible] =
    useState<boolean>(false);

  const wrapperRef = useRef(null);

  useOutsideClick(
    wrapperRef,
    () => setIsMoreOptionsVisible(false),
    isMoreOptionsVisible
  );

  return (
    <div className="justify-items-right flex flex-row">
      <EditButton editInvoiceLink={editInvoiceLink} />
      <SendButton onClick={sendInvoice} />
      <div ref={wrapperRef}>
        <MoreButton
          onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
        />
        {isMoreOptionsVisible && (
          <MoreOptions
            deleteInvoice={deleteInvoice}
            downloadInvoice={handleDownloadInvoice}
            invoice={invoice}
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceActions;
