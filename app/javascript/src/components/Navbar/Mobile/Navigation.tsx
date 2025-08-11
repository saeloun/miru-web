import React, { useState, Fragment, useEffect } from "react";

import { useUserContext } from "context/UserContext";
import { DotsThreeVerticalIcon } from "miruIcons";

import MoreOptions from "./MoreOptions";

import { mobileActiveClassName, MobileMenuOptions, navOptions } from "../utils";

const Navigation = () => {
  const { setSelectedTab, selectedTab, companyRole } = useUserContext();
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

  return (
    <Fragment>
      <ul
        className={`fixed bottom-0 left-0 right-0 z-40 flex h-1/12 ${
          companyRole == "client" ? "px-8" : "px-3"
        } justify-between bg-white shadow-c1`}
      >
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
