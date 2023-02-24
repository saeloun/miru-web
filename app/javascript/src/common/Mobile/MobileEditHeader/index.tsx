import React from "react";

import { Link } from "react-router-dom";

import BackButton from "components/Invoices/Invoice/BackButton";

export const MobileEditHeader = ({
  wrapperClassName = "w-full flex flex-row items-center justify-between h-12 shadow-c1 fixed z-15 fixed",
  title = "",
  backHref,
  href,
}) => (
  <div className={wrapperClassName}>
    <div className="flex flex-row items-center">
      <BackButton href={backHref} />
      <span>{title}</span>
    </div>
    <div className="items-center pr-3 font-bold text-miru-han-purple-1000">
      <Link to={href}>Edit</Link>
    </div>
  </div>
);
