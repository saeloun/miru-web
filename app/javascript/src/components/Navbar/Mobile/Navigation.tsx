import React, { useState, Fragment } from "react";

import { DotsThreeVerticalIcon } from "miruIcons";

import MoreOptions from "./MoreOptions";

import { mobileActiveClassName, MobileMenuOptions } from "../utils";

const Navigation = ({ isAdminUser, setSelectedTab }) => {
  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);

  return (
    <Fragment>
      <ul className="fixed bottom-0 left-0 right-0 z-40 flex h-14 justify-between bg-white px-3 shadow-c1">
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
          onClick={() => {
            setSelectedTab("More");
            setShowMoreOptions(true);
          }}
        >
          <DotsThreeVerticalIcon size={26} /> More
        </li>
      </ul>
      {showMoreOptions && (
        <MoreOptions
          setSelectedTab={setSelectedTab}
          setVisiblity={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
    </Fragment>
  );
};
export default Navigation;
