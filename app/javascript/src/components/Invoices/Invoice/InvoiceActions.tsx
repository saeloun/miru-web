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
  invoice
}) => {
  const [isMoreOptionsVisible, setMoreOptionsVisibility] =
    useState<boolean>(false);

  const wrapperRef = useRef(null);

  useOutsideClick(
    wrapperRef,
    () => setMoreOptionsVisibility(false),
    isMoreOptionsVisible
  );

  return (
    <>
      <div className="flex flex-row justify-items-right">
        <EditButton editInvoiceLink={editInvoiceLink} />
        <SendButton onClick={sendInvoice} />
        <div ref={wrapperRef}>
          <MoreButton
            onClick={() => setMoreOptionsVisibility(!isMoreOptionsVisible)}
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
    </>
  );
};

export default InvoiceActions;
