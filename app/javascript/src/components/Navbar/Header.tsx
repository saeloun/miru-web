import React from "react";

import { Link } from "react-router-dom";

import { Paths } from "constants/index";

const miruLogo = require("../../../../assets/images/PurpleMiruLogoWithText.svg"); //eslint-disable-line

const Header = () => (
  <div className="flex h-20 items-center justify-center bg-miru-gray-100">
    <Link to={Paths.TIME_TRACKING}>
      <img alt="miru-logo" src={miruLogo} />
    </Link>
  </div>
);

export default Header;
