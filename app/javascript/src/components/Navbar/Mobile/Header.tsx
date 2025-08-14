import React, { Fragment } from "react";

import { MiruLogoSVG, PurpleMiruLogoWithTextSVG } from "miruIcons";
import { Link } from "react-router-dom";

import { Roles, Paths } from "constants/index";
import { useUserContext } from "context/UserContext";

const Header = ({ selectedTab }) => {
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
        url = "/invoices";
        break;
      case Roles.CLIENT:
        url = "/invoices";
        break;
      default:
        url = Paths.TIME_TRACKING;
        break;
    }

    return url;
  };

  const getHeaderContent = () => {
    if (selectedTab == "More" || selectedTab == null) {
      return (
        <Link
          className="flex w-full items-center justify-center"
          to={rootPath()}
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
        <Link className="flex items-center justify-center" to={rootPath()}>
          <img alt="miru-logo" className="h-6 w-6" src={MiruLogoSVG} />
        </Link>
        <span className="z-40 w-full pr-3 text-center text-base font-bold leading-5 text-miru-han-purple-1000">
          {selectedTab}
        </span>
      </Fragment>
    );
  };

  return (
    <div className="sticky top-0 left-0 right-0 z-50 flex h-1/15 items-center bg-white px-4 shadow-lg">
      {getHeaderContent()}
    </div>
  );
};

export default Header;
