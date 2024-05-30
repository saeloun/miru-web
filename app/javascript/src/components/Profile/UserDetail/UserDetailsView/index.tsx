/* eslint-disable @typescript-eslint/no-var-requires */

import React, { Fragment, useEffect, useState } from "react";

import { Outlet, useNavigate } from "react-router-dom";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfile } from "components/Profile/context/EntryContext";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";
import { employmentMapper, teamsMapper } from "mapper/teams.mapper";
import { sendGAPageView } from "utils/googleAnalytics";

import MobilePersonalDetails from "./MobilePersonalDetails";
import StaticPage from "./StaticPage";

const UserDetailsView = () => {
  const { setUserState, profileSettings } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const { user, isDesktop, companyRole } = useUserContext();

  const getData = async () => {
    setIsLoading(true);
    const res = await teamsApi.get(user.id);
    if (res.status && res.status == 200) {
      const addressData = await teamsApi.getAddress(user.id);
      const userObj = teamsMapper(res.data, addressData.data.addresses[0]);

      setUserState("profileSettings", userObj);
      if (companyRole !== "client") {
        const employmentData: any = await teamsApi.getEmploymentDetails(
          user.id
        );

        const previousEmploymentData: any =
          await teamsApi.getPreviousEmployments(user.id);

        if (employmentData.status && employmentData.status == 200) {
          const employmentObj = employmentMapper(
            employmentData.data.employment,
            previousEmploymentData.data.previous_employments
          );
          setUserState("employmentDetails", employmentObj);
        }
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    sendGAPageView();
    getData();
  }, []);

  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate(`/settings/profile/edit`, { replace: true });
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
              personalDetails={profileSettings}
            />
          )}
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          <MobileEditHeader
            backHref="/settings/"
            href="/settings/profile/edit"
            title="Personal Details"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <MobilePersonalDetails
              handleEditClick={handleEditClick}
              personalDetails={profileSettings}
            />
          )}
        </Fragment>
      )}
      <Outlet />
    </div>
  );
};

export default UserDetailsView;
