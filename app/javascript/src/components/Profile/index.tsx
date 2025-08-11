import React, { Fragment, useState, useEffect } from "react";

import { ProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useLocation, useParams } from "react-router-dom";

import { CompensationDetailsState } from "./Context/CompensationDetailsState";
import { EmploymentDetailsState } from "./Context/EmploymentDetailsState";
import { PersonalDetailsState } from "./Context/PersonalDetailsState";
import Header from "./Layout/Header";
import SideNav from "./Layout/Navigation";
import MobileNav from "./Layout/Navigation/MobileNav";
import OutletWrapper from "./Layout/OutletWrapper";

const Layout = () => {
  const { isDesktop } = useUserContext();
  const location = useLocation();
  const { memberId } = useParams();
  const [settingsStates, setSettingsStates] = useState({
    personalDetails: PersonalDetailsState,
    employmentDetails: EmploymentDetailsState,
    documentDetails: {},
    deviceDetails: {},
    compensationDetails: CompensationDetailsState,
    reimburstmentDetails: {},
  });

  const [isCalledFromSettings, setIsCalledFromSettings] = useState(false);
  const [isCalledFromTeam, setIsCalledFromTeam] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith("/settings")) {
      setIsCalledFromSettings(true);
    } else {
      setIsCalledFromSettings(false);
    }

    if (location.pathname.startsWith("/team")) {
      setIsCalledFromTeam(true);
    } else {
      setIsCalledFromTeam(false);
    }

    const mobileNavVisibility =
      location.pathname === "/settings" ||
      location.pathname === "/settings/" ||
      location.pathname === `/team/${memberId}` ||
      location.pathname === `/team/${memberId}/`;

    setShowMobileNav(mobileNavVisibility);
  }, [location]);

  const updateDetails = (key, value) => {
    setSettingsStates(previousSettings => ({
      ...previousSettings,
      ...{ [key]: { ...previousSettings[key], ...value } },
    }));
  };

  return (
    <ProfileContext.Provider
      value={{
        ...settingsStates,
        updateDetails,
        isCalledFromSettings,
        setIsCalledFromSettings,
        isCalledFromTeam,
        setIsCalledFromTeam,
      }}
    >
      {isDesktop && (
        <Fragment>
          <div className="mt-3">
            <Header />
          </div>
          <div className="mt-6 mb-10 grid grid-cols-12 gap-11">
            <div className="col-span-3">
              <SideNav />
            </div>
            <div className="col-span-9">
              <OutletWrapper />
            </div>
          </div>
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          {showMobileNav && <MobileNav />}
          <OutletWrapper />
        </Fragment>
      )}
    </ProfileContext.Provider>
  );
};

export default Layout;
