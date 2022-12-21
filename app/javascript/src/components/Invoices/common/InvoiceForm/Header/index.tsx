import React, { Fragment, useState, useRef } from "react";

import { useOutsideClick } from "helpers";
import {
  XIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  SettingIcon,
} from "miruIcons";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { TOASTER_DURATION } from "constants/index";

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
    <Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex">
          <h2 className="header__title font-bold">
            {formType == "edit"
              ? `Edit Invoice #${invoiceNumber}`
              : "Generate Invoice"}
          </h2>
          {formType == "generate" && (
            <button
              className="ml-5 flex items-center text-xs font-bold leading-4 tracking-widest text-miru-han-purple-1000"
              onClick={() => setShowInvoiceSetting(true)}
            >
              <SettingIcon className="mr-2.5" color="#5B34EA" size={15} />
              SETTINGS
            </button>
          )}
        </div>
        <div className="flex flex-col md:w-2/5 md:flex-row">
          <Link
            className="header__button my-1 p-0 md:my-0 md:w-1/3"
            to={formType == "edit" ? `/invoices/${id}` : "/invoices"}
            type="button"
          >
            <XIcon size={12} />
            <span className="ml-2 inline-block">CANCEL</span>
          </Link>
          <button
            className="header__button my-1 bg-miru-han-purple-1000 p-0 text-white hover:text-white md:my-0 md:w-1/3"
            data-cy="save-invoice"
            type="button"
            onClick={handleSaveInvoice}
          >
            <FloppyDiskIcon color="white" size={18} />
            <span className="ml-2 inline-block">SAVE</span>
          </button>
          <button
            className="header__button my-1 bg-miru-han-purple-1000 p-0 text-white hover:text-white md:my-0 md:w-1/3"
            type="button"
            onClick={handleSendInvoice}
          >
            <PaperPlaneTiltIcon color="White" size={18} />
            <span className="ml-2 inline-block" data-cy="send-invoice">
              SEND TO
            </span>
          </button>
          <div ref={wrapperRef}>
            <MoreButton
              onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
            />
            {isMoreOptionsVisible && (
              <MoreOptions
                deleteInvoice={deleteInvoice}
                downloadInvoice={null}
              />
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Header;
