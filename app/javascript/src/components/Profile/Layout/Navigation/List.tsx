import React from "react";

import { NavLink } from "react-router-dom";

const getActiveClassName = isActive => {
  if (isActive) {
    return "flex w-full items-center gap-4 rounded-lg border border-border bg-accent px-6 py-4 text-lg font-semibold text-foreground shadow-sm transition-colors";
  }

  return "flex w-full items-center gap-4 rounded-lg border border-transparent px-6 py-4 text-lg font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
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
                {setting.label}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                {setting.category === "personal" ? "Personal" : "Organization"}
              </span>
            </div>
          </NavLink>
        );
      }
    })}
  </nav>
);

export default List;
