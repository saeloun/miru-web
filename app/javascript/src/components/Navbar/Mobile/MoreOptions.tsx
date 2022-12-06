import React from "react";

import { NavLink } from "react-router-dom";
import { SidePanel } from "StyledComponents";

import Header from "./Header";

import UserActions from "../UserActions";
import { navAdminOptions, navEmployeeOptions } from "../utils";

const MoreOptions = ({ isAdminUser, setVisiblity, setSelectedTab }) => (
  <SidePanel setFilterVisibilty={setVisiblity}>
    <SidePanel.Header className="w-full">
      <Header selectedTab="More Options" />
    </SidePanel.Header>
    <SidePanel.Body className="flex flex-col" hasFooter={false}>
      <ul className="h-full w-full pt-14" onClick={() => setVisiblity(false)}>
        {isAdminUser
          ? navAdminOptions
              .slice(4, navAdminOptions.length)
              .map((option, index) => (
                <li
                  className="flex items-center justify-center p-2 hover:bg-miru-gray-100"
                  key={index}
                  onClick={() => setSelectedTab(option.label)}
                >
                  <NavLink
                    className="flex items-center justify-center text-xs hover:bg-miru-gray-100"
                    data-cy={option.dataCy}
                    to={option.path}
                  >
                    {option.logo} {option.label}
                  </NavLink>
                </li>
              ))
          : navEmployeeOptions
              .slice(4, navAdminOptions.length)
              .map((option, index) => (
                <li
                  className="flex items-center justify-center p-2 hover:bg-miru-gray-100"
                  key={index}
                  onClick={() => setSelectedTab(option.label)}
                >
                  <NavLink
                    className="flex flex-col items-center justify-center text-xs hover:bg-miru-gray-100"
                    data-cy={option.dataCy}
                    to={option.path}
                  >
                    {option.logo} {option.label}
                  </NavLink>
                </li>
              ))}
      </ul>
      <UserActions />
    </SidePanel.Body>
  </SidePanel>
);

export default MoreOptions;
