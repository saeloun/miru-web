import React from "react";

import { NavLink } from "react-router-dom";

const getActiveClassName = isActive => {
  if (isActive) {
    return "flex w-full items-center gap-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 text-lg font-bold text-indigo-700 border-l-4 border-indigo-500 shadow-md transform scale-105 transition-all duration-200";
  }

  return "flex w-full items-center gap-4 rounded-lg px-6 py-4 text-lg font-semibold text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-indigo-600 hover:shadow-md hover:transform hover:translate-x-1";
};

const List = ({ settingsList, companyRole }) => (
  <nav className="space-y-3">
    {settingsList.map((setting, index) => {
      if (setting.isTab && setting.authorisedRoles.includes(companyRole)) {
        return (
          <NavLink
            end
            className={({ isActive }) => getActiveClassName(isActive)}
            key={index}
            to={`/settings/${setting.path}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400 text-white shadow-sm">
              {React.cloneElement(setting.icon, {
                size: 26,
                weight: "bold",
                color: "white",
              })}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">
                {setting.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                {setting.category === "personal"
                  ? "Personal Setting"
                  : "Organization Setting"}
              </span>
            </div>
          </NavLink>
        );
      }
    })}
  </nav>
);

export default List;
