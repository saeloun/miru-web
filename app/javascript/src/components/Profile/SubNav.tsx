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
    personal: true,
    company: false,
  });

  const companySettingsList = [
    { label: "ORG. SETTINGS", link: "/profile/edit/organization-details" },
    { label: "PAYMENT SETTINGS", link: "/profile/edit/payment" },
    { label: "LEAVES", link: "/profile/edit/leaves" },
    { label: "HOLIDAYS", link: "/profile/edit/holidays" },
  ];

  const getAdminLinks = () => (
    <ul className="list-none min-h-50v text-sm font-medium leading-5 tracking-wider">
      <div
        className="flex cursor-pointer flex-row items-center justify-between py-3 px-5"
        onClick={() =>
          setOpenedSubNav({
            ...openedSubNav,
            personal: !openedSubNav.personal,
          })
        }
      >
        <span className="text-base font-bold">Personal</span>
        <button id="personal">
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
      <div
        className="flex cursor-pointer flex-row items-center justify-between py-3 px-5"
        onClick={() =>
          setOpenedSubNav({ ...openedSubNav, company: !openedSubNav.company })
        }
      >
        <span className="text-base font-bold">{company.name}</span>
        <button id="company">
          {openedSubNav.company ? (
            <MinusIcon size={16} weight="bold" />
          ) : (
            <PlusIcon size={16} weight="bold" />
          )}
        </button>
      </div>
      {openedSubNav.company && (
        <div>
          {companySettingsList.map((setting, index) => (
            <li
              className="border-b-2 border-miru-gray-400 tracking-widest"
              key={index}
            >
              <NavLink
                end
                className={({ isActive }) => getActiveClassName(isActive)}
                to={setting.link}
              >
                {setting.label}
              </NavLink>
            </li>
          ))}
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
