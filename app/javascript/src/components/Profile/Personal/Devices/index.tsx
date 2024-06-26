import React, { Fragment, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import deviceApi from "apis/devices";
import Loader from "common/Loader/index";
import { MobileEditHeader } from "common/Mobile/MobileEditHeader";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";

import { Device } from "./Device";
import StaticPage from "./StaticPage";

const AllocatedDevicesDetails = () => {
  const { user, isDesktop, company } = useUserContext();
  const { isCalledFromSettings } = useProfileContext();
  const navigate = useNavigate();
  const { memberId } = useParams();
  const dateFormat = company.date_format;
  const currentUserId = isCalledFromSettings ? user.id : memberId;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [devices, setDevices] = useState<Device[]>([]);

  const getDevicesDetail = async () => {
    const res: any = await deviceApi.get(currentUserId);
    const devicesDetails: Device[] = res.data.devices;
    setDevices(devicesDetails);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    getDevicesDetail();
  }, []);

  const handleEdit = () => {
    navigate(`edit`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop ? (
        <DetailsHeader
          showButtons
          editAction={handleEdit}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Allocated Devices"
        />
      ) : (
        <MobileEditHeader
          backHref={isCalledFromSettings ? "/settings/" : `/team/${memberId}`}
          href="edit"
          title="Allocated Devices"
        />
      )}
      {isLoading ? (
        <div className="flex min-h-70v items-center justify-center">
          <Loader />
        </div>
      ) : (
        <StaticPage dateFormat={dateFormat} devices={devices} />
      )}
    </Fragment>
  );
};

export default AllocatedDevicesDetails;
