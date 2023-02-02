import React from "react";

import { NavLink } from "react-router-dom";

const ReportCard = ({ icon, iconHover, title, description, url }) => (
  <NavLink end className="group" to={`/reports/${url}`}>
    <div className="hover-component mt-5 box-border flex cursor-pointer	rounded-lg border-2 border-miru-gray-100 p-5  group-hover:shadow-c1">
      <div className="flex items-center justify-center rounded bg-gradient-to-b from-miru-report-purple-400 to-miru-report-purple-600 p-3 lg:h-120 lg:w-30 lg:p-0">
        <img
          className="opacity-100 group-hover:hidden group-hover:opacity-0"
          src={icon}
        />
        <img
          className="hidden opacity-0 group-hover:block group-hover:opacity-100"
          src={iconHover}
        />
      </div>
      <div className="pl-5">
        <div className="h-[27px] max-w-xs text-base font-semibold text-miru-dark-purple-1000	group-hover:text-miru-han-purple-1000 lg:text-xl">
          {title}
        </div>
        <div className="h-[78px] max-w-xs pt-2 text-xs font-medium	text-miru-dark-purple-400 lg:text-sm lg:font-normal">
          {description}
        </div>
      </div>
    </div>
  </NavLink>
);

export default ReportCard;
