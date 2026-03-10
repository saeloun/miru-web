import React from "react";

import { XIcon, FloppyDiskIcon, PaperPlaneTiltIcon } from "miruIcons";
import { Link } from "react-router-dom";

const Header = ({ invoiceNumber, id, updateInvoice }) => (
  <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
    <h2 className="header__title font-bold">Edit Invoice #{invoiceNumber}</h2>
    <div className="mt-3 flex w-full flex-col gap-2 sm:mt-0 sm:w-2/5 sm:flex-row sm:gap-0">
      <Link
        className="header__button w-full p-0 sm:w-1/3"
        to={`/invoices/${id}`}
        type="button"
      >
        <XIcon size={12} />
        <span className="ml-2 inline-block">CANCEL</span>
      </Link>
      <button
        className="header__button w-full bg-primary p-0 text-white hover:text-white sm:w-1/3"
        type="button"
        onClick={updateInvoice}
      >
        <FloppyDiskIcon color="white" size={18} />
        <span className="ml-2 inline-block">SAVE</span>
      </button>
      <button
        className="header__button w-full bg-primary p-0 text-white hover:text-white sm:w-1/3"
        type="button"
      >
        <PaperPlaneTiltIcon color="White" size={18} />
        <span className="ml-2 inline-block">SEND TO</span>
      </button>
    </div>
  </div>
);

export default Header;
