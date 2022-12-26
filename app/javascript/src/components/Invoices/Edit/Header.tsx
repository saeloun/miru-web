import React, { Fragment } from "react";

import { XIcon, FloppyDiskIcon, PaperPlaneTiltIcon } from "miruIcons";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const Header = ({ invoiceNumber, id, updateInvoice }) => (
  <Fragment>
    <ToastContainer />
    <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
      <h2 className="header__title font-bold">Edit Invoice #{invoiceNumber}</h2>
      <div className="flex w-2/5">
        <Link
          className="header__button w-1/3 p-0"
          to={`/invoices/${id}`}
          type="button"
        >
          <XIcon size={12} />
          <span className="ml-2 inline-block">CANCEL</span>
        </Link>
        <button
          className="header__button w-1/3 bg-miru-han-purple-1000 p-0 text-white hover:text-white"
          data-cy="save-invoice-edit"
          type="button"
          onClick={updateInvoice}
        >
          <FloppyDiskIcon color="white" size={18} />
          <span className="ml-2 inline-block">SAVE</span>
        </button>
        <button
          className="header__button w-1/3 bg-miru-han-purple-1000 p-0 text-white hover:text-white"
          type="button"
        >
          <PaperPlaneTiltIcon color="White" size={18} />
          <span className="ml-2 inline-block">SEND TO</span>
        </button>
      </div>
    </div>
  </Fragment>
);

export default Header;
