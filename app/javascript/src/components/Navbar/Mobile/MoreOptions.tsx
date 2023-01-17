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

const MoreOptions = ({ setVisiblity, setSelectedTab }) => {
  const { user, isAdminUser } = useUserContext();

  return (
    <SidePanel WrapperClassname="pt-13 pb-16" setFilterVisibilty={setVisiblity}>
      <SidePanel.Body
        className={`flex h-full w-full flex-col items-start ${
          isAdminUser ? "justify-between" : "justify-start"
        }`}
      >
        <div className="w-full">
          <UserInfo user={user} />
          <ul className="w-full px-4" onClick={() => setVisiblity(false)}>
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
