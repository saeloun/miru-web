import React, { Fragment } from "react";

import { TOASTER_DURATION } from "constants/index";

import { XIcon, FloppyDiskIcon, PaperPlaneTiltIcon, SettingIcon } from "miruIcons";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const Header = ({
  formType = "generate",
  handleSaveInvoice,
  handleSendInvoice,
  setShowInvoiceSetting,
  invoiceNumber = null,
  id = null
}) => (
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
            <SettingIcon size={15} className="text-col-han-app-1000 mr-2.5" />
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
          <XIcon size={12} />
          <span className="ml-2 inline-block">CANCEL</span>
        </Link>
        <button
          type="button"
          className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
          onClick={handleSaveInvoice}
          data-cy='save-invoice'
        >
          <FloppyDiskIcon size={18} color="white" />
          <span className="ml-2 inline-block">SAVE</span>
        </button>
        <button
          type="button"
          onClick={handleSendInvoice}
          className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
        >
          <PaperPlaneTiltIcon size={18} color="White" />
          <span className="ml-2 inline-block" data-cy="send-invoice">SEND TO</span>
        </button>
      </div>
    </div>
  </Fragment>
);

export default Header;
