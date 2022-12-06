import React, { useState } from "react";

import { DotsThreeVerticalIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import MoreOptions from "./MoreOptions";

import { navAdminOptions, navEmployeeOptions } from "../utils";

const Navigation = ({ isAdminUser, setSelectedTab }) => {
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  const activeClassName =
    "flex flex-col items-center justify-center text-miru-han-purple-1000 font-bold text-xs";

  return (
    <>
      <ul className="fixed bottom-0 left-0 right-0 flex h-20 justify-between bg-white px-3 shadow-c1">
        {isAdminUser
          ? navAdminOptions.slice(0, 4).map((option, index) => (
              <li
                className="flex items-center justify-center p-2 hover:bg-miru-gray-100"
                key={index}
                onClick={() => setSelectedTab(option.label)}
              >
                <NavLink
                  data-cy={option.dataCy}
                  to={option.path}
                  className={({ isActive }) =>
                    isActive
                      ? activeClassName
                      : "flex flex-col items-center justify-center text-xs hover:bg-miru-gray-100"
                  }
                >
                  {option.logo} {option.label}
                </NavLink>
              </li>
            ))
          : navEmployeeOptions.slice(0, 4).map((option, index) => (
              <li
                className="flex items-center p-2 hover:bg-miru-gray-100"
                key={index}
                onClick={() => setSelectedTab(option.label)}
              >
                <NavLink
                  data-cy={option.dataCy}
                  to={option.path}
                  className={({ isActive }) =>
                    isActive
                      ? activeClassName
                      : "flex flex-col items-center justify-center text-xs hover:bg-miru-gray-100"
                  }
                >
                  /{option.logo} {option.label}
                </NavLink>
              </li>
            ))}
        <li
          className="flex items-center p-2 hover:bg-miru-gray-100"
          onClick={() => setSelectedTab("More")}
        >
          <NavLink
            to=""
            className={({ isActive }) =>
              isActive
                ? activeClassName
                : "flex flex-col items-center justify-center text-xs hover:bg-miru-gray-100"
            }
            onClick={() => setShowMoreOptions(true)}
          >
            <DotsThreeVerticalIcon size={26} /> More
          </NavLink>
        </li>
      </ul>
      {showMoreOptions && (
        <MoreOptions
          isAdminUser={isAdminUser}
          setSelectedTab={setSelectedTab}
          setVisiblity={setShowMoreOptions}
        />
      )}
    </>
  );
};
export default Navigation;
