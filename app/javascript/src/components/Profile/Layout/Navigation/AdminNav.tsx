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
    <div className="min-h-[60vh] rounded-xl border border-border bg-card shadow-sm">
      <div className="max-h-[70vh] overflow-y-auto p-4 md:p-6">
        <List companyRole={companyRole} settingsList={allSettings} />
      </div>
    </div>
  );
};

export default AdminNav;
