import React, { useEffect } from "react";

import teamsApi from "apis/teams";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";
import { useParams } from "react-router-dom";

import AdminNav from "./AdminNav";
import List from "./List";
import UserInformation from "./UserInformation";

import { SETTINGS } from "../routes";

const SideNav = () => {
  const { isCalledFromSettings, updateDetails } = useProfileContext();
  const { isAdminUser, companyRole, user } = useUserContext();
  const personalSettings = SETTINGS.filter(
    ({ category }) => category === "personal"
  );
  const { memberId } = useParams();
  const UserId = window.location.pathname.startsWith("/settings")
    ? user.id
    : memberId;

  const EmployeeNav = () => (
    <List companyRole={companyRole} settingsList={personalSettings} />
  );

  const fetchPersonalDetails = async () => {
    const res = await teamsApi.get(UserId);
    if (res.status && res.status == 200) {
      const addressData = await teamsApi.getAddress(UserId);
      const userObj = teamsMapper(res.data, addressData.data.addresses[0]);
      updateDetails("personalDetails", userObj);
    }
  };

  useEffect(() => {
    fetchPersonalDetails();
  }, []);

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
