import React, { useEffect, useState } from "react";

import { teamsApi } from "apis/api";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import {
  employmentMapper,
  pickPrimaryAddress,
  teamsMapper,
} from "mapper/teams.mapper";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { hasEmployeeRecordsAccess } from "../../../../lib/employeeRecordsAccess";
import { getDisplayAvatarUrl } from "helpers";
import { sendGAPageView } from "utils/googleAnalytics";
import { i18n } from "../../../../i18n";

import PersonalProfileSummary from "./PersonalProfileSummary";
import AccountSecurity from "./AccountSecurity";

const UserDetailsView = () => {
  const { updateDetails, personalDetails, isCalledFromSettings } =
    useProfileContext();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { avatarUrl, user, company, isDesktop, companyRole } = useUserContext();
  const { memberId } = useParams();

  const getData = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const userResponse: any = await teamsApi.get(currentUserId);

      if (userResponse?.status === 200) {
        const addressData: any = await teamsApi.getAddress(currentUserId);
        const primaryAddress = pickPrimaryAddress(addressData?.data?.addresses);
        const userObj = teamsMapper(userResponse.data, primaryAddress);
        updateDetails("personalDetails", userObj);
      }

      if (companyRole !== "client") {
        const employmentData: any = await teamsApi.getEmploymentDetails(
          currentUserId
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
    } catch (error) {
      console.error("Failed to fetch personal/employment data:", error);
    }
    setIsLoading(false);
  };

  // Effect to determine current user ID
  useEffect(() => {
    if (isCalledFromSettings) {
      if (user?.id) {
        setCurrentUserId(user.id);
      }
    } else {
      // Use memberId for team view
      setCurrentUserId(memberId);
    }
  }, [isCalledFromSettings, memberId, user]);

  useEffect(() => {
    sendGAPageView();
    if (currentUserId) {
      getData();
    }
  }, [currentUserId]);

  const navigate = useNavigate();
  const displayAvatarEmail = isCalledFromSettings
    ? user?.email || personalDetails.email_id
    : personalDetails.email_id;

  const displayAvatarUrl = getDisplayAvatarUrl(
    avatarUrl,
    displayAvatarEmail,
    isDesktop ? 128 : 96
  );

  const handleEditClick = () => {
    navigate(`edit`, { replace: true });
  };

  return (
    <div className="flex w-full flex-col">
      {isDesktop ? (
        <DetailsHeader
          showButtons
          editAction={handleEditClick}
          isDisableUpdateBtn={false}
          subTitle=""
          title={i18n.t("profile.personalDetails")}
        />
      ) : (
        <MobileEditHeader
          href="edit"
          title={i18n.t("profile.personalDetails")}
          backHref={
            isCalledFromSettings
              ? "/settings/"
              : `/team/${memberId || currentUserId}/`
          }
        />
      )}
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <PersonalProfileSummary
          avatarUrl={displayAvatarUrl}
          handleEditClick={handleEditClick}
          isCalledFromSettings={isCalledFromSettings}
          personalDetails={personalDetails}
        />
      )}
      {isCalledFromSettings && !isLoading && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <AccountSecurity />
        </div>
      )}
      {hasEmployeeRecordsAccess(
        company,
        user,
        companyRole,
        memberId || user?.id
      ) && (
        <Link
          className="my-4 inline-flex min-h-10 items-center text-primary underline"
          to={
            memberId
              ? `/team/${memberId}/employee-records?company_id=${company.id}`
              : "/settings/employee-records"
          }
        >
          {i18n.t("employeeRecords.title")}
        </Link>
      )}
      <Outlet />
    </div>
  );
};

export default UserDetailsView;
