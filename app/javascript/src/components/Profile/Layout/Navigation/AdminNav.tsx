import React, { useState } from "react";

import { useUserContext } from "context/UserContext";
import { CaretDownIcon, CaretUpIcon } from "miruIcons";

import List from "./List";

import { SETTINGS } from "../routes";

const AdminNav = () => {
  const { companyRole, company } = useUserContext();
  const [openedSubNav, setOpenedSubNav] = useState({
    personal: true,
    organization: false,
  });

  const toggleSection = section => {
    setOpenedSubNav(prev => {
      const isCurrentlyOpen = prev[section];
      if (isCurrentlyOpen) {
        // If clicking on already open section, close it
        return {
          ...prev,
          [section]: false,
        };
      }

      // If clicking on closed section, open it and close others
      return {
        personal: section === "personal",
        organization: section === "organization",
      };
    });
  };

  const personalSettings = SETTINGS.filter(
    ({ category }) => category === "personal"
  );

  const organizationalSettings = SETTINGS.filter(
    ({ category }) => category === "organization"
  );

  const renderSection = (title, section, settingsList) => (
    <div className="border-b border-border/40">
      <button
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/50"
        type="button"
        onClick={() => toggleSection(section)}
      >
        <span className="text-base font-bold text-foreground">{title}</span>
        <div className="flex items-center justify-center">
          {openedSubNav[section] ? (
            <CaretUpIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <CaretDownIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {openedSubNav[section] && (
        <div className="pb-2">
          <List companyRole={companyRole} settingsList={settingsList} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-[50vh] border border-border rounded-md bg-card text-card-foreground shadow-sm">
      {renderSection("Personal", "personal", personalSettings)}
      {renderSection(company.name, "organization", organizationalSettings)}
    </div>
  );
};

export default AdminNav;
