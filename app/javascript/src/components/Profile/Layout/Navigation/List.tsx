import React from "react";

import { NavLink } from "react-router-dom";

const getActiveClassName = isActive => {
  if (isActive) {
    return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block w-full flex items-center";
  }

  return "pl-6 py-5 border-b-1 border-miru-gray-400 block w-full flex items-center";
};

const List = ({ settingsList, companyRole }) => (
  <ul className="list-none text-sm font-medium leading-5 tracking-wider">
    {settingsList.map((setting, index) => {
      if (
        setting.isNavigationTab &&
        setting.authorisedRoles.includes(companyRole)
      ) {
        return (
          <li className="border-b-2 border-miru-gray-400" key={index}>
            <NavLink
              end
              className={({ isActive }) => getActiveClassName(isActive)}
              to={setting.path}
            >
              {setting.icon}
              {setting.label}
            </NavLink>
          </li>
        );
      }
    })}
  </ul>
);

export default List;
