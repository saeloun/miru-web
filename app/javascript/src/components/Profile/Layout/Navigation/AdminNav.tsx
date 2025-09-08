import React from "react";

import { useUserContext } from "context/UserContext";

import List from "./List";

import { SETTINGS } from "../routes";

const AdminNav = () => {
  const { companyRole } = useUserContext();

  // Get all settings that should be shown as tabs
  const allSettings = SETTINGS.filter(
    ({ isTab, authorisedRoles }) =>
      isTab && authorisedRoles.includes(companyRole)
  );

  return (
    <div className="min-h-[60vh] rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2"></div>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
          Settings Menu
        </h2>
        <List companyRole={companyRole} settingsList={allSettings} />
      </div>
    </div>
  );
};

export default AdminNav;
