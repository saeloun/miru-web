import React from "react";

import NavItem from "./NavItem";

export const TeamUrl = ({ urlList, currentWorkspaceName }) => (
  <div className="h-full w-full bg-white">
    <ul className="list-none text-sm font-medium leading-5 tracking-wider">
      {urlList.map((item, index) => (
        <li className="border-b-2 border-miru-gray-400" key={index}>
          {item?.isCompanyDetails ? (
            <>
              <p className="p-4 font-manrope text-base font-bold not-italic">
                {currentWorkspaceName}
              </p>
              <ul>
                {item?.navItems?.map(navItem => (
                  <NavItem
                    icon={navItem.icon}
                    key={navItem.text}
                    text={navItem.text}
                    url={navItem.url}
                  />
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="p-4 font-manrope text-base font-bold not-italic">
                {item.groupName}
              </p>
              <ul>
                {item?.navItems?.map(navItem => (
                  <NavItem
                    icon={navItem.icon}
                    key={navItem.text}
                    text={navItem.text}
                    url={navItem.url}
                  />
                ))}
              </ul>
            </>
          )}
        </li>
      ))}
    </ul>
  </div>
);
