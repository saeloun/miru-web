import React from "react";

import { SidePanel } from "StyledComponents";

import { useUserContext } from "context/UserContext";

import UserActions from "../UserActions";
import UserInfo from "../UserInfo";
import {
  navAdminOptions,
  navEmployeeOptions,
  MobileMenuOptions,
} from "../utils";

const MoreOptions = ({ isAdminUser, setVisiblity, setSelectedTab }) => {
  const { user } = useUserContext();

  return (
    <SidePanel WrapperClassname="pt-13 pb-16" setFilterVisibilty={setVisiblity}>
      <SidePanel.Body
        className="flex h-full w-full flex-col items-start justify-between"
        hasFooter={false}
      >
        <div className="w-full">
          <UserInfo user={user} />
          <ul className="w-full" onClick={() => setVisiblity(false)}>
            <MobileMenuOptions
              from={4}
              isAdminUser={isAdminUser}
              setSelectedTab={setSelectedTab}
              to={
                isAdminUser ? navAdminOptions.length : navEmployeeOptions.length
              }
            />
          </ul>
        </div>
        <UserActions />
      </SidePanel.Body>
    </SidePanel>
  );
};

export default MoreOptions;
