import React, { Fragment, useState, useEffect } from "react";

import { ProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import { useLocation, useParams } from "react-router-dom";

import { EmploymentDetailsState } from "./Context/EmploymentDetailsState";
import { PersonalDetailsState } from "./Context/PersonalDetailsState";
import Header from "./Layout/Header";
import MobileNav from "./Layout/Navigation/MobileNav";
import OutletWrapper from "./Layout/OutletWrapper";

const buildPersonalDetails = (
  user,
  company,
  previousState = PersonalDetailsState
) => ({
  ...previousState,
  id: user?.id ? String(user.id) : previousState.id,
  first_name: user?.first_name || previousState.first_name,
  last_name: user?.last_name || previousState.last_name,
  date_of_birth:
    user?.date_of_birth && (user?.date_format || company?.date_format)
      ? dayjs(user.date_of_birth).format(
          user?.date_format || company?.date_format
        )
      : user?.date_of_birth || previousState.date_of_birth,
  phone_number: user?.phone || previousState.phone_number,
  email_id: user?.personal_email_id || user?.email || previousState.email_id,
  linkedin: user?.social_accounts?.linkedin_url || previousState.linkedin,
  github: user?.social_accounts?.github_url || previousState.github,
  password_changed_at:
    user?.password_changed_at || previousState.password_changed_at,
  date_format:
    user?.date_format || company?.date_format || previousState.date_format,
});

const Layout = () => {
  const { isDesktop, user, company } = useUserContext();
  const location = useLocation();
  const { memberId } = useParams();
  const [settingsStates, setSettingsStates] = useState({
    personalDetails: buildPersonalDetails(user, company),
    employmentDetails: EmploymentDetailsState,
    documentDetails: {},
    deviceDetails: {},
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

  // Initialize personal details with current user data when in settings context
  useEffect(() => {
    if (isCalledFromSettings && user) {
      setSettingsStates(prevState => ({
        ...prevState,
        personalDetails: buildPersonalDetails(
          user,
          company,
          prevState.personalDetails
        ),
      }));
    }
  }, [company, isCalledFromSettings, user]);

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
          <div className="mt-6 mb-10">
            <OutletWrapper />
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
