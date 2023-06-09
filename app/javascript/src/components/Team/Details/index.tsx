import React, { Fragment, useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import teamsApi from "apis/teams";
import { TeamDetailsContext } from "context/TeamDetailsContext";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";

import { EmploymentDetailsState } from "./EmploymentDetails/EmploymentDetailsState";
import Header from "./Layout/Header";
import OutletWrapper from "./Layout/OutletWrapper";
import SideNav from "./Layout/SideNav";
import { PersonalDetailsState } from "./PersonalDetails/PersonalDetailsState";

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
  const { memberId } = useParams();
  const updateDetails = (key, payload) => {
    setDetails({ ...details, [`${key}Details`]: payload });
  };

  const getDetails = async () => {
    const res: any = await teamsApi.get(memberId);
    const addRes = await teamsApi.getAddress(memberId);
    const teamsObj = teamsMapper(res.data, addRes.data.addresses[0]);
    updateDetails("personal", teamsObj);
  };

  useEffect(() => {
    getDetails();
  }, []);

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
              <OutletWrapper />
            </div>
          </div>
        </Fragment>
      )}
      {!isDesktop && <OutletWrapper />}
    </TeamDetailsContext.Provider>
  );
};

export default TeamDetails;
