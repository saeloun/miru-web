import React from "react";

import { MiruLogoSVG } from "miruIcons";
import { Link } from "react-router-dom";

import { Paths } from "constants/index";

const Header = () => (
  <div className="flex h-20 items-center justify-center bg-miru-gray-100">
    <Link to={Paths.TIME_TRACKING}>
      <img alt="miru-logo" height="64px" src={MiruLogoSVG} width="64px" />
    </Link>
  </div>
);

export default Header;
