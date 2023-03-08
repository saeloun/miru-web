import React from "react";

import { NavLink } from "react-router-dom";

const getActiveClassName = isActive => {
  if (isActive) {
    return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
  }

  return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
};

export const TeamUrl = ({ urlList }) => (
  <div className="h-full w-full bg-white">
    <ul className="list-none text-sm font-medium leading-5 tracking-wider">
      {urlList.map((item, index) => (
        <li className="border-b-2 border-miru-gray-400" key={index}>
          <NavLink
            end
            className={({ isActive }) => getActiveClassName(isActive)}
            to={item.url}
          >
            {item.text}
          </NavLink>
        </li>
      ))}
    </ul>
  </div>
);
