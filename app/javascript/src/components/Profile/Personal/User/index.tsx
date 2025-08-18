import React, { Fragment, useEffect, useState } from "react";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { employmentMapper } from "mapper/teams.mapper";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import MobilePersonalDetails from "./MobilePersonalDetails";
import StaticPage from "./StaticPage";

const UserDetailsView = () => {
  const { updateDetails, personalDetails, isCalledFromSettings } =
    useProfileContext();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { user, isDesktop, companyRole } = useUserContext();
  const { currentUser } = useCurrentUser();
  const { memberId } = useParams();

  const getData = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      if (companyRole !== "client") {
        // First, get the list of employments to find the current one
        const employmentsResponse: any = await teamsApi.getEmployments();
        
        if (employmentsResponse.status === 200 && employmentsResponse.data.employments?.length > 0) {
          // Use the first employment (current employment)
          const currentEmployment = employmentsResponse.data.employments[0];
          
          const employmentData: any = await teamsApi.getEmploymentDetails(
            currentEmployment.id
          );

          const previousEmploymentData: any =
            await teamsApi.getPreviousEmployments(currentUserId);

          if (employmentData.status && employmentData.status == 200) {
            const employmentObj = employmentMapper(
              employmentData.data.employment,
              previousEmploymentData.data.previous_employments
            );
            updateDetails("employmentDetails", employmentObj);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch employment data:", error);
    }
    setIsLoading(false);
  };

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

  useEffect(() => {
    sendGAPageView();
    if (currentUserId) {
      getData();
    }
  }, [currentUserId]);

  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate(`edit`, { replace: true });
  };

  return (
    <div className="flex w-full flex-col">
      {isDesktop && (
        <Fragment>
          <DetailsHeader
            showButtons
            editAction={handleEditClick}
            isDisableUpdateBtn={false}
            subTitle=""
            title="Personal Details"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <StaticPage
              handleEditClick={handleEditClick}
              isCalledFromSettings={isCalledFromSettings}
              personalDetails={personalDetails}
            />
          )}
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          <MobileEditHeader
            href="edit"
            title="Personal Details"
            backHref={
              isCalledFromSettings ? "/settings/" : `/team/${currentUserId}/`
            }
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <MobilePersonalDetails
              handleEditClick={handleEditClick}
              isCalledFromSettings={isCalledFromSettings}
              personalDetails={personalDetails}
            />
          )}
        </Fragment>
      )}
      <Outlet />
    </div>
  );
};

export default UserDetailsView;
