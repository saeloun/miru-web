import React, { Fragment, useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { useTeamDetails } from "context/TeamDetailsContext";
import { employmentMapper } from "mapper/teams.mapper";

import StaticPage from "./StaticPage";

const EmploymentDetails = () => {
  const {
    updateDetails,
    details: { employmentDetails },
  } = useTeamDetails();
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const getDetails = async () => {
    const res1: any = await teamsApi.getEmploymentDetails(memberId);
    const res: any = await teamsApi.getPreviousEmployments(memberId);
    const employmentData = employmentMapper(
      res1.data.employment,
      res.data.previous_employments
    );
    updateDetails("employment", employmentData);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDetails();
  }, []);

  return (
    <Fragment>
      <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
        <h1 className="text-2xl font-bold text-white">Employment Details</h1>
        <button
          className="cursor-pointer rounded-md border border-white bg-miru-han-purple-1000 px-6 py-2 font-bold text-white"
          onClick={() =>
            navigate(`/team/${memberId}/employment_edit`, { replace: true })
          }
        >
          Edit
        </button>
      </div>
      {isLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : (
        <StaticPage employmentDetails={employmentDetails} />
      )}
    </Fragment>
  );
};
export default EmploymentDetails;
