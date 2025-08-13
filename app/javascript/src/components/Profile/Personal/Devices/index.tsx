import React, { Fragment, useEffect, useState } from "react";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import { Device } from "./Device";
import StaticPage from "./StaticPage";

const AllocatedDevicesDetails = () => {
  const { user, isDesktop } = useUserContext();
  const { currentUser } = useCurrentUser();
  const { isCalledFromSettings } = useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<Device[]>([]);
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

  const getDevicesDetail = async () => {
    if (!currentUserId) return;

    try {
      const res: any = await deviceApi.get(currentUserId);
      const devicesDetails: Device[] = res.data.devices;
      setDevices(devicesDetails);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      getDevicesDetail();
    }
  }, [currentUserId]);

  const handleEdit = () => {
    navigate(`edit`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop ? (
        <DetailsHeader
          editAction={handleEdit}
          isDisableUpdateBtn={false}
          showButtons={false}
          subTitle=""
          title="Allocated Devices"
        />
      ) : (
        <MobileEditHeader
          href="edit"
          title="Allocated Devices"
          backHref={
            isCalledFromSettings
              ? "/settings/"
              : `/team/${currentUserId || memberId}`
          }
        />
      )}
      {isLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : (
        <StaticPage devices={devices} />
      )}
    </Fragment>
  );
};

export default AllocatedDevicesDetails;
