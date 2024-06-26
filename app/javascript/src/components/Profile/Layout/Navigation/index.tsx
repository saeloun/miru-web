import React from "react";

import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";

import AdminNav from "./AdminNav";
import List from "./List";
import UserInformation from "./UserInformation";

import { SETTINGS } from "../routes";

const SideNav = () => {
  const { isCalledFromSettings } = useProfileContext();
  const { isAdminUser, companyRole } = useUserContext();
  const personalSettings = SETTINGS.filter(
    ({ category }) => category === "personal"
  );

  const EmployeeNav = () => (
    <List companyRole={companyRole} settingsList={personalSettings} />
  );

  return (
    <div className="flex flex-col">
      <UserInformation />
      <div className="mt-4 flex-1 bg-miru-gray-100">
        {isCalledFromSettings && isAdminUser ? <AdminNav /> : <EmployeeNav />}
      </div>
    </div>
  );
};

export default SideNav;
