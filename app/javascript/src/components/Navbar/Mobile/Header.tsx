import React from "react";

import { Link } from "react-router-dom";

import { Paths } from "constants/index";

const miruLogo = require("../../../../../assets/images/logo.jpg"); //eslint-disable-line

const Header = ({ selectedTab }) => (
  <div className="fixed top-0 left-0 right-0 flex h-12 items-center bg-white shadow-lg">
    <Link
      className="flex items-center justify-center p-2"
      to={Paths.TIME_TRACKING}
    >
      <img alt="miru-logo" className="h-10 w-12" src={miruLogo} />
    </Link>
    <span className="w-full text-center text-base font-bold leading-5 text-miru-han-purple-1000">
      {selectedTab}
    </span>
  </div>
);

export default Header;
