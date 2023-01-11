/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { MiruLogoSVG } from "miruIcons";
import { Link } from "react-router-dom";

import { Paths } from "constants/index";

const Header = ({ selectedTab }) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center bg-white px-4 shadow-lg">
    <Link className="flex items-center justify-center" to={Paths.TIME_TRACKING}>
      <img alt="miru-logo" className="h-10 w-12" src={MiruLogoSVG} />
    </Link>
    <span className="w-full pr-12 text-center text-base font-bold leading-5 text-miru-han-purple-1000">
      {selectedTab}
    </span>
  </div>
);

export default Header;
