import React, { useState } from "react";
import { TeamDetailsContext } from "context/TeamDetailsContext";
import Header from "./Layout/Header";
import OutletWrapper from "./Layout/OutletWrapper";
import SideNav from "./Layout/SideNav";

const TeamDetails = () => {

  const [details, setDetails] = useState({
    personalDetails: {},
    employmentDetails: [],
    documentDetails: {},
    deviceDetails: {},
    compensationDetails: {},
    reimburstmentDetails: {}
  });

  const updateDetails = (key, payload) => {
    setDetails({ ...details, [`${key}Details`]: payload });
  };

  return (
    <TeamDetailsContext.Provider value={{
      details,
      updateDetails
    }}>
      <Header />
      <div className="flex mt-6 mb-10">
        <SideNav />
        <OutletWrapper />
      </div>
    </TeamDetailsContext.Provider>
  );
};
export default TeamDetails;
