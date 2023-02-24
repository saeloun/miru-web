import React from "react";

import { X } from "phosphor-react";
import { Link } from "react-router-dom";

export const MobileDetailsHeader = ({
  wrapperClassName = "w-full flex flex-row text-center justify-center items-center h-12 text-white bg-miru-han-purple-1000 fixed z-15",
  title = "",
  href,
}) => (
  <div className={wrapperClassName}>
    <span>{title}</span>
    <div className="absolute right-0 items-center pr-3 font-bold text-white">
      <Link to={href}>
        <X className="" color="#FFFFFF" size={16} weight="bold" />
      </Link>
    </div>
  </div>
);
