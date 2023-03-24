import React, { useState, Fragment, useEffect } from "react";

import { DotsThreeVerticalIcon } from "miruIcons";

import { useUserContext } from "context/UserContext";

import MoreOptions from "./MoreOptions";

import { mobileActiveClassName, MobileMenuOptions } from "../utils";

const Navigation = () => {
  const { isAdminUser, setSelectedTab, selectedTab } = useUserContext();
  const defaultShowOption = selectedTab == "More";
  const [showMoreOptions, setShowMoreOptions] =
    useState<boolean>(defaultShowOption);

  const handleMoreClick = () => {
    setShowMoreOptions(true);
  };

  useEffect(() => {
    if (showMoreOptions) {
      setSelectedTab("More");
    }
  }, [showMoreOptions]);

  return (
    <Fragment>
      <ul className="fixed bottom-0 left-0 right-0 z-40 flex h-1/12 justify-between bg-white px-3 shadow-c1">
        <MobileMenuOptions
          from={0}
          isAdminUser={isAdminUser}
          setSelectedTab={setSelectedTab}
          showMoreOptions={showMoreOptions}
          to={4}
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
