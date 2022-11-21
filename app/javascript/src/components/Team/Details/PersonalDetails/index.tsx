import React, { Fragment } from "react";
import { useEffect } from "react";

import { useTeamDetails } from "context/TeamDetailsContext";

import StaticPage from "./StaticPage";

const PersonalDetails = () => {
  const { updateDetails } = useTeamDetails();

  useEffect(() => {
    updateDetails("personal", {
      name: "Jane Cooper",
      dob: "04. 05. 1989",
      phone: "+123345234",
      email: "jane.cooper@gmail.com",
    });
  }, []);

  return (
    <Fragment>
      <div className="px-10 py-4 bg-miru-han-purple-1000 flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Personal Details</h1>
      </div>
      <StaticPage />
    </Fragment>
  );
};
export default PersonalDetails;
