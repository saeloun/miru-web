import React, { Fragment, useEffect } from "react";

import { useTeamDetails } from "context/TeamDetailsContext";

import StaticPage from "./StaticPage";
// import { useNavigate } from "react-router-dom";

const PersonalDetails = () => {
  const { updateDetails } = useTeamDetails();
  // const navigate = useNavigate();

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
      <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
        <h1 className="text-2xl font-bold text-white">Personal Details</h1>
        <button
          className="mx-1 cursor-auto rounded-md border bg-white px-3 text-miru-han-purple-1000"
          data-cy="update-profile"
          // onClick={() => navigate("/team/")}
        >
          Edit
        </button>
      </div>
      <StaticPage />
    </Fragment>
  );
};
export default PersonalDetails;
