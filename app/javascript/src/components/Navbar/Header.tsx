import { Roles, Paths } from "constants/index";

import React from "react";

import { useUserContext } from "context/UserContext";
import { MiruLogoSVG } from "miruIcons";
import { Link } from "react-router-dom";
import { ModeToggle } from "../ui/mode-toggle";

const Header = () => {
  const { user, companyRole } = useUserContext();

  const rootPath = () => {
    if (!user) {
      window.location.href = Paths.SIGN_IN;

      return null;
    }

    let url;

    switch (companyRole) {
      case Roles.BOOK_KEEPER:
        url = Paths.PAYMENTS;
        break;
      case Roles.OWNER:
        url = "invoices";
        break;
      case Roles.CLIENT:
        url = "invoices";
        break;
      default:
        url = Paths.TIME_TRACKING;
        break;
    }

    return url;
  };

  return (
    <div className="relative flex h-20 items-center justify-center bg-miru-gray-100 dark:bg-miru-dark-purple-600">
      <Link to={rootPath()}>
        <img alt="miru-logo" height="64px" src={MiruLogoSVG} width="64px" />
      </Link>
      <div className="absolute top-2 right-2">
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
