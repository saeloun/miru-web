/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { MinusIcon, PlusIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import UserInformation from "./CommonComponents/UserInformation";

const SideNav = ({ isAdmin, firstName, company, lastName }) => {
  const getActiveClassName = isActive => {
    if (isActive) {
      return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
    }

    return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
  };

  const [openedSubNav, setOpenedSubNav] = useState({
    personal: false,
    company: false,
  });

  const getAdminLinks = () => (
    <ul className="min-h-50v list-none text-sm font-medium leading-5 tracking-wider">
      <div className="flex flex-row items-center justify-between py-3 px-5">
        <span className="text-base font-bold">Personal</span>
        <button
          id="personal"
          onClick={() =>
            setOpenedSubNav({
              ...openedSubNav,
              personal: !openedSubNav.personal,
            })
          }
        >
          {openedSubNav.personal ? (
            <MinusIcon size={16} weight="bold" />
          ) : (
            <PlusIcon size={16} weight="bold" />
          )}
        </button>
      </div>
      {openedSubNav.personal && (
        <div>
          <li className="border-b-2 border-miru-gray-400 tracking-widest">
            <NavLink
              end
              className={({ isActive }) => getActiveClassName(isActive)}
              to="/profile/edit"
            >
              PROFILE SETTINGS
            </NavLink>
          </li>
        </div>
      )}
      <div className="flex flex-row items-center justify-between py-3 px-5">
        <span className="text-base font-bold">{company.name}</span>
        <button
          id="company"
          onClick={() =>
            setOpenedSubNav({ ...openedSubNav, company: !openedSubNav.company })
          }
        >
          {openedSubNav.company ? (
            <MinusIcon size={16} weight="bold" />
          ) : (
            <PlusIcon size={16} weight="bold" />
          )}
        </button>
      </div>
      {openedSubNav.company && (
        <div>
          <li className="border-b-2 border-miru-gray-400 tracking-widest">
            <NavLink
              end
              className={({ isActive }) => getActiveClassName(isActive)}
              to="/profile/edit/organization-details"
            >
              ORG. SETTINGS
            </NavLink>
          </li>
          <li className="border-b-2 border-miru-gray-400 tracking-widest">
            <NavLink
              end
              className={({ isActive }) => getActiveClassName(isActive)}
              to="/profile/edit/payment"
            >
              PAYMENT SETTINGS
            </NavLink>
          </li>
        </div>
      )}
    </ul>
  );

  const getEmployeeLinks = () => (
    <ul className="list-none text-sm font-medium leading-5 tracking-wider">
      <li className="border-b-2 border-miru-gray-400">
        <NavLink
          end
          className={({ isActive }) => getActiveClassName(isActive)}
          to="/profile/edit"
        >
          PROFILE SETTINGS
        </NavLink>
      </li>
    </ul>
  );

  return (
    <div className="flex flex-col ">
      <UserInformation firstName={firstName} lastName={lastName} />
      <div className="mt-4 h-full bg-miru-gray-100">
        {isAdmin ? getAdminLinks() : getEmployeeLinks()}
      </div>
    </div>
  );
};

export default SideNav;
