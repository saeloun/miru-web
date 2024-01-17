/* eslint-disable no-unused-vars */
import React, { Fragment, useState } from "react";

import { useUserContext } from "context/UserContext";

import Header from "./CommonComponents/Header";
import { CompensationDetailsState } from "./context/CompensationDetailsState";
import { EmploymentDetailsState } from "./context/EmploymentDetailsState";
import EntryContext from "./context/EntryContext";
import { PersonalDetailsState } from "./context/PersonalDetailsState";
import RouteConfig from "./RouteConfig";
import SubNav from "./SubNav";

const Layout = ({ isAdminUser, user, company }) => {
  const { isDesktop } = useUserContext();

  const [settingsStates, setSettingsStates] = useState({
    profileSettings: PersonalDetailsState,
    employmentDetails: EmploymentDetailsState,
    compensationDetails: CompensationDetailsState,
    organizationSettings: {},
    bankAccDetails: {},
    paymentSettings: {},
    billing: {},
  });

  const { profileSettings, employmentDetails } = settingsStates;
  const setUserState = (key, value) => {
    setSettingsStates(previousSettings => ({
      ...previousSettings,
      ...{ [key]: { ...previousSettings[key], ...value } },
    }));
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
              <SubNav
                company={company}
                designation={employmentDetails?.current_employment?.designation}
                firstName={profileSettings?.first_name}
                isAdmin={isAdminUser}
                lastName={profileSettings?.last_name}
              />
            </div>
            <div className="col-span-9">
              <RouteConfig />
            </div>
          </div>
        </Fragment>
      )}
      {!isDesktop && <RouteConfig />}
    </EntryContext.Provider>
  );
};

export default Layout;
