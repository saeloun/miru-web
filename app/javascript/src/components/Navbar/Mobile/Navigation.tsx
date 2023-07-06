import React, { useState, Fragment, useEffect } from "react";

import { DotsThreeVerticalIcon, SignOutIcon } from "miruIcons";

import { useAuthDispatch } from "context/auth";
import { useUserContext } from "context/UserContext";

import MoreOptions from "./MoreOptions";

import {
  mobileActiveClassName,
  MobileMenuOptions,
  navOptions,
  navClientOptions,
  MobileListOption,
  handleLogout,
} from "../utils";

const Navigation = () => {
  const { setSelectedTab, selectedTab, companyRole } = useUserContext();
  const authDispatch = useAuthDispatch();
  const defaultShowOption = selectedTab == "More";
  const [showMoreOptions, setShowMoreOptions] =
    useState<boolean>(defaultShowOption);

  const handleMoreClick = () => {
    setShowMoreOptions(!showMoreOptions);
  };

  useEffect(() => {
    if (showMoreOptions) {
      setSelectedTab("More");
    }
  }, [showMoreOptions]);

  if (companyRole == "client") {
    return (
      <ul className="fixed bottom-0 left-0 right-0 z-40 flex h-1/12 justify-between bg-white px-3 shadow-c1">
        {navClientOptions.map((option, index) => (
          <MobileListOption
            from={0}
            index={index}
            key={index}
            option={option}
            setSelectedTab={setSelectedTab}
            showMoreOptions={showMoreOptions}
          />
        ))}
        <li
          className="flex flex-col items-center justify-center border-b border-miru-gray-100 py-3 text-xs font-medium leading-5 last:border-b-0"
          onClick={() => handleLogout(authDispatch)}
        >
          <SignOutIcon size={26} />
          <span className="text-center">Logout</span>
        </li>
      </ul>
    );
  }

  return (
    <Fragment>
      <ul className="fixed bottom-0 left-0 right-0 z-40 flex h-1/12 justify-between bg-white px-3 shadow-c1">
        <MobileMenuOptions
          companyRole={companyRole}
          from={0}
          setSelectedTab={setSelectedTab}
          showMoreOptions={showMoreOptions}
          to={
            navOptions.filter(option =>
              option.allowedRoles.includes(companyRole)
            ).length < 4
              ? navOptions.length
              : 4
          }
        />
        <li
          className={`flex items-center p-2 ${
            showMoreOptions
              ? mobileActiveClassName
              : "flex flex-col items-center justify-center text-xs"
          }`}
          onClick={handleMoreClick}
        >
          <DotsThreeVerticalIcon size={26} />
          More
        </li>
      </ul>
      {showMoreOptions && (
        <MoreOptions
          setVisiblity={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
    </Fragment>
  );
};
export default Navigation;
