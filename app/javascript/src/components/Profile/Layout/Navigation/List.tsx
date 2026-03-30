import React from "react";
import { t } from "../../../../i18n";

import { NavLink } from "react-router-dom";

const getActiveClassName = isActive => {
  if (isActive) {
    return "flex w-full items-center gap-4 rounded-lg border border-border bg-accent px-6 py-4 text-lg font-semibold text-foreground shadow-sm transition-colors";
  }

  return "flex w-full items-center gap-4 rounded-lg border border-transparent px-6 py-4 text-lg font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
};

const labelForSetting = path => {
  if (path.startsWith("profile")) return t("settings.labels.profile");

  if (path.startsWith("employment")) return t("settings.labels.employment");

  if (path.startsWith("devices")) return t("settings.labels.devices");

  if (path.startsWith("notifications")) {
    return t("settings.labels.notifications");
  }

  if (path.startsWith("preferences")) return t("settings.labels.preferences");

  if (path.startsWith("automation")) return t("settings.labels.automation");

  if (path.startsWith("organization")) return t("settings.labels.organization");

  if (path.startsWith("bank-info")) return t("settings.labels.bankInfo");

  if (path.startsWith("leaves")) return t("settings.labels.leaves");

  if (path.startsWith("holidays")) return t("settings.labels.holidays");

  if (path.startsWith("payment")) return t("settings.labels.payment");

  if (path.startsWith("billing")) return t("settings.labels.billing");

  return path;
};

const List = ({ settingsList, companyRole }) => (
  <nav className="space-y-3">
    {settingsList.map((setting, index) => {
      if (setting.isTab && setting.authorisedRoles.includes(companyRole)) {
        return (
          <NavLink
            end
            className={({ isActive }) => getActiveClassName(isActive)}
            key={index}
            to={`/settings/${setting.path}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm">
              {React.cloneElement(setting.icon, {
                size: 26,
                weight: "bold",
                color: "currentColor",
              })}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">
                {labelForSetting(setting.path)}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                {setting.category === "personal"
                  ? t("settings.categories.personal")
                  : t("settings.categories.organization")}
              </span>
            </div>
          </NavLink>
        );
      }
    })}
  </nav>
);

export default List;
