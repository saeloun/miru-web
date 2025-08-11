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

import MobilePersonalDetails from "./MobilePersonalDetails";
import StaticPage from "./StaticPage";

const UserDetailsView = () => {
  const { updateDetails, personalDetails, isCalledFromSettings } =
    useProfileContext();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isDesktop, companyRole } = useUserContext();
  const { memberId } = useParams();
  const UserId = window.location.pathname.startsWith("/settings")
    ? user.id
    : memberId;

  const getData = async () => {
    setIsLoading(true);
    if (companyRole !== "client") {
      const employmentData: any = await teamsApi.getEmploymentDetails(UserId);

      const previousEmploymentData: any = await teamsApi.getPreviousEmployments(
        UserId
      );

      if (employmentData.status && employmentData.status == 200) {
        const employmentObj = employmentMapper(
          employmentData.data.employment,
          previousEmploymentData.data.previous_employments
        );
        updateDetails("employmentDetails", employmentObj);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    sendGAPageView();
    getData();
  }, []);

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
              isCalledFromSettings ? "/settings/" : `/team/${memberId}/`
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
