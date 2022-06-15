import React, { Fragment, useEffect } from "react";
import { useTeamDetails } from "context/TeamDetailsContext";

const EmploymentDetails = () => {
  const { updateDetails } = useTeamDetails();

  useEffect(() => {
    updateDetails("employment", [{
      employeeId: "SI0007"
    }])
  }, []);

  return (
    <Fragment>
      <div className="px-10 py-4 bg-miru-han-purple-1000 flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Employment Details</h1>
      </div>
    </Fragment>
  );
}
export default EmploymentDetails;
