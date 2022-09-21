import React from "react";

import { X, FloppyDisk, PaperPlaneTilt } from "phosphor-react";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const Header = ({ invoiceNumber, id, updateInvoice }) => (
  <React.Fragment>
    <ToastContainer />
    <div className="sm:flex mt-6 mb-3 sm:items-center sm:justify-between">
      <h2 className="header__title font-bold">Edit Invoice #{invoiceNumber}</h2>
      <div className="flex w-2/5">
        <Link
          to={`/invoices/${id}`}
          type="button"
          className="header__button w-1/3 p-0"
        >
          <X size={12} />
          <span className="ml-2 inline-block">CANCEL</span>
        </Link>
        <button
          type="button"
          className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
          onClick={updateInvoice}
          data-cy='save-invoice-edit'
        >
          <FloppyDisk size={18} color="white" />
          <span className="ml-2 inline-block">SAVE</span>
        </button>
        <button
          type="button"
          className="header__button bg-miru-han-purple-1000 text-white w-1/3 p-0 hover:text-white"
        >
          <PaperPlaneTilt size={18} color="White" />
          <span className="ml-2 inline-block">SEND TO</span>
        </button>
      </div>
    </div>
  </React.Fragment>
);

export default Header;
