/* eslint-disable @typescript-eslint/no-var-requires */

import React, { Fragment, useEffect, useState } from "react";

import { Outlet, useNavigate } from "react-router-dom";

import profileApi from "apis/profile";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import { useProfile } from "components/Profile/context/EntryContext";
import DetailsHeader from "components/Profile/DetailsHeader";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";
import { sendGAPageView } from "utils/googleAnalytics";

import MobilePersonalDetails from "./MobilePersonalDetails";
import StaticPage from "./StaticPage";

const UserDetailsView = () => {
  const { setUserState, profileSettings } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const { isDesktop } = useUserContext();

  const getData = async () => {
    setIsLoading(true);
    const data = await profileApi.index();
    if (data.status && data.status == 200) {
      const addressData = await profileApi.getAddress(data.data.user.id);
      const userObj = teamsMapper(
        data.data.user,
        addressData.data.addresses[0]
      );
      setUserState("profileSettings", userObj);
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
    navigate(`/profile/edit/change`, { replace: true });
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
            backHref="/profile/edit/option"
            href="/profile/edit/change"
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
