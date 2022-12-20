import React from "react";

import { SidePanel } from "StyledComponents";

import Header from "./Header";

import UserActions from "../UserActions";
import {
  navAdminOptions,
  navEmployeeOptions,
  MobileMenuOptions,
} from "../utils";

const MoreOptions = ({ isAdminUser, setVisiblity, setSelectedTab }) => (
  <SidePanel setFilterVisibilty={setVisiblity}>
    <SidePanel.Header className="w-full">
      <Header selectedTab="More Options" />
    </SidePanel.Header>
    <SidePanel.Body className="flex flex-col" hasFooter={false}>
      <ul className="h-full w-full pt-14" onClick={() => setVisiblity(false)}>
        <MobileMenuOptions
          from={4}
          isAdminUser={isAdminUser}
          setSelectedTab={setSelectedTab}
          to={isAdminUser ? navAdminOptions.length : navEmployeeOptions.length}
        />
      </ul>
      <UserActions />
    </SidePanel.Body>
  </SidePanel>
);

export default MoreOptions;
