import React, { Fragment, useState, useRef } from "react";

import { TOASTER_DURATION } from "constants/index";

import { useOutsideClick } from "helpers";
import { X, FloppyDisk, PaperPlaneTilt, Gear } from "phosphor-react";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import MoreButton from "../../MoreButton";
import MoreOptions from "../../MoreOptions";

const Header = ({
  formType = "generate",
  handleSaveInvoice,
  handleSendInvoice,
  setShowInvoiceSetting,
  invoiceNumber = null,
  id = null,
  deleteInvoice = null
}) => {

  const [isMoreOptionsVisible, setMoreOptionsVisibility] = useState<boolean>(false);
  const wrapperRef = useRef(null);

  useOutsideClick(
    wrapperRef,
    () => setMoreOptionsVisibility(false),
    isMoreOptionsVisible
  );

  return (
    <Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
        <div className="flex">
          <h2 className="header__title font-bold">{formType == "edit" ?  `Edit Invoice #${invoiceNumber}`: "Generate Invoice"}</h2>

          {formType == "generate" &&
          <button
            onClick={() => setShowInvoiceSetting(true)}
            className="font-bold text-xs text-miru-han-purple-1000 tracking-widest leading-4 flex items-center ml-5"
          >
            <Gear size={15} color="#5B34EA" className="mr-2.5" />
              SETTINGS
          </button>
          }
        </div>
        <div className="flex w-2/5">
          <Link
            to={formType == "edit" ? `/invoices/${id}`: "/invoices"}
            type="button"
            className="header__button w-1/3 p-0"
          >
            <X size={12} />
            <span className="ml-2 inline-block">CANCEL</span>
          </Link>
          <button
            type="button"
            className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
            onClick={handleSaveInvoice}
            data-cy='save-invoice'
          >
            <FloppyDisk size={18} color="white" />
            <span className="ml-2 inline-block">SAVE</span>
          </button>
          <button
            type="button"
            onClick={handleSendInvoice}
            className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
          >
            <PaperPlaneTilt size={18} color="White" />
            <span className="ml-2 inline-block" data-cy="send-invoice">SEND TO</span>
          </button>
          <div ref={wrapperRef}>
            <MoreButton
              onClick={() => setMoreOptionsVisibility(!isMoreOptionsVisible)}
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
  );};

export default Header;
