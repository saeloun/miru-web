import React, { Fragment, useEffect } from "react";

import { useTeamDetails } from "context/TeamDetailsContext";

import StaticPage from "./StaticPage";

const EmploymentDetails = () => {
  const { updateDetails } = useTeamDetails();

  useEffect(() => {
    updateDetails("employment", {
      currentEmployment: {
        employeeId: "SI0007",
        designation: "Senior Software Developer",
        emailId: "jane@saeloun.com",
        employeeType: "Salaried Employee",
        doj: "01. 08. 2021",
        dor: "",
      },
      previousEmployment: [
        {
          name: "Infosys",
          role: "Software Developer",
        },
      ],
    });
  }, []);

  return (
    <Fragment>
      <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
        <h1 className="text-2xl font-bold text-white">Employment Details</h1>
      </div>
      <StaticPage />
    </Fragment>
  );
};
export default EmploymentDetails;
