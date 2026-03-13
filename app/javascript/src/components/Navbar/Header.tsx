import { Roles, Paths } from "constants/index";

import React from "react";

import useThemeMode from "common/useThemeMode";
import { useUserContext } from "context/UserContext";
import { MiruLogoSVG } from "miruIcons";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, companyRole } = useUserContext();
  const themeMode = useThemeMode();

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
    <div className="relative flex h-20 items-center justify-center bg-muted">
      <Link to={rootPath()}>
        <img
          alt="Miru"
          className="transition"
          height="64px"
          src={MiruLogoSVG}
          style={{
            filter: themeMode === "dark" ? "brightness(0) invert(1)" : "none",
          }}
          width="64px"
        />
      </Link>
    </div>
  );
};

export default Header;
