import React from "react";

import { NavLink } from "react-router-dom";

const getActiveClassName = isActive => {
  if (isActive) {
    return "flex w-full items-center gap-3 rounded-md bg-accent px-4 py-3 text-base font-bold text-accent-foreground border-l-4 border-primary";
  }

  return "flex w-full items-center gap-3 rounded-md px-4 py-3 text-base font-semibold text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground";
};

const List = ({ settingsList, companyRole }) => (
  <nav className="space-y-1 px-2">
    {settingsList.map((setting, index) => {
      if (setting.isTab && setting.authorisedRoles.includes(companyRole)) {
        return (
          <NavLink
            end
            className={({ isActive }) => getActiveClassName(isActive)}
            key={index}
            to={`/settings/profile/${setting.path}`}
          >
            <div className="flex h-5 w-5 items-center justify-center">
              {setting.icon}
            </div>
            <span className="text-sm font-bold uppercase tracking-wide">
              {setting.label}
            </span>
          </NavLink>
        );
      }
    })}
  </nav>
);

export default List;
