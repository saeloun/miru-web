import React, { useState, Fragment } from "react";

import { DotsThreeVerticalIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import MoreOptions from "./MoreOptions";

import { mobileActiveClassName, MobileMenuOptions } from "../utils";

const Navigation = ({ isAdminUser, setSelectedTab }) => {
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  return (
    <Fragment>
      <ul className="fixed bottom-0 left-0 right-0 z-50 flex h-14 justify-between bg-white px-3 shadow-c1">
        <MobileMenuOptions
          from={0}
          isAdminUser={isAdminUser}
          setSelectedTab={setSelectedTab}
          to={4}
        />
        <li
          className="flex items-center p-2"
          onClick={() => setSelectedTab("More")}
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? mobileActiveClassName
                : "flex flex-col items-center justify-center text-xs"
            }
            onClick={() => setShowMoreOptions(true)}
          >
            <DotsThreeVerticalIcon size={26} /> More
          </NavLink>
        </li>
      </ul>
      {showMoreOptions && (
        <MoreOptions
          setSelectedTab={setSelectedTab}
          setVisiblity={setShowMoreOptions}
        />
      )}
    </Fragment>
  );
};
export default Navigation;
