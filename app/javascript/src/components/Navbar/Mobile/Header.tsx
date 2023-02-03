/* eslint-disable @typescript-eslint/no-var-requires */
import React, { Fragment } from "react";

import { MiruLogoSVG, PurpleMiruLogoWithTextSVG } from "miruIcons";
import { Link } from "react-router-dom";

import { Paths } from "constants/index";

const Header = ({ selectedTab }) => {
  const getHeaderContent = () => {
    if (selectedTab == "More" || selectedTab == null) {
      return (
        <Link
          className="flex w-full items-center justify-center"
          to={Paths.TIME_TRACKING}
        >
          <img
            alt="miru-logo"
            className="h-10 w-20"
            src={PurpleMiruLogoWithTextSVG}
          />
        </Link>
      );
    }

    return (
      <Fragment>
        <Link
          className="flex items-center justify-center"
          to={Paths.TIME_TRACKING}
        >
          <img alt="miru-logo" className="h-6 w-6" src={MiruLogoSVG} />
        </Link>
        <span className="z-40 w-full pr-3 text-center text-base font-bold leading-5 text-miru-han-purple-1000">
          {selectedTab}
        </span>
      </Fragment>
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center bg-white px-4 shadow-lg">
      {getHeaderContent()}
    </div>
  );
};

export default Header;
