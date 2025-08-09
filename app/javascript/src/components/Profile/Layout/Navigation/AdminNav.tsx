import React, { Fragment, useState } from "react";

import { useUserContext } from "context/UserContext";
import { MinusIcon, PlusIcon } from "miruIcons";

import List from "./List";

import { SETTINGS } from "../routes";

const AdminNav = () => {
  const { companyRole, company } = useUserContext();
  const [openedSubNav, setOpenedSubNav] = useState({
    personal: true,
    organization: false,
  });

  const toggleSection = section => {
    setOpenedSubNav({
      personal: section === "personal",
      organization: section === "organization",
    });
  };

  const personalSettings = SETTINGS.filter(
    ({ category }) => category === "personal"
  );

  const organizationalSettings = SETTINGS.filter(
    ({ category }) => category === "organization"
  );

  const renderSection = (title, section, settingsList) => (
    <Fragment>
      <div
        className="flex cursor-pointer flex-row items-center justify-between py-3 px-5"
        onClick={() => toggleSection(section)}
      >
        <span className="text-base font-bold">{title}</span>
        <div id={section}>
          {openedSubNav[section] ? (
            <MinusIcon size={16} weight="bold" />
          ) : (
            <PlusIcon size={16} weight="bold" />
          )}
        </div>
      </div>
      {openedSubNav[section] && (
        <List companyRole={companyRole} settingsList={settingsList} />
      )}
    </Fragment>
  );

  return (
    <div className="list-none min-h-50v text-sm font-medium leading-5 tracking-wider">
      {renderSection("Personal", "personal", personalSettings)}
      {renderSection(company.name, "organization", organizationalSettings)}
    </div>
  );
};

export default AdminNav;
