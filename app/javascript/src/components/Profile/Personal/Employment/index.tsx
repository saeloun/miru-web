import React, { Fragment, useEffect, useState } from "react";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { employmentMapper } from "mapper/teams.mapper";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import StaticPage from "./StaticPage";

const EmploymentDetails = () => {
  const { user, isDesktop } = useUserContext();
  const { currentUser } = useCurrentUser();
  const { updateDetails, employmentDetails, isCalledFromSettings } =
    useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Effect to determine current user ID
  useEffect(() => {
    if (isCalledFromSettings) {
      // Use fresh user data from _me endpoint for settings
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }
    } else {
      // Use memberId for team view
      setCurrentUserId(memberId);
    }
  }, [isCalledFromSettings, currentUser, memberId]);

  const getDetails = async () => {
    if (!currentUserId) return;

    try {
      const res1: any = await teamsApi.getEmploymentDetails(currentUserId);
      const res: any = await teamsApi.getPreviousEmployments(currentUserId);
      const employmentData = employmentMapper(
        res1.data.employment,
        res.data.previous_employments
      );
      updateDetails("employmentDetails", employmentData);
    } catch (error) {
      console.error("Failed to fetch employment details:", error);
    }
    setIsLoading(false);
  };

  const handleEditClick = () => {
    navigate(`edit`, { replace: true });
  };

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      getDetails();
    }
  }, [currentUserId]);

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
          href="edit"
          title="Employment Details"
          backHref={
            isCalledFromSettings ? "/settings/" : `/team/${currentUserId}`
          }
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
