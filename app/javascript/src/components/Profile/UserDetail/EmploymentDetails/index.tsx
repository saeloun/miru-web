import React, { Fragment, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfile } from "components/Profile/context/EntryContext";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";
import { employmentMapper } from "mapper/teams.mapper";

import StaticPage from "./StaticPage";

const EmploymentDetails = () => {
  const { user, isDesktop } = useUserContext();
  const { setUserState, employmentDetails } = useProfile();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const getDetails = async () => {
    const res1: any = await teamsApi.getEmploymentDetails(user.id);
    const res: any = await teamsApi.getPreviousEmployments(user.id);
    const employmentData = employmentMapper(
      res1.data.employment,
      res.data.previous_employments
    );
    setUserState("employmentDetails", employmentData);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDetails();
  }, []);

  return (
    <Fragment>
      {isDesktop && (
        <DetailsHeader
          showButtons
          isDisableUpdateBtn={false}
          subTitle=""
          title="Employment Details"
          editAction={() =>
            navigate(`/settings/employment/edit`, { replace: true })
          }
        />
      )}
      {!isDesktop && (
        <MobileEditHeader
          backHref="/settings/"
          href="/settings/employment/edit"
          title="Employment Details"
        />
      )}
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <StaticPage employmentDetails={employmentDetails} />
      )}
    </Fragment>
  );
};
export default EmploymentDetails;
