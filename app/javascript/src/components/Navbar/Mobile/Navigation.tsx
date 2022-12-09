import React, { useState } from "react";

import { DotsThreeVerticalIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import MoreOptions from "./MoreOptions";

import { mobileActiveClassName, MobileMenuOptions } from "../utils";

const Navigation = ({ isAdminUser, setSelectedTab }) => {
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  return (
    <>
      <ul className="fixed bottom-0 left-0 right-0 flex h-20 justify-between bg-white px-3 shadow-c1">
        <MobileMenuOptions
          from={0}
          isAdminUser={isAdminUser}
          setSelectedTab={setSelectedTab}
          to={4}
        />
        <li
          className="flex items-center p-2 hover:bg-miru-gray-100"
          onClick={() => setSelectedTab("More")}
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? mobileActiveClassName
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
