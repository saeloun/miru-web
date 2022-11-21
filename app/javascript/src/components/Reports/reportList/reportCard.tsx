import React from "react";

import { NavLink } from "react-router-dom";

const ReportCard = ({ icon, title, description, url }) => (
  <NavLink end to={`/reports/${url}`}>
    <div className="w-128 h-[148px] rounded-lg	border-2	border-miru-gray-100 box-border	p-5 mt-5 flex hover:shadow-c1  cursor-pointer">
      <div className="w-30 h-120 bg-miru-gray-100 flex justify-center items-center rounded	">
        <img src={icon} width="31.25px" height="31.25px" />
      </div>
      <div className="pl-5">
        <div className="max-w-xs h-[27px] font-semibold	text-xl	text-miru-dark-purple-1000">
          {title}
        </div>
        <div className="max-w-xs h-[78px] text-sm	font-normal	text-miru-dark-purple-400 pt-2">
          {description}
        </div>
      </div>
    </div>
  </NavLink>
);

export default ReportCard;
