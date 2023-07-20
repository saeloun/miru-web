import React from "react";

import { NavLink } from "react-router-dom";

const ReportCard = ({ icon, iconHover, title, description, url }) => (
  <NavLink end className="group" to={`/reports/${url}`}>
    <div className="hover-component box-border flex cursor-pointer rounded-lg border-b-2 border-miru-gray-100 py-4 last:border-b-0 group-hover:shadow-c1 lg:mt-5 lg:border-2  lg:p-5">
      <div className="flex h-14 w-14 items-center justify-center rounded bg-gradient-to-b from-miru-report-purple-400 to-miru-report-purple-600 p-2.5 lg:h-120 lg:w-30 lg:p-0">
        <img
          className="h-9 w-9 opacity-100 group-hover:hidden group-hover:opacity-0 lg:h-20 lg:w-20"
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
        <div className="h-[78px] max-w-xs pt-1 text-xs font-medium	text-miru-dark-purple-400 lg:text-sm lg:font-normal">
          {description}
        </div>
      </div>
    </div>
  </NavLink>
);

export default ReportCard;
