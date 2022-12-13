/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { NavLink } from "react-router-dom";

const profile = require("../../../../assets/images/avatar_payments.svg");

const SideNav = ({ isAdmin, firstName, company, lastName, email }) => {
  const getActiveClassName = isActive => {
    if (isActive) {
      return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
    }

    return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
  };

  const getAdminLinks = () => (
    <ul className="list-none text-sm font-medium leading-5 tracking-wider">
      <p className="mt-3 ml-4 text-base font-bold">Personal</p>
      <li className="mt-4 border-b-2 border-miru-gray-400">
        <NavLink
          end
          className={({ isActive }) => getActiveClassName(isActive)}
          to="/profile/edit"
        >
          PROFILE SETTINGS
        </NavLink>
      </li>
      <li className="border-b-2 border-miru-gray-400">
        {/* <NavLink
          to="/profile/edit/bank_account_details"
          type="li"
          className={({ isActive }) => getActiveClassName(isActive)}
        >
          BANK ACCOUNT DETAILS
        </NavLink> TODO: Temporary disabling*/}
      </li>
      <p className="mt-5 ml-4 text-base font-bold">{company.name}</p>
      <li className="mt-4 border-b-2 border-miru-gray-400">
        <NavLink
          end
          className={({ isActive }) => getActiveClassName(isActive)}
          to="/profile/edit/organization"
        >
          ORGANIZATION SETTINGS
        </NavLink>
      </li>
      <li className="border-b-2 border-miru-gray-400">
        <NavLink
          end
          className={({ isActive }) => getActiveClassName(isActive)}
          to="/profile/edit/payment"
        >
          PAYMENT SETTINGS
        </NavLink>
      </li>
      <li className="border-b-2 border-miru-gray-400">
        <NavLink
          end
          className={({ isActive }) => getActiveClassName(isActive)}
          to="/profile/edit/billing"
        >
          BILLING
        </NavLink>
      </li>
      <li className="border-b-2 border-miru-gray-400">
        {/* <NavLink end to="/profile/edit/import" className={({ isActive }) => getActiveClassName(isActive)}>
          IMPORT
        </NavLink> */}
      </li>
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
      <div className="mr-2 flex h-16 w-60 items-center bg-miru-han-purple-1000 p-4 text-white">
        <img className="mr-2" src={profile} />
        <div className="flex flex-col overflow-x-auto">
          <span className="pt-1 text-base font-bold leading-5">{`${firstName} ${lastName}`}</span>
          <span className="text-xs font-normal leading-4">{email}</span>
        </div>
      </div>
      <div className="mr-2 mt-4 h-full w-60 bg-miru-gray-100">
        {isAdmin ? getAdminLinks() : getEmployeeLinks()}
      </div>
    </div>
  );
};

export default SideNav;
