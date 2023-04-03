import React, { Fragment, useState } from "react";

import { ToastContainer } from "react-toastify";

import { TOASTER_DURATION } from "constants/index";
import { useUserContext } from "context/UserContext";

import Header from "./CommonComponents/Header";
import EntryContext from "./context/EntryContext";
import RouteConfig from "./RouteConfig";
import SideNav from "./SubNav";

const Layout = ({ isAdminUser, user, company }) => {
  const { isDesktop } = useUserContext();

  const [settingsStates, setSettingsStates] = useState({
    profileSettings: {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    },
    organizationSettings: {},
    bankAccDetails: {},
    paymentSettings: {},
    billing: {},
  });

  const { profileSettings } = settingsStates;
  const setUserState = (key, value) => {
    setSettingsStates({
      ...settingsStates,
      ...{ [key]: { ...settingsStates[key], ...value } },
    });
  };

  return (
    <EntryContext.Provider
      value={{
        ...settingsStates,
        setUserState,
      }}
    >
      {isDesktop && (
        <Fragment>
          <div className="mt-3">
            <Header />
          </div>
          <div className="mt-6 mb-10 grid grid-cols-12 gap-11">
            <div className="col-span-3">
              <SideNav
                company={company}
                firstName={profileSettings?.firstName}
                isAdmin={isAdminUser}
                lastName={profileSettings?.lastName}
              />
            </div>
            <div className="col-span-9">
              <RouteConfig />
            </div>
          </div>
        </Fragment>
      )}
      <ToastContainer autoClose={TOASTER_DURATION} />
    </EntryContext.Provider>
  );
};

export default Layout;
