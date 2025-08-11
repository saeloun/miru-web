import React, { Fragment, useEffect, useState } from "react";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { employmentMapper } from "mapper/teams.mapper";
import { useNavigate, useParams } from "react-router-dom";

import StaticPage from "./StaticPage";

const EmploymentDetails = () => {
  const { user, isDesktop } = useUserContext();
  const { updateDetails, employmentDetails, isCalledFromSettings } =
    useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = isCalledFromSettings ? user.id : memberId;

  const getDetails = async () => {
    const res1: any = await teamsApi.getEmploymentDetails(currentUserId);
    const res: any = await teamsApi.getPreviousEmployments(currentUserId);
    const employmentData = employmentMapper(
      res1.data.employment,
      res.data.previous_employments
    );
    updateDetails("employmentDetails", employmentData);
    setIsLoading(false);
  };

  const handleEditClick = () => {
    navigate(`edit`, { replace: true });
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
          editAction={handleEditClick}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Employment Details"
        />
      )}
      {!isDesktop && (
        <MobileEditHeader
          backHref={isCalledFromSettings ? "/settings/" : `/team/${memberId}`}
          href="edit"
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
