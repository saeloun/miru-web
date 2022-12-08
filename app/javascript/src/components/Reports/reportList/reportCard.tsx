import React from "react";

import { NavLink } from "react-router-dom";

const ReportCard = ({ icon, title, description, url }) => (
  <NavLink end to={`/reports/${url}`}>
    <div className="mt-5 box-border flex	h-[148px]	w-128 cursor-pointer	rounded-lg border-2 border-miru-gray-100 p-5  hover:shadow-c1">
      <div className="flex h-120 w-30 items-center justify-center rounded bg-miru-gray-100	">
        <img height="31.25px" src={icon} width="31.25px" />
      </div>
      <div className="pl-5">
        <div className="h-[27px] max-w-xs text-xl	font-semibold	text-miru-dark-purple-1000">
          {title}
        </div>
        <div className="h-[78px] max-w-xs pt-2	text-sm	font-normal text-miru-dark-purple-400">
          {description}
        </div>
      </div>
    </div>
  </NavLink>
);

export default ReportCard;
