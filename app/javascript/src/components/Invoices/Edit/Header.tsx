import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ArrowLeft } from "phosphor-react";
import { X, FloppyDisk, PaperPlaneTilt } from "phosphor-react";

const Header = ({ invoiceNumber, id }) => (
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
        >
          <FloppyDisk size={18} color="white" />
          <span className="ml-2 inline-block">SAVE</span>
        </button>
      </div>
    </div>
  </React.Fragment>
);

export default Header;
