import React from "react";

import { useUserContext } from "context/UserContext";
import { SidePanel } from "StyledComponents";

import UserActions from "../UserActions";
import UserInfo from "../UserInfo";
import { MobileMenuOptions, navOptions } from "../utils";

const MoreOptions = ({ setVisiblity, showMoreOptions }) => {
  const { user, isAdminUser, setSelectedTab, companyRole } = useUserContext();

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
              companyRole={companyRole}
              from={4}
              setSelectedTab={setSelectedTab}
              showMoreOptions={showMoreOptions}
              to={
                navOptions.filter(option =>
                  option.allowedRoles.includes(companyRole)
                ).length
              }
            />
          </ul>
        </div>
        <UserActions setVisiblity={setVisiblity} />
      </SidePanel.Body>
    </SidePanel>
  );
};

export default MoreOptions;
