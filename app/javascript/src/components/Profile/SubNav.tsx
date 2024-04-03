/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useState } from "react";

import { MinusIcon, PlusIcon } from "miruIcons";
import { NavLink } from "react-router-dom";

import { useUserContext } from "context/UserContext";

import UserInformation from "./CommonComponents/UserInformation";
import { companySettingsList, personalSettingsList } from "./constants";

const SubNav = ({ isAdmin, firstName, company, lastName, designation }) => {
  const { companyRole } = useUserContext();

  const getActiveClassName = isActive => {
    if (isActive) {
      return "pl-4 py-5 border-l-8 border-miru-han-purple-600 bg-miru-gray-200 text-miru-han-purple-600 block w-full flex items-center";
    }

    return "pl-6 py-5 border-b-1 border-miru-gray-400 block w-full flex items-center";
  };

  const [openedSubNav, setOpenedSubNav] = useState({
    personal: true,
    company: false,
  });

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
        <ul>
          {personalSettingsList.map((setting, index) => {
            if (setting.authorisedRoles.includes(companyRole)) {
              return (
                <li
                  className="border-b-2 border-miru-gray-400 tracking-widest"
                  key={index}
                >
                  <SideBarNavItem
                    icon={setting.icon}
                    label={setting.label}
                    link={setting.link}
                  />
                </li>
              );
            }
          })}
        </ul>
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
        <ul>
          {companySettingsList.map((setting, index) => {
            if (setting.authorisedRoles.includes(companyRole)) {
              return (
                <li
                  className="flex items-center justify-start border-b-2 border-miru-gray-400 tracking-widest"
                  key={index}
                >
                  <SideBarNavItem
                    icon={setting.icon}
                    label={setting.label}
                    link={setting.link}
                  />
                </li>
              );
            }
          })}
        </ul>
      )}
    </ul>
  );

  const getEmployeeLinks = () => (
    <ul className="list-none text-sm font-medium leading-5 tracking-wider">
      {personalSettingsList.map((setting, index) => {
        if (setting.authorisedRoles.includes(companyRole)) {
          return (
            <li
              className="border-b-2 border-miru-gray-400 tracking-widest"
              key={index}
            >
              <SideBarNavItem
                icon={setting.icon}
                label={setting.label}
                link={setting.link}
              />
            </li>
          );
        }
      })}
    </ul>
  );

  const SideBarNavItem = ({ label, link, icon }) => (
    <NavLink
      end
      className={({ isActive }) => getActiveClassName(isActive)}
      to={link}
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-full flex-col">
      <UserInformation
        designation={designation}
        firstName={firstName}
        lastName={lastName}
      />
      <div className="mt-4 h-full bg-miru-gray-100">
        {isAdmin ? getAdminLinks() : getEmployeeLinks()}
      </div>
    </div>
  );
};

export default SubNav;
