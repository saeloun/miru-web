import React, { Fragment, useState } from "react";

import { TeamDetailsContext } from "context/TeamDetailsContext";
import { useUserContext } from "context/UserContext";

import { EmploymentDetailsState } from "./EmploymentDetails/EmploymentDetailsState";
import Header from "./Layout/Header";
import SideNav from "./Layout/SideNav";
import { PersonalDetailsState } from "./PersonalDetails/PersonalDetailsState";

import RouteConfig from "../RouteConfig";

const TeamDetails = () => {
  const [details, setDetails] = useState({
    personalDetails: PersonalDetailsState,
    employmentDetails: EmploymentDetailsState,
    documentDetails: {},
    deviceDetails: {},
    compensationDetails: {},
    reimburstmentDetails: {},
  });
  const { isDesktop } = useUserContext();
  const updateDetails = (key, payload) => {
    setDetails({ ...details, [`${key}Details`]: payload });
  };

  return (
    <TeamDetailsContext.Provider
      value={{
        details,
        updateDetails,
      }}
    >
      {isDesktop && (
        <Fragment>
          <Header />
          <div className="mt-6 mb-10 grid grid-cols-12 gap-11">
            <div className="col-span-3">
              <SideNav />
            </div>
            <div className="col-span-9">
              <RouteConfig />
            </div>
          </div>
        </Fragment>
      )}
      {!isDesktop && <RouteConfig />}
    </TeamDetailsContext.Provider>
  );
};

export default TeamDetails;
