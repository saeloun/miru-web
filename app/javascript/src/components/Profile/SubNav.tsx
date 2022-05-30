/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";
import { NavLink } from "react-router-dom";

const profile = require("../../../../assets/images/avatar_payments.svg");

const SideNav = ({ isAdmin, firstName, lastName, email }) => {
  const getActiveClassName = (isActive) => {
    if (isActive) {
      return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block";
    }
    return "pl-6 py-5 border-b-1 border-miru-gray-400 block";
  };

  const getAdminLinks = () => (
    <ul className='list-none text-sm font-medium leading-5 tracking-wider'>
      <p className='font-bold text-base mt-3 ml-4'>Personal</p>
      <li className='border-b-2 border-miru-gray-400 mt-4'>
        <NavLink end to="/profile/edit" className={({ isActive }) => getActiveClassName(isActive)}>
          PROFILE SETTINGS
        </NavLink>
      </li>
      <li className='border-b-2 border-miru-gray-400'>
        <NavLink
          to="/profile/edit/billing"
          type="li"
          className={({ isActive }) => getActiveClassName(isActive)}
        >
          BILLING
        </NavLink>
      </li>
      <h4>Saeloun Inc</h4>
      <li className='border-b-2 border-miru-gray-400'>
        <NavLink end to="/profile/edit/organization" className={({ isActive }) => getActiveClassName(isActive)}>
          ORGANIZATION SETTINGS
        </NavLink>
      </li>
      <li className='border-b-2 border-miru-gray-400'>
        <NavLink end to="/profile/edit/paymentsettings" className={({ isActive }) => getActiveClassName(isActive)}>
          PAYMENT SETTINGS
        </NavLink>
      </li>
      <li className='border-b-2 border-miru-gray-400'>
        <NavLink end to="/profile/edit/billing" className={({ isActive }) => getActiveClassName(isActive)}>
          BILLING
        </NavLink>
      </li>
    </ul>
  );

  const getEmployeeLinks = () => (
    <ul className='list-none text-sm font-medium leading-5 tracking-wider'>
      <li className='border-b-2 border-miru-gray-400'>
        <NavLink end to="/profile/edit" className={({ isActive }) => getActiveClassName(isActive)}>
          PROFILE SETTINGS
        </NavLink>
      </li>
      <li className='border-b-2 border-miru-gray-400'>
        <NavLink
          to="/profile/edit/billing"
          type="li"
          className={({ isActive }) => getActiveClassName(isActive)}
        >
          BILLING
        </NavLink>
      </li>
    </ul>
  );

  return (
    <div className='flex flex-col '>
      <div className='mr-2 w-60 h-16 p-4 bg-miru-han-purple-1000 flex text-white items-center'>
        <img src={profile} className='mr-2' />
        <div className='flex flex-col'>
          <span className='font-bold text-base leading-5 pt-1'>{`${firstName} ${lastName}`}</span>
          <span className='font-normal text-xs leading-4'>{email}</span>
        </div>
      </div>

      <div className='mr-2 mt-4 w-60 bg-miru-gray-100 h-full'>
        { isAdmin ? getAdminLinks() : getEmployeeLinks() }
      </div>
    </div>
  );
};

export default SideNav;
