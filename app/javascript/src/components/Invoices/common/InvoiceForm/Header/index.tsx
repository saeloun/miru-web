import React, { useState, useRef } from "react";

import { useOutsideClick } from "helpers";
import {
  XIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  SettingIcon,
} from "miruIcons";
import { Link } from "react-router-dom";
import { Button } from "StyledComponents";

import MoreButton from "../../MoreButton";
import MoreOptions from "../../MoreOptions";

const Header = ({
  formType = "generate",
  handleSaveInvoice,
  handleSendInvoice,
  setShowInvoiceSetting,
  invoiceNumber = null,
  id = null,
  deleteInvoice = null,
  wavieInvoice = null,
  setIsSendReminder = _value => {},
  showMoreButton = false,
  invoice = null,
  showHistory = () => {},
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
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="header__title font-bold">
          {formType == "edit"
            ? `Edit Invoice #${invoiceNumber}`
            : "Generate Invoice"}
        </h2>
        <Button
          className="ml-0 flex items-center text-xs font-bold leading-4 tracking-widest text-miru-han-purple-1000 sm:ml-5"
          style="ternary"
          onClick={() => setShowInvoiceSetting(true)}
        >
          <SettingIcon className="mr-2.5" color="#5E58F1" size={15} />
          Settings
        </Button>
      </div>
      <div className="mt-3 flex w-full flex-col gap-2 sm:mt-0 md:w-2/5 md:flex-row md:gap-0">
        <Link
          className="header__button my-0 w-full p-0 md:my-0 md:w-1/3"
          to={formType == "edit" ? `/invoices/${id}` : "/invoices"}
          type="button"
        >
          <XIcon size={12} />
          <span className="ml-2 inline-block" id="cancelEditInvoiceButton">
            CANCEL
          </span>
        </Link>
        <button
          className="header__button my-0 w-full bg-miru-han-purple-1000 p-0 text-white hover:text-white md:my-0 md:w-1/3"
          id="saveInvoiceButton"
          type="button"
          onClick={handleSaveInvoice}
        >
          <FloppyDiskIcon color="white" size={18} />
          <span className="ml-2 inline-block">SAVE</span>
        </button>
        <button
          className="header__button my-0 w-full bg-miru-han-purple-1000 p-0 text-white hover:text-white md:my-0 md:w-1/3"
          type="button"
          onClick={handleSendInvoice}
        >
          <PaperPlaneTiltIcon color="White" size={18} />
          <span className="ml-2 inline-block truncate" id="sendInvoiceButton">
            SEND TO
          </span>
        </button>
        {showMoreButton && (
          <div ref={wrapperRef}>
            <MoreButton
              onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
            />
            {isMoreOptionsVisible && (
              <MoreOptions
                deleteInvoice={deleteInvoice}
                downloadInvoice={null}
                invoice={invoice}
                markInvoiceAsPaid={() => null}
                sendInvoice={handleSendInvoice}
                setIsSendReminder={setIsSendReminder}
                showHistory={showHistory}
                wavieInvoice={wavieInvoice}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
