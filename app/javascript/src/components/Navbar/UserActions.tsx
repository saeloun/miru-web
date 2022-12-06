import React from "react";

import { SettingIcon, SignOutIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import { activeClassName } from "./utils";

const UserActions = () => (
  <ul className="mt:auto md:mt-32">
    {/* <a>
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Bell size={26} className="mr-0 md:mr-4" /> Notification
            </li>
          </a> */}
    <li className="flex items-center justify-center hover:bg-miru-gray-100 md:justify-start">
      <NavLink
        to="/profile/edit"
        className={({ isActive }) =>
          isActive
            ? activeClassName
            : "flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6"
        }
      >
        <SettingIcon className="mr-0 md:mr-4" size={26} />
        Settings
      </NavLink>
    </li>
    {/* <a>
            <li className="flex py-3 md:px-6 px-2 items-center md:justify-start justify-center hover:bg-miru-gray-100">
              <Question size={26} className="mr-0 md:mr-4" /> Help
            </li>
          </a> */}
    <a data-method="delete" href="/users/sign_out" rel="nofollow">
      <li className="flex items-center justify-center py-3 px-2 hover:bg-miru-gray-100 md:justify-start md:px-6">
        <SignOutIcon className="mr-0 md:mr-4" size={26} />
        Logout
      </li>
    </a>
  </ul>
);

export default UserActions;
