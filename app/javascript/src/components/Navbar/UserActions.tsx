import React from "react";

import { SettingIcon, SignOutIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import { activeClassName } from "./utils";

const UserActions = () => {
  const handleLogout = () => {
    window.localStorage.removeItem("filters");
  };

  return (
    <ul className="mt-auto lg:mt-32">
      <li className="flex items-center justify-center hover:bg-miru-gray-100 lg:justify-start">
        <NavLink
          to="/profile/edit"
          className={({ isActive }) =>
            isActive
              ? activeClassName
              : "flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 lg:justify-start lg:px-6"
          }
        >
          <SettingIcon className="mr-0 lg:mr-4" size={26} />
          Settings
        </NavLink>
      </li>
      <a data-method="delete" href="/users/sign_out" rel="nofollow">
        <li
          className="flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 lg:justify-start lg:px-6"
          onClick={handleLogout}
        >
          <SignOutIcon className="mr-0 lg:mr-4" size={26} />
          Logout
        </li>
      </a>
    </ul>
  );
};

export default UserActions;
