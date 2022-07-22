import React from "react";
import { useEffect } from "react";
import { useState } from "react";

import { TOASTER_DURATION } from "constants/index";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

import EntryContext from "./context/EntryContext";
import RouteConfig from "./RouteConfig";
import SideNav from "./SubNav";

const Layout = ({ isAdmin, company, userDetails }) => {

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  const [settingsStates, setSettingsStates] = useState({
    profileSettings: { firstName: userDetails.firstName, lastName: userDetails.lastName, email: userDetails.email },
    organizationSettings: {},
    bankAccDetails: {},
    paymentSettings: {},
    billing: {}
  });

  const setUserState = (key, value) => {
    setSettingsStates({ ...settingsStates, ...{ [key]: { ...settingsStates[key], ...value } } });
  };

  return (
    <React.Fragment>
      <EntryContext.Provider value={{
        ...settingsStates,
        setUserState
      }}>
        <BrowserRouter>
          <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
            <h2 className="header__title">Settings</h2>
          </div>
          <div className="flex mt-5 mb-10">
            <SideNav
              isAdmin={isAdmin}
              company={company}
              firstName={settingsStates.profileSettings?.firstName}
              lastName={settingsStates.profileSettings?.lastName}
              email={settingsStates.profileSettings?.email}
            />
            <RouteConfig />
          </div>
          <ToastContainer autoClose={TOASTER_DURATION} />
        </BrowserRouter>
      </EntryContext.Provider>
    </React.Fragment>
  );
};

export default Layout;
